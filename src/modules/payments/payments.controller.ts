import { Request, Response } from "express";
import { paymentsService } from "./payments.service";
import { ok } from "../../utils/http";

export const paymentsController = {
  async getMethods(_req: Request, res: Response) {
    return ok(res, paymentsService.getMethods());
  },

  async createIntent(req: Request, res: Response) {
    return ok(
      res,
      await paymentsService.createPaymentIntent(req.user!.sub, req.params.orderId),
      201
    );
  },

  async confirm(req: Request, res: Response) {
    return ok(
      res,
      await paymentsService.confirmPayment(req.user!.sub, req.params.orderId)
    );
  },

  async refund(req: Request, res: Response) {
    return ok(
      res,
      await paymentsService.refund(req.params.orderId, req.body.amount)
    );
  },

  // Mounted with express.raw() before the JSON parser, so req.body is a Buffer.
  async webhook(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"] as string;
    const result = await paymentsService.handleWebhook(
      req.body as Buffer,
      signature
    );
    return res.json(result);
  },
};
