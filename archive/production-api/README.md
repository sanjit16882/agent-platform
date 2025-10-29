# AgentHub Production API

Production-ready API server for AgentHub CLI and VS Code extension.

## Features

- **5 Mock Agents**: test-generator, security-scanner, code-quality, documentation-generator, failure-analyzer
- **Production Ready**: Helmet security, compression, CORS, error handling
- **Realistic Responses**: Dynamic data generation with processing delays
- **Health Monitoring**: Comprehensive health check endpoint
- **Logging**: Request logging with timestamps and IP addresses

## Quick Deploy to Railway

1. **Create Railway Account**: https://railway.app
2. **Deploy from GitHub**:
   ```bash
   # Push this directory to GitHub
   git init
   git add .
   git commit -m "AgentHub Production API"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```
3. **Connect to Railway**:
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-deploy

4. **Get Production URL**:
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Use this URL in your CLI and VS Code extension

## Alternative: Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create agenthub-api

# Deploy
git init
git add .
git commit -m "AgentHub Production API"
heroku git:remote -a agenthub-api
git push heroku main

# Your app will be available at: https://agenthub-api.herokuapp.com
```

## Alternative: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts, your app will be deployed automatically
```

## Local Testing

```bash
npm install
npm start
# Server runs on http://localhost:3000
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents/:id/execute` - Execute agent

## Configure CLI and VS Code

Once deployed, configure your tools:

### CLI Tool:
```bash
agent config set --api-url https://your-production-url.com
agent config test
```

### VS Code Extension:
1. `Ctrl+Shift+P` → "AgentHub: Configure AgentHub"
2. Enter your production URL
3. Test connection

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

## Monitoring

The `/api/health` endpoint provides:
- Status
- Version
- Uptime
- Timestamp

Perfect for monitoring services like UptimeRobot or Pingdom.