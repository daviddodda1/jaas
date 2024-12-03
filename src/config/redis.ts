import { createClient } from "redis";
import { logger } from "./logger.js";

const redisClient = createClient({
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

export default redisClient;
