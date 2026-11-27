import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const registerBody = z.object({
  name: z.string().trim().min(2, "Name must be between 2 and 50 characters").max(50, "Name must be between 2 and 50 characters"),
  email,
  password: z
    .string()
    .min(8, "Password must be between 8 and 128 characters")
    .max(128, "Password must be between 8 and 128 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
