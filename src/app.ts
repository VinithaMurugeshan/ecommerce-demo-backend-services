import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { mountSwagger } from "./config/swagger";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { asyncHandler } from "./utils/asyncHandler";
import { paymentsController } from "./modules/payments/payments.controller";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl === "*" ? true : env.clientUrl.split(","),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan("dev"));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  /**
   * @openapi
   * /payments/webhook:
   *   post:
   *     tags: [Payments]
   *     summary: Stripe webhook endpoint (raw body, signature-verified)
   *     security: []
   *     description: Configure this URL in the Stripe dashboard. Not called directly by clients.
   *     responses:
   *       200: { description: Event received }
   *       400: { description: Signature verification failed }
   */
  // Stripe webhook needs the raw body, so it must be registered before express.json().
  app.post(
    `${env.apiPrefix}/payments/webhook`,
    express.raw({ type: "application/json" }),
    asyncHandler(paymentsController.webhook)
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API docs
  mountSwagger(app);

  // Root redirect to docs
  app.get("/", (_req, res) => res.redirect("/docs"));

  // Versioned API
  app.use(env.apiPrefix, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
