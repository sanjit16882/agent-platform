# Complete MCP Integration Requirements

## Date
November 8, 2025

## Requirements Overview

### ✅ Requirement 1: Central MCP Configuration
**Status:** Implemented

**Details:**
- All MCP server configurations managed ONLY through MCP Management Page
- Located under Developer Tools → Manage MCP Servers
- URL: `/mcp-management`

### ⏭️ Requirement 2: Agent Builder MCP Selection
**Status:** Planned

**Details:**
- Agent Builder shows dropdown of pre-configured MCP servers
- User selects from existing configurations
- Cannot configure new servers inline
- Link to MCP Management page provided

### ⏭️ Requirement 3: Hybrid Builder MCP Selection
**Status:** Planned

**Details:**
- Same as Agent Builder
- Consistent UI and behavior
- Dropdown of pre-configured servers
- Link to MCP Management page

### ⏭️ Requirement 4: Model Dropdown Disable Logic
**Status:** Planned

**Details:**
- When MCP server selected → Model dropdown DISABLED
- Model automatically set from MCP server configuration
- Info alert shows which model is being used
- Clear visual feedback

### ⏭️ Requirement 5: AWS Bedrock Models
**Status:** Planned

**Details:**
- Fetch real models from AWS Bedrock
- Display in MCP Management Page
- Models include: Claude 3 (Haiku, Sonnet, Opus), Titan (Express, Lite)
- Show provider, description, and cost information

### ⏭️ Requirement 6: Edit Agent MCP Configuration ⭐
**Status:** Planned

**Details:**
- Edit modal shows MCP server dropdown
- Load existing MCP association
- Allow changing or removing MCP server
- Model dropdown disabled when MCP selected
- Save updates association

## Complete User Workflows

### Workflow A: Configure MCP Server (One-Time Setup)
```
1. Navigate to Developer Tools → Manage MCP Servers
2. Click "Add MCP Server" or use template
3. Fill in server details:
   - Server ID and name
   - Command and arguments
   - Execution engine (asyncio, threading, multiprocessing)
   - Logging settings (console, level)
4. Select Model Provider (AWS Bedrock)
5. Select Model from AWS:
   - Claude 3 Haiku (cost-effective)
   - Claude 3.5 Sonnet (balanced)
   - Claude 3 Opus (most capable)
   - Titan Text Express (budget)
   - Titan Text Lite (lightweight)
6. Configure timeout and retry settings
7. Save configuration
8. Export YAML files (optional)
```

### Workflow B: Create Agent with MCP
```
1. Navigate to Agent Builder
2. Describe agent
3. Fill in agent details
4. Select MCP Server from dropdown:
   ┌────────────────────────────────────┐
   │ [v] GitHub Server (Claude 3 Haiku) │
   │     No MCP Server                  │
   │     Filesystem Server (Sonnet)     │
   └────────────────────────────────────┘
5. Model dropdown becomes DISABLED
6. Info alert shows: "Model is configured in MCP server"
7. Create agent
8. Agent is associated with MCP server
```

### Workflow C: Create Hybrid Agent with MCP
```
1. Navigate to Hybrid Builder
2. Add components to workflow
3. Configure agent details
4. Go to MCP Integration tab
5. Select MCP Server from dropdown
6. Model dropdown becomes DISABLED
7. Info alert shows MCP server's model
8. Save hybrid agent
9. Agent is associated with MCP server
```

### Workflow D: Edit Agent MCP Configuration ⭐
```
1. Navigate to Manage Agents
2. Find agent in list
3. Click "Edit" button
4. Edit modal opens
5. See current MCP server (if configured)
6. Options:
   a) Keep current MCP server
   b) Change to different MCP server
   c) Remove MCP server (select "No MCP Server")
7. Model dropdown disabled if MCP selected
8. Model updates automatically from MCP server
9. Save changes
10. Association updated
```

## Technical Architecture

### Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│                  MCP Management Page                         │
│                  (Central Configuration)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Configure MCP Server:                                       │
│  ├─ Server details (command, args)                          │
│  ├─ Model selection (AWS Bedrock)                           │
│  ├─ Execution settings                                       │
│  └─ Save to localStorage                                     │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ mcpConfigService
                   │
        ┌──────────┴──────────┬──────────────────┐
        │                     │                   │
        ▼                     ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Agent Builder│    │Hybrid Builder│    │  Edit Agent  │
