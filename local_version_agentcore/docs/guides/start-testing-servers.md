# Quick Start Guide - Testing Framework

## Start Backend Server

Open a terminal and run:

```bash
cd local_version/agent-hub-backend
node testing-server.js
```

You should see:
```
🧪 Testing Framework Server running on port 4002
📊 API available at http://localhost:4002/api
❤️  Health check at http://localhost:4002/health
```

## Start Frontend (if not already running)

Open another terminal and run:

```bash
cd local_version/agent-hub-ui
npm start
```

Frontend will be available at: http://localhost:4001

## Access Testing Dashboard

Once both servers are running, go to:
http://localhost:4001/agent-testing

## Verify Backend is Running

Test the health endpoint:
```bash
curl http://localhost:4002/health
```

Should return:
```json
{"status":"ok","service":"testing-framework"}
```

## Current Status

❌ Backend NOT running (all 404 errors)
✅ Frontend IS running (on port 4001)

**Action Required:** Start the backend server using the command above!
