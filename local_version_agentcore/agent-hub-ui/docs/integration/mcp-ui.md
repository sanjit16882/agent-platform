# MCP UI Integration Guide - How to Connect Agents to MCP

## 🎯 **Quick Start: Add MCP to Agent Creation**

### **Step 1: Import MCP Components**

Add these imports to your existing agent creation components:

```tsx
// Add to your AgentUpload.tsx, HybridAgentBuilder.tsx, etc.
import MCPAgentCreationStep from './management/MCPAgentCreationStep';
import MCPManagement from './management/MCPManagement';
import MCPStatus from './management/MCPStatus';
```

### **Step 2: Add MCP Config to Your Agent State**

Update your agent form state to include MCP configuration:

```tsx
// In your existing agent creation component
const [agentData, setAgentData] = useState({
  // Your existing fields
  name: '',
  description: '',
  category: '',
  
  // Add MCP configuration
  mcpConfig: {
    enabled: false,
    serverIds: [],
    timeout: 30000,
    autoApprove: []
  }
});
```

### **Step 3: Add MCP Step to Your Workflow**

#### **Option A: Add as a New Step (Recommended)**

```tsx
// In your multi-step agent creation workflow
const renderStep = () => {
  switch (currentStep) {
    case 1:
      return <BasicAgentInfo />; // Your existing step
    
    case 2:
      return <AgentConfiguration />; // Your existing step
    
    case 3:
      // NEW: Add MCP configuration step
      return (
        <MCPAgentCreationStep
          agentData={agentData}
          mcpConfig={agentData.mcpConfig}
          onMCPConfigChange={(mcpConfig) => 
            setAgentData(prev => ({ ...prev, mcpConfig }))
          }
          onNext={() => setCurrentStep(4)}
          onPrevious={() => setCurrentStep(2)}
        />
      );
    
    case 4:
      return <ReviewAndCreate />; // Your existing step
  }
};
```

#### **Option B: Add as a Section in Existing Step**

```tsx
// Add to your existing agent configuration step
<div className="space-y-6">
  {/* Your existing configuration sections */}
  <AgentBasicConfig />
  <AgentAdvancedConfig />
  
  {/* NEW: Add MCP configuration section */}
  <MCPAgentCreationStep
    agentData={agentData}
    mcpConfig={agentData.mcpConfig}
    onMCPConfigChange={(mcpConfig) => 
      setAgentData(prev => ({ ...prev, mcpConfig }))
    }
    showNavigation={false} // Hide navigation in inline mode
  />
</div>
```

### **Step 4: Save MCP Config with Agent**

Update your agent creation API call to include MCP configuration:

```tsx
const createAgent = async () => {
  try {
    const response = await fetch('/api/v1/agents/s3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'sk-agenthub-system-internal-frontend-key'
      },
      body: JSON.stringify({
        // Your existing agent data
        name: agentData.name,
        description: agentData.description,
        category: agentData.category,
        processingLogic: agentData.processingLogic,
        
        // NEW: Include MCP configuration
        mcpConfig: agentData.mcpConfig,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Agent created with MCP config:', result.agent);
      // Handle success
    }
  } catch (error) {
    console.error('Failed to create agent:', error);
  }
};
```

## 🎨 **Add MCP to Existing Agent Management**

### **Add MCP Status to Dashboard**

```tsx
// In your main dashboard component
import MCPStatus from './components/management/MCPStatus';

const Dashboard = () => {
  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* NEW: Add MCP status */}
      <div className="mb-4">
        <MCPStatus 
          compact={true}
          showDetails={false}
          onManageClick={() => navigate('/mcp/servers')}
        />
      </div>
      
      {/* Rest of your dashboard */}
    </div>
  );
};
```

### **Add MCP Management to Agent Detail Pages**

```tsx
// In your agent detail/edit component
import MCPManagement from './components/management/MCPManagement';

const AgentDetail = ({ agentId }) => {
  const [showMCPConfig, setShowMCPConfig] = useState(false);
  
  return (
    <div>
      {/* Your existing agent details */}
      
      {/* NEW: Add MCP configuration button */}
      <Button onClick={() => setShowMCPConfig(!showMCPConfig)}>
        {showMCPConfig ? 'Hide' : 'Configure'} MCP
      </Button>
      
      {/* NEW: MCP configuration panel */}
      {showMCPConfig && (
        <MCPManagement
          agentId={agentId}
          agentName={agent.name}
          onConfigUpdate={(config) => {
            console.log('MCP config updated:', config);
            // Refresh agent data or update state
          }}
        />
      )}
    </div>
  );
};
```

## 🔧 **Test Your Integration**

### **1. Start the Backend Server**

```bash
cd agent-hub-backend
npm start
# Server should be running on http://localhost:4002
```

### **2. Test MCP API Endpoints**

```bash
# Check MCP status
curl -H "X-API-Key: sk-agenthub-system-internal-frontend-key" \
  http://localhost:4002/api/v1/mcp/status

# List available MCP servers
curl -H "X-API-Key: sk-agenthub-system-internal-frontend-key" \
  http://localhost:4002/api/v1/mcp/servers/available
```

