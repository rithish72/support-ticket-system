import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const make = (limit: number, message: string, skipSuccessfulRequests = false) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: () => env.isTest,
    message: { success: false, message },
  });

export const apiLimiter = make(300, "Too many requests. Please try again later.");
/** Brute-force protection: only failed login/register attempts count. */
export const authLimiter = make(20, "Too many authentication attempts. Please try again later.", true);
