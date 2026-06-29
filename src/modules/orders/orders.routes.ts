import { Router } from "express";
import { ordersController } from "./orders.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  checkoutSchema,
  listAllOrdersSchema,
  listOrdersSchema,
  orderIdSchema,
  trackOrderSchema,
  updateStatusSchema,
} from "./orders.validation";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order from the current cart (checkout)
 *     description: >
 *       Creates an order from the cart, reserves stock and sets up a pending
 *       payment. For card payments, follow up with POST /payments/{orderId}/intent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddressId]
 *             properties:
 *               shippingAddressId: { type: string, format: uuid }
 *               billingAddressId: { type: string, format: uuid }
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, UPI, NET_BANKING, WALLET, COD]
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Order' }
 *       400: { description: Empty cart or insufficient stock }
 */
router.post("/checkout", validate(checkoutSchema), asyncHandler(ordersController.checkout));

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List the current user's orders (My Orders)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated orders }
 */
router.get("/", validate(listOrdersSchema), asyncHandler(ordersController.list));

/**
 * @openapi
 * /orders/admin/all:
 *   get:
 *     tags: [Orders]
 *     summary: List all orders (admin)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated orders }
 */
router.get(
  "/admin/all",
  authorize("ADMIN"),
  validate(listAllOrdersSchema),
  asyncHandler(ordersController.listAll)
);

/**
 * @openapi
 * /orders/track/{orderNumber}:
 *   get:
 *     tags: [Orders]
 *     summary: Track an order by its order number
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order status timeline }
 *       404: { description: Not found }
 */
router.get(
  "/track/:orderNumber",
  validate(trackOrderSchema),
  asyncHandler(ordersController.track)
);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order's details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Order' }
 *       404: { description: Not found }
 */
router.get("/:id", validate(orderIdSchema), asyncHandler(ordersController.getById));

/**
 * @openapi
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order (before it ships)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Cancelled order }
 *       400: { description: Cannot cancel }
 */
router.post("/:id/cancel", validate(orderIdSchema), asyncHandler(ordersController.cancel));

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status & add a tracking event (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED]
 *               message: { type: string }
 *               location: { type: string }
 *     responses:
 *       200: { description: Updated order }
 *       400: { description: Invalid transition }
 */
router.patch(
  "/:id/status",
  authorize("ADMIN"),
  validate(updateStatusSchema),
  asyncHandler(ordersController.updateStatus)
);

export default router;
