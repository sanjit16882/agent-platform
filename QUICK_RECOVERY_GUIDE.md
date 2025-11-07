# 🚨 Quick Recovery Guide

## If You Ever See Errors Again

### Option 1: Revert to Last Working State

```bash
cd local_version
git checkout v1.0-api-fixes-bedrock-enabled
```

This will take you back to the exact state where everything was working.

### Option 2: Check What Changed

```bash
git status
git diff
```

See what files were modified since the last working state.

### Option 3: Reset Specific Files

```bash
# Reset just the backend server
git checkout v1.0-api-fixes-bedrock-enabled -- agent-hub-backend/src/server.ts

# Reset just the endpoints
git checkout v1.0-api-fixes-bedrock-enabled -- agent-hub-backend/src/routes/missingEndpoints.ts
```

## If Backend Stops Working

### 1. Check if it's running
```bash
curl http://localhost:3002/health
```

### 2. Restart backend
```bash
cd local_version
.\restart-backend.bat
```

### 3. Check environment variables
```bash
# Make sure these are set in agent-hub-backend/.env:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAWQUOZ342VPAAHYL4
AWS_SECRET_ACCESS_KEY=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
ENABLE_REAL_COST_TRACKING=true
```

## If Frontend Shows Errors

### 1. Hard refresh browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 2. Clear browser cache
- Open DevTools (F12)
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

### 3. Restart frontend
```bash
cd local_version/agent-hub-ui
npm start
```

## If AWS Bedrock Shows "MOCK"

### 1. Check credentials
```bash
# View backend .env
type agent-hub-backend\.env

# Should see:
# AWS_ACCESS_KEY_ID=AKIAWQUOZ342VPAAHYL4
# AWS_SECRET_ACCESS_KEY=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
# ENABLE_REAL_COST_TRACKING=true
```

### 2. Restart backend
```bash
.\restart-backend.bat
```

### 3. Test endpoint
```bash
curl http://localhost:3002/api/v1/bedrock/models
```

Should show `"real_ai": true`

## Emergency: Start Fresh

If everything is broken and you want to start from the last working state:

```bash
# 1. Stop all processes
# Close all terminals running npm/node

# 2. Reset to working state
cd local_version
git reset --hard v1.0-api-fixes-bedrock-enabled

# 3. Restart everything
.\start-local.bat
```

## Contact Points

### Working Commits
- **Latest Working:** `d1c1fdf` (with docs)
- **Core Fixes:** `2b324de` (main fixes)
- **Tag:** `v1.0-api-fixes-bedrock-enabled`

### Key Files
- Backend Server: `agent-hub-backend/src/server.ts`
- API Endpoints: `agent-hub-backend/src/routes/missingEndpoints.ts`
- Backend Config: `agent-hub-backend/.env`
- Root Config: `.env`

### Documentation
- `TODAYS_FIXES_LOCKED.md` - What was fixed
- `API_ERRORS_FIXED_SESSION_2.md` - Detailed fixes
- `ENABLE_REAL_BEDROCK.md` - AWS Bedrock guide
- `SESSION_FIXES_SUMMARY.md` - Session summary

## Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Backend health
curl http://localhost:3002/health

# 2. MCP health
curl http://localhost:3002/mcp-health/filesystem

# 3. Bedrock status
curl http://localhost:3002/api/v1/bedrock/models

# All should return 200 OK
```

## Browser Console Check

1. Open http://localhost:3001
2. Press F12 (DevTools)
3. Go to Console tab
4. Should see:
   - ✅ No red errors
   - ✅ "Loaded X agents from S3"
   - ✅ "MCP servers are not running. Using mock endpoints" (info only)

---

**Remember:** You can always go back to `v1.0-api-fixes-bedrock-enabled` - that's your safety net!

**Status:** 🔒 LOCKED AND SAFE ✅
