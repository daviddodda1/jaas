import { createClient } from "redis";
import { logger } from "./logger.js";

// Use environment variables with your network IP
const redisUrl = `redis://${process.env.REDIS_HOST || "100.70.72.62"}:${
  process.env.REDIS_PORT || "6379"
}`;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      logger.info(`Reconnecting to Redis... Attempt ${retries}`);
      return Math.min(retries * 100, 3000);
    },
  }
});

redisClient.on("error", (err) => {
  logger.error("Redis error:", err);
});

redisClient.on("connect", () => {
  logger.info(`Redis connected to ${redisUrl}`);
});

redisClient.on("reconnecting", () => {
  logger.info("Redis reconnecting...");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis client connected successfully");
  } catch (err) {
    logger.error("Redis connection error:", err);
    throw err;
  }
};
