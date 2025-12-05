# MCP Pre-Implementation Checklist
## Verify System Health Before Starting MCP Work

### **BASELINE VERIFICATION**

Run this checklist before starting any MCP implementation to ensure we have a stable baseline:

#### 1. Backend Health Check
```bash
# Verify backend is running
curl http://localhost:3002/health

# Verify agents endpoint returns all 17 agents
curl http://localhost:3002/api/v1/agents | jq '.data | length'
# Expected: 17 (6 hybrid + 8 custom + 3 template)

# Verify S3 agents are accessible
curl http://localhost:3002/api/v1/agents/s3 | jq '.data | length'
# Expected: 14 (6 hybrid + 8 custom)
```

#### 2. Frontend Functionality Check
- [ ] Agent Catalog loads and shows all 17 agents
- [ ] Agent creation workflows work (Upload, Builder, Generator)
- [ ] Hybrid Agent Builder opens and functions
- [ ] Agent execution works for existing agents
- [ ] S3 storage operations work (save/load agents)

#### 3. Core Services Check
- [ ] API Key service functioning
- [ ] Security policies loading
- [ ] Analytics service working
- [ ] AWS Bedrock integration active
- [ ] S3 bucket accessible

#### 4. Build and Compilation Check
```bash
# Verify backend builds without errors
cd agent-hub-backend
npm run build
# Expected: Exit code 0, no TypeScript errors

# Verify frontend builds without errors
cd ../agent-hub-ui
npm run build
# Expected: Exit code 0, no compilation errors
```

### **PROTECTED FILES VERIFICATION**

Verify these critical files are in working state before MCP work:

#### Backend Core Files
- [ ] `agent-hub-backend/src/reliable-server.ts` - No compilation errors
- [ ] `agent-hub-backend/src/agent-processors.ts` - Functions correctly
- [ ] `agent-hub-backend/src/agent-templates.ts` - Templates load
- [ ] `agent-hub-backend/src/services/s3AgentStorage.js` - S3 operations work

#### Frontend Core Files
- [ ] `agent-hub-ui/src/components/AgentCatalog.tsx` - Displays agents
- [ ] `agent-hub-ui/src/components/HybridAgentBuilder.tsx` - Opens and works
- [ ] `agent-hub-ui/src/contexts/AgentContext.tsx` - State management works

### **ENVIRONMENT SETUP**

Before MCP implementation:

#### 1. Create MCP Directory Structure
```bash
mkdir -p agent-hub-backend/src/mcp/{servers,types,tests}
mkdir -p agent-hub-ui/src/components/mcp
```

#### 2. Set MCP Environment Variables
```bash
# Add to .env files
MCP_ENABLED=false  # Start disabled
MCP_DEBUG=true     # Enable debug logging
```

#### 3. Create MCP Configuration
```bash
# Create .kiro/settings/mcp.json
{
  "enabled": false,
  "debug": true,
  "servers": [],
  "fallbackToExisting": true
}
```

### **BACKUP STRATEGY**

Before starting MCP work:

#### 1. Create Git Branch
```bash
git checkout -b mcp-implementation-safe
git add .
git commit -m "Baseline before MCP implementation"
```

#### 2. Document Current State
- [ ] Record current agent count (17)
- [ ] Document working features
- [ ] Note any existing issues
- [ ] Save configuration files

### **TESTING BASELINE**

Create baseline tests to run after each MCP addition:

#### 1. Agent Functionality Test
```bash
# Test agent creation
curl -X POST http://localhost:3002/api/v1/agents/create \
  -H "Content-Type: application/json" \
  -d '{"templateId":"custom","name":"Test Agent","description":"Test"}'

# Test agent execution
curl -X POST http://localhost:3002/api/v1/agents/test-agent/execute \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"input":"test"}}'
```

#### 2. S3 Storage Test
```bash
# Test S3 agent listing
curl http://localhost:3002/api/v1/agents/s3

# Test S3 agent retrieval
curl http://localhost:3002/api/v1/agents/s3/hybrid_1761960595718_q22p1r94a
```

### **SUCCESS CRITERIA FOR BASELINE**

✅ Backend server starts without errors
✅ All 17 agents load in frontend
✅ Agent creation workflows function
✅ Agent execution works
✅ S3 storage operations succeed
✅ No TypeScript compilation errors
✅ No console errors in browser
✅ All API endpoints respond correctly

### **FAILURE RESPONSE**

If baseline verification fails:
1. **STOP** - Do not proceed with MCP implementation
2. Fix baseline issues first
3. Re-run verification checklist
4. Only proceed when all checks pass

### **MCP IMPLEMENTATION READINESS**

Only start MCP work when:
- [ ] All baseline checks pass
- [ ] System is stable and functional
- [ ] Backup branch created
- [ ] MCP directory structure ready
- [ ] Environment variables configured
- [ ] Team notified of MCP work starting

This ensures we always have a stable foundation before adding MCP functionality.