import { Router } from "express";
import { couponsController } from "./coupons.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  couponIdSchema,
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "./coupons.validation";

const router = Router();

/**
 * @openapi
 * /coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Validate a coupon code and preview the discount
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, subtotal]
 *             properties:
 *               code: { type: string }
 *               subtotal: { type: number }
 *     responses:
 *       200: { description: Coupon is valid with computed discount }
 *       400: { description: Invalid or expired coupon }
 */
router.post(
  "/validate",
  validate(validateCouponSchema),
  asyncHandler(couponsController.validate)
);

/**
 * @openapi
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: List coupons (admin)
 *     responses:
 *       200: { description: Array of coupons }
 *   post:
 *     tags: [Coupons]
 *     summary: Create a coupon (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Coupon' }
 *     responses:
 *       201: { description: Created }
 */
router.get("/", authenticate, authorize("ADMIN"), asyncHandler(couponsController.list));
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCouponSchema),
  asyncHandler(couponsController.create)
);

/**
 * @openapi
 * /coupons/{id}:
 *   patch:
 *     tags: [Coupons]
 *     summary: Update a coupon (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Coupons]
 *     summary: Delete a coupon (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 */
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateCouponSchema),
  asyncHandler(couponsController.update)
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(couponIdSchema),
  asyncHandler(couponsController.remove)
);

export default router;
