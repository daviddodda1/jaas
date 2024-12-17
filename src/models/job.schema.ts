import mongoose from "mongoose";
import ProcessingStepSchema from "./processingStep.schema.js";

interface Job {
  campaign_id: mongoose.Types.ObjectId;
  job_link: string;
  job_id: string;
  job_role: string;
  employer: string;
  location: string;
  work_arrangement: string;
  salary: string;
  processing_status: "pending" | "in_progress" | "completed" | "failed";
  current_step:
    | "pending"
    | "fetching_html"
    | "cleaning_html"
    | "extracting_info"
    | "generating_email"
    | "completed";
  job_info_html: {
    content: string;
    step: ProcessingStep;
  };
  job_info_clean_html: {
    content: string;
    step: ProcessingStep;
  };
  job_info_json: {
    content: {
      contact_email: string;
      application_instructions: string;
      job_posting_text: string;
      additional_info: {
        salary_range: string;
        location_details: string;
        company_name: string;
        job_type: string;
        required_experience: string;
        education_requirements: string;
        language_requirements: string[];
        skills_required: string[];
        benefits: string[];
      };
    };
    step: ProcessingStep;
  };
  job_application_email: {
    to_email: string;
    subject: string;
    content_html: string;
    content_text: string;
    generation_prompt: string;
    resume_used: {
      version: string;
      content: string;
      file_name: string;
    };
    metadata: {
      tailored_skills: string[];
      highlighted_experiences: string[];
      matching_score: number;
      custom_fields: Map<string, any>;
    };
    step: ProcessingStep;
  };
  last_error: {
    message: string;
    step: string;
    timestamp: Date;
  };
}

