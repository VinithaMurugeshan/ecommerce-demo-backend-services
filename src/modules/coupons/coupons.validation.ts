import { z } from "zod";

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    subtotal: z.number().nonnegative(),
  }),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    description: z.string().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional(),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createCouponSchema.shape.body.partial(),
});

export const couponIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
