import mongoose from "mongoose";

interface Campaign {
  name: string;
  status:
    | "draft"
    | "queue_pre_clean"
    | "active_pre_clean"
    | "queue_fetch"
    | "active_fetch"
    | "queue_generation"
    | "active_generation"
    | "processing"
    | "completed"
    | "failed";
  auth_credentials: {
    cookie: string;
    token: string;
    expires_at: Date;
  };
  metadata: Map<string, any>;
  champain_raw_html: string;
  champain_json: any;
  cleanup_script: string;
  fetch_script: string;
  email_generation_script: string;
  jobs_cleanup_script: string;
  send_emails_script: string;
  jobs_raw_html: string;
  jobs_clean_json: any;
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
      enum: [
        "draft",
        "queue_pre_clean",
        "active_pre_clean",
        "queue_fetch",
        "active_fetch",
        "queue_generation",
        "active_generation",
        "processing",
        "completed",
        "failed",
      ],
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
    cleanup_script: {
      type: String,
      default: "// Default cleanup script template\n",
    },
    fetch_script: {
      type: String,
      default: "// Default fetch script template\n",
    },
    email_generation_script: {
      type: String,
      default: "// Default email generation script template\n",
    },
    jobs_cleanup_script: {
      type: String,
      default: "// Default jobs cleanup script template\n",
    },
    send_emails_script: {
      type: String,
      default: "// Default send emails script template\n",
    },
    jobs_raw_html: {
      type: String,
      default: "",
    },
    jobs_clean_json: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// add toJson to turn _id into id
CampaignSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Campaign = mongoose.model<Campaign>("Campaign", CampaignSchema);

export default Campaign;
