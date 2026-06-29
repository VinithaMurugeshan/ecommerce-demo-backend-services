import { Router } from "express";
import { usersController } from "./users.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  addressIdSchema,
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from "./users.validation";

const router = Router();

// All account routes require authentication.
router.use(authenticate);

/**
 * @openapi
 * /account/profile:
 *   get:
 *     tags: [Account]
 *     summary: Get current user's profile
 *     responses:
 *       200: { description: Profile }
 *   patch:
 *     tags: [Account]
 *     summary: Update profile information
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: Updated profile }
 */
router.get("/profile", asyncHandler(usersController.getProfile));
router.patch(
  "/profile",
  validate(updateProfileSchema),
  asyncHandler(usersController.updateProfile)
);

/**
 * @openapi
 * /account/settings:
 *   patch:
 *     tags: [Account]
 *     summary: Update notification preferences
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications: { type: boolean }
 *               smsNotifications: { type: boolean }
 *     responses:
 *       200: { description: Updated settings }
 */
router.patch(
  "/settings",
  validate(updateSettingsSchema),
  asyncHandler(usersController.updateSettings)
);

/**
 * @openapi
 * /account/change-password:
 *   post:
 *     tags: [Account]
 *     summary: Change password while logged in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed }
 *       400: { description: Current password incorrect }
 */
router.post(
  "/change-password",
  validate(changePasswordSchema),
  asyncHandler(usersController.changePassword)
);

/**
 * @openapi
 * /account/addresses:
 *   get:
 *     tags: [Account]
 *     summary: List saved addresses
 *     responses:
 *       200: { description: Array of addresses }
 *   post:
 *     tags: [Account]
 *     summary: Add a new address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201: { description: Created address }
 */
router.get("/addresses", asyncHandler(usersController.listAddresses));
router.post(
  "/addresses",
  validate(createAddressSchema),
  asyncHandler(usersController.createAddress)
);

/**
 * @openapi
 * /account/addresses/{id}:
 *   patch:
 *     tags: [Account]
 *     summary: Update an address
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200: { description: Updated address }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Account]
 *     summary: Delete an address
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
router.patch(
  "/addresses/:id",
  validate(updateAddressSchema),
  asyncHandler(usersController.updateAddress)
);
router.delete(
  "/addresses/:id",
  validate(addressIdSchema),
  asyncHandler(usersController.deleteAddress)
);

export default router;
