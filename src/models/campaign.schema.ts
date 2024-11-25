import mongoose from "mongoose";

interface Campaign {
  name: string;
  status: "draft" | "active" | "processing" | "completed" | "failed";
  auth_credentials: {
    cookie: string;
    token: string;
    expires_at: Date;
  };
  metadata: Map<string, any>;
  champain_raw_html: string;
  champain_json: any;
}

const CampaignSchema = new mongoose.Schema<Campaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "processing", "completed", "failed"],
      default: "draft",
    },
    auth_credentials: {
      cookie: String,
      token: String,
      expires_at: Date,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
    champain_raw_html: {
      type: String,
    },
    champain_json: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const Campaign = mongoose.model<Campaign>("Campaign", CampaignSchema);

export default Campaign;
