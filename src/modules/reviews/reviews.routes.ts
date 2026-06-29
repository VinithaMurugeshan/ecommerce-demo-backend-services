import { Router } from "express";
import { reviewsController } from "./reviews.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createReviewSchema,
  listReviewsSchema,
  reviewIdSchema,
  updateReviewSchema,
} from "./reviews.validation";

const router = Router();

/**
 * @openapi
 * /products/{slug}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews for a product
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated reviews }
 *   post:
 *     tags: [Reviews]
 *     summary: Add a review for a product
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               title: { type: string }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Review created }
 *       409: { description: Already reviewed }
 */
router.get(
  "/products/:slug/reviews",
  validate(listReviewsSchema),
  asyncHandler(reviewsController.list)
);
router.post(
  "/products/:slug/reviews",
  authenticate,
  validate(createReviewSchema),
  asyncHandler(reviewsController.create)
);

/**
 * @openapi
 * /reviews/{id}:
 *   patch:
 *     tags: [Reviews]
 *     summary: Update your review
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete your review
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 */
router.patch(
  "/reviews/:id",
  authenticate,
  validate(updateReviewSchema),
  asyncHandler(reviewsController.update)
);
router.delete(
  "/reviews/:id",
  authenticate,
  validate(reviewIdSchema),
  asyncHandler(reviewsController.remove)
);

export default router;
