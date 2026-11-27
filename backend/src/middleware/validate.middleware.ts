import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";
import { AppError } from "../errors/AppError";

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

/**
 * Validates + sanitises request parts with Zod. Unknown fields are stripped (no mass assignment)
 * and values are type-checked (so `{ "email": { "$gt": "" } }` NoSQL-injection payloads are rejected).
 * Error items keep the `{ path, msg }` shape of the previous express-validator implementation.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const issues: { location: string; path: string; msg: string }[] = [];

    for (const key of ["params", "query", "body"] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const input = key === "body" ? (req.body ?? {}) : req[key];
      const result = schema.safeParse(input);
      if (result.success) {
        Object.defineProperty(req, key, { value: result.data, writable: true, configurable: true, enumerable: true });
      } else {
        for (const i of result.error.issues) {
          issues.push({ location: key, path: i.path.join("."), msg: i.message });
        }
      }
    }

    if (issues.length > 0) return next(new AppError(400, "Validation failed", issues));
    next();
  };
