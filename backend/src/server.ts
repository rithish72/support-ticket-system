import dns from "node:dns";
import { createApp } from "./app";
import { connectDB, disconnectDB } from "./config/database";
import { env } from "./config/env";
import { registerEventListeners } from "./events";

// Optional: some networks fail Atlas SRV lookups; set DNS_SERVERS=8.8.8.8,8.8.4.4 to override.
if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(",").map((s) => s.trim()));

const start = async () => {
  await connectDB();
  registerEventListeners();

  const server = createApp().listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    console.log(`Health check: http://localhost:${env.PORT}/api/health`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));

start().catch((err) => {
  console.error("Server startup failed:", err);
  process.exit(1);
});
