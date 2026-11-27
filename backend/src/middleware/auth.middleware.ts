import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { User } from "../models/user.model";
import { verifyToken } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";

const extractToken = (req: Request): string | undefined => {
  const fromCookie = req.cookies?.token as string | undefined;
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return undefined;
};

/** Authenticates via httpOnly cookie (browser) or `Authorization: Bearer <jwt>` (API clients/Postman). */
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw new AppError(401, "Authentication required");

  let userId: string;
  try {
    userId = verifyToken(token).userId;
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new AppError(401, "User is not authorized");

  req.user = user;
  next();
});
