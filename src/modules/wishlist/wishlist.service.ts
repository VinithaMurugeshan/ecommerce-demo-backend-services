import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { cartService } from "../cart/cart.service";

const wishlistInclude = {
  items: {
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" as const }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

async function getOrCreateWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: wishlistInclude,
  });
  if (wishlist) return wishlist;
  return prisma.wishlist.create({ data: { userId }, include: wishlistInclude });
}

export const wishlistService = {
  async getWishlist(userId: string) {
    return getOrCreateWishlist(userId);
  },

  async addItem(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");

    const wishlist = await getOrCreateWishlist(userId);
    await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId },
      },
      create: { wishlistId: wishlist.id, productId },
      update: {},
    });
    return getOrCreateWishlist(userId);
  },

  async removeItem(userId: string, productId: string) {
    const wishlist = await getOrCreateWishlist(userId);
    const item = wishlist.items.find((i) => i.productId === productId);
    if (!item) throw ApiError.notFound("Item not in wishlist");
    await prisma.wishlistItem.delete({ where: { id: item.id } });
    return getOrCreateWishlist(userId);
  },

  /** Move item from wishlist to cart (Wishlist -> Cart flow). */
  async moveToCart(userId: string, productId: string, quantity = 1) {
    const wishlist = await getOrCreateWishlist(userId);
    const item = wishlist.items.find((i) => i.productId === productId);
    if (!item) throw ApiError.notFound("Item not in wishlist");

    await cartService.addItem(userId, productId, quantity);
    await prisma.wishlistItem.delete({ where: { id: item.id } });
    return { message: "Moved to cart" };
  },
};
