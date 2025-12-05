# AgentHub CLI Usage Examples

## Real-World Developer Scenarios

### Scenario 1: New Developer Onboarding

```bash
# New developer joins team, clones repo
git clone https://github.com/company/project
cd project

# Initialize AgentHub CLI
agent init

# Configure for company's AgentHub instance
agent config setup
# Enter: https://agenthub.company.com
# Enter: [API key from team lead]

# Generate missing tests for entire codebase
agent generate tests --coverage --edge-cases

# Run security scan before first commit
agent scan --severity medium
```

### Scenario 2: Bug Investigation

```bash
# Tests are failing after merge
npm test > test-results.log

# Analyze the failures
agent analyze failure --log test-results.log --context src/

# Output:
# 🔍 Failure Analysis Results:
# 
# Root Cause:
#   Race condition in async payment processing
# 
# Affected Files:
#   • src/payment.ts
#   • src/validation.ts
# 
# 💡 Suggested Fixes:
#   1. Add proper async/await handling in payment.ts:45
#   2. Implement mutex lock for concurrent validation
#   3. Add timeout handling for external API calls

# Apply suggested fixes
agent generate fix --apply --file src/payment.ts
```

### Scenario 3: Security Review

```bash
# Before production deployment
agent analyze security --severity high --format sarif --output security-report.sarif

# Output:
# 🔒 Found 3 security issues:
# 
# 1. [HIGH] SQL Injection vulnerability
#    File: src/database.ts:23
#    Raw SQL query with user input
#    💡 Fix: Use parameterized queries
# 
# 2. [CRITICAL] Hardcoded API key
#    File: src/config.ts:15
#    API key exposed in source code
#    💡 Fix: Move to environment variables

# Generate fixes
agent generate security-fix --file src/database.ts
```

### Scenario 4: Code Review Preparation

```bash
# Before creating PR
agent generate docs --directory src/api --format markdown
agent generate tests --file src/new-feature.ts --framework jest
agent analyze performance --file src/heavy-computation.ts

# All in one command
agent review-ready --include-docs --include-tests --include-security
```

### Scenario 5: CI/CD Integration

```bash
# In GitHub Actions workflow
- name: Agent-Powered Analysis
  run: |
    agent analyze security --format sarif --output security.sarif
    agent generate tests --missing-only
    agent analyze performance --profile performance.json
    
- name: Upload Security Results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: security.sarif
```

## Team Workflow Integration

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
agent scan --severity medium --format json > .agenthub/security-check.json
if [ $? -ne 0 ]; then
  echo "❌ Security issues found. Run 'agent scan' for details."
  exit 1
fi

agent generate tests --missing-only --quiet
git add tests/
```

### Pre-push Hook

```bash
# .husky/pre-push
#!/bin/sh
agent analyze performance --threshold 100ms
agent generate docs --update-only
```

## Language-Specific Examples

### TypeScript Project

```bash
# Initialize with TypeScript detection
agent init
# Detected: TypeScript + React + Jest

# Generate comprehensive tests
agent generate tests --framework jest --typescript --coverage

# Analyze TypeScript-specific issues
agent analyze failure --error "TS2345: Argument of type 'string' is not assignable"
```

### Python Project

```bash
# Initialize Python project
agent init
# Detected: Python + Django + pytest

# Generate tests with Python conventions
agent generate tests --framework pytest --style pep8

# Security scan for Python vulnerabilities
agent analyze security --language python --check-dependencies
```

### Java Project

```bash
# Initialize Java project
agent init
# Detected: Java + Spring Boot + JUnit

# Generate tests following Java conventions
agent generate tests --framework junit --style google-java-format

# Performance analysis for Java
agent analyze performance --jvm-profiling --heap-analysis
```

## Advanced Usage

### Custom Agent Execution

```bash
# Run specific agent with custom input
agent agents run custom-refactor --input '{
  "source_code": "$(cat src/legacy.js)",
  "target_style": "modern-es6",
  "preserve_functionality": true
}'

# Pipe file content to agent
cat src/complex-algorithm.py | agent agents run optimize-algorithm --stdin
```

### Batch Processing

```bash
# Process multiple files
find src/ -name "*.ts" -exec agent generate tests --file {} \;

# Or using xargs
find src/ -name "*.js" | xargs -I {} agent analyze security --file {}
```

### Configuration Management

```bash
# Different configs for different environments
agent config set --api-url https://dev-agenthub.company.com
agent config set --default-agent dev-code-quality

# Switch to production config
agent config set --api-url https://prod-agenthub.company.com
agent config set --default-agent prod-code-quality
```

## Integration with Popular Tools

### VS Code Integration

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Generate Tests",
      "type": "shell",
      "command": "agent",
      "args": ["generate", "tests", "--file", "${file}"],
      "group": "build"
    },
    {
      "label": "Security Scan",
      "type": "shell", 
      "command": "agent",
      "args": ["scan", "--severity", "medium"],
      "group": "test"
    }
  ]
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "agent:test": "agent generate tests --coverage",
    "agent:scan": "agent analyze security --severity high",
    "agent:docs": "agent generate docs --format markdown",
    "agent:fix": "agent analyze failure --log npm-debug.log",
    "pre-commit": "agent scan && npm test"
  }
}
```

### Makefile Integration

```makefile
.PHONY: agent-setup agent-test agent-scan

agent-setup:
	agent init
	agent config test

agent-test:
	agent generate tests --coverage --edge-cases

agent-scan:
	agent analyze security --format sarif --output security.sarif

agent-fix:
	agent analyze failure --log build.log --context src/

pre-commit: agent-scan agent-test
	git add tests/ docs/
```

## Troubleshooting Common Issues

### Issue: "Agent not found"

```bash
# Check available agents
agent agents list

# Verify connection
agent config test

# Update default agent
agent config set --default-agent code-quality-v2
```

### Issue: "Rate limit exceeded"

```bash
# Check current usage
agent config get

# Use different agent instance
agent config set --api-url https://backup-agenthub.company.com
```

### Issue: "Large file processing"

```bash
# Process in chunks
split -l 1000 large-file.js chunk_
for chunk in chunk_*; do
  agent analyze security --file $chunk
done
```

This CLI tool provides the foundation for seamless developer experience integration with AgentHub!