const JobSchema = new mongoose.Schema(
  {
    campaign_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    job_link: {
      type: String,
      required: true,
    },
    job_id: {
      type: String,
      required: true,
    },
    job_role: {
      type: String,
      required: true,
    },
    employer: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    work_arrangement: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
      required: true,
    },
    processing_status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
    },
    current_step: {
      type: String,
      enum: [
        "pending",
        "fetching_html",
        "cleaning_html",
        "extracting_info",
        "generating_email",
        "completed",
      ],
      default: "pending",
    },
    job_info_html: {
      content: String,
      step: ProcessingStepSchema,
    },
    job_info_clean_html: {
      content: String,
      step: ProcessingStepSchema,
    },
    job_info_json: {
      content: {
        contact_email: String,
        application_instructions: String,
        job_posting_text: String,
        additional_info: {
          salary_range: String,
          location_details: String,
          company_name: String,
          job_type: String,
          required_experience: String,
          education_requirements: String,
          language_requirements: [String],
          skills_required: [String],
          benefits: [String],
        },
      },
      step: ProcessingStepSchema,
    },
    job_application_email: {
      to_email: String,
      subject: String,
      content_html: String,
      content_text: String,
      generation_prompt: String,
      resume_used: {
        version: String,
        content: String,
        file_name: String,
      },
      metadata: {
        tailored_skills: [String],
        highlighted_experiences: [String],
        matching_score: Number,
        custom_fields: Map,
      },
      step: ProcessingStepSchema,
    },
    last_error: {
      message: String,
      step: String,
      timestamp: Date,
    },
  },
  {
    timestamps: true,
    indexes: [
      { campaign_id: 1, job_id: 1 },
      { campaign_id: 1, processing_status: 1 },
      { campaign_id: 1, current_step: 1 },
      { processing_status: 1 },
      { current_step: 1 },
      { "job_info_json.content.contact_email": 1 },
    ],
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const STEP_ORDER = {
  pending: 0,
  fetching_html: 1,
  cleaning_html: 2,
  extracting_info: 3,
  generating_email: 4,
  completed: 5,
} as const;

type ProcessingStep = keyof typeof STEP_ORDER;

type JobStepProperties = {
  job_info_html: {
    content: string;
    step: mongoose.Types.Subdocument & {
      status: string;
      started_at?: Date;
      completed_at?: Date;
      error?: string;
    };
  };
  job_info_clean_html: {
    content: string;
    step: mongoose.Types.Subdocument & {
      status: string;
      started_at?: Date;
      completed_at?: Date;
      error?: string;
    };
  };
  job_info_json: {
    content: {
      contact_email: string;
      application_instructions: string;
      job_posting_text: string;
      additional_info: {
        salary_range: string;
        location_details: string;
        company_name: string;
        job_type: string;
        required_experience: string;
        education_requirements: string;
        language_requirements: string[];
        skills_required: string[];
        benefits: string[];
      };
    };
    step: mongoose.Types.Subdocument & {
      status: string;
      started_at?: Date;
      completed_at?: Date;
      error?: string;
    };
  };
  job_application_email: {
    to_email: string;
    subject: string;
    content_html: string;
    content_text: string;
    generation_prompt: string;
    resume_used: { version: string; content: string; file_name: string };
    metadata: {
      tailored_skills: string[];
      highlighted_experiences: string[];
      matching_score: number;
      custom_fields: { [key: string]: any };
    };
    step: mongoose.Types.Subdocument & {
      status: string;
      started_at?: Date;
      completed_at?: Date;
      error?: string;
    };
  };
};

// Extend the Mongoose document type to include _previousValues
interface JobDocument extends mongoose.Document {
  _previousValues?: {
    current_step?: ProcessingStep;
  };
}

JobSchema.virtual("processing_duration").get(function () {
  if (
    this.processing_status === "completed" ||
    this.processing_status === "failed"
  ) {
    const lastStep =
      this.job_application_email?.step?.completed_at ||
      this.job_info_json?.step?.completed_at ||
      this.job_info_clean_html?.step?.completed_at ||
      this.job_info_html?.step?.completed_at;

    if (lastStep && this.createdAt) {
      return lastStep.getTime() - this.createdAt.getTime();
    }
  }
  return null;
});

JobSchema.virtual("current_step_duration").get(function () {
  const currentStepObj = (this as any as JobStepProperties)[
    this.current_step as keyof JobStepProperties
  ];

  if (currentStepObj?.step?.started_at) {
    const endTime = currentStepObj.step.completed_at || new Date();
    return endTime.getTime() - currentStepObj.step.started_at.getTime();
  }
  return null;
});

JobSchema.virtual("progress_percentage").get(function () {
  if (this.processing_status === "completed") return 100;
  if (this.processing_status === "pending") return 0;

  const currentStepValue = STEP_ORDER[this.current_step as ProcessingStep] || 0;
  const totalSteps = Object.keys(STEP_ORDER).length - 2;

  return Math.round((currentStepValue / totalSteps) * 100);
});

JobSchema.virtual("step_timings").get(function () {
  return {
    fetch_html:
      this.job_info_html?.step?.completed_at &&
      this.job_info_html?.step?.started_at
        ? this.job_info_html.step.completed_at.getTime() -
          this.job_info_html.step.started_at.getTime()
        : null,
    clean_html:
      this.job_info_clean_html?.step?.completed_at &&
      this.job_info_clean_html?.step?.started_at
        ? this.job_info_clean_html.step.completed_at.getTime() -
          this.job_info_clean_html.step.started_at.getTime()
        : null,
    extract_info:
      this.job_info_json?.step?.completed_at &&
      this.job_info_json?.step?.started_at
        ? this.job_info_json.step.completed_at.getTime() -
          this.job_info_json.step.started_at.getTime()
        : null,
    generate_email:
      this.job_application_email?.step?.completed_at &&
      this.job_application_email?.step?.started_at
        ? this.job_application_email.step.completed_at.getTime() -
          this.job_application_email.step.started_at.getTime()
        : null,
  };
});

JobSchema.pre("save", function (next: any) {
  if (
    this.isModified("updatedAt") &&
    Object.keys(this.modifiedPaths()).length === 1
  ) {
    return next();
  }

  const stepStatuses = [
    this.job_info_html?.step?.status,
    this.job_info_clean_html?.step?.status,
    this.job_info_json?.step?.status,
    this.job_application_email?.step?.status,
  ];

  if (stepStatuses.some((status) => status === "failed")) {
    this.processing_status = "failed";
  } else if (stepStatuses.every((status) => status === "completed")) {
    this.processing_status = "completed";
    this.current_step = "completed";
  } else if (stepStatuses.some((status) => status === "in_progress")) {
    this.processing_status = "in_progress";
  } else if (stepStatuses.every((status) => !status || status === "pending")) {
    this.processing_status = "pending";
  }

  if (this.isModified("current_step")) {
    const currentStepValue = STEP_ORDER[this.current_step as ProcessingStep];
    const previousStep = (this as JobDocument)._previousValues?.current_step;
    const previousStepValue = STEP_ORDER[previousStep as ProcessingStep];

    if (
      currentStepValue < previousStepValue &&
      this.processing_status !== "failed"
    ) {
      return next(
        new Error(
          `Invalid step transition from ${previousStep} to ${this.current_step}`
        )
      );
    }
  }

  next();
});

JobSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  if (update.$set?.processing_status === "completed") {
    update.$set.current_step = "completed";
  }
  next();
});

JobSchema.methods.updateStepStatus = async function (
  step: string,
  status: string,
  error: string | null = null
) {
  const stepPath = `${step}.step`;
  const update: any = {
    $set: {
      [stepPath + ".status"]: status,
      current_step: step,
    },
  };

  if (status === "in_progress") {
    update.$set[stepPath + ".started_at"] = new Date();
  } else if (status === "completed" || status === "failed") {
    update.$set[stepPath + ".completed_at"] = new Date();
  }

  if (error) {
    update.$set[stepPath + ".error"] = error;
    update.$set.last_error = {
      message: error,
      step: step,
      timestamp: new Date(),
    };
  }

  return await this.model("Job").findByIdAndUpdate(this._id, update, {
    new: true,
  });
};

JobSchema.methods.canProceedToNextStep = function (): boolean {
  const currentStepValue = STEP_ORDER[this.current_step as ProcessingStep];
  const nextStep = Object.entries(STEP_ORDER).find(
    ([, value]) => value === currentStepValue + 1
  )?.[0];

  if (!nextStep) return false;

  const currentStepObj = this[this.current_step as string];
  return currentStepObj?.step?.status === "completed";
};

const Job = mongoose.model("Job", JobSchema);
export default Job;
