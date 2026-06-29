import { Request, Response } from "express";
import { wishlistService } from "./wishlist.service";
import { ok } from "../../utils/http";

export const wishlistController = {
  async getWishlist(req: Request, res: Response) {
    return ok(res, await wishlistService.getWishlist(req.user!.sub));
  },
  async addItem(req: Request, res: Response) {
    return ok(
      res,
      await wishlistService.addItem(req.user!.sub, req.body.productId),
      201
    );
  },
  async removeItem(req: Request, res: Response) {
    return ok(
      res,
      await wishlistService.removeItem(req.user!.sub, req.params.productId)
    );
  },
  async moveToCart(req: Request, res: Response) {
    return ok(
      res,
      await wishlistService.moveToCart(
        req.user!.sub,
        req.params.productId,
        req.body.quantity
      )
    );
  },
};
