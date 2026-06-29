import { z } from "zod";

export const listProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(), // category slug
    brand: z.string().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    featured: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    inStock: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    sort: z
      .enum(["newest", "price_asc", "price_desc", "rating", "popular", "name"])
      .default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const productSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const productIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    brand: z.string().optional(),
    sku: z.string().min(1),
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    stock: z.number().int().nonnegative().default(0),
    categoryId: z.string().uuid(),
    isFeatured: z.boolean().optional(),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          alt: z.string().optional(),
          position: z.number().int().optional(),
        })
      )
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    brand: z.string().optional(),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    categoryId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});
