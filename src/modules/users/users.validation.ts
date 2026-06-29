import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
});

const addressBody = z.object({
  type: z.enum(["SHIPPING", "BILLING"]).optional(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1).default("US"),
  isDefault: z.boolean().optional(),
});

export const createAddressSchema = z.object({ body: addressBody });

export const updateAddressSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: addressBody.partial(),
});

export const addressIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
