import { CookieOptions, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { UserDocument } from "../models/user.model";
import { loginUser, registerUser } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd || env.cookieSameSite === "none",
  sameSite: env.cookieSameSite,
  path: "/",
};

const publicUser = (u: UserDocument) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});

const sendAuth = (res: Response, status: number, message: string, user: UserDocument, token: string) => {
  res.cookie("token", token, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });
  // `token` is also returned so API clients (Postman, mobile) can use `Authorization: Bearer <token>`.
  res.status(status).json({ success: true, message, data: { user: publicUser(user), token } });
};

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await registerUser(req.body);
  sendAuth(res, 201, "Registration successful", user, token);
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);
  sendAuth(res, 200, "Login successful", user, token);
});

export const getMe = (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, "Not authenticated");
  res.status(200).json({ success: true, data: { user: req.user } });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ success: true, message: "Logout successful" });
};
