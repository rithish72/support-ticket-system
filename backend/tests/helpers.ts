import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { registerEventListeners } from "../src/events";
import { User } from "../src/models/user.model";

export const app = createApp();

export const startDb = async () => {
  let uri = process.env.MONGODB_TEST_URI;
  let stop = async () => {};
  if (!uri) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    stop = () => mem.stop();
  }
  await mongoose.connect(uri!, { dbName: `tickets_test_${Date.now()}` });
  registerEventListeners();
  return async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await stop();
  };
};

export const clearDb = async () => {
  const cols = await mongoose.connection.db!.collections();
  await Promise.all(cols.map((c) => c.deleteMany({})));
};

export const register = async (name: string, email: string, password = "Password123") => {
  const res = await request(app).post("/api/auth/register").send({ name, email, password });
  return { res, token: res.body?.data?.token as string, id: res.body?.data?.user?.id as string };
};

export const makeAdmin = async (email = "admin@test.com", password = "AdminPassword123") => {
  await User.create({ name: "Admin", email, password, role: "admin" });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return { token: res.body.data.token as string, id: res.body.data.user.id as string };
};

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Events are handled asynchronously — poll until the assertion holds. */
export const eventually = async (fn: () => Promise<void>, ms = 3000) => {
  const end = Date.now() + ms;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      if (Date.now() > end) throw e;
      await new Promise((r) => setTimeout(r, 50));
    }
  }
};
