# Quick Start Checklist ✅

## Backend Setup

- [x] Navigate to backend directory
  ```bash
  cd local_version/agent-hub-backend
  ```

- [x] Start the server
  ```powershell
  .\start-server.ps1
  ```
  OR
  ```bash
  node comprehensive-server.js
  ```

- [x] Verify server is running
  ```bash
  curl http://localhost:4002/health
  ```
  Should return: `{"status":"healthy","timestamp":"..."}`

## Frontend Setup

- [ ] Navigate to frontend directory
  ```bash
  cd local_version/agent-hub-ui
  ```

- [ ] Install dependencies (if not done)
  ```bash
  npm install
  ```

- [ ] Start the development server
  ```bash
  npm start
  ```

- [ ] Open browser to http://localhost:4001

## Verification Steps

### 1. Check Backend Health
```bash
curl http://localhost:4002/health
```
✅ Should return JSON with status "healthy"

### 2. Test Vector DB API (with auth)
```bash
curl -H "x-demo-password: agenthub2024" http://localhost:4002/api/v1/vector-db/providers
```
✅ Should return providers list

### 3. Check Frontend Console
Open browser DevTools → Console
✅ No 401 errors
✅ No CORS errors
✅ Should see: "✅ Loaded X agents from S3"

### 4. Navigate to Vector DB Page
Click "Vector DB" in the navigation
✅ Providers should load
✅ Should see "Approved Providers" section
✅ Should see "Marketplace" section

## Common Issues & Fixes

### ❌ Backend won't start - "EADDRINUSE"
**Problem**: Port 4002 is already in use

**Fix**:
```powershell
# Kill all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Then start server
.\start-server.ps1
```

### ❌ Frontend shows 401 errors
**Problem**: Backend not running or authentication missing

**Fix**:
1. Verify backend is running: `curl http://localhost:4002/health`
2. Check component is using `api` client from `utils/apiClient.ts`
3. Restart backend to ensure CORS headers are loaded

### ❌ CORS errors in browser
**Problem**: Backend CORS not configured

**Fix**:
1. Verify `comprehensive-server.js` has `allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-password']`
2. Restart backend server
3. Hard refresh browser (Ctrl+Shift+R)

### ❌ Module not found errors
**Problem**: Wrong directory or missing dependencies

**Fix**:
```bash
# Backend
cd local_version/agent-hub-backend
npm install

# Frontend
cd local_version/agent-hub-ui
npm install
```

## Environment Variables (Optional)

### Backend `.env`
```env
PORT=4002
DEMO_PASSWORD=agenthub2024
DEMO_MODE=true
AWS_REGION=us-east-1
```

### Frontend `.env`
```env
REACT_APP_API_BASE_URL=http://localhost:4002
REACT_APP_DEMO_PASSWORD=agenthub2024
```

## Success Indicators

When everything is working correctly, you should see:

### Backend Console
```
🔧 Server Mode: DEVELOPMENT
📊 AWS Data: REAL
✅ VectorDBProviderService initialized with 6 providers
🚀 Comprehensive Agent Hub Server running on port 4002
✅ Connected to SQLite database
✅ S3 bucket agenthub-agents-storage exists
```

### Frontend Console
```
AgentCatalog API_BASE_URL: http://localhost:4002
✅ S3 API response status: 200
✅ Loaded 15 agents from S3
```

### Browser
- No red errors in console
- Vector DB page loads providers
- All API calls succeed (check Network tab)

## Quick Commands Reference

### Start Backend
```powershell
cd local_version/agent-hub-backend
.\start-server.ps1
```

### Start Frontend
```bash
cd local_version/agent-hub-ui
npm start
```

### Kill All Node Processes
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Test API
```bash
curl -H "x-demo-password: agenthub2024" http://localhost:4002/api/v1/vector-db/providers
```

### Check Server Logs
Backend logs appear in the terminal where you started the server.

## Status: ✅ READY TO USE

All authentication issues have been resolved. The system is locked and working correctly.

**Last Updated**: 2025-11-13
**Status**: Production Ready (Development Mode)
