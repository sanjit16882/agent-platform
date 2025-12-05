# MCP Integration Implementation Plan

## Requirements Summary

1. **MCP Server Configuration Page** - Central management under Developer Tools
2. **Agent/Hybrid Pages** - Select from pre-configured MCP servers
3. **Model Dropdown Logic** - Disable when MCP server selected
4. **AWS Model Integration** - Fetch real models from Bedrock
5. **Edit Agent Support** - Update MCP associations

## Implementation Status

### ✅ Phase 1: Completed
- [x] MCP Management Page created (`/mcp-management`)
- [x] Navigation updated (Developer Tools → Manage MCP Servers)
- [x] Basic server configuration UI
- [x] YAML export functionality
- [x] Documentation created

### 🔄 Phase 2: In Progress
- [x] MCP Configuration Service created (`mcpConfigService.ts`)
- [ ] Backend endpoint for AWS Bedrock models
- [ ] Integration with Agent/Hybrid Builder pages
- [ ] Model dropdown disable logic
- [ ] Edit agent MCP association

### ⏭️ Phase 3: Pending
- [ ] Real-time model fetching from AWS
- [ ] MCP server health monitoring
- [ ] Agent-MCP association management
- [ ] Configuration validation
- [ ] Testing and QA

## Detailed Implementation

### 1. MCP Configuration Service ✅

**File:** `local_version/agent-hub-ui/src/services/mcpConfigService.ts`

**Features:**
```typescript
interface MCPServerConfiguration {
  id: string;
  name: string;
  command: string;
  args: string[];
  
  // Model configuration
  modelProvider: 'aws-bedrock' | 'openai' | 'anthropic';
  modelId: string;
  modelName: string;
  
  // Execution settings
  executionEngine: 'asyncio' | 'threading' | 'multiprocessing';
  logging: { console: boolean; level: string };
  
  // Server settings
  timeout: number;
  retryAttempts: number;
  disabled: boolean;
}
```

**Methods:**
- `getConfiguredServers()` - Get all configured MCP servers
- `saveServerConfig()` - Save MCP server configuration
- `getAWSBedrockModels()` - Fetch AWS Bedrock models
- `getAgentMCPServer()` - Get agent's associated MCP server
- `setAgentMCPServer()` - Associate agent with MCP server
- `exportAsYAML()` - Export configuration as YAML

### 2. Backend API Endpoint

**File:** `local_version/agent-hub-backend/src/routes/bedrockRoutes.ts` (TO CREATE)

```typescript
// GET /api/v1/bedrock/models
router.get('/models', async (req, res) => {
  const models = [
    {
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      modelName: 'Claude 3 Haiku',
      provider: 'Anthropic',
      description: 'Cost-effective for most tasks',
      costPer1MTokens: { input: 0.25, output: 1.25 }
    },
    {
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      modelName: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      description: 'Balanced for complex tasks',
      costPer1MTokens: { input: 3.00, output: 15.00 }
    },
    {
      modelId: 'amazon.titan-text-express-v1',
      modelName: 'Titan Text Express',
      provider: 'Amazon',
      description: 'Budget-friendly option',
      costPer1MTokens: { input: 0.80, output: 0.80 }
    }
  ];
  
  res.json({ success: true, models });
});
```

### 3. Enhanced MCP Management Page

**File:** `local_version/agent-hub-ui/src/components/mcp/MCPManagementPage.tsx`

