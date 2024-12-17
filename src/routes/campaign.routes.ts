// campaign.routes.ts
import {
  createCampaign,
  getAllCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaign.controller.js";
import express from "express";
import Campaign from "../models/campaign.schema.js";
import { redisClient } from "../config/redis.js";
import { executeScriptInWorker, getScriptLogs, getScriptExecutionStatus } from "../utils/scriptWorker.js";
const router = express.Router();

/**
 * @swagger
 * /campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: The created campaign
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 */
router.post("/", createCampaign);

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: A list of campaigns
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 */
router.get("/", getAllCampaigns);

/**
 * @swagger
 * /campaigns/{id}:
 *   get:
 *     summary: Get a campaign by ID
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *     responses:
 *       200:
 *         description: The campaign
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 */
//@ts-expect-error - some issue with the url having id
router.get("/:id", getCampaign);

/**
 * @swagger
 * /campaigns/{id}:
 *   put:
 *     summary: Update a campaign by ID
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: The updated campaign
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 */
//@ts-expect-error - some issue with the url having id
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      champain_raw_html,
      cleanup_script,
      fetch_script,
      email_generation_script,
      jobs_cleanup_script,
      send_emails_script,
      champain_json,
      jobs_raw_html,
      jobs_clean_json,
      generated_emails_json,
    } = req.body;

    const updateData: Partial<Campaign> = {};

    // Handle all fields as text
    if (name) updateData.name = name;
    if (champain_raw_html) updateData.champain_raw_html = champain_raw_html;
    if (cleanup_script) updateData.cleanup_script = cleanup_script;
    if (fetch_script) updateData.fetch_script = fetch_script;
    if (jobs_raw_html) updateData.jobs_raw_html = jobs_raw_html;
    if (jobs_cleanup_script)
      updateData.jobs_cleanup_script = jobs_cleanup_script;
    if (email_generation_script)
      updateData.email_generation_script = email_generation_script;
    if (send_emails_script) updateData.send_emails_script = send_emails_script;
    if (champain_json) updateData.champain_json = champain_json;
    if (jobs_clean_json) updateData.jobs_clean_json = jobs_clean_json;
    if (generated_emails_json)
      updateData.generated_emails_json = generated_emails_json;

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ message: "Error updating campaign" });
  }
});

/**
 * @swagger
 * /campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign by ID
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *     responses:
 *       200:
 *         description: The deleted campaign
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 */
//@ts-expect-error - some issue with the url having id
router.delete("/:id", deleteCampaign);

/**
 * @swagger
 * /campaigns/{id}/script/{type}:
 *   get:
 *     summary: Get a specific script by ID and type
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: The script type
 *     responses:
 *       200:
 *         description: The script
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
//@ts-expect-error - some issue with the url having id
router.get("/:id/script/:type", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const scriptType = req.params.type;
    let script;

    switch (scriptType) {
      case "cleanup":
        script = campaign.cleanup_script;
        break;
      case "fetch":
        script = campaign.fetch_script;
        break;
      case "email":
        script = campaign.email_generation_script;
        break;
      default:
        return res.status(400).json({ message: "Invalid script type" });
    }

    res.json({ script });
  } catch (error) {
    console.error("Error fetching script:", error);
    res.status(500).json({ message: "Error fetching script" });
  }
});

/**
 * @swagger
 * /campaigns/{id}/execute/{scriptType}:
 *   post:
 *     summary: Execute a specific script
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *       - in: path
 *         name: scriptType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cleanup_script, fetch_script, email_generation_script, jobs_cleanup_script, send_emails_script]
 *         description: The type of script to execute
 *     responses:
 *       200:
 *         description: Script execution result
 */
//@ts-expect-error - some issue with the url having id
router.post("/:id/execute/:scriptType", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const scriptType = req.params.scriptType;
    let scriptContent;

    switch (scriptType) {
      case "cleanup_script":
        scriptContent = campaign.cleanup_script;
        break;
      case "fetch_script":
        scriptContent = campaign.fetch_script;
        break;
      case "email_generation_script":
        scriptContent = campaign.email_generation_script;
        break;
      case "jobs_cleanup_script":
        scriptContent = campaign.jobs_cleanup_script;
        break;
      case "send_emails_script":
        scriptContent = campaign.send_emails_script;
        break;
      default:
        return res.status(400).json({ 
          message: "Invalid script type", 
          validTypes: [
            "cleanup_script",
            "fetch_script",
            "email_generation_script",
            "jobs_cleanup_script",
            "send_emails_script"
          ] 
        });
    }

    const result = await executeScriptInWorker(
      campaign.id,
      scriptType,
      scriptContent,
      req.body // Pass request body as input to script
    );

    res.json({ success: true, result });
  } catch (error:any) {
    console.error("Error executing script:", error);
    res.status(500).json({ message: "Error executing script", error: error.message });
  }
});

/**
 * @swagger
 * /campaigns/{id}/logs/{scriptType}:
 *   get:
 *     summary: Get execution logs for a specific script from database
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *       - in: path
 *         name: scriptType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cleanup_script, fetch_script, email_generation_script, jobs_cleanup_script, send_emails_script]
 *         description: The type of script
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of logs to return
 *     responses:
 *       200:
 *         description: List of execution logs
 */

//@ts-expect-error - some issue with the url having id
router.get("/:id/logs/:scriptType", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const scriptType = req.params.scriptType;
    
    // Get the correct log array based on script type
    let logs;
    switch (scriptType) {
      case "cleanup_script":
        logs = campaign.cleanup_script_logs;
        break;
      case "fetch_script":
        logs = campaign.fetch_script_logs;
        break;
      case "email_generation_script":
        logs = campaign.email_generation_script_logs;
        break;
      case "jobs_cleanup_script":
        logs = campaign.jobs_cleanup_script_logs;
        break;
      case "send_emails_script":
        logs = campaign.send_emails_script_logs;
        break;
      default:
        return res.status(400).json({ 
          message: "Invalid script type",
          validTypes: [
            "cleanup_script",
            "fetch_script",
            "email_generation_script",
            "jobs_cleanup_script",
            "send_emails_script"
          ]
        });
    }

    // Get the last 'limit' logs and format them
    const formattedLogs = (logs || [])
      .slice(-limit)
      .map(log => ({
        campaignId: campaign.id,
        scriptType,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message
      }));

    res.json(formattedLogs);
  } catch (error:any) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Error fetching logs", error: error.message });
  }
});

/**
 * @swagger
 * /campaigns/{id}/script-status:
 *   get:
 *     summary: Get the current script execution status
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The campaign ID
 *     responses:
 *       200:
 *         description: Current script execution status
 */
//@ts-expect-error - some issue with the url having id
router.get("/:id/script-status", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const status = await getScriptExecutionStatus(campaign.id);
    res.json(status);
  } catch (error: any) {
    console.error("Error fetching script status:", error);
    res.status(500).json({ message: "Error fetching script status", error: error.message });
  }
});

export default router;
