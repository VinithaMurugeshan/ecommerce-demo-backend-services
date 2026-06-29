import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import productsRoutes from "../modules/products/products.routes";
import reviewsRoutes from "../modules/reviews/reviews.routes";
import cartRoutes from "../modules/cart/cart.routes";
import wishlistRoutes from "../modules/wishlist/wishlist.routes";
import couponsRoutes from "../modules/coupons/coupons.routes";
import ordersRoutes from "../modules/orders/orders.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import returnsRoutes from "../modules/returns/returns.routes";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     security: []
 *     responses:
 *       200: { description: Service is healthy }
 */
router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", uptime: process.uptime() } });
});

router.use("/auth", authRoutes);
router.use("/account", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
// Reviews are nested under products and a top-level /reviews path.
router.use("/", reviewsRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/coupons", couponsRoutes);
router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/returns", returnsRoutes);

export default router;
