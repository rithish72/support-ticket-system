import { NextFunction, Request, RequestHandler, Response } from "express";

/** Forwards rejected promises to the global error handler (no try/catch in controllers). */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
