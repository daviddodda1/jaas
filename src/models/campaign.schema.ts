import mongoose from "mongoose";

export interface ScriptLog {
  timestamp: Date;
  level: 'info' | 'error' | 'debug';
  message: string;
  scriptType?: string;
}

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
  champain_json: string;
  cleanup_script: string;
  fetch_script: string;
  jobs_raw_html: string;
  jobs_cleanup_script: string;
  jobs_clean_json: string;
  email_generation_script: string;
  generated_emails_json: string;
  send_emails_script: string;
  cleanup_script_logs: ScriptLog[];
  fetch_script_logs: ScriptLog[];
  email_generation_script_logs: ScriptLog[];
  jobs_cleanup_script_logs: ScriptLog[];
  send_emails_script_logs: ScriptLog[];
  is_script_running: boolean;
  current_running_script?: string;
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
      type: String,
      default: "{}",
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
    generated_emails_json: {
      type: String,
      default: "{}",
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
      type: String,
      default: "{}",
    },
    cleanup_script_logs: [{
      timestamp: { type: Date, default: Date.now },
      level: { 
        type: String,
        enum: ['info', 'error', 'debug'],
        required: true 
      },
      message: { type: String, required: true }
    }],
    fetch_script_logs: [{
      timestamp: { type: Date, default: Date.now },
      level: { 
        type: String,
        enum: ['info', 'error', 'debug'],
        required: true 
      },
      message: { type: String, required: true }
    }],
    email_generation_script_logs: [{
      timestamp: { type: Date, default: Date.now },
      level: { 
        type: String,
        enum: ['info', 'error', 'debug'],
        required: true 
      },
      message: { type: String, required: true }
    }],
    jobs_cleanup_script_logs: [{
      timestamp: { type: Date, default: Date.now },
      level: { 
        type: String,
        enum: ['info', 'error', 'debug'],
        required: true 
      },
      message: { type: String, required: true }
    }],
    send_emails_script_logs: [{
      timestamp: { type: Date, default: Date.now },
      level: { 
        type: String,
        enum: ['info', 'error', 'debug'],
        required: true 
      },
      message: { type: String, required: true }
    }],
    is_script_running: {
      type: Boolean,
      default: false
    },
    current_running_script: {
      type: String,
      enum: [
        "cleanup_script",
        "fetch_script",
        "email_generation_script",
        "jobs_cleanup_script",
        "send_emails_script"
      ]
    }
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
