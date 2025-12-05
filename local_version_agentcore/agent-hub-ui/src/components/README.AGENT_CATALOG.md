# AgentCatalog Component - Critical Configuration

## 🔒 LOCKED CONFIGURATION

### API Endpoint (DO NOT CHANGE)
```typescript
// Line ~543 in AgentCatalog.tsx
const response = await axios.get(`${API_BASE_URL}/api/v1/agents/s3`);
```

### Why This Matters
This endpoint configuration is **LOCKED** because:

1. **Bug History**: Previously used wrong endpoint causing 4 vs 15 agent count mismatch
2. **Data Consistency**: All pages must use same S3 storage
3. **User Experience**: Critical for platform reliability
4. **Real-time Sync**: Ensures changes propagate everywhere

### Protected Code Block
```typescript
const fetchAgents = useCallback(async () => {
  try {
    setLoading(true);
    
    // 🔒 LOCKED: Must use S3 endpoint
    const response = await axios.get(`${API_BASE_URL}/api/v1/agents/s3`);
    
    if (response.data && response.data.success && response.data.data) {
      const apiAgents = response.data.data.map((agent: any) => ({
        agent_id: agent.id || agent.agent_id,
        name: agent.name,
        description: agent.description,
        category: agent.category,
        // 🔒 LOCKED: S3-specific field mappings
        usage_count: agent.usage_count || agent.metrics?.totalExecutions || 0,
        average_rating: agent.average_rating || 4.5,
        created_at: agent.createdAt || agent.created_at || agent.created,
        agent_type: agent.type || agent.agent_type || 'hybrid'
      }));
      
      setAgents(apiAgents);
      setLoading(false);
      return;
    }
  } catch (error) {
    console.error('Error fetching agents:', error);
  }
}, [deployedAgents]);
```

### Safeguards in Place

1. **Steering File**: `.kiro/steering/agent-catalog-endpoint-lock.md`
   - Auto-loads when editing AgentCatalog.tsx
   - Provides context and warnings

2. **Test File**: `AgentCatalog.test.ts`
   - Validates correct endpoint usage
   - Fails if wrong endpoint detected

3. **ESLint Rule**: `.eslintrc.agent-catalog.json`
   - Prevents wrong endpoint at lint time
   - Shows error message with documentation link

4. **CODEOWNERS**: Requires approval from Platform Team

5. **Documentation**: 
   - `AGENT_COUNT_SYNC_FIX.md` - Full technical details
   - `QUICK_FIX_SUMMARY.md` - Quick reference
   - This file - Component-specific guide

### If You Must Modify

**STOP and follow these steps:**

1. **Read Documentation**
   - `local_version/AGENT_COUNT_SYNC_FIX.md`
   - Understand why this was locked

2. **Verify Requirements**
   - Why do you need to change it?
   - Is there an alternative solution?
   - Will it maintain data consistency?

3. **Test Thoroughly**
   - All pages show same agent count
   - Create/delete agent works everywhere
   - No regression in Dashboard, Analytics, FinOps

4. **Get Approval**
   - Platform Team review required
   - Update all documentation
   - Update tests to match new behavior

5. **Update Safeguards**
   - Modify steering file
   - Update test expectations
   - Update ESLint rules
   - Document the change

### Emergency Contact
If you encounter issues with this configuration:
- **DO NOT** revert to `/api/v1/agents`
- **DO** contact Platform Team immediately
- **DO** check S3 storage service health
- **DO** verify backend endpoint is working

### Related Components
- `s3AgentService.ts` - Frontend S3 service
- `AgentContext.tsx` - Shared agent state
- `s3AgentStorage.js` - Backend S3 storage

---
**Status**: LOCKED
**Last Updated**: 2025-11-08
**Owner**: Platform Team
**Severity**: CRITICAL
