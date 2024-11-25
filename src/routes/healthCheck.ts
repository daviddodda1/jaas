import express from "express";

const healthCheckRouter = express.Router();

healthCheckRouter.get("/", (req, res) => {
  res.status(200).json({ status: "UP" });
});

export default healthCheckRouter;
