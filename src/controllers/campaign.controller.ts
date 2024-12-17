// campaign.controller.ts
import Campaign from "../models/campaign.schema.js";
import { Request, Response } from "express";
import { redisClient } from "../config/redis.js";
// Create a new campaign
export const createCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Error creating campaign", error });
  }
};

// Get all campaigns
export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await Campaign.find();
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Error fetching campaigns", error });
  }
};

// Get a single campaign by ID
export const getCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Error fetching campaign", error });
  }
};

// Update a campaign by ID
export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Error updating campaign", error });
  }
};

// Delete a campaign by ID
export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting campaign", error });
  }
};

// Execute a script
export const executeScript = async (req: Request, res: Response) => {
  try {
    const { id, scriptType } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === "processing") {
      return res
        .status(400)
        .json({ message: "Another script is currently running" });
    }

    // Get the input data based on script type
    let inputData;
    let scriptContent;
    switch (scriptType) {
      case "cleanup_script":
        inputData = campaign.champain_raw_html;
        scriptContent = campaign.cleanup_script;
        break;
      case "jobs_cleanup_script":
        inputData = campaign.jobs_raw_html;
        scriptContent = campaign.jobs_cleanup_script;
        break;
      case "email_gen_script":
        inputData = campaign.jobs_clean_json;
        scriptContent = campaign.email_generation_script;
        break;
      default:
        return res.status(400).json({ message: "Invalid script type" });
    }

    const jobData = {
      campaignId: id,
      scriptType,
      scriptContent,
      inputData,
    };

    // Queue the job
    await redisClient.lPush("script_execution_queue", JSON.stringify(jobData));

    // Update campaign status
    await Campaign.findByIdAndUpdate(id, { status: "processing" });

    res.json({ message: "Script execution queued" });
  } catch (error) {
    console.error("Error executing script:", error);
    res.status(500).json({ message: "Error executing script" });
  }
};

// Get script execution logs
export const getScriptLogs = async (req: Request, res: Response) => {
  try {
    const { id, scriptType } = req.params;
    const logKey = `script_logs:${id}:${scriptType}`;
    const logs = await redisClient.lRange(logKey, 0, -1);
    res.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Error fetching logs" });
  }
};
