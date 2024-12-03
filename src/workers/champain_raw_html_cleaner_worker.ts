import { logger } from "../config/logger.js";
import { redisClient } from "../workers.js";
import Campaign from "../models/campaign.schema.js";
import * as cheerio from "cheerio";

// Function to parse and clean HTML content
const parseHtmlToJson = (htmlContent: string) => {
  const $ = cheerio.load(htmlContent);
  const jobListings: any[] = [];

  $("article.action-buttons").each((_, element) => {
    const jobInfo: any = {};

    const jobLink = $(element).find("a.resultJobItem").attr("href");
    if (jobLink) {
      jobInfo.job_link = jobLink;
    }

    const jobTitle = $(element).find("span.noctitle").text().trim();
    if (jobTitle) {
      jobInfo.job_role = jobTitle;
    }

    const employer = $(element).find("li.business").text().trim();
    if (employer) {
      jobInfo.employer = employer;
    }

    const location = $(element)
      .find("li.location")
      .text()
      .replace("Location", "")
      .trim();
    if (location) {
      jobInfo.location = location;
    }

    const workArrangement = $(element).find("span.telework").text().trim();
    if (workArrangement) {
      jobInfo.work_arrangement = workArrangement;
    }

    const salary = $(element)
      .find("li.salary")
      .text()
      .replace("Salary:", "")
      .trim();
    if (salary) {
      jobInfo.salary = salary;
    }

    jobListings.push(jobInfo);
  });

  return jobListings;
};

// Function to process a single job from the Redis queue
const processJob = async (): Promise<void> => {
  try {
    // brPop returns [key, value] or null if timeout
    const result = await redisClient.brPop(
      "champain_raw_html_cleanup",
      0 // 0 means block indefinitely
    );

    if (!result) {
      logger.warn("No job data received from Redis");
      return;
    }

    const { key, element: rawData } = result;
    const jobData = JSON.parse(rawData);
    const { campaignId, rawHtml } = jobData;

    const cleanedJson = parseHtmlToJson(rawHtml);

    await Campaign.findByIdAndUpdate(campaignId, {
      champain_json: cleanedJson,
      status: "active_pre_clean",
    });

    logger.info(`Processed and updated campaign ${campaignId}`);
  } catch (error) {
    // logger.error(`Error processing job: ${error}`);
    console.log(error);
    process.exit(1);
    // Optionally re-throw if you want the error to bubble up
    // throw error;
  }
};

// Worker function that continuously processes jobs
export const startWorker = async (): Promise<never> => {
  logger.info("Starting champain raw HTML cleaner worker");

  while (true) {
    try {
      await processJob();
    } catch (error) {
      logger.error(`Worker error: ${error}`);
      // Add a small delay before retrying on error
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};
