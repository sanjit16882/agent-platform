# Agent Hub Backend - Quick Start Guide

## Starting the Server

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-server.ps1
```

This script will:
- Kill any existing Node processes on port 4002
- Start the server fresh
- Show you the server URL

### Option 2: Manual Start
```bash
node comprehensive-server.js
```

## Server Information

- **Port**: 4002
- **Health Check**: http://localhost:4002/health
- **API Base**: http://localhost:4002/api/v1

## Authentication

All API requests require the demo password header:
```
x-demo-password: agenthub2024
```

## Common Issues

### Port Already in Use (EADDRINUSE)
If you see this error, another process is using port 4002.

**Solution**: Use the `start-server.ps1` script which automatically kills existing processes.

**Manual fix**:
```powershell
# Kill all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Then start the server
node comprehensive-server.js
```

### Module Not Found Errors
Make sure you're in the correct directory:
```bash
cd local_version/agent-hub-backend
```

### TypeScript Compilation Issues
If you modify TypeScript files in `src/`, you need to recompile:
```bash
npm run build
# or
tsc
```

## API Endpoints

### Vector DB Providers
- `GET /api/v1/vector-db/providers` - Get all providers
- `GET /api/v1/vector-db/providers/approved` - Get approved providers
- `GET /api/v1/vector-db/providers/marketplace` - Get marketplace providers
- `GET /api/v1/vector-db/providers/:id` - Get provider by ID

### Agents
- `GET /api/v1/agents` - Get all agents
- `GET /api/v1/agents/s3` - Get agents from S3
- `POST /api/v1/agents/create` - Create new agent

### Analytics
- `GET /api/v1/analytics/executions` - Get execution history
- `GET /api/v1/finops/dashboard` - Get FinOps data

## Testing the API

### Using curl
```bash
curl -H "x-demo-password: agenthub2024" http://localhost:4002/api/v1/vector-db/providers
```

### Using PowerShell
```powershell
$headers = @{ "x-demo-password" = "agenthub2024" }
Invoke-RestMethod -Uri "http://localhost:4002/api/v1/vector-db/providers" -Headers $headers
```

## Environment Variables

Create a `.env` file if you need custom configuration:
```env
PORT=4002
DEMO_PASSWORD=agenthub2024
DEMO_MODE=true
AWS_REGION=us-east-1
```

## Logs

The server logs important events to the console:
- ✅ Success messages (green)
- ⚠️  Warnings (yellow)
- ❌ Errors (red)
- 🔍 Debug info (blue)

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.
