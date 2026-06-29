import { Router } from "express";
import { cartController } from "./cart.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  addItemSchema,
  applyCouponSchema,
  itemParamSchema,
  updateItemSchema,
} from "./cart.validation";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: View the current cart with pricing summary
 *     responses:
 *       200:
 *         description: Cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Cart' }
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the cart
 *     responses:
 *       200: { description: Empty cart }
 */
router.get("/", asyncHandler(cartController.getCart));
router.delete("/", asyncHandler(cartController.clear));

/**
 * @openapi
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               quantity: { type: integer, minimum: 1, default: 1 }
 *     responses:
 *       201: { description: Updated cart }
 *       400: { description: Out of stock }
 */
router.post("/items", validate(addItemSchema), asyncHandler(cartController.addItem));

/**
 * @openapi
 * /cart/items/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update item quantity (0 removes it)
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200: { description: Updated cart }
 *   delete:
 *     tags: [Cart]
 *     summary: Remove an item from the cart
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated cart }
 */
router.patch(
  "/items/:productId",
  validate(updateItemSchema),
  asyncHandler(cartController.updateItem)
);
router.delete(
  "/items/:productId",
  validate(itemParamSchema),
  asyncHandler(cartController.removeItem)
);

/**
 * @openapi
 * /cart/coupon:
 *   post:
 *     tags: [Cart]
 *     summary: Apply a coupon code to the cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200: { description: Updated cart }
 *       400: { description: Invalid coupon }
 *   delete:
 *     tags: [Cart]
 *     summary: Remove the applied coupon
 *     responses:
 *       200: { description: Updated cart }
 */
router.post("/coupon", validate(applyCouponSchema), asyncHandler(cartController.applyCoupon));
router.delete("/coupon", asyncHandler(cartController.removeCoupon));

export default router;
