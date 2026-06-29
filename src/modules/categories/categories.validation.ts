import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    parentId: z.string().uuid().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    parentId: z.string().uuid().optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
