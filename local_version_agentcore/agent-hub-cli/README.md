# Agent Hub Testing CLI

Command-line interface for Agent Hub testing. Run tests, manage test suites, and view analytics from your terminal.

## Installation

### Global Installation
```bash
npm install -g @agent-hub/testing-cli
```

### Local Development
```bash
cd agent-hub-cli
npm install
npm run build
npm link
```

## Configuration

Create `~/.agent-hub/config.json`:
```json
{
  "apiUrl": "http://localhost:4002",
  "apiKey": "your-api-key-here",
  "defaultAgent": "agent_123"
}
```

Or use environment variables:
```bash
export AGENT_HUB_API_URL=http://localhost:4002
export AGENT_HUB_API_KEY=your-api-key-here
```

## Quick Start

```bash
# List available tests
agent-test list

# Run tests
agent-test run \
  --agent agent_123 \
  --models claude-3-5-sonnet \
  --tests test_001,test_002 \
  --watch

# View results
agent-test results <run_id>

# View analytics
agent-test analytics --days 7
```

## Commands

### Test Management

```bash
# List tests
agent-test list [--category <category>] [--tags <tags>]

# Create test
agent-test create --name "Test Name" --category functional --file test.json

# Show test details
agent-test show <testId>

# Delete test
agent-test delete <testId> [--yes]
```

### Test Execution

```bash
# Run tests
agent-test run \
  --agent <agentId> \
  --models <model1,model2> \
  --tests <test1,test2> \
  [--watch] \
  [--vector-db] \
  [--knowledge-bases <kb1,kb2>] \
  [--mcp] \
  [--mcp-servers <server1,server2>]

# Run from test suite file
agent-test run --suite test-suite.yaml

# Watch execution
agent-test watch <runId>
```

### Results & Analytics

```bash
# Show results
agent-test results <runId> [--detailed] [--export json] [--output file.json]

# List runs
agent-test runs [--agent <agentId>] [--status <status>]

# Show analytics
agent-test analytics [--agent <agentId>] [--days <days>]
```

### CI/CD Mode

```bash
# Run in CI mode (exits with status code)
agent-test run \
  --agent agent_123 \
  --models claude-3-5-sonnet \
  --tests test_001 \
  --ci-mode \
  --fail-threshold 80 \
  --report junit \
  --output test-results.xml
```

## Test Suite File Format

Create a `test-suite.yaml` file:

```yaml
name: "My Test Suite"
agent: agent_123
models:
  - claude-3-5-sonnet
  - gpt-4
tests:
  - id: test_001
    input:
      content: "Test input 1"
      format: plain_text
  - id: test_002
    input:
      content: '{"data": "test"}'
      format: json
knowledgeConfig:
  vectorDB:
    enabled: true
    knowledgeBases:
      - kb_001
    retrievalConfig:
      topK: 5
      minSimilarity: 0.7
  mcp:
    enabled: false
    selectedServers: []
```

## Examples

See [API_CLI_TESTING_GUIDE.md](../docs/API_CLI_TESTING_GUIDE.md) for detailed examples.

## Development

```bash
# Build
npm run build

# Development mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## License

MIT