**Add Model Selection:**
```typescript
// In server configuration form
<Form.Group className="mb-3">
  <Form.Label>Model Provider</Form.Label>
  <Form.Select
    value={newServer.modelProvider}
    onChange={(e) => setNewServer(prev => ({ 
      ...prev, 
      modelProvider: e.target.value 
    }))}
  >
    <option value="aws-bedrock">AWS Bedrock</option>
    <option value="openai">OpenAI</option>
    <option value="anthropic">Anthropic</option>
  </Form.Select>
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>Model</Form.Label>
  <Form.Select
    value={newServer.modelId}
    onChange={(e) => {
      const model = awsModels.find(m => m.modelId === e.target.value);
      setNewServer(prev => ({ 
        ...prev, 
        modelId: e.target.value,
        modelName: model?.modelName || ''
      }));
    }}
  >
    {awsModels.map(model => (
      <option key={model.modelId} value={model.modelId}>
        {model.modelName} - {model.provider}
      </option>
    ))}
  </Form.Select>
  <Form.Text className="text-muted">
    Model selected here will be used by agents associated with this MCP server
  </Form.Text>
</Form.Group>
```

### 4. Update Agent Builder

**File:** `local_version/agent-hub-ui/src/components/NLPAgentBuilder.tsx`

**Replace MCPAgentCreationStep with MCP Server Selection:**

```typescript
// Add state
const [configuredMCPServers, setConfiguredMCPServers] = useState<MCPServerConfiguration[]>([]);
const [selectedMCPServer, setSelectedMCPServer] = useState<string | null>(null);

// Load configured servers
useEffect(() => {
  const servers = mcpConfigService.getConfiguredServers();
  setConfiguredMCPServers(servers.filter(s => !s.disabled));
}, []);

// In render
<Form.Group className="mb-3">
  <Form.Label>MCP Server (Optional)</Form.Label>
  <Form.Select
    value={selectedMCPServer || ''}
    onChange={(e) => {
      setSelectedMCPServer(e.target.value || null);
      // Disable model selection if MCP server selected
      if (e.target.value) {
        const server = configuredMCPServers.find(s => s.id === e.target.value);
        if (server) {
          setSelectedBedrockModel(server.modelId);
          setSelectedBedrockModelName(server.modelName);
        }
      }
    }}
  >
    <option value="">No MCP Server</option>
    {configuredMCPServers.map(server => (
      <option key={server.id} value={server.id}>
        {server.name} ({server.modelName})
      </option>
    ))}
  </Form.Select>
  <Form.Text className="text-muted">
    Select a pre-configured MCP server from the MCP Management page
  </Form.Text>
</Form.Group>

{/* Model Selection - Disabled if MCP server selected */}
<BedrockModelSelector
  selectedModel={selectedBedrockModel}
  onModelChange={(modelId, modelName) => {
    setSelectedBedrockModel(modelId);
    setSelectedBedrockModelName(modelName);
  }}
  agentType={nlpAnalysis?.type?.toLowerCase() || 'custom'}
  label="AI Model"
  required={false}
  disabled={!!selectedMCPServer}  // DISABLE IF MCP SERVER SELECTED
/>

{selectedMCPServer && (
  <Alert variant="info">
    <small>
      <strong>ℹ️ Model Selection Disabled:</strong> The model is configured 
      in the selected MCP server ({configuredMCPServers.find(s => s.id === selectedMCPServer)?.modelName})
    </small>
  </Alert>
)}
```

### 5. Update Hybrid Builder

**File:** `local_version/agent-hub-ui/src/components/HybridAgentBuilder.tsx`

**Same changes as Agent Builder:**
- Add MCP server dropdown
- Disable model selection when MCP server selected
- Show info alert

### 6. Edit Agent Support ⭐ NEW REQUIREMENT

**File:** `local_version/agent-hub-ui/src/components/AgentManagementSimple.tsx`

**Requirements:**
- ✅ Show MCP server selection when editing agent
- ✅ Load existing MCP association
- ✅ Allow changing MCP server
- ✅ Disable model dropdown when MCP server selected
- ✅ Update association on save

**Implementation:**