### **3. Create an Agent with MCP**

1. **Navigate to your agent creation page**
2. **Fill in basic agent information**
3. **In the MCP step:**
   - Toggle "Enable MCP Enhancement" to ON
   - Select available MCP servers (if any)
   - Review the configuration summary
4. **Create the agent**
5. **Verify MCP config is saved:**

```bash
# Check agent's MCP configuration
curl -H "X-API-Key: sk-agenthub-system-internal-frontend-key" \
  http://localhost:4002/api/v1/mcp/agents/{agentId}/config
```

### **4. Test Agent Execution with MCP**

```bash
# Execute agent with MCP enhancement
curl -X POST -H "X-API-Key: sk-agenthub-system-internal-frontend-key" \
  -H "Content-Type: application/json" \
  -d '{"input": {"query": "Test MCP functionality"}}' \
  http://localhost:4002/api/v1/mcp/agents/{agentId}/execute
```

## 📋 **Integration Checklist**

### **Frontend Integration**
- [ ] Import MCP components into agent creation workflow
- [ ] Add MCP config to agent form state
- [ ] Include MCP configuration step/section
- [ ] Update agent creation API call to include MCP config
- [ ] Add MCP status to dashboard
- [ ] Add MCP management to agent detail pages

### **Testing**
- [ ] Backend server running on port 4002
- [ ] MCP API endpoints responding
- [ ] Can create agent with MCP configuration
- [ ] MCP config is saved in S3 with agent data
- [ ] Can view/edit MCP config for existing agents
- [ ] Agent execution works with MCP enhancement

### **User Experience**
- [ ] Clear explanation of MCP benefits
- [ ] Easy toggle to enable/disable MCP
- [ ] Visual indicators for MCP-enabled agents
- [ ] Fallback messaging (zero risk)
- [ ] Configuration validation and error handling

## 🎯 **Real-World Usage Example**

Here's how a user would create an MCP-enabled agent:

### **1. User Creates New Agent**
```
Agent Name: "Database Analyzer"
Description: "Analyzes database schemas and suggests optimizations"
Category: "Analytics"
```

### **2. User Configures MCP**
```
✅ Enable MCP Enhancement: ON
✅ Selected Servers: Database Server (1 server)
✅ Timeout: 30000ms
✅ Auto-approve: execute_query, get_schema
```

### **3. Agent is Created with MCP**
```json
{
  "id": "agent_db_analyzer_123",
  "name": "Database Analyzer",
  "category": "analytics",
  "mcpConfig": {
    "enabled": true,
    "serverIds": ["database"],
    "timeout": 30000,
    "autoApprove": ["execute_query", "get_schema"]
  }
}
```

### **4. User Executes Agent**
```
Input: "Analyze the users table and suggest optimizations"

Agent Response (with MCP):
- Connects to database via MCP
- Executes schema analysis queries
- Provides detailed optimization suggestions
- Falls back to standard processing if MCP fails
```

## 🚀 **Advanced Integration Options**

### **Conditional MCP Display**

Only show MCP options when servers are available:

```tsx
const [mcpAvailable, setMcpAvailable] = useState(false);

useEffect(() => {
  // Check if MCP servers are available
  fetch('/api/v1/mcp/servers/available')
    .then(res => res.json())
    .then(data => setMcpAvailable(data.servers?.length > 0));
}, []);

// Only show MCP step if servers are available
{mcpAvailable && (
  <MCPAgentCreationStep ... />
)}
```

### **MCP Server Management Integration**

Add server management to admin pages:

```tsx
// In admin/settings page
import MCPServerManagement from './components/management/MCPServerManagement';

const AdminSettings = () => {
  return (
    <Tabs>
      <Tab title="Users">...</Tab>
      <Tab title="Roles">...</Tab>
      <Tab title="MCP Servers">
        <MCPServerManagement />
      </Tab>
    </Tabs>
  );
};
```

### **Bulk MCP Configuration**

Enable MCP for multiple agents at once:

```tsx
const enableMCPForAgents = async (agentIds: string[]) => {
  const results = await Promise.all(
    agentIds.map(agentId =>
      fetch(`/api/v1/mcp/agents/${agentId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sk-agenthub-system-internal-frontend-key'
        },
        body: JSON.stringify({
          enabled: true,
          serverIds: ['database'],
          timeout: 30000
        })
      })
    )
  );
  
  console.log('MCP enabled for', results.length, 'agents');
};
```

---

## 🎉 **You're Ready!**

With this integration, your users can now:

1. **Create agents with MCP enhancement** during the creation process
2. **See MCP status** in dashboards and agent lists
3. **Configure MCP settings** for individual agents
4. **Execute agents with enhanced capabilities** through MCP
5. **Manage MCP servers** through the admin interface

The integration maintains **zero disruption** - existing agents continue to work exactly as before, while new agents can optionally use MCP for enhanced capabilities!