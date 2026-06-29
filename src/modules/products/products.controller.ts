import { Request, Response } from "express";
import { productsService, ProductFilters } from "./products.service";
import { buildPaginationMeta, ok, paginated } from "../../utils/http";

export const productsController = {
  async list(req: Request, res: Response) {
    const filters = req.query as unknown as ProductFilters;
    const { items, total } = await productsService.list(filters);
    return paginated(
      res,
      items,
      buildPaginationMeta(filters.page, filters.limit, total)
    );
  },

  async facets(_req: Request, res: Response) {
    return ok(res, await productsService.getFilterFacets());
  },

  async getBySlug(req: Request, res: Response) {
    return ok(res, await productsService.getBySlug(req.params.slug));
  },

  async getRelated(req: Request, res: Response) {
    return ok(res, await productsService.getRelated(req.params.slug));
  },

  async create(req: Request, res: Response) {
    return ok(res, await productsService.create(req.body), 201);
  },

  async update(req: Request, res: Response) {
    return ok(res, await productsService.update(req.params.id, req.body));
  },

  async remove(req: Request, res: Response) {
    return ok(res, await productsService.remove(req.params.id));
  },
};
