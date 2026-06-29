import { Router } from "express";
import { productsController } from "./products.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  productSlugSchema,
  updateProductSchema,
} from "./products.validation";

const router = Router();

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Browse, search and filter products (PLP)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search across name, description and brand
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category slug
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: minRating
 *         schema: { type: number, minimum: 0, maximum: 5 }
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, rating, popular, name]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated product list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *   post:
 *     tags: [Products]
 *     summary: Create a product (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Product' }
 *     responses:
 *       201: { description: Created }
 */
router.get("/", validate(listProductsSchema), asyncHandler(productsController.list));
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createProductSchema),
  asyncHandler(productsController.create)
);

/**
 * @openapi
 * /products/facets:
 *   get:
 *     tags: [Products]
 *     summary: Get available filter facets (brands, price range)
 *     security: []
 *     responses:
 *       200: { description: Filter facets }
 */
router.get("/facets", asyncHandler(productsController.facets));

/**
 * @openapi
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail by slug (PDP)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product detail with images and recent reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       404: { description: Not found }
 */
router.get("/:slug", validate(productSlugSchema), asyncHandler(productsController.getBySlug));

/**
 * @openapi
 * /products/{slug}/related:
 *   get:
 *     tags: [Products]
 *     summary: Get related products (same category)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Related products }
 */
router.get(
  "/:slug/related",
  validate(productSlugSchema),
  asyncHandler(productsController.getRelated)
);

/**
 * @openapi
 * /products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Products]
 *     summary: Deactivate a product (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deactivated }
 */
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateProductSchema),
  asyncHandler(productsController.update)
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(productIdSchema),
  asyncHandler(productsController.remove)
);

export default router;