├──────────────┤    ├──────────────┤    ├──────────────┤
│              │    │              │    │              │
│ Select MCP   │    │ Select MCP   │    │ Select MCP   │
│ Server       │    │ Server       │    │ Server       │
│              │    │              │    │              │
│ Model        │    │ Model        │    │ Model        │
│ DISABLED     │    │ DISABLED     │    │ DISABLED     │
│              │    │              │    │              │
│ Create Agent │    │ Save Agent   │    │ Save Changes │
│              │    │              │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Agent with MCP      │
                │  Association         │
                └──────────────────────┘
```

### Storage Structure

**MCP Server Configurations:**
```typescript
localStorage['mcp_server_configurations'] = [
  {
    id: 'github-server',
    name: 'GitHub Server',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    modelProvider: 'aws-bedrock',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    modelName: 'Claude 3 Haiku',
    executionEngine: 'asyncio',
    logging: { console: true, level: 'INFO' },
    timeout: 30000,
    retryAttempts: 3,
    disabled: false
  }
]
```

**Agent-MCP Associations:**
```typescript
localStorage['agent_mcp_agent-123'] = 'github-server'
localStorage['agent_mcp_agent-456'] = 'filesystem-server'
```

## Key Rules

### Rule 1: Single Source of Truth
✅ MCP servers configured ONLY in MCP Management Page  
❌ Cannot configure MCP servers in Agent/Hybrid Builder  
❌ Cannot configure MCP servers in Edit Agent

### Rule 2: Model Management
✅ Model selected during MCP server configuration  
✅ Model dropdown disabled when MCP server selected  
✅ Model automatically assigned from MCP server  
❌ Cannot override model when MCP server selected

### Rule 3: Association Management
✅ Agent-MCP association stored in localStorage  
✅ Association can be changed in Edit Agent  
✅ Association can be removed (select "No MCP Server")  
✅ Association persists across sessions

### Rule 4: Consistency
✅ Same behavior in Agent Builder  
✅ Same behavior in Hybrid Builder  
✅ Same behavior in Edit Agent  
✅ Same UI components and patterns

## Implementation Checklist

### Backend
- [ ] Create `/api/v1/bedrock/models` endpoint
- [ ] Return real AWS Bedrock models
- [ ] Include model metadata (provider, cost, description)

### MCP Management Page
- [ ] Add AWS model fetching
- [ ] Add model provider dropdown
- [ ] Add model selection dropdown
- [ ] Display model in server list
- [ ] Update YAML export with model info

### Agent Builder
- [ ] Load configured MCP servers
- [ ] Replace MCPAgentCreationStep with dropdown
- [ ] Add model disable logic
- [ ] Add info alert for MCP selection
- [ ] Save MCP association

### Hybrid Builder
- [ ] Load configured MCP servers
- [ ] Replace MCPAgentCreationStep with dropdown
- [ ] Add model disable logic
- [ ] Add info alert for MCP selection
- [ ] Save MCP association

### Edit Agent (AgentManagementSimple)
- [ ] Add edit modal
- [ ] Load existing MCP association
- [ ] Show MCP server dropdown
- [ ] Implement model disable logic
- [ ] Add info alert
- [ ] Save updated association
- [ ] Refresh agent list

### BedrockModelSelector Component
- [ ] Add `disabled` prop
- [ ] Show disabled state styling
- [ ] Add helper text when disabled

### Testing
- [ ] Test MCP server configuration
- [ ] Test agent creation with MCP
- [ ] Test hybrid agent creation with MCP
- [ ] Test edit agent MCP configuration
- [ ] Test model disable logic
- [ ] Test association persistence
- [ ] Test removing MCP association

## Success Criteria

✅ **Configuration:**
- MCP servers can only be configured in MCP Management Page
- AWS Bedrock models are fetched and displayed
- Configuration includes model selection

✅ **Agent Creation:**
- Agent Builder shows MCP server dropdown
- Hybrid Builder shows MCP server dropdown
- Model dropdown disabled when MCP selected
- Clear visual feedback provided

✅ **Edit Agent:**
- Edit modal shows MCP server dropdown
- Existing association loaded correctly
- Can change or remove MCP association
- Model dropdown disabled when MCP selected

✅ **Consistency:**
- Same behavior across all pages
- Same UI components
- Same data structure
- Same validation rules

## Conclusion

This comprehensive MCP integration provides:
- **Centralized Management** - Single place to configure MCP servers
- **Automatic Model Assignment** - Models managed at MCP server level
- **Consistent Experience** - Same flow for create and edit
- **Clear Visual Feedback** - Users understand what's happening
- **Flexible** - Can use MCP or configure manually

The implementation ensures that MCP configuration is managed centrally while providing easy access throughout the platform for agent creation and editing.
