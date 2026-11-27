import { connectDB, disconnectDB } from "../config/database";
import { env } from "../config/env";
import { User } from "../models/user.model";

const run = async () => {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
  if (password.length < 12) throw new Error("Admin password must be at least 12 characters");

  await connectDB();
  if (await User.exists({ email })) {
    console.log("An account with this email already exists. No changes were made.");
    return;
  }
  await User.create({ name: env.ADMIN_NAME, email, password, role: "admin" }); // hashed by the model hook
  console.log("Admin account created successfully.");
};

run()
  .catch((err) => {
    console.error("Admin creation failed:", err.message ?? err);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
