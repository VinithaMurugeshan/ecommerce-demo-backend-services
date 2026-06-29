import { Router } from "express";
import { returnsController } from "./returns.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createReturnSchema,
  listReturnsSchema,
  returnIdSchema,
  updateReturnStatusSchema,
} from "./returns.validation";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /returns:
 *   get:
 *     tags: [Returns]
 *     summary: List the current user's return requests
 *     responses:
 *       200: { description: Array of return requests }
 *   post:
 *     tags: [Returns]
 *     summary: Request a return/refund for delivered order items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, reason, items]
 *             properties:
 *               orderId: { type: string, format: uuid }
 *               reason: { type: string }
 *               comment: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     orderItemId: { type: string, format: uuid }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       201: { description: Return request created }
 *       400: { description: Order not delivered or invalid items }
 */
router.get("/", asyncHandler(returnsController.list));
router.post("/", validate(createReturnSchema), asyncHandler(returnsController.create));

/**
 * @openapi
 * /returns/admin/all:
 *   get:
 *     tags: [Returns]
 *     summary: List all return requests (admin)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of return requests }
 */
router.get(
  "/admin/all",
  authorize("ADMIN"),
  validate(listReturnsSchema),
  asyncHandler(returnsController.listAll)
);

/**
 * @openapi
 * /returns/{id}:
 *   get:
 *     tags: [Returns]
 *     summary: Get a single return request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Return request }
 *       404: { description: Not found }
 */
router.get("/:id", validate(returnIdSchema), asyncHandler(returnsController.getById));

/**
 * @openapi
 * /returns/{id}/status:
 *   patch:
 *     tags: [Returns]
 *     summary: Update a return request status (admin). REFUNDED triggers a refund.
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
 *                 enum: [REQUESTED, APPROVED, REJECTED, RECEIVED, REFUNDED]
 *     responses:
 *       200: { description: Updated return request }
 */
router.patch(
  "/:id/status",
  authorize("ADMIN"),
  validate(updateReturnStatusSchema),
  asyncHandler(returnsController.updateStatus)
);

export default router;
