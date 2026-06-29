import { z } from "zod";

export const addItemSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ productId: z.string().uuid() }),
  body: z.object({
    quantity: z.number().int(),
  }),
});

export const itemParamSchema = z.object({
  params: z.object({ productId: z.string().uuid() }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
  }),
});
