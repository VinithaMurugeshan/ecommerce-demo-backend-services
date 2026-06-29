import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { calculatePricing } from "../../utils/pricing";

const cartInclude = {
  items: {
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" as const }, take: 1 } },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  coupon: true,
};

async function getOrCreateCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
  if (cart) return cart;
  return prisma.cart.create({ data: { userId }, include: cartInclude });
}

function serializeCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  const lineItems = cart.items.map((i) => ({
    unitPrice: i.product.price,
    quantity: i.quantity,
  }));
  const summary = calculatePricing(lineItems, cart.coupon ?? null);
  return { ...cart, summary };
}

export const cartService = {
  async getCart(userId: string) {
    const cart = await getOrCreateCart(userId);
    return serializeCart(cart);
  },

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");
    if (product.stock < quantity) {
      throw ApiError.badRequest(`Only ${product.stock} unit(s) in stock`);
    }

    const cart = await getOrCreateCart(userId);
    const existing = cart.items.find((i) => i.productId === productId);
    const newQty = (existing?.quantity ?? 0) + quantity;
    if (product.stock < newQty) {
      throw ApiError.badRequest(`Only ${product.stock} unit(s) in stock`);
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: newQty },
    });
    return this.getCart(userId);
  },

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw ApiError.notFound("Item not in cart");

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      return this.getCart(userId);
    }
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product && product.stock < quantity) {
      throw ApiError.badRequest(`Only ${product.stock} unit(s) in stock`);
    }
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return this.getCart(userId);
  },

  async removeItem(userId: string, productId: string) {
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw ApiError.notFound("Item not in cart");
    await prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(userId);
  },

  async clear(userId: string) {
    const cart = await getOrCreateCart(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });
    return this.getCart(userId);
  },

  async applyCoupon(userId: string, code: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    const now = new Date();
    if (
      !coupon ||
      !coupon.isActive ||
      (coupon.startsAt && coupon.startsAt > now) ||
      (coupon.expiresAt && coupon.expiresAt < now) ||
      (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    ) {
      throw ApiError.badRequest("Coupon is invalid or expired");
    }
    const cart = await getOrCreateCart(userId);
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    });
    return this.getCart(userId);
  },

  async removeCoupon(userId: string) {
    const cart = await getOrCreateCart(userId);
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });
    return this.getCart(userId);
  },
};
