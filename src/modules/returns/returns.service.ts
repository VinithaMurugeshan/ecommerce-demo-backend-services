import { Prisma } from "@prisma/client";
import { ReturnStatus } from "../../types/enums";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { paymentsService } from "../payments/payments.service";

const returnInclude = {
  items: { include: { orderItem: true } },
  order: { select: { orderNumber: true, status: true } },
};

export const returnsService = {
  /** Create a return request for delivered order items. */
  async create(
    userId: string,
    input: {
      orderId: string;
      reason: string;
      comment?: string;
      items: { orderItemId: string; quantity: number }[];
    }
  ) {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId, userId },
      include: { items: true },
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.status !== "DELIVERED") {
      throw ApiError.badRequest("Only delivered orders can be returned");
    }

    // Validate the requested items belong to the order and quantities are valid.
    let refundAmount = new Prisma.Decimal(0);
    for (const reqItem of input.items) {
      const orderItem = order.items.find((i) => i.id === reqItem.orderItemId);
      if (!orderItem) {
        throw ApiError.badRequest(`Order item ${reqItem.orderItemId} not in this order`);
      }
      if (reqItem.quantity < 1 || reqItem.quantity > orderItem.quantity) {
        throw ApiError.badRequest(
          `Invalid return quantity for ${orderItem.productName}`
        );
      }
      refundAmount = refundAmount.add(
        new Prisma.Decimal(orderItem.unitPrice).mul(reqItem.quantity)
      );
    }

    return prisma.returnRequest.create({
      data: {
        orderId: input.orderId,
        userId,
        reason: input.reason,
        comment: input.comment,
        refundAmount,
        items: {
          create: input.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        },
      },
      include: returnInclude,
    });
  },

  async listForUser(userId: string) {
    return prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: returnInclude,
    });
  },

  async getByIdForUser(userId: string, id: string) {
    const ret = await prisma.returnRequest.findFirst({
      where: { id, userId },
      include: returnInclude,
    });
    if (!ret) throw ApiError.notFound("Return request not found");
    return ret;
  },

  // ---- Admin ----
  async listAll(status?: ReturnStatus) {
    return prisma.returnRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: { ...returnInclude, user: { select: { email: true } } },
    });
  },

  /**
   * Admin updates the return status. When set to REFUNDED, a Stripe refund is
   * issued for the computed refund amount.
   */
  async updateStatus(id: string, status: ReturnStatus) {
    const ret = await prisma.returnRequest.findUnique({ where: { id } });
    if (!ret) throw ApiError.notFound("Return request not found");

    if (status === "REFUNDED") {
      await paymentsService.refund(
        ret.orderId,
        ret.refundAmount ? Number(ret.refundAmount) : undefined
      );
    }

    return prisma.returnRequest.update({
      where: { id },
      data: { status },
      include: returnInclude,
    });
  },
};
