import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import {
  comparePassword,
  compareToken,
  generateRandomToken,
  hashPassword,
  hashToken,
} from "../../utils/password";
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { User } from "@prisma/client";
import { Role } from "../../types/enums";

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    emailNotifications: user.emailNotifications,
    smsNotifications: user.smsNotifications,
  };
}

async function issueTokens(payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = await hashToken(refreshToken);
  await prisma.user.update({
    where: { id: payload.sub },
    data: { refreshTokenHash },
  });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        // Provision a cart and wishlist up front
        cart: { create: {} },
        wishlist: { create: {} },
      },
    });

    const tokens = await issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    });
    return { user: publicUser(user), ...tokens };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    const tokens = await issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    });
    return { user: publicUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw ApiError.unauthorized("Session no longer valid");
    }
    const matches = await compareToken(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw ApiError.unauthorized("Refresh token has been revoked");
    }
    const tokens = await issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    });
    return tokens;
  },

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  },

  /**
   * Generates a password reset token. In production this would be emailed.
   * For the demo we return it directly so the flow is testable.
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Do not reveal whether the email exists.
    if (!user) {
      return { message: "If the account exists, a reset link has been sent" };
    }
    const resetToken = generateRandomToken();
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });
    return {
      message: "If the account exists, a reset link has been sent",
      // Exposed for demo/testing only.
      resetToken,
    };
  },

  async resetPassword(token: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) {
      throw ApiError.badRequest("Reset token is invalid or has expired");
    }
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        refreshTokenHash: null,
      },
    });
    return { message: "Password has been reset successfully" };
  },
};
