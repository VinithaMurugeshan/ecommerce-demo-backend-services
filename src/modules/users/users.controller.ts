import { Request, Response } from "express";
import { usersService } from "./users.service";
import { ok } from "../../utils/http";

export const usersController = {
  async getProfile(req: Request, res: Response) {
    return ok(res, await usersService.getProfile(req.user!.sub));
  },
  async updateProfile(req: Request, res: Response) {
    return ok(res, await usersService.updateProfile(req.user!.sub, req.body));
  },
  async updateSettings(req: Request, res: Response) {
    return ok(res, await usersService.updateSettings(req.user!.sub, req.body));
  },
  async changePassword(req: Request, res: Response) {
    return ok(
      res,
      await usersService.changePassword(
        req.user!.sub,
        req.body.currentPassword,
        req.body.newPassword
      )
    );
  },
  async listAddresses(req: Request, res: Response) {
    return ok(res, await usersService.listAddresses(req.user!.sub));
  },
  async createAddress(req: Request, res: Response) {
    return ok(res, await usersService.createAddress(req.user!.sub, req.body), 201);
  },
  async updateAddress(req: Request, res: Response) {
    return ok(
      res,
      await usersService.updateAddress(req.user!.sub, req.params.id, req.body)
    );
  },
  async deleteAddress(req: Request, res: Response) {
    return ok(res, await usersService.deleteAddress(req.user!.sub, req.params.id));
  },
};
