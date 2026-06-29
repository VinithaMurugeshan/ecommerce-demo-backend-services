import { Router } from "express";
import { paymentsController } from "./payments.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { orderIdParamSchema, refundSchema } from "./payments.validation";

const router = Router();

/**
 * @openapi
 * /payments/methods:
 *   get:
 *     tags: [Payments]
 *     summary: List available payment methods
 *     security: []
 *     responses:
 *       200: { description: Payment methods }
 */
router.get("/methods", asyncHandler(paymentsController.getMethods));

/**
 * @openapi
 * /payments/{orderId}/intent:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Stripe PaymentIntent for an order
 *     description: >
 *       Returns a clientSecret the frontend uses with Stripe.js to collect
 *       payment. In mock mode (no Stripe key) a fake clientSecret is returned.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientSecret: { type: string }
 *                     paymentIntentId: { type: string }
 *                     amount: { type: number }
 *                     currency: { type: string }
 *                     mock: { type: boolean }
 *       400: { description: Order already paid / COD }
 */
router.post(
  "/:orderId/intent",
  authenticate,
  validate(orderIdParamSchema),
  asyncHandler(paymentsController.createIntent)
);

/**
 * @openapi
 * /payments/{orderId}/confirm:
 *   post:
 *     tags: [Payments]
 *     summary: Confirm a payment (COD, mock mode, or post-Stripe verification)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Payment confirmed, order moved to CONFIRMED }
 *       400: { description: Payment not completed }
 */
router.post(
  "/:orderId/confirm",
  authenticate,
  validate(orderIdParamSchema),
  asyncHandler(paymentsController.confirm)
);

/**
 * @openapi
 * /payments/{orderId}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund a payment, full or partial (admin)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number, description: Omit for a full refund }
 *     responses:
 *       200: { description: Refund processed }
 *       400: { description: Cannot refund }
 */
router.post(
  "/:orderId/refund",
  authenticate,
  authorize("ADMIN"),
  validate(refundSchema),
  asyncHandler(paymentsController.refund)
);

export default router;
