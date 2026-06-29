import { Request, Response } from "express";
import { categoriesService } from "./categories.service";
import { ok } from "../../utils/http";

export const categoriesController = {
  async list(_req: Request, res: Response) {
    return ok(res, await categoriesService.list());
  },
  async getBySlug(req: Request, res: Response) {
    return ok(res, await categoriesService.getBySlug(req.params.slug));
  },
  async create(req: Request, res: Response) {
    return ok(res, await categoriesService.create(req.body), 201);
  },
  async update(req: Request, res: Response) {
    return ok(res, await categoriesService.update(req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    return ok(res, await categoriesService.remove(req.params.id));
  },
};
