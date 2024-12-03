import cron from "node-cron";
import redisClient from "../config/redis.js";
import Campaign from "../models/campaign.schema.js";
import { logger } from "../config/logger.js";

// Function to queue jobs for campaign raw HTML cleanup
const queueCampaignRawHtmlCleanup = async () => {
  try {
    const draftCampaigns = await Campaign.find({ status: "queue_pre_clean" });

    draftCampaigns.forEach(async (campaign) => {
      const jobData = {
        campaignId: campaign._id,
        rawHtml: campaign.champain_raw_html,
      };

      const existingJobs = await redisClient.lRange(
        "champain_raw_html_cleanup",
        0,
        -1
      );
      const isDuplicate = existingJobs.some((job) => {
        const parsedJob = JSON.parse(job);
        return parsedJob.campaignId === campaign._id;
      });

      if (!isDuplicate) {
        redisClient
          .lPush("champain_raw_html_cleanup", JSON.stringify(jobData))
          .then(async () => {
            logger.info(`Queued job for campaign ${campaign._id}`);
            // Update campaign status to "processing"
            await Campaign.updateOne(
              { _id: campaign._id },
              { status: "processing" }
            );
          })
          .catch((err: Error) => {
            logger.error(
              `Failed to queue job for campaign ${campaign._id}: ${err}`
            );
          });
      } else {
        logger.info(
          `Job for campaign ${campaign._id} already exists in the queue`
        );
      }
    });
  } catch (error) {
    logger.error(`Error fetching draft campaigns: ${error}`);
  }
};

const campaignRawHtmlCleanupCron = async () => {
  await redisClient.connect();
  // Schedule the cron job to run every minute
  cron.schedule("* * * * *", () => {
    logger.info("Running cron job to queue campaign raw HTML cleanup jobs");
    queueCampaignRawHtmlCleanup();
  });
};

export { campaignRawHtmlCleanupCron };
