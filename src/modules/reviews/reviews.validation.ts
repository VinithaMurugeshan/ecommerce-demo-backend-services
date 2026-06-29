import { z } from "zod";

export const listReviewsSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const createReviewSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    comment: z.string().max(2000).optional(),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().max(120).optional(),
    comment: z.string().max(2000).optional(),
  }),
});

export const reviewIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
