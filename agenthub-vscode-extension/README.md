# AgentHub VS Code Extension

Integrate AI agents directly into your VS Code workflow for testing, security analysis, code generation, and more.

## Features

### 🤖 **Right-Click Integration**
- Right-click any code file to generate tests, run security analysis, or create documentation
- Context-aware suggestions based on file type and content
- Seamless integration with your existing workflow

### 🎯 **Command Palette**
Access all AgentHub features via Command Palette (`Ctrl+Shift+P`):
- `AgentHub: Generate Tests` - Create comprehensive test suites
- `AgentHub: Security Analysis` - Scan for vulnerabilities
- `AgentHub: Analyze Failure` - Debug errors and failures
- `AgentHub: Generate Documentation` - Create code documentation
- `AgentHub: List Available Agents` - Browse and select agents

### 📊 **Status Bar Integration**
- Real-time connection status to AgentHub platform
- Operation counter showing completed tasks
- Quick access to output panel

### 🔍 **Integrated Output Panel**
- Detailed results from agent operations
- Security issue reporting with file locations
- Suggested fixes and improvements
- Operation history and timing

### 🌳 **Side Panel Views**
- **Available Agents**: Browse and manage your agents
- **Recent Operations**: Track your agent usage history
- Quick access to agent information and capabilities

### ⚙️ **Smart Configuration**
- Automatic project detection and initialization
- Workspace-specific settings
- Global and project-level configuration options

## Quick Start

### 1. Install Extension
Install from VS Code Marketplace or package manually.

### 2. Configure Connection
```
Ctrl+Shift+P → "AgentHub: Configure AgentHub"
```
Enter your AgentHub API URL and optional API key.

### 3. Initialize Project
```
Ctrl+Shift+P → "AgentHub: Initialize AgentHub in Project"
```
Sets up project-specific configuration.

### 4. Start Using Agents
- **Right-click** any code file → Select AgentHub action
- **Command Palette** → Search for "AgentHub" commands
- **Status Bar** → Click AgentHub icon for quick access

## Usage Examples

### Generate Tests
1. Right-click on a JavaScript/TypeScript file
2. Select "Generate Tests for This File"
3. Tests are automatically created in `tests/` directory
4. Generated test file opens automatically

### Security Analysis
1. Right-click on any code file
2. Select "Security Analysis for This File"
3. View results in output panel
4. Security issues appear as VS Code diagnostics

### Analyze Failures
1. Copy error message from terminal
2. `Ctrl+Shift+P` → "AgentHub: Analyze Failure"
3. Paste error message
4. Get root cause analysis and suggested fixes

### Generate Documentation
1. Right-click on code file
2. Select "Generate Documentation for This File"
3. Markdown documentation created in `docs/` directory

## Configuration

### Global Settings
Access via `File → Preferences → Settings → Extensions → AgentHub`:

```json
{
  "agenthub.apiUrl": "https://agenthub.company.com",
  "agenthub.apiKey": "your-api-key",
  "agenthub.autoGenerateTests": false,
  "agenthub.autoSecurityScan": true,
  "agenthub.showStatusBar": true,
  "agenthub.outputLevel": "normal"
}
```

### Project Settings
Create `.agenthub/config.json` in your project:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-project",
    "language": "typescript",
    "framework": "react"
  },
  "agents": {
    "preferred": {
      "test-generator": "jest-test-generator",
      "security-scanner": "security-scanner-v2"
    }
  }
}
```

## Supported File Types

- **JavaScript** (`.js`, `.jsx`)
- **TypeScript** (`.ts`, `.tsx`)
- **Python** (`.py`)
- **Java** (`.java`)
- **C#** (`.cs`)
- **Go** (`.go`)

## Commands Reference

| Command | Description | Shortcut |
|---------|-------------|----------|
| `agenthub.generateTests` | Generate tests for current file | - |
| `agenthub.analyzeSecurity` | Run security analysis | - |
| `agenthub.analyzeFailure` | Analyze error messages | - |
| `agenthub.generateDocs` | Generate documentation | - |
| `agenthub.configure` | Configure AgentHub connection | - |
| `agenthub.listAgents` | List available agents | - |
| `agenthub.showOutput` | Show AgentHub output panel | - |

## Context Menu Integration

Right-click context menu appears on:
- Code files in Explorer
- Open editor tabs
- Selected code in editor

Available actions depend on file type and context.

## Automatic Features

### File Watchers
- **Auto Security Scan**: Automatically scan files on save (configurable)
- **Auto Test Generation**: Prompt to generate tests for new files (configurable)

### Smart Diagnostics
- Security issues appear as VS Code problems
- Click to navigate to issue location
- Hover for detailed descriptions and fixes

## Troubleshooting

### Connection Issues
1. Check AgentHub API URL in settings
2. Verify API key (if required)
3. Test connection: `Ctrl+Shift+P` → "AgentHub: Configure AgentHub"
4. Check output panel for detailed error messages

### Agent Not Found
1. Verify agents are deployed on AgentHub platform
2. Check agent IDs in project configuration
3. Use "List Available Agents" to see what's available

### Performance Issues
1. Disable auto-scanning if too frequent
2. Adjust output level to "minimal"
3. Check network connectivity to AgentHub API

## Development

### Building from Source
```bash
git clone https://github.com/agenthub/vscode-extension
cd vscode-extension
npm install
npm run compile
```

### Packaging
```bash
npm install -g vsce
vsce package
```

### Testing
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Documentation**: https://docs.agenthub.com
- **Issues**: https://github.com/agenthub/vscode-extension/issues
- **Community**: https://community.agenthub.com