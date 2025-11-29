# MCP Dropdown Not Showing Servers - Debug Guide

## Issue
Edit Agent Modal shows "No MCP servers configured" even though servers should be configured.

## Root Cause
MCP servers need to be configured in the MCP Management Page first, and they're stored in localStorage.

## Solution Steps

### Step 1: Configure an MCP Server
1. Go to **http://localhost:3000/mcp-management**
2. Click **"Add MCP Server"** button
3. Fill in the form:
   - **Server ID:** `fetch` (or any unique ID)
   - **Server Name:** `Fetch Server`
   - **Command:** `uvx`
   - **Arguments:** `mcp-server-fetch`
   - **AWS Bedrock Model:** Select `Claude 3 Haiku` (or any model)
   - **Timeout:** `30000`
   - **Retry Attempts:** `3`
4. Click **"Add Server"**
5. You should see an alert: "MCP Server configured successfully!"

### Step 2: Verify Server Was Saved
Open browser console (F12) and check for:
```
💾 Saving MCP Server Config: {...}
✅ Saved! Total servers now: 1
✅ Servers: [{...}]
```

### Step 3: Check LocalStorage
In browser console, run:
```javascript
localStorage.getItem('mcp_server_configurations')
```

You should see JSON with your server configuration.

### Step 4: Test Edit Agent Modal
1. Go to **Agent Catalog**
2. Click **"Edit"** on any agent
3. Open browser console
4. Look for logs:
```
📝 EDIT AGENT MODAL - Loading Data
📝 Available MCP Servers: 1
📝 MCP Servers: [{...}]
```

### Step 5: Check Dropdown
The MCP Server dropdown should now show:
- "None - Use model selection below"
- "Fetch Server (Claude 3 Haiku)" ← Your configured server

## If Still Not Showing

### Check 1: LocalStorage
```javascript
// In browser console
const servers = localStorage.getItem('mcp_server_configurations');
console.log('Stored servers:', JSON.parse(servers));
```

### Check 2: Service Import
The EditAgentModal should import:
```typescript
import { mcpConfigService } from '../services/mcpConfigService';
```

### Check 3: Server Structure
Each server should have:
```json
{
  "id": "fetch",
  "name": "Fetch Server",
  "description": "MCP Server: Fetch Server",
  "command": "uvx",
  "args": ["mcp-server-fetch"],
  "modelProvider": "aws-bedrock",
  "modelId": "anthropic.claude-3-haiku-20240307-v1:0",
  "modelName": "Claude 3 Haiku",
  "executionEngine": "asyncio",
  "logging": {
    "console": true,
    "level": "INFO"
  },
  "timeout": 30000,
  "retryAttempts": 3,
  "disabled": false,
  "autoApprove": [],
  "createdAt": "2025-11-08T...",
  "updatedAt": "2025-11-08T..."
}
```

## Quick Fix: Manually Add Server

If the UI isn't working, you can manually add a server via console:

```javascript
// In browser console
const mcpConfigService = {
  saveServerConfig: (config) => {
    const stored = localStorage.getItem('mcp_server_configurations');
    const servers = stored ? JSON.parse(stored) : [];
    servers.push(config);
    localStorage.setItem('mcp_server_configurations', JSON.stringify(servers));
  }
};

// Add a test server
mcpConfigService.saveServerConfig({
  id: 'fetch',
  name: 'Fetch Server',
  description: 'MCP Server: Fetch Server',
  command: 'uvx',
  args: ['mcp-server-fetch'],
  modelProvider: 'aws-bedrock',
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
  modelName: 'Claude 3 Haiku',
  executionEngine: 'asyncio',
  logging: { console: true, level: 'INFO' },
  timeout: 30000,
  retryAttempts: 3,
  disabled: false,
  autoApprove: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Verify
console.log('Servers:', JSON.parse(localStorage.getItem('mcp_server_configurations')));
```

Then refresh the page and try editing an agent again.

## Expected Console Output

### When Adding Server (MCP Management Page):
```
💾 Saving MCP Server Config: {id: 'fetch', name: 'Fetch Server', ...}
✅ Saved! Total servers now: 1
✅ Servers: [{id: 'fetch', name: 'Fetch Server', ...}]
```

### When Opening Edit Modal (Agent Catalog):
```
═══════════════════════════════════════════════════════
📝 EDIT AGENT MODAL - Loading Data
═══════════════════════════════════════════════════════
📝 Agent MCP Server ID: null
📝 Available MCP Servers: 1
📝 MCP Servers: [{id: 'fetch', name: 'Fetch Server', ...}]
═══════════════════════════════════════════════════════
```

## Summary

The MCP dropdown will only show servers if:
1. ✅ Servers are configured in MCP Management Page
2. ✅ Servers are saved to localStorage
3. ✅ mcpConfigService.getConfiguredServers() returns them
4. ✅ EditAgentModal loads them on open

**Action Required:** Configure at least one MCP server in the MCP Management Page first!

---

**Status:** 🔍 DEBUGGING ENABLED  
**Next Step:** Configure an MCP server and check console logs
