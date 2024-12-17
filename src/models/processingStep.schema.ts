import mongoose from "mongoose";

export interface ProcessingStep {
  status: "pending" | "in_progress" | "completed" | "failed";
  error: string | null;
  started_at: Date | null;
  completed_at: Date | null;
}
const ProcessingStepSchema = new mongoose.Schema<ProcessingStep>(
  {
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
    },
    error: {
      type: String,
      default: null,
    },
    started_at: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

export default ProcessingStepSchema;
