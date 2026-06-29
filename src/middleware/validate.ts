import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Validates and coerces req.body / req.query / req.params against a Zod schema.
 * The schema should be shaped like z.object({ body, query, params }).
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      // req.query / req.params getters are read-only in some setups; assign defensively.
      if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        throw ApiError.unprocessable("Validation failed", details);
      }
      throw err;
    }
  };
}
