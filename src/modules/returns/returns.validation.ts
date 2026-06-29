import { z } from "zod";

export const createReturnSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(1),
    comment: z.string().optional(),
    items: z
      .array(
        z.object({
          orderItemId: z.string().uuid(),
          quantity: z.number().int().min(1),
        })
      )
      .min(1),
  }),
});

export const returnIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const updateReturnStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]),
  }),
});

export const listReturnsSchema = z.object({
  query: z.object({
    status: z
      .enum(["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"])
      .optional(),
  }),
});
