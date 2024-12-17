import { corsSetup } from "./config/cors.js";
import { logger } from "./config/logger.js";
import { swaggerSetup } from "./config/swagger.js";
import campaignRoutes from "./routes/campaign.routes.js";
import healthCheckRouter from "./routes/healthCheck.js";
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "5mb" })); // Increase the limit for JSON data
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true })); // Increase the limit for urlencoded data
corsSetup(app);
swaggerSetup(app);

// Routes
// app.use('/api', routes);
app.use("/", healthCheckRouter);
app.use("/campaigns", campaignRoutes);

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error(err.stack);
    res.status(500).send("Something broke!");
  }
);

export default app;
