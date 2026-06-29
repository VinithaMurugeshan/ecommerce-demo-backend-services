import { Router } from "express";
import { authController } from "./auth.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validation";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: Account created
 *       409:
 *         description: Email already registered
 */
router.post("/register", validate(registerSchema), asyncHandler(authController.register));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive access & refresh tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Authenticated
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate(loginSchema), asyncHandler(authController.login));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for new tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New token pair
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", validate(refreshSchema), asyncHandler(authController.refresh));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", authenticate, asyncHandler(authController.logout));

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user (from token)
 *     responses:
 *       200:
 *         description: Current user claims
 */
router.get("/me", authenticate, asyncHandler(authController.me));

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset token issued (returned directly in demo mode)
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a reset token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

export default router;
