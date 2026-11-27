import { RequestHandler } from "express";
import { Role } from "../constants";
import { AppError } from "../errors/AppError";

export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission to access this resource"));
    }
    next();
  };
