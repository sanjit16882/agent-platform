# Per-Agent MCP Integration Guide

## Overview

The Agent Factory platform now supports **per-agent MCP (Model Context Protocol) configuration**. This allows each agent to have its own MCP settings, enabling fine-grained control over which tools and capabilities each agent can access.

## Key Features

### ✅ **Zero-Disruption Implementation**
- Existing agents continue to work exactly as before
- MCP is completely optional and additive
- Fallback to standard execution is always available
- No breaking changes to existing APIs

### ✅ **Per-Agent Configuration**
- Each agent can have its own MCP settings
- Enable/disable MCP per agent
- Select which MCP servers each agent can use
- Configure timeouts and auto-approval settings per agent

### ✅ **S3-Based Storage**
- MCP configuration is stored in S3 alongside agent data
- No database changes required
- Maintains current architecture
- Easy backup and migration

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Agent Request │───▶│ Agent MCP        │───▶│ MCP Servers     │
│                 │    │ Processor        │    │ (File, DB, Git) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Standard Agent   │
                       │ Processor        │
                       │ (Fallback)       │
                       └──────────────────┘
```

## API Endpoints

### MCP Server Management
```bash
# Get all MCP servers
GET /api/v1/mcp/servers

# Get available servers
GET /api/v1/mcp/servers/available

# Add new MCP server
POST /api/v1/mcp/servers

# Update MCP server
PUT /api/v1/mcp/servers/{serverId}

# Delete MCP server
DELETE /api/v1/mcp/servers/{serverId}

# Test server connection
POST /api/v1/mcp/servers/{serverId}/test
```

### Per-Agent MCP Configuration
```bash
# Get agent's MCP config
GET /api/v1/mcp/agents/{agentId}/config

# Update agent's MCP config
PUT /api/v1/mcp/agents/{agentId}/config

# Test agent's MCP setup
POST /api/v1/mcp/agents/{agentId}/test

# Execute agent with MCP
POST /api/v1/mcp/agents/{agentId}/execute
```

### System Status
```bash
# Get MCP system status
GET /api/v1/mcp/status

