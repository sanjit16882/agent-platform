# Customizing the AgentHub VS Code Extension

This document explains how organizations can customize the generic AgentHub VS Code extension for their specific needs.

## Overview

This extension is designed to be generic and configurable for any AgentHub instance or compatible AI agent platform. Organizations can customize branding, default configurations, and specific integrations.

## Customization Options

### 1. Branding and Display Name

Update `package.json`:

```json
{
  "name": "your-company-agenthub",
  "displayName": "YourCompany AgentHub Assistant",
  "description": "AI-powered development assistant for YourCompany developers",
  "publisher": "your-company"
}
```

### 2. Default Configuration

Update default values in `package.json` configuration section:

```json
{
  "configuration": {
    "properties": {
      "agenthub.apiUrl": {
        "default": "https://agenthub.yourcompany.com"
      },
      "agenthub.defaultAgent": {
        "default": "your-preferred-agent-id"
      }
    }
  }
}
```

### 3. Custom Commands and Menus

Add organization-specific commands in `package.json`:

```json
{
  "commands": [
    {
      "command": "agenthub.yourCustomCommand",
      "title": "Your Custom Action",
      "category": "YourCompany AgentHub"
    }
  ]
}
```

### 4. Custom Agent Endpoints

Update `src/agentService.ts` to match your API structure:

```typescript
// Customize API endpoints
async listAgents(): Promise<Agent[]> {
  const response = await this.client.get('/your-api/agents');
  return response.data.agents || [];
}
```

### 5. Organization-Specific Features

Add custom functionality in `src/commands.ts`:

```typescript
async yourCustomCommand() {
  // Implement organization-specific logic
}
```

## Deployment Options

### Option 1: Internal Marketplace
1. Customize the extension
2. Package with `vsce package`
3. Deploy to your internal VS Code marketplace

### Option 2: Direct Distribution
1. Build the extension
2. Distribute `.vsix` file to developers
3. Install with `code --install-extension your-extension.vsix`

### Option 3: Workspace Extensions
1. Include in workspace `.vscode/extensions.json`
2. Recommend to team members
3. Auto-install for new team members

## Configuration Templates

### Enterprise Template

```json
{
  "agenthub.apiUrl": "https://agenthub.enterprise.com",
  "agenthub.apiKey": "${env:AGENTHUB_API_KEY}",
  "agenthub.autoSecurityScan": true,
  "agenthub.autoGenerateTests": false,
  "agenthub.outputLevel": "normal"
}
```

### Development Team Template

```json
{
  "agenthub.apiUrl": "https://dev-agenthub.company.com",
  "agenthub.autoGenerateTests": true,
  "agenthub.autoSecurityScan": true,
  "agenthub.showStatusBar": true
}
```

## Security Considerations

### API Key Management
- Use environment variables for API keys
- Implement secure credential storage
- Consider using VS Code's SecretStorage API

### Network Security
- Configure for corporate firewalls
- Use HTTPS endpoints only
- Implement certificate validation

### Access Control
- Integrate with corporate SSO
- Implement role-based permissions
- Audit agent usage and access

## Testing Your Customization

1. **Unit Tests**: Test custom commands and services
2. **Integration Tests**: Test with your AgentHub instance
3. **User Acceptance**: Test with development teams
4. **Performance**: Test with large codebases

## Maintenance

### Regular Updates
- Monitor for security updates
- Update agent integrations
- Sync with AgentHub platform changes

### User Feedback
- Collect usage analytics
- Gather developer feedback
- Iterate on features

## Support

For customization support:
1. Review the source code documentation
2. Test changes in development environment
3. Consult with your AgentHub platform team
4. Consider professional services for complex customizations

## Example Customizations

### Custom Branding
Replace icons, colors, and text to match your organization's brand.

### Specialized Agents
Add commands for organization-specific agents (e.g., compliance checkers, internal code standards).

### Integration Hooks
Connect with internal tools like JIRA, Confluence, or custom development platforms.

### Workflow Automation
Add commands that integrate with your CI/CD pipelines and development workflows.