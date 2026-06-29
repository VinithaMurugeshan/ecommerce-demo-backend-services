import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      message = `A record with this ${target ?? "value"} already exists`;
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Requested record was not found";
    } else {
      statusCode = 400;
      message = "Database request error";
      details = { code: err.code };
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid database query";
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
      ...(env.isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
    },
  });
}
