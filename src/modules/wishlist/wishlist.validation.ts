import { z } from "zod";

export const addWishlistItemSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
  }),
});

export const wishlistItemParamSchema = z.object({
  params: z.object({ productId: z.string().uuid() }),
});

export const moveToCartSchema = z.object({
  params: z.object({ productId: z.string().uuid() }),
  body: z.object({
    quantity: z.number().int().min(1).default(1),
  }),
});
