# MCP Management Page - Complete Guide

## Overview
The MCP Management Page is a comprehensive interface for configuring, managing, and onboarding Model Context Protocol (MCP) servers into the AgentHub platform.

## Location
**Navigation:** Developer Tools → Manage MCP Servers  
**URL:** `/mcp-management`

## Features

### 1. 📊 Overview Tab
**Purpose:** Quick start guide and server status overview

**Components:**
- **Quick Start Guide**
  - Explains the two required configuration files
  - Provides setup instructions
  - Links to documentation

- **Configured Servers List**
  - Shows all servers added to configuration
  - Displays server status (Active/Disabled)
  - Shows command and arguments

- **Real-time Server Status**
  - Live health checks for all MCP servers
  - Connection status indicators
  - Server availability monitoring

### 2. 🖥️ MCP Servers Tab
**Purpose:** View and manage all available MCP servers

**Features:**
- Grid view of all MCP servers
- Server status badges (Active/Inactive)
- Tool listings for each server
- Server descriptions and capabilities
- Quick access to server details

### 3. ⚙️ Configuration Tab
**Purpose:** Configure agent settings and manage secrets

**Agent Configuration Section:**
- **Execution Engine Selection**
  - asyncio (default)
  - threading
  - multiprocessing

- **Logging Settings**
  - Console logging toggle
  - Log level selection (DEBUG, INFO, WARNING, ERROR)

**Model Providers Section:**
- OpenAI configuration
  - Default model selection (GPT-4, GPT-4 Turbo, GPT-3.5 Turbo)
- Option to add more providers (Anthropic, Azure, etc.)

**Secrets Management Section:**
- Secure credential storage
- API key management
- Environment variable recommendations
- Security best practices

### 4. 📦 Server Templates Tab
**Purpose:** Quick-start templates for popular MCP servers

**Available Templates:**
1. **Fetch Server**
   - Command: `uvx mcp-server-fetch`
   - Purpose: HTTP fetch and web scraping

2. **Filesystem Server**
   - Command: `npx -y @modelcontextprotocol/server-filesystem .`
   - Purpose: File system operations

3. **GitHub Server**
   - Command: `npx -y @modelcontextprotocol/server-github`
   - Purpose: GitHub API integration
   - Requires: GITHUB_PERSONAL_ACCESS_TOKEN

4. **PostgreSQL Server**
   - Command: `npx -y @modelcontextprotocol/server-postgres`
   - Purpose: Database operations
   - Requires: POSTGRES_CONNECTION_STRING

5. **Slack Server**
   - Command: `npx -y @modelcontextprotocol/server-slack`
   - Purpose: Slack messaging integration
   - Requires: SLACK_BOT_TOKEN

### 5. 📚 Documentation Tab
**Purpose:** Complete setup guide and reference

**Sections:**
- Configuration file examples
- MCP server setup instructions
- Agent integration guide
- Optional enhancements
- Useful links and resources
- Quick tips

## Configuration Files

### mcp_agent.config.yaml
Main configuration file containing:

```yaml
execution_engine: asyncio

logging:
  console: true
  level: INFO

mcp:
  servers:
    fetch:
      command: "uvx"
      args: ["mcp-server-fetch"]
    filesystem:
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."]

model_providers:
  openai:
    default_model: gpt-4
```

**Fields:**
- `execution_engine`: Runtime engine (asyncio, threading, multiprocessing)
- `logging`: Console output and log level settings
- `mcp.servers`: Server definitions with commands and arguments
- `model_providers`: AI model configurations

### mcp_agent.secrets.yaml
Sensitive credentials file (should be gitignored):

```yaml
# ⚠️ DO NOT COMMIT TO VERSION CONTROL
openai:
  api_key: "your-openai-key"
```

**Security Notes:**
- Never commit to version control
- Use environment variables in production
- Consider using secrets managers (AWS Secrets Manager, Azure Key Vault)

## Adding a New MCP Server

### Method 1: Using Templates
1. Navigate to "Server Templates" tab
2. Click "Use Template" on desired server
3. Review pre-filled configuration
4. Modify if needed
5. Click "Add Server"

### Method 2: Manual Configuration
1. Click "➕ Add MCP Server" button
2. Fill in required fields:
   - **Server ID**: Unique identifier (e.g., `fetch`, `github`)
   - **Server Name**: Display name (e.g., `Fetch Server`)
   - **Command**: Execution command (`uvx`, `npx`, `docker`, etc.)
   - **Arguments**: Command arguments (space-separated)
