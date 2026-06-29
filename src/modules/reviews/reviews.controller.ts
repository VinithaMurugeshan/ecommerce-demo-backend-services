import { Request, Response } from "express";
import { reviewsService } from "./reviews.service";
import { buildPaginationMeta, ok, paginated } from "../../utils/http";

export const reviewsController = {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const { items, total } = await reviewsService.listForProduct(
      req.params.slug,
      page,
      limit
    );
    return paginated(res, items, buildPaginationMeta(page, limit, total));
  },
  async create(req: Request, res: Response) {
    return ok(
      res,
      await reviewsService.create(req.user!.sub, req.params.slug, req.body),
      201
    );
  },
  async update(req: Request, res: Response) {
    return ok(
      res,
      await reviewsService.update(req.user!.sub, req.params.id, req.body)
    );
  },
  async remove(req: Request, res: Response) {
    return ok(res, await reviewsService.remove(req.user!.sub, req.params.id));
  },
};
