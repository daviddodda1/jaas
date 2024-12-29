# Job Application AI - Script Writing Guide

## Overview

The Job Application AI system uses several types of scripts to process job listings and generate applications. Each script type serves a specific purpose in the pipeline:

1. `cleanup_script` - Processes raw HTML into structured JSON
2. `fetch_script` - Fetches detailed job information
3. `jobs_cleanup_script` - Cleans and structures job data
4. `email_generation_script` - Generates application emails
5. `send_emails_script` - Handles email delivery

## Available Functions Per Script Type

### Cleanup Script
```javascript
// Available functions
GetChampainRawHtml() // Returns raw HTML string
SaveChampainJson(jsonStr) // Saves processed JSON
```

### Fetch Script
```javascript
// Available functions
fetchCleanCampaignJson() // Gets cleaned campaign JSON
saveJobsRawHtml(jobsData) // Saves raw HTML for jobs
sleep(ms) // Adds delay between operations
```

### Jobs Cleanup Script
```javascript
// Available functions
getJobsRawHtml() // Gets raw HTML data
saveJobsCleanJson(jsonData) // Saves cleaned JSON
callAI(prompt, config) // Makes AI API calls
callAIBatch(request) // Processes multiple AI requests
sleep(ms) // Adds delay between operations
```

### Email Generation Script
```javascript
// Available functions
getJobsCleanJson() // Gets cleaned job data
saveGeneratedEmails(emailsData) // Saves generated emails
callAI(prompt, config) // Makes AI API calls
callAIBatch(request) // Processes multiple AI requests
sleep(ms) // Adds delay between operations
```

### Send Emails Script
```javascript
// Available functions
getGeneratedEmailsJson() // Gets generated email data
sendEmail(emailData) // Sends individual emails
sleep(ms) // Adds delay between operations
```

## Available Libraries and Dependencies

Each script has access to specific libraries and utilities. Here's a comprehensive breakdown:

### Common Libraries (Available to All Scripts)
- `axios` (v1.7.9) - HTTP client for making requests
- `lodash` (v4.17.21) - Utility functions library

### Script-Specific Libraries

#### Cleanup Script
- `cheerio` (v1.0.0) - jQuery-like HTML parsing
- `lodash` (v4.17.21) - Utility functions

#### Fetch Script
- `cheerio` (v1.0.0) - HTML parsing and manipulation
- `axios` - Enhanced for web scraping with headers support

#### Jobs Cleanup Script
- `cheerio` (v1.0.0) - HTML parsing
- `lodash` - Data transformation and manipulation
- AI Integration Libraries:
  - OpenAI API client
  - Claude API client
  - Ollama API client

#### Email Generation Script
- `lodash` - Data processing
- AI Integration Libraries (Same as Jobs Cleanup)
- Template processing utilities

#### Send Emails Script
- `nodemailer` (v6.9.16) - Email sending functionality
- Email template processing utilities

### Library Usage Notes

1. **AI Libraries**
   ```javascript
   // OpenAI
   await callAI(prompt, {
     provider: "openai",
     model: "gpt-4" // or other models
   });

   // Claude
   await callAI(prompt, {
     provider: "claude",
     model: "claude-3-opus-20240229"
   });

   // Ollama
   await callAI(prompt, {
     provider: "ollama",
     model: "mistral" // or other models
   });
   ```

2. **Cheerio Usage**
   ```javascript
   const $ = cheerio.load(htmlContent);
   // jQuery-like selectors
   $('.className').each((i, elem) => {
     // Process elements
   });
   ```

3. **Lodash Functions**
   ```javascript
   // Available utilities
   _.groupBy(array, criteria)
   _.map(array, transformer)
   _.filter(array, predicate)
   _.reduce(collection, reducer, initial)
   _.sortBy(array, criteria)
   _.uniq(array)
   _.flatten(array)
   _.merge(object, sources)
   // ... and all other lodash functions
   ```

4. **Axios Configuration**
   ```javascript
   // Available configs
   const response = await axios({
     method: 'get',
     url: 'url',
     headers: {},
     timeout: 5000,
     validateStatus: (status) => status < 500
   });
   ```

