---
inclusion: fileMatch
fileMatchPattern: '**/AgentCatalog.tsx'
---

# CRITICAL: Agent Catalog API Endpoint Lock

## ⚠️ DO NOT MODIFY THIS ENDPOINT ⚠️

### Protected Code Section
The `fetchAgents` function in `AgentCatalog.tsx` MUST use the S3 endpoint:

```typescript
// ✅ CORRECT - DO NOT CHANGE
const response = await axios.get(`${API_BASE_URL}/api/v1/agents/s3`);

// ❌ WRONG - NEVER USE THIS
// const response = await axios.get(`${API_BASE_URL}/api/v1/agents`);
```

### Why This Is Critical
1. **Data Consistency**: All pages must show the same agent count (15 agents)
2. **S3 Storage**: This endpoint returns ALL agents from S3 storage
3. **Real-time Sync**: Ensures changes propagate across all pages
4. **Bug Fix**: Changing this will reintroduce the 4 vs 15 agent count bug

### Historical Context
- **Date Fixed**: 2025-11-08
- **Bug**: Agent Catalog showed 4 agents while other pages showed 15
- **Root Cause**: Wrong endpoint (`/api/v1/agents` instead of `/api/v1/agents/s3`)
- **Impact**: Critical user experience issue

### If You Need to Modify
1. **STOP** - Read this document first
2. **Verify** - Ensure all pages still show consistent agent counts
3. **Test** - Check Dashboard, Analytics, FinOps, and Catalog pages
4. **Document** - Update this steering file with your changes

### Code Review Checklist
When reviewing changes to AgentCatalog.tsx:
- [ ] Endpoint is still `/api/v1/agents/s3`
- [ ] Data mapping includes S3 agent format fields
- [ ] No fallback to `/api/v1/agents` endpoint
- [ ] Console logs confirm "Using real S3 agents"

### Related Files
- `local_version/agent-hub-ui/src/services/s3AgentService.ts`
- `local_version/agent-hub-ui/src/context/AgentContext.tsx`
- `local_version/agent-hub-backend/src/services/s3AgentStorage.js`

### Emergency Rollback
If this change causes issues, contact the team immediately.
DO NOT rollback to `/api/v1/agents` as it will break agent count sync.

---
**Last Updated**: 2025-11-08
**Status**: LOCKED - Critical Fix
**Owner**: Platform Team
