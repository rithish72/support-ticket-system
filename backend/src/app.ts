import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import notificationRoutes from "./routes/notification.routes";
import ticketRoutes from "./routes/ticket.routes";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  if (env.isProd) app.set("trust proxy", 1); // correct client IPs for rate limiting behind Render/Railway/Nginx

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigins, credentials: true }));
  if (!env.isTest) app.use(morgan(env.isProd ? "combined" : "dev"));
  // JSON only (no urlencoded parser) => browsers cannot forge cross-site form posts against cookie auth.
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      success: dbUp,
      message: "Support Ticket API is running",
      database: dbUp ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/tickets", ticketRoutes); // tickets + nested comments + activities
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