# Initialize MCP system
POST /api/v1/mcp/initialize
```

## Usage Examples

### 1. Enable MCP for an Agent

```javascript
// Update agent's MCP configuration
const response = await fetch(`/api/v1/mcp/agents/${agentId}/config`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    enabled: true,
    serverIds: ['database', 'filesystem'],
    timeout: 30000,
    autoApprove: ['read_file', 'execute_query']
  })
});
```

### 2. Execute Agent with MCP

```javascript
// Execute agent (automatically uses MCP if configured)
const response = await fetch(`/api/v1/mcp/agents/${agentId}/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: {
      query: "Analyze the database schema and suggest optimizations"
    },
    options: {
      timeout: 60000,
      fallbackOnError: true
    }
  })
});

const result = await response.json();
console.log('MCP Used:', result.mcpUsed);
console.log('Servers Used:', result.mcpServersUsed);
console.log('Tools Used:', result.toolsUsed);
```

### 3. Add a New MCP Server

```javascript
// Add filesystem MCP server
const response = await fetch('/api/v1/mcp/servers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'filesystem',
    name: 'File System Server',
    command: 'uvx',
    args: ['mcp-server-filesystem', '.'],
    env: {
      FILESYSTEM_ROOT: process.cwd()
    },
    disabled: false,
    autoApprove: ['read_file', 'list_directory'],
    timeout: 30000,
    retryAttempts: 3
  })
});
```

## Agent Data Structure

Agents stored in S3 now include an optional `mcpConfig` field:

```json
{
  "id": "agent_123",
  "name": "Data Analyzer",
  "category": "analytics",
  "createdAt": "2024-01-18T10:00:00Z",
  "updatedAt": "2024-01-18T12:00:00Z",
  "mcpConfig": {
    "enabled": true,
    "serverIds": ["database", "filesystem"],
    "timeout": 30000,
    "autoApprove": ["read_file", "execute_query"]
  }
}
```

## Built-in MCP Servers

### Database Server (Internal)
- **ID**: `database`
- **Tools**: `execute_query`, `get_schema`, `get_table_info`, `validate_query`
- **Status**: Always available (internal server)
- **Use Case**: Database analysis, query execution, schema inspection

### File System Server (External)
- **ID**: `filesystem`
- **Command**: `uvx mcp-server-filesystem`
- **Tools**: `read_file`, `write_file`, `list_directory`, `search_files`
- **Use Case**: Code analysis, file operations, project inspection

### Git Server (External)
- **ID**: `git`
- **Command**: `uvx mcp-server-git`
- **Tools**: `log`, `status`, `diff`, `branch`, `commit`
- **Use Case**: Repository analysis, change tracking, version control

## Frontend Components

### MCPManagement Component
```tsx
import { MCPManagement } from './components/management/MCPManagement';

// Use in agent detail pages
<MCPManagement 
  agentId={agentId}
  agentName={agentName}
  onConfigUpdate={(config) => console.log('MCP config updated:', config)}
/>
```

### MCPServerManagement Component
```tsx
import { MCPServerManagement } from './components/management/MCPServerManagement';

// Use in admin/settings pages
<MCPServerManagement />
```

### MCPStatus Component
```tsx
import { MCPStatus } from './components/management/MCPStatus';

// Use in dashboards
<MCPStatus 
  compact={false}
  showDetails={true}
  onManageClick={() => navigate('/mcp/servers')}
/>
```

## Configuration Files

### Workspace MCP Configuration
File: `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "id": "filesystem",
      "name": "File System Server",
      "command": "uvx",
      "args": ["mcp-server-filesystem", "."],
      "env": {
        "FILESYSTEM_ROOT": "."
      },
      "disabled": false,
      "autoApprove": ["read_file", "list_directory"],
      "timeout": 30000
    },
    "database": {
      "id": "database",
      "name": "Database Server",
      "command": "node",
      "args": [],
      "disabled": false,
      "autoApprove": ["execute_query", "get_schema"],
      "timeout": 30000
    }
  }
}
```

## Migration Strategy

### Phase 1: Optional Enhancement (Current)
- MCP is disabled by default for all agents
- Users can opt-in per agent
- Existing functionality unchanged

### Phase 2: Gradual Adoption
- Provide migration tools for bulk enabling
- Show MCP benefits in UI
- Encourage adoption through better capabilities

### Phase 3: Default Enhancement
- Enable MCP by default for new agents
- Existing agents remain unchanged
- Full backward compatibility maintained

## Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   ```bash
   # Check if uvx is installed
   uvx --version
   
   # Test server manually
   uvx mcp-server-filesystem .
   ```

2. **Agent Not Using MCP**
   - Check if MCP is enabled for the agent
   - Verify selected servers are connected
   - Check agent execution logs

3. **Server Connection Failed**
   - Verify server command and arguments
   - Check environment variables
   - Test server connection via API

### Debug Commands

```bash
# Check MCP system status
curl http://localhost:4002/api/v1/mcp/status

# Test specific server
curl -X POST http://localhost:4002/api/v1/mcp/servers/database/test

# Get agent MCP config
curl http://localhost:4002/api/v1/mcp/agents/{agentId}/config
```

## Security Considerations

### Auto-Approval
- Only approve safe, read-only operations by default
- Review tool permissions carefully
- Use principle of least privilege

### Server Isolation
- Each MCP server runs in its own process
- Environment variables are isolated
- File system access is controlled

### Agent Permissions
- Agents can only use explicitly configured servers
- No cross-agent server sharing by default
- Audit logs for all MCP operations

## Performance Impact

### Minimal Overhead
- MCP adds ~50-100ms per execution when enabled
- Fallback to standard execution is instant
- No impact when MCP is disabled

### Resource Usage
- Each MCP server uses ~10-50MB RAM
- CPU usage is minimal during idle
- Network overhead is negligible for local servers

## Future Enhancements

### Planned Features
- [ ] Custom MCP server templates
- [ ] Agent-to-agent MCP communication
- [ ] MCP server marketplace
- [ ] Advanced tool composition
- [ ] Real-time collaboration tools
- [ ] Multi-tenant MCP isolation

### Integration Roadmap
- [ ] VSCode extension MCP support
- [ ] CLI tool MCP integration
- [ ] GitHub Actions MCP workflows
- [ ] Kubernetes MCP operators

## Support

For questions or issues with MCP integration:

1. Check the troubleshooting section above
2. Review server logs in the backend console
3. Test individual components using the API endpoints
4. Verify configuration files are properly formatted

The MCP implementation follows the zero-disruption principle - existing functionality will never be affected, and fallback mechanisms ensure system reliability.