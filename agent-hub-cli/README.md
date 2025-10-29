# AgentHub CLI

Developer tools for agent-powered development. Create, test, and analyze code using AI agents directly from your terminal.

## Installation

```bash
npm install -g @agenthub/cli
```

## Quick Start

1. **Initialize in your project:**
   ```bash
   agent init
   ```

2. **Configure API connection:**
   ```bash
   agent config setup
   ```

3. **Generate tests:**
   ```bash
   agent test
   # or for specific file
   agent test src/utils.ts
   ```

4. **Run security scan:**
   ```bash
   agent scan
   ```

## Commands

### Configuration

```bash
# Interactive setup
agent config setup

# Set specific values
agent config set --api-url https://agenthub.company.com
agent config set --api-key your-api-key

# View current config
agent config get

# Test connection
agent config test
```

### Agent Management

```bash
# List available agents
agent agents list

# Get agent details
agent agents info code-quality

# Run agent interactively
agent agents run test-generator --file src/app.ts
```

### Code Generation

```bash
# Generate tests
agent generate tests --file src/utils.ts
agent generate tests --directory src/components
agent generate tests --framework jest --coverage

# Generate documentation
agent generate docs --file src/api.ts --format markdown
```

### Code Analysis

```bash
# Analyze failures
agent analyze failure --log test-results.log
agent analyze failure --error "TypeError: Cannot read property"

# Security analysis
agent analyze security --severity high
agent analyze security --file src/auth.ts --format sarif

# Performance analysis
agent analyze performance --file src/heavy-computation.ts
agent analyze performance --profile performance.json
```

## Project Integration

### Initialize Project

```bash
agent init
```

This creates `.agenthub/config.json` with project-specific settings:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-app",
    "language": "typescript",
    "framework": "react",
    "testFramework": "jest"
  },
  "agents": {
    "preferred": {
      "code-quality": "code-quality-agent",
      "test-generator": "test-generator-agent"
    }
  },
  "hooks": {
    "pre-commit": ["security-scan"],
    "pre-push": ["test-coverage"]
  }
}
```

### Git Hooks Integration

Add to your `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "agent scan --severity medium",
      "pre-push": "agent test --coverage"
    }
  }
}
```

## Examples

### Generate Tests for Entire Project

```bash
agent generate tests --coverage --edge-cases
```

### Analyze Build Failure

```bash
# From log file
agent analyze failure --log build.log --context src/

# Direct error message
agent analyze failure --error "Module not found: Can't resolve './utils'"
```

### Security Scan with Custom Output

```bash
agent analyze security --severity high --format sarif --output security-report.sarif
```

### Interactive Agent Execution

```bash
agent agents run code-quality
# Opens editor for input, then shows results
```

## Configuration

### Global Config Location

- **Linux/Mac:** `~/.agenthub/config.json`
- **Windows:** `%USERPROFILE%\.agenthub\config.json`

### Environment Variables

```bash
export AGENTHUB_API_URL=https://agenthub.company.com
export AGENTHUB_API_KEY=your-api-key
```

### Project Config

Each project can have `.agenthub/config.json` for project-specific settings.

## API Integration

The CLI connects to your AgentHub platform via REST API:

```
POST /api/agents/{agentId}/execute
{
  "input": {
    "source_code": "...",
    "context": {...}
  }
}
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
agent config test

# Check configuration
agent config get
```

### Common Issues

1. **"No agents found"** - Check API URL and ensure agents are deployed
2. **"Connection failed"** - Verify API URL and network connectivity
3. **"Authentication failed"** - Check API key configuration

### Debug Mode

```bash
agent --verbose generate tests
```

## Development

### Build from Source

```bash
git clone https://github.com/agenthub/cli
cd cli
npm install
npm run build
npm link
```

### Run in Development

```bash
npm run dev -- generate tests --file example.ts
```

## License

MIT License - see LICENSE file for details.