5. **Nodemailer Setup**
   ```javascript
   // Available through sendEmail function
   await sendEmail({
     to: "recipient@example.com",
     subject: "Subject",
     bodyHtml: "<p>HTML content</p>",
     bodyText: "Plain text content",
     resumeUrl: "optional-resume-url"
   });
   ```

### Development Environment

All scripts run in a sandboxed VM2 environment with:
- ES2020 support
- Async/await support
- Limited file system access (through provided APIs)
- No direct process or system access
- Memory limits based on VM configuration

## Script Structure

All scripts should follow this basic structure:

```javascript
const main = async () => {
  try {
    console.log("Starting script execution...");
    
    // Your script logic here
    
    console.log("Script completed successfully");
    return { success: true, processed: n };
    
  } catch (error) {
    console.error(`Script failed: ${error.message}`);
    throw error;
  }
};

// Execute the script
main().catch(console.error);
```

## Best Practices

1. **Error Handling**
   - Always use try-catch blocks
   - Log errors with meaningful messages
   - Include error details in the output

2. **Progress Logging**
   - Use console.log for important steps
   - Log start and completion of major operations
   - Include counts and summaries

3. **Rate Limiting**
   - Use sleep() between API calls
   - Implement batch processing where possible
   - Handle API rate limits gracefully

4. **Data Validation**
   - Validate input data before processing
   - Check for required fields
   - Handle missing or malformed data

## AI Integration

When using AI capabilities:

```javascript
// Single AI call
const response = await callAI(prompt, {
  provider: "openai", // or "claude" or "ollama"
  model: "gpt-4" // optional
});

// Batch processing
const batchResponse = await callAIBatch({
  prompts: [prompt1, prompt2, prompt3],
  config: {
    provider: "openai",
    batchSize: 5
  }
});
```

## Example Implementations

### 1. Cleanup Script Example
```javascript
const main = async () => {
  try {
    console.log("Starting HTML cleaning process...");
    
    // Get the raw HTML content
    const htmlContent = GetChampainRawHtml();
    if (!htmlContent) {
      throw new Error("No HTML content found");
    }

    // Process HTML using cheerio
    const $ = cheerio.load(htmlContent);
    
    // Extract and structure data
    const jobs = [];
    $('article').each((_, article) => {
      // Extract job information
      const job = {
        // ... job data
      };
      jobs.push(job);
    });

    // Save processed data
    await SaveChampainJson(JSON.stringify(jobs, null, 2));
    
    return { processed: jobs.length };
  } catch (error) {
    console.error(`Error processing HTML: ${error.message}`);
    throw error;
  }
};
```

### 2. Email Generation Script Example
```javascript
const main = async () => {
  try {
    // Get cleaned job data
    const jobsData = getJobsCleanJson();
    console.log(`Found ${jobsData.length} jobs to process`);

    const generatedEmails = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const job of jobsData) {
      try {
        // Generate email using AI
        const emailContent = await callAI(
          `Generate email for job: ${job.title}`,
          { provider: "openai" }
        );
        
        generatedEmails.push({
          jobId: job.id,
          email: emailContent,
          timestamp: new Date()
        });
        
        processedCount++;
        await sleep(1000); // Rate limiting
        
      } catch (error) {
        errorCount++;
        console.error(`Error processing job ${job.id}: ${error.message}`);
      }
    }

    // Save results
    await saveGeneratedEmails(generatedEmails);
    
    return {
      processed: processedCount,
      errors: errorCount,
      total: jobsData.length
    };
  } catch (error) {
    console.error(`Script failed: ${error.message}`);
    throw error;
  }
};
```

## Script Testing

1. Start with small data sets
2. Use console.log for debugging
3. Test error handling
4. Verify data persistence
5. Check rate limiting
6. Validate output format

## Common Issues and Solutions

1. **Rate Limiting Errors**
   - Increase sleep duration between requests
   - Implement exponential backoff
   - Use batch processing

2. **Memory Issues**
   - Process data in chunks
   - Clean up large objects
   - Use streams for large files

3. **API Timeouts**
   - Implement retry logic
   - Add timeout configuration
   - Handle partial success

4. **Data Consistency**
   - Validate data at each step
   - Implement rollback mechanisms
   - Log transformation steps

## Support

For additional help:
- Check the example scripts in examples.txt
- Review the API documentation
- Contact the development team

Remember to always test scripts thoroughly before deploying to production.