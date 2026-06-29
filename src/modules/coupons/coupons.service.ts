import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { computeDiscount } from "../../utils/pricing";

export const couponsService = {
  async list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  },

  /** Validate a coupon against a cart subtotal and preview the discount. */
  async validate(code: string, subtotal: number) {
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
    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      throw ApiError.badRequest(
        `Minimum order value of ${coupon.minOrderValue} required`
      );
    }
    const discount = computeDiscount(subtotal, coupon);
    return { coupon, discount, valid: true };
  },

  async create(data: any) {
    return prisma.coupon.create({
      data: { ...data, code: String(data.code).toUpperCase() },
    });
  },

  async update(id: string, data: any) {
    const payload = { ...data };
    if (data.code) payload.code = String(data.code).toUpperCase();
    return prisma.coupon.update({ where: { id }, data: payload });
  },

  async remove(id: string) {
    await prisma.coupon.delete({ where: { id } });
    return { message: "Coupon deleted" };
  },
};