3. Configure optional settings:
   - Timeout (default: 30000ms)
   - Retry Attempts (default: 3)
   - Disabled flag
4. Click "Add Server"

## Exporting Configuration

### Export Process
1. Configure all desired servers
2. Set up model providers
3. Add API keys and secrets
4. Click "📥 Export Configuration"
5. Two files will be downloaded:
   - `mcp_agent.config.yaml`
   - `mcp_agent.secrets.yaml`

### Using Exported Files
1. Place files in your agent's directory
2. Ensure `mcp_agent.secrets.yaml` is in `.gitignore`
3. Update environment variables if needed
4. Start your agent with the configuration

## MCP Server Setup

### Server Requirements
- **Independent Process**: Each server runs separately
- **MCP Protocol**: Implements Model Context Protocol
- **Tool Exposure**: Provides tools via JSON-RPC 2.0
- **Runtime**: Node.js, Python, or other supported runtimes

### Server Definition
```yaml
server_id:
  command: "uvx"  # or npx, docker, python, node
  args: ["mcp-server-package"]
  env:  # Optional environment variables
    API_KEY: "value"
  disabled: false  # Optional
  autoApprove: ["tool1", "tool2"]  # Optional
  timeout: 30000  # Optional (ms)
  retryAttempts: 3  # Optional
```

## Agent Integration

### Integration Flow
1. **Configuration**: Agent loads `mcp_agent.config.yaml`
2. **Secrets**: Agent loads `mcp_agent.secrets.yaml`
3. **Server Start**: Agent starts configured MCP servers
4. **Tool Discovery**: Agent discovers available tools
5. **Execution**: Agent invokes tools via MCP protocol

### Testing Integration
- Use MCP Inspector for debugging
- Test with CLI tools
- Monitor server logs
- Check health endpoints

## Best Practices

### Configuration
- ✅ Start with templates for common servers
- ✅ Test servers before production use
- ✅ Use descriptive server IDs and names
- ✅ Set appropriate timeouts and retries
- ✅ Document custom server configurations

### Security
- ✅ Never commit secrets to version control
- ✅ Use environment variables for sensitive data
- ✅ Implement secrets rotation
- ✅ Use secrets managers in production
- ✅ Limit API key permissions

### Operations
- ✅ Monitor server health regularly
- ✅ Keep servers updated
- ✅ Log server activities
- ✅ Implement error handling
- ✅ Set up alerts for failures

## Troubleshooting

### Server Won't Start
**Symptoms:** Server shows as inactive or error status

**Solutions:**
1. Check command and arguments are correct
2. Verify required dependencies are installed
3. Check environment variables are set
4. Review server logs for errors
5. Increase timeout if needed

### Authentication Failures
**Symptoms:** API key errors, permission denied

**Solutions:**
1. Verify API keys are correct
2. Check key permissions/scopes
3. Ensure secrets file is loaded
4. Validate environment variables
5. Check key expiration

### Tool Execution Errors
**Symptoms:** Tool calls fail or timeout

**Solutions:**
1. Verify tool arguments are correct
2. Check server is running and healthy
3. Increase timeout settings
4. Review tool documentation
5. Test tool independently

## Advanced Features

### Custom MCP Servers
Create custom servers for AgentHub:

1. **Choose Runtime**: Node.js, Python, etc.
2. **Implement MCP Protocol**: JSON-RPC 2.0
3. **Define Tools**: Input/output schemas
4. **Add to Configuration**: Use custom command
5. **Test Integration**: Verify tool execution

### Multi-Model Support
Configure multiple AI providers:

```yaml
model_providers:
  openai:
    default_model: gpt-4
  anthropic:
    default_model: claude-3-opus
  azure:
    default_model: gpt-4
    endpoint: "https://your-endpoint.openai.azure.com"
```

### Environment-Specific Configs
Maintain separate configurations:
- `mcp_agent.config.dev.yaml` - Development
- `mcp_agent.config.staging.yaml` - Staging
- `mcp_agent.config.prod.yaml` - Production

## Related Pages

- **MCP Dashboard** (`/real-mcp-dashboard`): Test and interact with MCP servers
- **MCP Test & Integration** (`/mcp-test`): Integration testing tools
- **API Documentation** (`/api-docs`): API reference
- **Integration Guide** (`/integration-guide`): Platform integration

## Support

### Resources
- [MCP Official Documentation](https://modelcontextprotocol.io)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
- AgentHub Developer Portal

### Getting Help
- Check documentation tab for guides
- Review server templates for examples
- Test servers in MCP Dashboard
- Contact support for assistance
