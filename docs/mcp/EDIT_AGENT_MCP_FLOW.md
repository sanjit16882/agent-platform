# Edit Agent MCP Configuration Flow

## Overview
When editing an existing agent, users can configure or change the MCP server association, with the model automatically managed by the selected MCP server.

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Manage Agents Page                        │
│                      (/manage)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Click "Edit" button
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Edit Agent Modal                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Agent Name: [My Test Agent____________]                    │
│                                                              │
│  Description: [This agent does...______]                    │
│                                                              │
│  MCP Server (Optional) [Configure in MCP Management]        │
│  ┌────────────────────────────────────────────┐            │
│  │ [v] GitHub Server (Claude 3 Haiku)         │            │
│  │     No MCP Server                          │            │
│  │     Filesystem Server (Claude 3.5 Sonnet)  │            │
│  │     Database Server (Titan Express)        │            │
│  └────────────────────────────────────────────┘            │
│  Select a pre-configured MCP server or                      │
│  configure a new one                                        │
│                                                              │
│  AI Model                                                    │
│  ┌────────────────────────────────────────────┐            │
│  │ Claude 3 Haiku                    [DISABLED]│            │
│  └────────────────────────────────────────────┘            │
│  Model is configured in the selected MCP server             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ℹ️ MCP Server Selected: The model and configuration  │  │
│  │ are managed through the MCP server (Claude 3 Haiku)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Cancel]                            [Save Changes]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scenarios

### Scenario 1: Agent Without MCP Server
**Initial State:**
- Agent has no MCP server configured
- Model dropdown is enabled
- Current model shown

**User Actions:**
1. Click Edit
2. See "No MCP Server" selected
3. Model dropdown is enabled
4. Can select MCP server or keep as-is

### Scenario 2: Agent With MCP Server
**Initial State:**
- Agent has MCP server configured
- MCP server shown in dropdown
- Model dropdown is disabled
- Model from MCP server shown

**User Actions:**
1. Click Edit
2. See current MCP server selected
3. Model dropdown is disabled
4. Can change MCP server or remove it

### Scenario 3: Change MCP Server
**Initial State:**
- Agent has "GitHub Server" configured

**User Actions:**
1. Click Edit
2. Change dropdown to "Filesystem Server"
3. Model automatically updates to Filesystem Server's model
4. Info alert updates
5. Save changes
6. Association updated

### Scenario 4: Remove MCP Server
**Initial State:**
- Agent has MCP server configured

**User Actions:**
1. Click Edit
2. Select "No MCP Server"
3. Model dropdown becomes enabled
4. Can select model manually
5. Save changes
6. MCP association removed

## Implementation Details

### Load Existing Association
```typescript
useEffect(() => {
  if (editMode && editingAgent) {
    // Load MCP association from localStorage
    const mcpServerId = mcpConfigService.getAgentMCPServer(editingAgent.id);
    
    if (mcpServerId) {
      setSelectedMCPServer(mcpServerId);
      
      // Load server config to get model
      const server = mcpConfigService.getServerConfig(mcpServerId);
      if (server) {
        setSelectedBedrockModel(server.modelId);
        setSelectedBedrockModelName(server.modelName);
      }
    } else {
      // No MCP server, load agent's current model
      setSelectedBedrockModel(editingAgent.bedrockModel || '');
      setSelectedBedrockModelName(editingAgent.bedrockModelName || '');
    }
  }
}, [editMode, editingAgent]);
```

### Handle MCP Server Change
```typescript
const handleMCPServerChange = (serverId: string | null) => {
  setSelectedMCPServer(serverId);
  
  if (serverId) {
    // Load model from MCP server
    const server = configuredMCPServers.find(s => s.id === serverId);
    if (server) {
      setSelectedBedrockModel(server.modelId);
      setSelectedBedrockModelName(server.modelName);
    }
  } else {
    // No MCP server, keep current model or clear
    // User can select model manually
  }
};
```

### Save Changes
```typescript
const handleSaveAgent = async () => {
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

  // Save to backend
  await fetch(`/api/v1/agents/${editingAgent.id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });

  // Update localStorage association
  if (selectedMCPServer) {
    mcpConfigService.setAgentMCPServer(editingAgent.id, selectedMCPServer);
  } else {
    mcpConfigService.removeAgentMCPServer(editingAgent.id);
  }
};
```

## UI Components

### MCP Server Dropdown
```tsx
<Form.Group className="mb-3">
  <Form.Label>
    MCP Server (Optional)
    <Badge bg="info" className="ms-2">Configure in MCP Management</Badge>
  </Form.Label>
  <Form.Select
    value={selectedMCPServer || ''}
    onChange={(e) => handleMCPServerChange(e.target.value || null)}
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
```

### Model Dropdown (Disabled State)
```tsx
<Form.Group className="mb-3">
  <Form.Label>AI Model</Form.Label>
  <Form.Select
    value={selectedBedrockModel}
    onChange={(e) => setSelectedBedrockModel(e.target.value)}
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
```

### Info Alert
```tsx
{selectedMCPServer && (
  <Alert variant="info">
    <small>
      <strong>ℹ️ MCP Server Selected:</strong> The model and configuration 
      are managed through the MCP server (
      {configuredMCPServers.find(s => s.id === selectedMCPServer)?.modelName}
      )
    </small>
  </Alert>
)}
```

## Validation

### Before Save
- ✅ Agent name is not empty
- ✅ If MCP server selected, model is from that server
- ✅ If no MCP server, model is selected manually
- ✅ Description is provided

### Error Handling
- Show error if save fails
- Keep modal open on error
- Allow user to retry
- Don't update localStorage if backend save fails

## Testing Checklist

### Edit Agent with No MCP
- [ ] Open edit modal
- [ ] Verify "No MCP Server" is selected
- [ ] Verify model dropdown is enabled
- [ ] Select MCP server
- [ ] Verify model dropdown becomes disabled
- [ ] Verify model updates from MCP server
- [ ] Save and verify association

### Edit Agent with MCP
- [ ] Open edit modal
- [ ] Verify current MCP server is selected
- [ ] Verify model dropdown is disabled
- [ ] Verify correct model is shown
- [ ] Change MCP server
- [ ] Verify model updates
- [ ] Save and verify association

### Remove MCP Association
- [ ] Open edit modal for agent with MCP
- [ ] Select "No MCP Server"
- [ ] Verify model dropdown becomes enabled
- [ ] Select model manually
- [ ] Save and verify association removed

### Link to MCP Management
- [ ] Click "configure a new one" link
- [ ] Verify opens MCP Management page
- [ ] Configure new server
- [ ] Return to edit agent
- [ ] Verify new server appears in dropdown

## Benefits

### For Users
- ✅ Easy to configure MCP for existing agents
- ✅ Clear visual feedback
- ✅ Model automatically managed
- ✅ Can change or remove MCP association
- ✅ Link to configure new servers

### For Platform
- ✅ Consistent with create agent flow
- ✅ Centralized MCP management
- ✅ Better data integrity
- ✅ Easier troubleshooting
- ✅ Scalable architecture

## Summary

The Edit Agent flow provides a seamless way to configure or change MCP server associations for existing agents, with automatic model management and clear visual feedback. The implementation is consistent with the Create Agent flow and maintains the principle of centralized MCP configuration through the MCP Management page.
