import { Request, Response } from "express";
import { OrderStatus } from "../../types/enums";
import { ordersService } from "./orders.service";
import { buildPaginationMeta, ok, paginated } from "../../utils/http";

export const ordersController = {
  async checkout(req: Request, res: Response) {
    return ok(res, await ordersService.checkout(req.user!.sub, req.body), 201);
  },

  async list(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const { items, total } = await ordersService.listForUser(req.user!.sub, page, limit);
    return paginated(res, items, buildPaginationMeta(page, limit, total));
  },

  async getById(req: Request, res: Response) {
    return ok(res, await ordersService.getByIdForUser(req.user!.sub, req.params.id));
  },

  async track(req: Request, res: Response) {
    return ok(
      res,
      await ordersService.trackByNumber(req.params.orderNumber, req.user!.sub)
    );
  },

  async cancel(req: Request, res: Response) {
    return ok(res, await ordersService.cancel(req.user!.sub, req.params.id));
  },

  // Admin
  async listAll(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = req.query.status as OrderStatus | undefined;
    const { items, total } = await ordersService.listAll(page, limit, status);
    return paginated(res, items, buildPaginationMeta(page, limit, total));
  },

  async updateStatus(req: Request, res: Response) {
    return ok(
      res,
      await ordersService.updateStatus(
        req.params.id,
        req.body.status,
        req.body.message,
        req.body.location
      )
    );
  },
};
