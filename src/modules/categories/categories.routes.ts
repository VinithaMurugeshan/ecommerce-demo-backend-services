import { Router } from "express";
import { categoriesController } from "./categories.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./categories.validation";

const router = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     security: []
 *     responses:
 *       200:
 *         description: Array of categories with product counts
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Category' }
 *     responses:
 *       201: { description: Created }
 */
router.get("/", asyncHandler(categoriesController.list));
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  asyncHandler(categoriesController.create)
);

/**
 * @openapi
 * /categories/{slug}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a single category by slug
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category }
 *       404: { description: Not found }
 */
router.get("/:slug", asyncHandler(categoriesController.getBySlug));

/**
 * @openapi
 * /categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (admin)
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
  validate(updateCategorySchema),
  asyncHandler(categoriesController.update)
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(categoryIdSchema),
  asyncHandler(categoriesController.remove)
);

export default router;
