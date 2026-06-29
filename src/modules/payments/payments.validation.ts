import { z } from "zod";

export const orderIdParamSchema = z.object({
  params: z.object({ orderId: z.string().uuid() }),
});

export const refundSchema = z.object({
  params: z.object({ orderId: z.string().uuid() }),
  body: z.object({
    amount: z.number().positive().optional(),
  }),
});
