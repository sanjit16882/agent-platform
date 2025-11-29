# API Client Migration Guide

## Problem Fixed

The 401 Unauthorized errors were happening because fetch requests weren't including the demo password authentication header. This has been fixed by creating a centralized API client.

## What Was Done

1. ✅ Created `src/utils/apiClient.ts` - centralized API client with automatic auth
2. ✅ Updated `VectorDBProviderSelection.tsx` to use the new client
3. ✅ Updated `VectorDBManagement.tsx` to use the new client  
4. ✅ Updated `VectorDBAdminDashboard.tsx` to use the new client

## Components That Still Need Migration

The following components still use raw `fetch()` and may encounter 401 errors:

### High Priority (API calls that likely need auth)
- `src/services/dashboardDataService.ts` - 4 fetch calls
- `src/services/advancedAnalyticsService.ts` - 1 fetch call
- `src/components/RequestMonitoringDashboard.tsx` - 1 fetch call
- `src/components/CloudWatchMetrics.tsx` - 1 fetch call
- `src/components/PlatformIntegration.tsx` - 3 fetch calls
- `src/components/GitHubIntegrationStatus.tsx` - 1 fetch call
- `src/components/GitHubIntegrationDemo.tsx` - 2 fetch calls
- `src/components/NLPAgentBuilder.tsx` - 2 fetch calls

### Medium Priority (may have custom auth)
- `src/components/RealMCPDemo.tsx` - 4 fetch calls (uses custom Authorization header)
- `src/components/IntelligenceModal.tsx` - 4 fetch calls
- `src/components/IntelligenceSidebar.tsx` - 2 fetch calls
- `src/components/SimpleIntelligenceDemo.tsx` - 2 fetch calls

## How to Migrate a Component

### Step 1: Import the API client

```typescript
import api from '../utils/apiClient';
```

### Step 2: Replace fetch calls

**Before:**
```typescript
const response = await fetch('http://localhost:3002/api/v1/agents', {
  headers: {
    'Content-Type': 'application/json',
    'x-demo-password': 'agenthub2024'
  }
});
```

**After:**
```typescript
const response = await api.get('/api/v1/agents');
```

**For POST requests:**
```typescript
// Before
const response = await fetch('http://localhost:3002/api/v1/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// After
const response = await api.post('/api/v1/agents', data);
```

## Quick Test

After restarting your server, the Vector DB pages should now work without 401 errors. Test by:

1. Navigate to Vector DB Management page
2. Check browser console - no more 401 errors
3. Providers should load successfully

## Environment Variables

Add to your `.env` file (optional, has defaults):

```env
REACT_APP_API_BASE_URL=http://localhost:3002
REACT_APP_DEMO_PASSWORD=agenthub2024
```
