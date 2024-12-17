import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { logger } from "./config/logger.js";

const PORT = process.env.PORT || 3000;

// Connect to both MongoDB and Redis before starting the server
Promise.all([connectDB(), connectRedis()])
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("Failed to connect to services:", error);
    process.exit(1);
  });
