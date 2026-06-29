import { Request, Response } from "express";
import { ReturnStatus } from "../../types/enums";
import { returnsService } from "./returns.service";
import { ok } from "../../utils/http";

export const returnsController = {
  async create(req: Request, res: Response) {
    return ok(res, await returnsService.create(req.user!.sub, req.body), 201);
  },
  async list(req: Request, res: Response) {
    return ok(res, await returnsService.listForUser(req.user!.sub));
  },
  async getById(req: Request, res: Response) {
    return ok(res, await returnsService.getByIdForUser(req.user!.sub, req.params.id));
  },
  async listAll(req: Request, res: Response) {
    return ok(
      res,
      await returnsService.listAll(req.query.status as ReturnStatus | undefined)
    );
  },
  async updateStatus(req: Request, res: Response) {
    return ok(
      res,
      await returnsService.updateStatus(req.params.id, req.body.status)
    );
  },
};
