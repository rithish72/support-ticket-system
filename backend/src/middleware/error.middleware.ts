import { ErrorRequestHandler, RequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/** Single place where every error becomes a consistent `{ success:false, message, errors? }` response. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = "Internal server error";
  let errors: unknown[] | undefined;

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  } else if (err?.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  } else if (err?.name === "ValidationError") {
    status = 400;
    message = "Validation failed";
    errors = Object.values(err.errors ?? {}).map((e: any) => ({ path: e.path, msg: e.message }));
  } else if (err?.code === 11000) {
    status = 409;
    message = "Resource already exists";
  } else if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token";
  }

  if (status >= 500) console.error("Unhandled error:", err);

  res.status(status).json({
    success: false,
    message: status >= 500 && env.isProd ? "Internal server error" : message,
    ...(errors ? { errors } : {}),
  });
};
