import { Prisma } from "@prisma/client";
import { OrderStatus, PaymentMethod } from "../../types/enums";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { calculatePricing } from "../../utils/pricing";

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

// Forward-only order lifecycle used to validate admin status transitions.
const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const orderInclude = {
  items: true,
  payment: true,
  coupon: true,
  shippingAddress: true,
  billingAddress: true,
  tracking: { orderBy: { createdAt: "asc" as const } },
};

export const ordersService = {
  /**
   * Checkout: turns the user's cart into an order.
   * Runs in a transaction so stock, coupon usage and cart clearing are atomic.
   */
  async checkout(
    userId: string,
    input: {
      shippingAddressId: string;
      billingAddressId?: string;
      paymentMethod: PaymentMethod;
    }
  ) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } }, coupon: true },
    });
    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest("Your cart is empty");
    }

    // Validate the shipping address belongs to the user.
    const shippingAddress = await prisma.address.findFirst({
      where: { id: input.shippingAddressId, userId },
    });
    if (!shippingAddress) throw ApiError.badRequest("Invalid shipping address");

    if (input.billingAddressId) {
      const billing = await prisma.address.findFirst({
        where: { id: input.billingAddressId, userId },
      });
      if (!billing) throw ApiError.badRequest("Invalid billing address");
    }

    // Validate stock before charging.
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw ApiError.badRequest(`${item.product.name} is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for ${item.product.name} (have ${item.product.stock})`
        );
      }
    }

    const pricing = calculatePricing(
      cart.items.map((i) => ({ unitPrice: i.product.price, quantity: i.quantity })),
      cart.coupon ?? null
    );

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: "PENDING",
          subtotal: pricing.subtotal,
          discountTotal: pricing.discountTotal,
          shippingTotal: pricing.shippingTotal,
          taxTotal: pricing.taxTotal,
          grandTotal: pricing.grandTotal,
          currency: cart.items[0].product.currency,
          couponId: cart.couponId,
          shippingAddressId: input.shippingAddressId,
          billingAddressId: input.billingAddressId ?? input.shippingAddressId,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              productName: i.product.name,
              sku: i.product.sku,
              unitPrice: i.product.price,
              quantity: i.quantity,
              lineTotal: new Prisma.Decimal(i.product.price).mul(i.quantity),
            })),
          },
          tracking: {
            create: {
              status: "PENDING",
              message: "Order placed and awaiting payment",
            },
          },
          payment: {
            create: {
              method: input.paymentMethod,
              status: input.paymentMethod === "COD" ? "PENDING" : "PENDING",
              amount: pricing.grandTotal,
              currency: cart.items[0].product.currency,
            },
          },
        },
        include: orderInclude,
      });

      // Decrement stock.
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Increment coupon usage.
      if (cart.couponId) {
        await tx.coupon.update({
          where: { id: cart.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear the cart.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { couponId: null },
      });

      return created;
    });

    return order;
  },

  async listForUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { items: true, payment: true },
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { items, total };
  },

  async getByIdForUser(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw ApiError.notFound("Order not found");
    return order;
  },

  /** Order tracking by order number (supports the "Track Your Order" screen). */
  async trackByNumber(orderNumber: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        tracking: { orderBy: { createdAt: "asc" } },
        items: true,
        payment: true,
      },
    });
    if (!order || (userId && order.userId !== userId)) {
      throw ApiError.notFound("Order not found");
    }
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      timeline: order.tracking,
    };
  },

  async cancel(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payment: true },
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(order.status)) {
      throw ApiError.badRequest(`Cannot cancel an order that is ${order.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          tracking: {
            create: { status: "CANCELLED", message: "Order cancelled by customer" },
          },
        },
        include: orderInclude,
      });
      // Restock.
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return updated;
    });
  },

  // ---- Admin ----
  async listAll(page = 1, limit = 20, status?: OrderStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { items: true, payment: true, user: { select: { email: true } } },
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  },

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    message?: string,
    location?: string
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound("Order not found");

    // Allow CANCELLED from anywhere; otherwise enforce forward-only flow.
    if (status !== "CANCELLED") {
      const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
      const nextIdx = STATUS_FLOW.indexOf(status);
      if (nextIdx === -1 || nextIdx < currentIdx) {
        throw ApiError.badRequest(
          `Invalid status transition from ${order.status} to ${status}`
        );
      }
    }

    return prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        tracking: {
          create: {
            status,
            message: message ?? `Order ${status.toLowerCase().replace(/_/g, " ")}`,
            location,
          },
        },
      },
      include: orderInclude,
    });
  },
};
