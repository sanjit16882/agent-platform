# 🔒 ENDPOINT LOCK - DO NOT MODIFY

## Critical Configuration
This file is located next to `AgentCatalog.tsx` as a reminder:

### LOCKED ENDPOINT
```typescript
// Line ~543 in AgentCatalog.tsx
const response = await axios.get(`${API_BASE_URL}/api/v1/agents/s3`);
```

### ⚠️ WARNING
Changing this endpoint to `/api/v1/agents` will cause:
- Agent count mismatch (4 vs 15 agents)
- Data inconsistency across pages
- User confusion and bug reports

### Why S3 Endpoint?
- Returns ALL agents from S3 storage (15 agents)
- Consistent with Dashboard, Analytics, FinOps
- Real-time sync across platform
- Single source of truth

### Before Making Changes
1. Read: `local_version/AGENT_COUNT_SYNC_FIX.md`
2. Check: All pages show same agent count
3. Test: Create/delete agent works everywhere
4. Verify: No regression in other pages

---
**DO NOT DELETE THIS FILE**
**Date Locked**: 2025-11-08
