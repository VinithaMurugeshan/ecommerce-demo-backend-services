import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  featured?: boolean;
  inStock?: boolean;
  sort: "newest" | "price_asc" | "price_desc" | "rating" | "popular" | "name";
  page: number;
  limit: number;
}

const orderByMap: Record<ProductFilters["sort"], Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  rating: { ratingAverage: "desc" },
  popular: { ratingCount: "desc" },
  name: { name: "asc" },
};

export const productsService = {
  async list(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (filters.search) {
      // SQLite LIKE is case-insensitive for ASCII, so no `mode` needed.
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { brand: { contains: filters.search } },
      ];
    }
    if (filters.category) {
      where.category = { slug: filters.category };
    }
    if (filters.brand) {
      where.brand = { equals: filters.brand };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }
    if (filters.minRating !== undefined) {
      where.ratingAverage = { gte: filters.minRating };
    }
    if (filters.featured !== undefined) {
      where.isFeatured = filters.featured;
    }
    if (filters.inStock) {
      where.stock = { gt: 0 };
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: orderByMap[filters.sort],
        skip,
        take: filters.limit,
        include: {
          images: { orderBy: { position: "asc" } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  },

  /** Distinct brands available — useful for the PLP filter sidebar. */
  async getFilterFacets() {
    const [brands, priceAgg] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, brand: { not: null } },
        distinct: ["brand"],
        select: { brand: true },
        orderBy: { brand: "asc" },
      }),
      prisma.product.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);
    return {
      brands: brands.map((b) => b.brand).filter(Boolean),
      priceRange: {
        min: priceAgg._min.price ?? 0,
        max: priceAgg._max.price ?? 0,
      },
    };
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!product || !product.isActive) {
      throw ApiError.notFound("Product not found");
    }
    return product;
  },

  /** Related products = same category, excluding the current product. */
  async getRelated(slug: string, limit = 4) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, categoryId: true },
    });
    if (!product) throw ApiError.notFound("Product not found");
    return prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: limit,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    });
  },

  async create(data: any) {
    const { images, ...rest } = data;
    return prisma.product.create({
      data: {
        ...rest,
        slug: slugify(data.name),
        images: images ? { create: images } : undefined,
      },
      include: { images: true },
    });
  },

  async update(id: string, data: any) {
    const payload: Record<string, unknown> = { ...data };
    if (data.name) payload.slug = slugify(data.name);
    return prisma.product.update({
      where: { id },
      data: payload,
      include: { images: true },
    });
  },

  async remove(id: string) {
    // Soft delete keeps order history intact.
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: "Product deactivated" };
  },
};
