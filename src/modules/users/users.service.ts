import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { comparePassword, hashPassword } from "../../utils/password";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  emailNotifications: true,
  smsNotifications: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const usersService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });
  },

  async updateSettings(
    userId: string,
    data: { emailNotifications?: boolean; smsNotifications?: boolean }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw ApiError.badRequest("Current password is incorrect");
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshTokenHash: null },
    });
    return { message: "Password changed successfully" };
  },

  // ---- Addresses ----
  async listAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async createAddress(userId: string, data: Prisma.AddressCreateInput | any) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return prisma.address.create({
      data: { ...data, userId },
    });
  },

  async updateAddress(userId: string, id: string, data: any) {
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw ApiError.notFound("Address not found");
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return prisma.address.update({ where: { id }, data });
  },

  async deleteAddress(userId: string, id: string) {
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw ApiError.notFound("Address not found");
    await prisma.address.delete({ where: { id } });
    return { message: "Address deleted" };
  },
};
