import { Router } from "express";
import { wishlistController } from "./wishlist.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  addWishlistItemSchema,
  moveToCartSchema,
  wishlistItemParamSchema,
} from "./wishlist.validation";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get the user's wishlist
 *     responses:
 *       200: { description: Wishlist with items }
 */
router.get("/", asyncHandler(wishlistController.getWishlist));

/**
 * @openapi
 * /wishlist/items:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add a product to the wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Updated wishlist }
 */
router.post(
  "/items",
  validate(addWishlistItemSchema),
  asyncHandler(wishlistController.addItem)
);

/**
 * @openapi
 * /wishlist/items/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove a product from the wishlist
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated wishlist }
 */
router.delete(
  "/items/:productId",
  validate(wishlistItemParamSchema),
  asyncHandler(wishlistController.removeItem)
);

/**
 * @openapi
 * /wishlist/items/{productId}/move-to-cart:
 *   post:
 *     tags: [Wishlist]
 *     summary: Move a wishlist item into the cart
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer, minimum: 1, default: 1 }
 *     responses:
 *       200: { description: Moved to cart }
 */
router.post(
  "/items/:productId/move-to-cart",
  validate(moveToCartSchema),
  asyncHandler(wishlistController.moveToCart)
);

export default router;
