import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAverage: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });
}

export const reviewsService = {
  async listForProduct(slug: string, page = 1, limit = 10) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) throw ApiError.notFound("Product not found");

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.review.count({ where: { productId: product.id } }),
    ]);
    return { items, total };
  },

  async create(
    userId: string,
    slug: string,
    data: { rating: number; title?: string; comment?: string }
  ) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) throw ApiError.notFound("Product not found");

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId } },
    });
    if (existing) {
      throw ApiError.conflict("You have already reviewed this product");
    }

    const review = await prisma.review.create({
      data: { ...data, productId: product.id, userId },
    });
    await recomputeProductRating(product.id);
    return review;
  },

  async update(
    userId: string,
    reviewId: string,
    data: { rating?: number; title?: string; comment?: string }
  ) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.userId !== userId) {
      throw ApiError.notFound("Review not found");
    }
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data,
    });
    await recomputeProductRating(review.productId);
    return updated;
  },

  async remove(userId: string, reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.userId !== userId) {
      throw ApiError.notFound("Review not found");
    }
    await prisma.review.delete({ where: { id: reviewId } });
    await recomputeProductRating(review.productId);
    return { message: "Review deleted" };
  },
};
