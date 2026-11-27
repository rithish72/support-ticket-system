import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).optional(),
  DNS_SERVERS: z.string().optional(),
  ADMIN_NAME: z.string().default("Administrator"),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${problems}`);
  process.exit(1);
}

const raw = parsed.data;
const isProd = raw.NODE_ENV === "production";

export const env = {
  ...raw,
  isProd,
  isTest: raw.NODE_ENV === "test",
  clientOrigins: raw.CLIENT_URL.split(",").map((s) => s.trim()).filter(Boolean),
  cookieSameSite: (raw.COOKIE_SAME_SITE ?? (isProd ? "none" : "lax")) as "strict" | "lax" | "none",
};
