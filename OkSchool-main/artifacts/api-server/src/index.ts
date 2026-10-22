import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { ensureUserMockSchema } from "./lib/ensure-schema";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"] || "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    await ensureUserMockSchema();
  } catch (err) {
    logger.error({ err }, "Failed to ensure user mock schema");
  }

  const server = app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(async () => {
      try {
        await pool.end();
      } catch (err) {
        logger.error({ err }, "Error closing pool");
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
    shutdown("uncaughtException");
  });
}

start();