```typescript
// Add state for edit mode
const [editMode, setEditMode] = useState(false);
const [editingAgent, setEditingAgent] = useState<any>(null);
const [configuredMCPServers, setConfiguredMCPServers] = useState<MCPServerConfiguration[]>([]);
const [selectedMCPServer, setSelectedMCPServer] = useState<string | null>(null);
const [selectedBedrockModel, setSelectedBedrockModel] = useState<string>('');
const [selectedBedrockModelName, setSelectedBedrockModelName] = useState<string>('');

// Load configured MCP servers
useEffect(() => {
  const servers = mcpConfigService.getConfiguredServers();
  setConfiguredMCPServers(servers.filter(s => !s.disabled));
}, []);

// Load existing MCP association when editing
useEffect(() => {
  if (editMode && editingAgent) {
    const mcpServerId = mcpConfigService.getAgentMCPServer(editingAgent.id);
    if (mcpServerId) {
      setSelectedMCPServer(mcpServerId);
      const server = mcpConfigService.getServerConfig(mcpServerId);
      if (server) {
        setSelectedBedrockModel(server.modelId);
        setSelectedBedrockModelName(server.modelName);
      }
    } else {
      // Load agent's current model if no MCP server
      setSelectedBedrockModel(editingAgent.bedrockModel || '');
      setSelectedBedrockModelName(editingAgent.bedrockModelName || '');
    }
  }
}, [editMode, editingAgent]);

// Handle edit button click
const handleEditAgent = (agent: any) => {
  setEditMode(true);
  setEditingAgent(agent);
  // Open edit modal/form
};

// In edit form JSX
<Modal show={editMode} onHide={() => setEditMode(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Edit Agent: {editingAgent?.name}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      {/* Agent Name */}
      <Form.Group className="mb-3">
        <Form.Label>Agent Name</Form.Label>
        <Form.Control
          type="text"
          value={editingAgent?.name || ''}
          onChange={(e) => setEditingAgent({...editingAgent, name: e.target.value})}
        />
      </Form.Group>

      {/* Agent Description */}
      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={editingAgent?.description || ''}
          onChange={(e) => setEditingAgent({...editingAgent, description: e.target.value})}
        />
      </Form.Group>

      {/* MCP Server Selection */}
      <Form.Group className="mb-3">
        <Form.Label>
          MCP Server (Optional)
          <Badge bg="info" className="ms-2">Configure in MCP Management</Badge>
        </Form.Label>
        <Form.Select
          value={selectedMCPServer || ''}
          onChange={(e) => {
            const serverId = e.target.value || null;
            setSelectedMCPServer(serverId);
            
            if (serverId) {
              const server = configuredMCPServers.find(s => s.id === serverId);
              if (server) {
                setSelectedBedrockModel(server.modelId);
                setSelectedBedrockModelName(server.modelName);
              }
            }
          }}
        >
          <option value="">No MCP Server</option>
          {configuredMCPServers.map(server => (
            <option key={server.id} value={server.id}>
              {server.name} ({server.modelName})
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">
          Select a pre-configured MCP server or{' '}
          <a href="/mcp-management" target="_blank">configure a new one</a>
        </Form.Text>
      </Form.Group>

      {/* Model Selection - Disabled if MCP server selected */}
      <Form.Group className="mb-3">
        <Form.Label>AI Model</Form.Label>
        <Form.Select
          value={selectedBedrockModel}
          onChange={(e) => {
            setSelectedBedrockModel(e.target.value);
            // Set model name based on selection
          }}
          disabled={!!selectedMCPServer}
        >
          <option value="">Select Model</option>
          <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</option>
          <option value="anthropic.claude-3-5-sonnet-20241022-v2:0">Claude 3.5 Sonnet</option>
          <option value="amazon.titan-text-express-v1">Titan Text Express</option>
        </Form.Select>
        {selectedMCPServer && (
          <Form.Text className="text-muted">
            Model is configured in the selected MCP server
          </Form.Text>
        )}
      </Form.Group>

      {selectedMCPServer && (
        <Alert variant="info">
          <small>
            <strong>ℹ️ MCP Server Selected:</strong> The model and configuration 
            are managed through the MCP server ({configuredMCPServers.find(s => s.id === selectedMCPServer)?.modelName})
          </small>
        </Alert>
      )}
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setEditMode(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSaveAgent}>
      Save Changes
    </Button>
  </Modal.Footer>
</Modal>

// Handle save
const handleSaveAgent = async () => {
  try {
    const updateData = {
      id: editingAgent.id,
      name: editingAgent.name,
      description: editingAgent.description,
      bedrockModel: selectedBedrockModel,
      bedrockModelName: selectedBedrockModelName,
      mcpServerId: selectedMCPServer,
      mcpIntegration: selectedMCPServer ? {
        enabled: true,
        serverId: selectedMCPServer,
        serverName: configuredMCPServers.find(s => s.id === selectedMCPServer)?.name,
        modelId: selectedBedrockModel,
        modelName: selectedBedrockModelName
      } : null
    };

    const response = await fetch(`http://localhost:3002/api/v1/agents/${editingAgent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (result.success) {
      // Update MCP association
      if (selectedMCPServer) {
        mcpConfigService.setAgentMCPServer(editingAgent.id, selectedMCPServer);
      } else {
        mcpConfigService.removeAgentMCPServer(editingAgent.id);
      }

      // Refresh agent list
      loadAgents();
      setEditMode(false);
      
      alert('Agent updated successfully!');
    }
  } catch (error) {
    console.error('Failed to update agent:', error);
    alert('Failed to update agent');
  }
};
```

### 7. Save Agent with MCP Association

**In handleCreateAgent:**
```typescript
const handleCreateAgent = async () => {
  // ... existing code ...
  
  const requestBody = {
    name: agentName,
    description: agentDescription,
    // ... other fields ...
    
    // MCP Configuration
    mcpServerId: selectedMCPServer,
    mcpIntegration: selectedMCPServer ? {
      enabled: true,
      serverId: selectedMCPServer,
      serverName: configuredMCPServers.find(s => s.id === selectedMCPServer)?.name,
      modelId: selectedBedrockModel,
      modelName: selectedBedrockModelName
    } : undefined
  };
  
  const response = await fetch('http://localhost:3002/api/v1/agents/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  const result = await response.json();
  
  if (result.success && selectedMCPServer) {
    // Associate agent with MCP server
    mcpConfigService.setAgentMCPServer(result.data.agentId, selectedMCPServer);
  }
};
```

## User Workflows

### Workflow 1: Configure MCP Server
1. Navigate to Developer Tools → Manage MCP Servers
2. Click "Add MCP Server"
3. Fill in server details (name, command, args)
4. Select Model Provider (AWS Bedrock)
5. Select Model (Claude 3 Haiku, Sonnet, Titan, etc.)
6. Configure execution engine and logging
7. Save configuration

### Workflow 2: Create Agent with MCP
1. Navigate to Agent Builder
2. Describe agent
3. Select MCP Server from dropdown
4. **Model dropdown is automatically disabled**
5. **Model from MCP server is used**
6. Create agent
7. Agent is associated with MCP server

### Workflow 3: Edit Agent MCP Association ⭐ NEW
1. Navigate to Manage Agents (`/manage`)
2. Click **Edit** button on existing agent
3. Edit modal opens with agent details
4. See **MCP Server dropdown** with current selection
5. Change MCP Server selection (or select "No MCP Server")
6. **Model dropdown automatically disabled if MCP server selected**
7. **Model updates automatically from MCP server**
8. See info alert showing MCP server's model
9. Click **Save Changes**
10. Association is updated in localStorage
11. Agent list refreshes with updated info

**Key Features:**
- ✅ Load existing MCP association
- ✅ Show current MCP server if configured
- ✅ Allow changing or removing MCP server
- ✅ Model dropdown disabled when MCP selected
- ✅ Link to MCP Management page for new servers
- ✅ Clear visual feedback with alerts

## Implementation Steps

### Step 1: Backend API ⏭️
```bash
# Create bedrock routes
touch local_version/agent-hub-backend/src/routes/bedrockRoutes.ts

# Add to server.ts
import bedrockRoutes from './routes/bedrockRoutes';
app.use('/api/v1/bedrock', bedrockRoutes);
```

### Step 2: Update MCP Management Page ⏭️
- Add AWS model fetching
- Add model selection to server configuration
- Display model in server list
- Update YAML export to include model

### Step 3: Update Agent Builder ⏭️
- Replace MCPAgentCreationStep with dropdown
- Add configured servers loading
- Implement model disable logic
- Add info alert

### Step 4: Update Hybrid Builder ⏭️
- Same changes as Agent Builder
- Ensure consistency

### Step 5: Edit Agent Support ⏭️
- Load existing MCP association
- Allow changing MCP server
- Update association on save

### Step 6: Testing ⏭️
- Test MCP server configuration
- Test agent creation with MCP
- Test model disable logic
- Test edit agent MCP association
- Test YAML export

## Benefits

### For Users
- ✅ Central MCP configuration management
- ✅ Model selection at MCP server level
- ✅ Automatic model assignment to agents
- ✅ No duplicate model selection
- ✅ Clear association between agents and MCP servers
- ✅ Easy to update MCP configurations

### For Platform
- ✅ Consistent MCP configuration
- ✅ Better model management
- ✅ Reduced configuration errors
- ✅ Easier troubleshooting
- ✅ Scalable architecture

## Next Steps

1. **Create backend endpoint** for AWS Bedrock models
2. **Update MCP Management Page** with model selection
3. **Modify Agent Builder** to use configured MCP servers
4. **Modify Hybrid Builder** to use configured MCP servers
5. **Add edit agent support** for MCP associations
6. **Test complete workflow**
7. **Update documentation**

## Files to Modify

### Created ✅
- `local_version/agent-hub-ui/src/services/mcpConfigService.ts`

### To Create ⏭️
- `local_version/agent-hub-backend/src/routes/bedrockRoutes.ts`

### To Modify ⏭️
- `local_version/agent-hub-ui/src/components/mcp/MCPManagementPage.tsx`
- `local_version/agent-hub-ui/src/components/NLPAgentBuilder.tsx`
- `local_version/agent-hub-ui/src/components/HybridAgentBuilder.tsx`
- `local_version/agent-hub-ui/src/components/AgentManagementSimple.tsx` ⭐ NEW
- `local_version/agent-hub-ui/src/components/BedrockModelSelector.tsx`
- `local_version/agent-hub-backend/src/server.ts`

## Estimated Time
- Backend API: 1 hour
- MCP Management Page updates: 2 hours
- Agent Builder updates: 2 hours
- Hybrid Builder updates: 1 hour
- **Edit Agent support: 2 hours** ⭐ UPDATED
- Testing (including edit flow): 2 hours
- **Total: ~10 hours**

## Edit Agent Requirements Summary ⭐

### Must Have Features
1. ✅ **MCP Server Dropdown** - Show in edit modal
2. ✅ **Load Existing Association** - Display current MCP server
3. ✅ **Change MCP Server** - Allow selecting different server
4. ✅ **Remove MCP Server** - Option to select "No MCP Server"
5. ✅ **Disable Model Dropdown** - When MCP server selected
6. ✅ **Auto-update Model** - From selected MCP server
7. ✅ **Visual Feedback** - Info alerts showing MCP configuration
8. ✅ **Link to MCP Management** - For configuring new servers
9. ✅ **Save Association** - Update localStorage on save
10. ✅ **Refresh UI** - Show updated configuration

### User Experience
- Clear indication when MCP server is configured
- Easy to change or remove MCP association
- Model selection automatically managed
- Link to configure new MCP servers
- Consistent with Create Agent flow
