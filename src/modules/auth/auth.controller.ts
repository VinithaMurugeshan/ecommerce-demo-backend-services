import { Request, Response } from "express";
import { authService } from "./auth.service";
import { ok } from "../../utils/http";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    return ok(res, result, 201);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password);
    return ok(res, result);
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    return ok(res, result);
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.user!.sub);
    return ok(res, { message: "Logged out" });
  },

  async me(req: Request, res: Response) {
    // req.user is set by the authenticate middleware
    return ok(res, { user: req.user });
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body.email);
    return ok(res, result);
  },

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(
      req.body.token,
      req.body.password
    );
    return ok(res, result);
  },
};
