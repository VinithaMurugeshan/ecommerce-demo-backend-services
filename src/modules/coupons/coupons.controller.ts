import { Request, Response } from "express";
import { couponsService } from "./coupons.service";
import { ok } from "../../utils/http";

export const couponsController = {
  async list(_req: Request, res: Response) {
    return ok(res, await couponsService.list());
  },
  async validate(req: Request, res: Response) {
    return ok(
      res,
      await couponsService.validate(req.body.code, req.body.subtotal)
    );
  },
  async create(req: Request, res: Response) {
    return ok(res, await couponsService.create(req.body), 201);
  },
  async update(req: Request, res: Response) {
    return ok(res, await couponsService.update(req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    return ok(res, await couponsService.remove(req.params.id));
  },
};
