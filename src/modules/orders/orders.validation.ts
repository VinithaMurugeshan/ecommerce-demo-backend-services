import { z } from "zod";

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().uuid(),
    billingAddressId: z.string().uuid().optional(),
    paymentMethod: z
      .enum(["CARD", "UPI", "NET_BANKING", "WALLET", "COD"])
      .default("CARD"),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const trackOrderSchema = z.object({
  params: z.object({ orderNumber: z.string().min(1) }),
});

export const listAllOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ])
      .optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ]),
    message: z.string().optional(),
    location: z.string().optional(),
  }),
});
