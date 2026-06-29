import { NextFunction, Request, Response } from "express";
import { Role } from "../types/enums";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Requires a valid access token; attaches the decoded user to req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing or malformed Authorization header");
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired access token");
  }
}

/** Restricts a route to specific roles (use after `authenticate`). */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (roles.length && !roles.includes(req.user.role)) {
      throw ApiError.forbidden("You do not have access to this resource");
    }
    next();
  };
}
