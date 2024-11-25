import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { Application } from "express";
import { join } from "path";

interface SwaggerDefinition {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
  components: {
    schemas: {
      [key: string]: any;
    };
    securitySchemes?: {
      [key: string]: any;
    };
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

// Swagger schema definitions
const schemas = {
  ProcessingStep: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["pending", "in_progress", "completed", "failed"],
        description: "Current status of the processing step",
      },
      error: {
        type: "string",
        nullable: true,
        description: "Error message if the step failed",
      },
      started_at: {
        type: "string",
        format: "date-time",
        nullable: true,
        description: "Timestamp when the step started",
      },
      completed_at: {
        type: "string",
        format: "date-time",
        nullable: true,
        description: "Timestamp when the step completed",
      },
    },
  },
  Campaign: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        description: "Unique identifier for the campaign",
      },
      name: {
        type: "string",
        description: "Name of the campaign",
      },
      status: {
        type: "string",
        enum: ["draft", "active", "processing", "completed", "failed"],
        description: "Current status of the campaign",
      },
      auth_credentials: {
        type: "object",
        properties: {
          cookie: {
            type: "string",
            description: "Authentication cookie",
          },
          token: {
            type: "string",
            description: "Authentication token",
          },
          expires_at: {
            type: "string",
            format: "date-time",
            description: "Credentials expiration timestamp",
          },
        },
      },
      metadata: {
        type: "object",
        additionalProperties: true,
        description: "Additional metadata for the campaign",
      },
      champain_raw_html: {
        type: "string",
        description: "Raw HTML content of the campaign",
      },
      champain_json: {
        type: "object",
        additionalProperties: true,
        description: "Parsed JSON data from the campaign",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Campaign creation timestamp",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Campaign last update timestamp",
      },
    },
    required: ["name"],
  },
  Job: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        description: "Unique identifier for the job",
      },
      campaign_id: {
        type: "string",
        description: "Reference to parent campaign",
      },
      job_link: {
        type: "string",
        description: "URL of the job posting",
      },
      job_id: {
        type: "string",
        description: "Unique identifier for the job posting",
      },
      job_role: {
        type: "string",
        description: "Job title/role",
      },
      employer: {
        type: "string",
        description: "Employer name",
      },
      location: {
        type: "string",
        description: "Job location",
      },
      work_arrangement: {
        type: "string",
        description: "Work arrangement (remote/onsite/hybrid)",
      },
      salary: {
        type: "string",
        description: "Salary information",
      },
      processing_status: {
        type: "string",
        enum: ["pending", "in_progress", "completed", "failed"],
        description: "Overall processing status",
      },
      current_step: {
        type: "string",
        enum: [
          "pending",
          "fetching_html",
          "cleaning_html",
          "extracting_info",
          "generating_email",
          "completed",
        ],
        description: "Current processing step",
      },
      job_info_html: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Raw HTML content",
          },
          step: {
            $ref: "#/components/schemas/ProcessingStep",
          },
        },
      },
      job_info_clean_html: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Cleaned HTML content",
          },
          step: {
            $ref: "#/components/schemas/ProcessingStep",
          },
        },
      },
      job_info_json: {
        type: "object",
        properties: {
          content: {
            type: "object",
            properties: {
              contact_email: {
                type: "string",
                description: "Contact email for application",
              },
              application_instructions: {
                type: "string",
                description: "Instructions for applying",
              },
              job_posting_text: {
                type: "string",
                description: "Full job posting text",
              },
              additional_info: {
                type: "object",
                properties: {
                  salary_range: {
                    type: "string",
                    description: "Salary range",
                  },
                  location_details: {
                    type: "string",
                    description: "Detailed location information",
                  },
                  company_name: {
                    type: "string",
                    description: "Company name",
                  },
                  job_type: {
                    type: "string",
                    description: "Type of job",
                  },
                  required_experience: {
                    type: "string",
                    description: "Required experience",
                  },
                  education_requirements: {
                    type: "string",
                    description: "Education requirements",
                  },
                  language_requirements: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description: "Required languages",
                  },
                  skills_required: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description: "Required skills",
                  },
                  benefits: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description: "Job benefits",
                  },
                },
              },
            },
          },
          step: {
            $ref: "#/components/schemas/ProcessingStep",
          },
        },
      },
      job_application_email: {
        type: "object",
        properties: {
          to_email: {
            type: "string",
            description: "Recipient email address",
          },
          subject: {
            type: "string",
            description: "Email subject",
          },
          content_html: {
            type: "string",
            description: "HTML content of the email",
          },
          content_text: {
            type: "string",
            description: "Plain text content of the email",
          },
          generation_prompt: {
            type: "string",
            description: "Prompt used to generate the email",
          },
          resume_used: {
            type: "object",
            properties: {
              version: {
                type: "string",
                description: "Resume version",
              },
              content: {
                type: "string",
                description: "Resume content",
              },
              file_name: {
                type: "string",
                description: "Resume file name",
              },
            },
          },
          metadata: {
            type: "object",
            properties: {
              tailored_skills: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Skills tailored for this application",
              },
              highlighted_experiences: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Experiences highlighted in the application",
              },
              matching_score: {
                type: "number",
                description: "Match score between job and resume",
              },
              custom_fields: {
                type: "object",
                additionalProperties: true,
                description: "Custom metadata fields",
              },
            },
          },
          step: {
            $ref: "#/components/schemas/ProcessingStep",
          },
        },
      },
      last_error: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Error message",
          },
          step: {
            type: "string",
            description: "Step where the error occurred",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "When the error occurred",
          },
        },
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Job creation timestamp",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Job last update timestamp",
      },
    },
    required: [
      "campaign_id",
      "job_link",
      "job_id",
      "job_role",
      "employer",
      "location",
      "work_arrangement",
      "salary",
    ],
  },
};

// Swagger configuration
const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Job Application AI API",
    version: "1.0.0",
    description: "API documentation for the Job Application AI project",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  },
  servers: [
    {
      url: process.env.API_URL || "http://localhost:3000",
      description: "Development server",
    },
  ],
  components: {
    schemas,
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  tags: [
    {
      name: "Campaigns",
      description: "Campaign management endpoints",
    },
    {
      name: "Jobs",
      description: "Job processing endpoints",
    },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

// Create swagger specification
const swaggerSpec = swaggerJsdoc(options);

// Swagger setup function
export const swaggerSetup = (app: Application) => {
  // Swagger documentation endpoint
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Job Application AI API Documentation",
      customfavIcon: "/favicon.ico",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        deepLinking: true,
      },
    })
  );

  // Expose swagger.json
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export default swaggerSetup;
