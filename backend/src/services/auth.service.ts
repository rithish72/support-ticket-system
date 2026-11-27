import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { User } from "../models/user.model";
import { LoginInput, RegisterInput } from "../validators/auth.validator";

export const signToken = (userId: string): string =>
  jwt.sign({ userId }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

export const verifyToken = (token: string): { userId: string } =>
  jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as { userId: string };

// Compared against when the email is unknown, so login time doesn't reveal which emails exist.
let dummyHash: string | undefined;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("not-a-real-password", 12));

export const registerUser = async (input: RegisterInput) => {
  if (await User.exists({ email: input.email })) throw new AppError(409, "Email is already registered");
  // role is always "user" here — admins can only be created with the create-admin script
  const user = await User.create({ ...input, role: "user" });
  return { user, token: signToken(user.id) };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    await bcrypt.compare(password, await getDummyHash());
    throw new AppError(401, "Invalid email or password");
  }
  const ok = await user.comparePassword(password);
  if (!ok || !user.isActive) throw new AppError(401, "Invalid email or password");
  return { user, token: signToken(user.id) };
};
