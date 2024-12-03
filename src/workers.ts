import connectDB from "./config/db.js";
import { logger } from "./config/logger.js";
import { startWorker as startChampainRawHtmlCleanerWorker } from "./workers/champain_raw_html_cleaner_worker.js";
import dotenv from "dotenv";

dotenv.config();

import { createClient } from "redis";

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${
    process.env.REDIS_PORT || "6379"
  }`,
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

redisClient.on("error", (err) => {
  logger.error("Redis error:", err);
});

const startWorkers = () => {
  logger.info("Starting all workers...");

  // Start the champain raw HTML cleaner worker
  startChampainRawHtmlCleanerWorker();

  // Add more workers here as needed
};

// Start the worker with proper error handling
const main = async () => {
  try {
    console.log(process.env.REDIS_HOST);
    // Ensure Redis client is ready
    await redisClient.connect();
    logger.info("Redis client connected");

    await startWorkers();
  } catch (error) {
    logger.error(`Fatal worker error: ${error}`);
    await redisClient.quit();
    process.exit(1);
  }
};

// Handle process termination
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await redisClient.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await redisClient.quit();
  process.exit(0);
});

connectDB().then(() => {
  // Start the application
  main().catch((error) => {
    logger.error(`Failed to start worker: ${error}`);
    process.exit(1);
  });
});
