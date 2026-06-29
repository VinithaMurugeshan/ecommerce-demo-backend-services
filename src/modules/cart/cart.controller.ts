import { Request, Response } from "express";
import { cartService } from "./cart.service";
import { ok } from "../../utils/http";

export const cartController = {
  async getCart(req: Request, res: Response) {
    return ok(res, await cartService.getCart(req.user!.sub));
  },
  async addItem(req: Request, res: Response) {
    return ok(
      res,
      await cartService.addItem(req.user!.sub, req.body.productId, req.body.quantity),
      201
    );
  },
  async updateItem(req: Request, res: Response) {
    return ok(
      res,
      await cartService.updateItem(
        req.user!.sub,
        req.params.productId,
        req.body.quantity
      )
    );
  },
  async removeItem(req: Request, res: Response) {
    return ok(
      res,
      await cartService.removeItem(req.user!.sub, req.params.productId)
    );
  },
  async clear(req: Request, res: Response) {
    return ok(res, await cartService.clear(req.user!.sub));
  },
  async applyCoupon(req: Request, res: Response) {
    return ok(res, await cartService.applyCoupon(req.user!.sub, req.body.code));
  },
  async removeCoupon(req: Request, res: Response) {
    return ok(res, await cartService.removeCoupon(req.user!.sub));
  },
};
