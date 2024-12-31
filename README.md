# Job Application AI

An automated job application system that helps streamline the process of finding, analyzing, and applying to jobs. The system uses AI to generate personalized application emails and manages the entire application workflow.

## Features

- Campaign-based job application management
- Multi-step job processing pipeline
- AI-powered email generation (supports OpenAI, Claude, and Ollama)
- Automated email drafting and sending
- Comprehensive logging and status tracking
- RESTful API with Swagger documentation

## Prerequisites

- Node.js (v18+)
- MongoDB
- Redis
- OpenAI API key (optional)
- Claude API key (optional)
- Mailgun API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/daviddodda1/jaas
   cd jaas
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. Create a `.env` file in the root directory:
   ```
   MONGO_URI=mongodb://mongodb_host:27017/job_application
   REDIS_HOST=redis_host
   REDIS_PORT=6379
   OPENAI_API_KEY=your_openai_key
   CLAUDE_API_KEY=your_claude_key
   GMAIL_USER=your.email@gmail.com
   GMAIL_APP_PASSWORD=your_app_specific_password
   ```

## Running the Application

1. Start the backend (from root directory):
   ```bash
   npm run dev
   ```

2. Start the frontend (in a new terminal):
   ```bash
   cd client
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:3001

## Environment Variables

Create a `.env` file based on `.env.example`:

- `MONGO_URI`: MongoDB connection string (default: mongodb://localhost:27017/your_database)
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `OPENAI_API_KEY`: Your OpenAI API key
- `CLAUDE_API_KEY`: Your Anthropic Claude API key
- `OLLAMA_HOST`: Ollama API host (default: http://localhost:11434)
- `MAILGUN_DOMAIN`: Your Mailgun domain
- `MAILGUN_API_KEY`: Your Mailgun API key

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
