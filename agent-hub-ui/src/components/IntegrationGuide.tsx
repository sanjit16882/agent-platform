import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Tabs, Tab, Accordion } from 'react-bootstrap';
import { Icon } from './Icon';

const IntegrationGuide: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'curl'>('python');
  const [selectedFramework, setSelectedFramework] = useState<'rest' | 'sdk' | 'webhook' | 'cicd'>('rest');

  const quickStartCode = {
    python: `# Install the AgentHub SDK
pip install agenthub-sdk

# Quick Start Example
from agenthub import AgentHubClient
import asyncio

async def main():
    # Initialize client
    client = AgentHubClient(
        api_key="your-api-key-here",
        base_url="https://api.agenthub.company.com/v1"
    )
    
    # Execute a QE Test Generator agent
    result = await client.execute_agent(
        agent_id="qe-test-generator-v2",
        inputs={
            "requirements": "Test user login functionality",
            "framework": "cypress",
            "language": "typescript"
        }
    )
    
    print(f"Generated {len(result.test_files)} test files")
    for test_file in result.test_files:
        print(f"- {test_file.name}: {test_file.test_count} tests")

if __name__ == "__main__":
    asyncio.run(main())`,

    javascript: `// Install the AgentHub SDK
// npm install @agenthub/sdk

// Quick Start Example
const { AgentHubClient } = require('@agenthub/sdk');

async function main() {
    // Initialize client
    const client = new AgentHubClient({
        apiKey: 'your-api-key-here',
        baseURL: 'https://api.agenthub.company.com/v1'
    });
    
    // Execute a DevOps Infrastructure Monitor
    const result = await client.executeAgent('devops-monitor-v1', {
        cloud_provider: 'aws',
        account_id: '123456789012',
        analysis_type: 'cost'
    });
    
    console.log(\`Analysis completed: \${result.recommendations?.length || 0} recommendations\`);
    result.recommendations.forEach(rec => {
        console.log(\`- \${rec.title}: \${rec.description}\`);
    });
}

main().catch(console.error);`,

    java: `// Add to your pom.xml or build.gradle
// <dependency>
//   <groupId>com.agenthub</groupId>
//   <artifactId>agenthub-sdk</artifactId>
//   <version>1.0.0</version>
// </dependency>

// Quick Start Example
import com.agenthub.AgentHubClient;
import com.agenthub.models.*;
import java.util.concurrent.CompletableFuture;

public class AgentHubExample {
    public static void main(String[] args) {
        // Initialize client
        AgentHubClient client = AgentHubClient.builder()
            .apiKey("your-api-key-here")
            .baseUrl("https://api.agenthub.company.com/v1")
            .build();
        
        // Execute Security Scanner agent
        ExecutionRequest request = ExecutionRequest.builder()
            .agentId("security-scanner-v1")
            .input("target_type", "kubernetes")
            .input("scan_depth", "comprehensive")
            .input("compliance_framework", "SOC2")
            .build();
            
        CompletableFuture<ExecutionResult> future = client.executeAgent(request);
        
        future.thenAccept(result -> {
            System.out.println("Found " + result.getVulnerabilities().size() + " vulnerabilities");
            result.getRemediationSteps().forEach(System.out::println);
        });
    }
}`,

    curl: `# REST API Quick Start

# 1. Get your API key (replace with actual key)
API_KEY="your-api-key-here"
BASE_URL="https://api.agenthub.company.com/v1"

# 2. Execute an agent
curl -X POST "$BASE_URL/agents/qe-test-generator-v2/execute" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "requirements": "Test user registration flow",
    "framework": "selenium",
    "language": "python"
  }'

# Response: {"execution_id": "exec_abc123", "status": "running"}

# 3. Check execution status
curl -X GET "$BASE_URL/executions/exec_abc123" \\
  -H "Authorization: Bearer $API_KEY"

# 4. Get results when completed
curl -X GET "$BASE_URL/executions/exec_abc123/results" \\
  -H "Authorization: Bearer $API_KEY"`
  };

  const cicdExamples = {
    github: `# .github/workflows/agenthub-integration.yml
name: AgentHub Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate Tests with AgentHub
        uses: agenthub/github-action@v1
        with:
          agent-id: 'qe-test-generator-v2'
          api-key: \${{ secrets.AGENTHUB_API_KEY }}
          inputs: |
            {
              "requirements": "Test cases from requirements.md",
              "framework": "cypress",
              "language": "typescript"
            }
          output-path: './generated-tests'
          
      - name: Run Generated Tests
        run: |
          npm install
          npm run test:generated
          
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: ./test-results/

  infrastructure-analysis:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Analyze Infrastructure Costs
        uses: agenthub/github-action@v1
        with:
          agent-id: 'devops-monitor-v1'
          api-key: \${{ secrets.AGENTHUB_API_KEY }}
          inputs: |
            {
              "cloud_provider": "aws",
              "account_id": "\${{ secrets.AWS_ACCOUNT_ID }}",
              "analysis_type": "cost"
            }
            
      - name: Create Cost Report
        run: |
          echo "Monthly savings identified: $AGENTHUB_OUTPUT_monthly_savings"
          echo "Recommendations: $AGENTHUB_OUTPUT_recommendations"`,

    jenkins: `// Jenkinsfile
pipeline {
    agent any
    
    environment {
        AGENTHUB_API_KEY = credentials('agenthub-api-key')
        AGENTHUB_BASE_URL = 'https://api.agenthub.company.com/v1'
    }
    
    stages {
        stage('Security Scan') {
            steps {
                script {
                    // Execute security scanner agent
                    def response = sh(
                        script: """
                            curl -s -X POST "\${AGENTHUB_BASE_URL}/agents/security-scanner-v1/execute" \\
                              -H "Authorization: Bearer \${AGENTHUB_API_KEY}" \\
                              -H "Content-Type: application/json" \\
                              -d '{
                                "target_type": "kubernetes",
                                "scan_depth": "comprehensive",
                                "compliance_framework": "SOC2"
                              }'
                        """,
                        returnStdout: true
                    ).trim()
                    
                    def result = readJSON text: response
                    env.EXECUTION_ID = result.execution_id
                }
                
                // Wait for completion and get results
                script {
                    timeout(time: 10, unit: 'MINUTES') {
                        waitUntil {
                            def status = sh(
                                script: "curl -s -H 'Authorization: Bearer \${AGENTHUB_API_KEY}' \${AGENTHUB_BASE_URL}/executions/\${EXECUTION_ID}",
                                returnStdout: true
                            ).trim()
                            def statusJson = readJSON text: status
                            return statusJson.status == 'completed'
                        }
                    }
                }
            }
        }
        
        stage('Process Results') {
            steps {
                script {
                    def results = sh(
                        script: "curl -s -H 'Authorization: Bearer \${AGENTHUB_API_KEY}' \${AGENTHUB_BASE_URL}/executions/\${EXECUTION_ID}/results",
                        returnStdout: true
                    ).trim()
                    
                    def resultsJson = readJSON text: results
                    
                    // Fail build if critical vulnerabilities found
                    def criticalVulns = resultsJson.vulnerabilities.findAll { it.severity == 'critical' }
                    if (criticalVulns.size() > 0) {
                        error("Found \${criticalVulns.size()} critical vulnerabilities")
                    }
                    
                    echo "Security scan completed successfully"
                }
            }
        }
    }
}`,

    gitlab: `# .gitlab-ci.yml
stages:
  - test-generation
  - security-scan
  - deploy

variables:
  AGENTHUB_BASE_URL: "https://api.agenthub.company.com/v1"

generate-tests:
  stage: test-generation
  image: node:16
  script:
    - |
      # Generate tests using AgentHub
      RESPONSE=$(curl -s -X POST "$AGENTHUB_BASE_URL/agents/qe-test-generator-v2/execute" \\
        -H "Authorization: Bearer $AGENTHUB_API_KEY" \\
        -H "Content-Type: application/json" \\
        -d '{
          "requirements": "Test user authentication and authorization",
          "framework": "playwright",
          "language": "typescript"
        }')
      
      EXECUTION_ID=$(echo $RESPONSE | jq -r '.execution_id')
      
      # Wait for completion
      while true; do
        STATUS=$(curl -s -H "Authorization: Bearer $AGENTHUB_API_KEY" \\
          "$AGENTHUB_BASE_URL/executions/$EXECUTION_ID" | jq -r '.status')
        
        if [ "$STATUS" = "completed" ]; then
          break
        elif [ "$STATUS" = "failed" ]; then
          echo "Agent execution failed"
          exit 1
        fi
        
        sleep 10
      done
      
      # Download generated tests
      curl -s -H "Authorization: Bearer $AGENTHUB_API_KEY" \\
        "$AGENTHUB_BASE_URL/executions/$EXECUTION_ID/results" > test-results.json
        
      # Extract and save test files
      jq -r '.test_files[] | "\\(.name)\\n\\(.content)"' test-results.json > generated-tests.txt
      
  artifacts:
    paths:
      - generated-tests.txt
      - test-results.json
    expire_in: 1 week

security-scan:
  stage: security-scan
  image: alpine/curl
  script:
    - |
      # Run security scan
      RESPONSE=$(curl -s -X POST "$AGENTHUB_BASE_URL/agents/security-scanner-v1/execute" \\
        -H "Authorization: Bearer $AGENTHUB_API_KEY" \\
        -H "Content-Type: application/json" \\
        -d '{
          "target_type": "docker",
          "scan_depth": "basic",
          "compliance_framework": "PCI"
        }')
      
      echo "Security scan initiated: $RESPONSE"
  only:
    - main
    - develop`
  };

  const webhookExample = `# Webhook Integration Example

## 1. Set up webhook endpoint (Express.js example)
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Webhook endpoint
app.post('/webhooks/agenthub', (req, res) => {
    // Verify webhook signature
    const signature = req.headers['x-agenthub-signature'];
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    if (signature !== \`sha256=\${expectedSignature}\`) {
        return res.status(401).send('Invalid signature');
    }
    
    // Process webhook event
    const { event_type, execution_id, agent_id, status, results } = req.body;
    
    switch (event_type) {
        case 'execution.completed':
            console.log(\`Agent \${agent_id} execution completed: \${execution_id}\`);
            
            // Process results based on agent type
            if (agent_id === 'qe-test-generator-v2') {
                handleTestGenerationResults(results);
            } else if (agent_id === 'security-scanner-v1') {
                handleSecurityScanResults(results);
            }
            break;
            
        case 'execution.failed':
            console.error(\`Agent \${agent_id} execution failed: \${execution_id}\`);
            // Handle failure (send alerts, retry, etc.)
            break;
    }
    
    res.status(200).send('OK');
});

function handleTestGenerationResults(results) {
    // Save generated test files
    results.test_files.forEach(file => {
        fs.writeFileSync(\`./tests/\${file.name}\`, file.content);
    });
    
    // Trigger test execution
    exec('npm run test', (error, stdout, stderr) => {
        if (error) {
            console.error('Test execution failed:', error);
        } else {
            console.log('Tests passed:', stdout);
        }
    });
}

function handleSecurityScanResults(results) {
    const criticalVulns = results.vulnerabilities.filter(v => v.severity === 'critical');
    
    if (criticalVulns.length > 0) {
        // Send alert to security team
        sendSlackAlert(\`🚨 Critical vulnerabilities found: \${criticalVulns.length}\`);
        
        // Create JIRA tickets for each vulnerability
        criticalVulns.forEach(vuln => {
            createJiraTicket({
                summary: \`Security Vulnerability: \${vuln.title}\`,
                description: vuln.description,
                priority: 'Critical'
            });
        });
    }
}

app.listen(3000, () => {
    console.log('Webhook server running on port 3000');
});

## 2. Configure webhook in AgentHub
curl -X POST "https://api.agenthub.company.com/v1/webhooks" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-domain.com/webhooks/agenthub",
    "events": ["execution.completed", "execution.failed"],
    "secret": "your-webhook-secret"
  }'`;

  const errorHandlingExample = `# Error Handling Best Practices

## Python SDK with Retry Logic
import asyncio
from agenthub import AgentHubClient, AgentHubError
from tenacity import retry, stop_after_attempt, wait_exponential

class AgentHubService:
    def __init__(self, api_key: str):
        self.client = AgentHubClient(api_key=api_key)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def execute_agent_with_retry(self, agent_id: str, inputs: dict):
        try:
            result = await self.client.execute_agent(agent_id, inputs)
            return result
            
        except AgentHubError.RateLimitError as e:
            print(f"Rate limited. Retry after: {e.retry_after}s")
            await asyncio.sleep(e.retry_after)
            raise
            
        except AgentHubError.ValidationError as e:
            print(f"Input validation failed: {e.details}")
            # Don't retry validation errors
            return None
            
        except AgentHubError.ExecutionTimeout as e:
            print(f"Agent execution timed out after {e.timeout}s")
            # Retry with longer timeout
            raise
            
        except AgentHubError.InsufficientCredits as e:
            print(f"Insufficient credits. Current balance: {e.balance}")
            # Don't retry, handle billing
            return None
            
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise

## JavaScript SDK with Circuit Breaker
const CircuitBreaker = require('opossum');

const options = {
    timeout: 30000, // 30 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 60000 // 1 minute
};

const breaker = new CircuitBreaker(executeAgent, options);

breaker.on('open', () => console.log('Circuit breaker opened'));
breaker.on('halfOpen', () => console.log('Circuit breaker half-open'));

async function executeAgent(agentId, inputs) {
    try {
        const result = await client.executeAgent(agentId, inputs);
        return result;
    } catch (error) {
        if (error.code === 'RATE_LIMIT') {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
            await new Promise(resolve => setTimeout(resolve, delay));
            throw error; // Retry
        }
        
        if (error.code === 'VALIDATION_ERROR') {
            // Log and don't retry
            console.error('Validation error:', error.details);
            throw new Error('Invalid input parameters');
        }
        
        throw error;
    }
}

// Usage
try {
    const result = await breaker.fire('qe-test-generator-v2', inputs);
    console.log('Success:', result);
} catch (error) {
    console.error('Circuit breaker failed:', error.message);
}`;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <Icon name="enterprise" size="large" className="me-3" />
            Integration Guide
          </h1>
          <p className="lead">
            Complete guide for integrating AgentHub into your development workflow
          </p>
        </Col>
      </Row>

      {/* Quick Start Section */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <Icon name="play" size="small" className="me-2" />
                Quick Start (5 minutes)
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <Alert variant="info">
                    <h6>Prerequisites</h6>
                    <ul className="mb-0">
                      <li>AgentHub account with API access</li>
                      <li>API key (get from dashboard)</li>
                      <li>Development environment setup</li>
                    </ul>
                  </Alert>
                </Col>
                <Col md={6}>
                  <Alert variant="success">
                    <h6>What you'll learn</h6>
                    <ul className="mb-0">
                      <li>Execute your first agent</li>
                      <li>Handle responses and errors</li>
                      <li>Integrate into existing workflows</li>
                    </ul>
                  </Alert>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label><strong>Choose your language:</strong></Form.Label>
                <div className="d-flex gap-2">
                  {(['python', 'javascript', 'java', 'curl'] as const).map(lang => (
                    <Button
                      key={lang}
                      variant={selectedLanguage === lang ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setSelectedLanguage(lang)}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </Button>
                  ))}
                </div>
              </Form.Group>

              <Card className="bg-dark text-light">
                <Card.Body>
                  <pre className="mb-0" style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                    <code>{quickStartCode[selectedLanguage]}</code>
                  </pre>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Integration Methods */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <Icon name="settings" size="small" className="me-2" />
                Integration Methods
              </h5>
            </Card.Header>
            <Card.Body>
              <Tabs
                activeKey={selectedFramework}
                onSelect={(k) => setSelectedFramework(k as any)}
                className="mb-3"
              >
                <Tab eventKey="rest" title="REST API">
                  <Alert variant="info">
                    <h6>Direct REST API Integration</h6>
                    <p className="mb-0">
                      Use HTTP requests to integrate with any language or framework. 
                      Perfect for custom implementations or when SDKs aren't available.
                    </p>
                  </Alert>
                  
                  <h6>Authentication</h6>
                  <Card className="bg-dark text-light mb-3">
                    <Card.Body>
                      <pre className="mb-0">
{`# Include API key in Authorization header
Authorization: Bearer your-api-key-here

# Base URL
https://api.agenthub.company.com/v1`}
                      </pre>
                    </Card.Body>
                  </Card>

                  <h6>Common Endpoints</h6>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Endpoint</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><Badge bg="success">GET</Badge></td>
                          <td>/agents</td>
                          <td>List available agents</td>
                        </tr>
                        <tr>
                          <td><Badge bg="info">POST</Badge></td>
                          <td>/agents/{'{agent_id}'}/execute</td>
                          <td>Execute an agent</td>
                        </tr>
                        <tr>
                          <td><Badge bg="success">GET</Badge></td>
                          <td>/executions/{'{execution_id}'}</td>
                          <td>Get execution status</td>
                        </tr>
                        <tr>
                          <td><Badge bg="success">GET</Badge></td>
                          <td>/executions/{'{execution_id}'}/results</td>
                          <td>Get execution results</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Tab>

                <Tab eventKey="sdk" title="SDKs">
                  <Alert variant="success">
                    <h6>Official SDKs</h6>
                    <p className="mb-0">
                      Use our official SDKs for the best developer experience with built-in 
                      error handling, retries, and type safety.
                    </p>
                  </Alert>

                  <Row>
                    <Col md={4}>
                      <Card className="mb-3">
                        <Card.Body>
                          <h6>
                            <Icon name="agent" size="small" className="me-2" />
                            Python SDK
                          </h6>
                          <p className="small text-muted">Full-featured async SDK</p>
                          <code>pip install agenthub-sdk</code>
                          <div className="mt-2">
                            <Badge bg="success">Async/Await</Badge>
                            <Badge bg="info" className="ms-1">Type Hints</Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="mb-3">
                        <Card.Body>
                          <h6>
                            <Icon name="agent" size="small" className="me-2" />
                            JavaScript SDK
                          </h6>
                          <p className="small text-muted">Node.js and browser support</p>
                          <code>npm install @agenthub/sdk</code>
                          <div className="mt-2">
                            <Badge bg="success">Promise-based</Badge>
                            <Badge bg="info" className="ms-1">TypeScript</Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="mb-3">
                        <Card.Body>
                          <h6>
                            <Icon name="agent" size="small" className="me-2" />
                            Java SDK
                          </h6>
                          <p className="small text-muted">Enterprise-ready with Spring Boot</p>
                          <code>com.agenthub:agenthub-sdk</code>
                          <div className="mt-2">
                            <Badge bg="success">CompletableFuture</Badge>
                            <Badge bg="info" className="ms-1">Spring Boot</Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="webhook" title="Webhooks">
                  <Alert variant="warning">
                    <h6>Event-Driven Integration</h6>
                    <p className="mb-0">
                      Receive real-time notifications when agent executions complete. 
                      Perfect for long-running agents and asynchronous workflows.
                    </p>
                  </Alert>

                  <Card className="bg-dark text-light">
                    <Card.Body>
                      <pre className="mb-0" style={{ fontSize: '0.85em' }}>
                        <code>{webhookExample}</code>
                      </pre>
                    </Card.Body>
                  </Card>
                </Tab>

                <Tab eventKey="cicd" title="CI/CD">
                  <Alert variant="primary">
                    <h6>Continuous Integration</h6>
                    <p className="mb-0">
                      Integrate AgentHub into your CI/CD pipelines for automated testing, 
                      security scanning, and infrastructure analysis.
                    </p>
                  </Alert>

                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>GitHub Actions</Accordion.Header>
                      <Accordion.Body>
                        <Card className="bg-dark text-light">
                          <Card.Body>
                            <pre className="mb-0" style={{ fontSize: '0.8em' }}>
                              <code>{cicdExamples.github}</code>
                            </pre>
                          </Card.Body>
                        </Card>
                      </Accordion.Body>
                    </Accordion.Item>
                    
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>Jenkins Pipeline</Accordion.Header>
                      <Accordion.Body>
                        <Card className="bg-dark text-light">
                          <Card.Body>
                            <pre className="mb-0" style={{ fontSize: '0.8em' }}>
                              <code>{cicdExamples.jenkins}</code>
                            </pre>
                          </Card.Body>
                        </Card>
                      </Accordion.Body>
                    </Accordion.Item>
                    
                    <Accordion.Item eventKey="2">
                      <Accordion.Header>GitLab CI</Accordion.Header>
                      <Accordion.Body>
                        <Card className="bg-dark text-light">
                          <Card.Body>
                            <pre className="mb-0" style={{ fontSize: '0.8em' }}>
                              <code>{cicdExamples.gitlab}</code>
                            </pre>
                          </Card.Body>
                        </Card>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Handling */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <Icon name="shield" size="small" className="me-2" />
                Error Handling & Best Practices
              </h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <h6>Production-Ready Error Handling</h6>
                <p className="mb-0">
                  Implement robust error handling with retries, circuit breakers, and proper logging 
                  for production deployments.
                </p>
              </Alert>

              <Card className="bg-dark text-light">
                <Card.Body>
                  <pre className="mb-0" style={{ fontSize: '0.8em' }}>
                    <code>{errorHandlingExample}</code>
                  </pre>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rate Limits & Pricing */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <Icon name="time" size="small" className="me-2" />
                Rate Limits
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Requests/min</th>
                      <th>Concurrent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Starter</td>
                      <td>60</td>
                      <td>5</td>
                    </tr>
                    <tr>
                      <td>Professional</td>
                      <td>300</td>
                      <td>20</td>
                    </tr>
                    <tr>
                      <td>Enterprise</td>
                      <td>1000</td>
                      <td>100</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Alert variant="light" className="small mb-0">
                <strong>Tip:</strong> Implement exponential backoff when you receive 429 responses.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <Icon name="chart" size="small" className="me-2" />
                Performance Metrics
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Agent Type</th>
                      <th>Avg Execution Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>QE Test Generator</td>
                      <td>30s - 2min</td>
                    </tr>
                    <tr>
                      <td>DevOps Monitor</td>
                      <td>1min - 5min</td>
                    </tr>
                    <tr>
                      <td>Security Scanner</td>
                      <td>45s - 3min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Alert variant="light" className="small mb-0">
                <strong>Note:</strong> Execution time varies by complexity and data size.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Support & Resources */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">
                <Icon name="users" size="small" className="me-2" />
                Support & Resources
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <h6>
                    <Icon name="view" size="small" className="me-2" />
                    Documentation
                  </h6>
                  <ul className="list-unstyled small">
                    <li><a href="https://docs.aws.amazon.com/lambda/latest/api/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Lambda API Reference</a></li>
                    <li><a href="https://boto3.amazonaws.com/v1/documentation/api/latest/index.html" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS SDK Documentation</a></li>
                    <li><a href="/agents" className="text-decoration-none">Agent Catalog</a></li>
                    <li><a href="https://aws.amazon.com/lambda/getting-started/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Lambda Tutorials</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6>
                    <Icon name="users" size="small" className="me-2" />
                    Community
                  </h6>
                  <ul className="list-unstyled small">
                    <li><a href="https://discord.gg/aws-developers" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Developers Discord</a></li>
                    <li><a href="https://github.com/aws/aws-lambda-developers/discussions" target="_blank" rel="noopener noreferrer" className="text-decoration-none">GitHub Discussions</a></li>
                    <li><a href="https://stackoverflow.com/questions/tagged/aws-lambda" target="_blank" rel="noopener noreferrer" className="text-decoration-none">Stack Overflow</a></li>
                    <li><a href="https://www.reddit.com/r/aws/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">r/aws Community</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6>
                    <Icon name="award" size="small" className="me-2" />
                    Examples
                  </h6>
                  <ul className="list-unstyled small">
                    <li><a href="https://github.com/aws-samples/aws-lambda-developer-guide" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Lambda Samples</a></li>
                    <li><a href="https://aws.amazon.com/lambda/resources/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">Integration Templates</a></li>
                    <li><a href="https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Lambda Best Practices</a></li>
                    <li><a href="/use-cases" className="text-decoration-none">Use Case Studies</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6>
                    <Icon name="settings" size="small" className="me-2" />
                    Enterprise
                  </h6>
                  <ul className="list-unstyled small">
                    <li><a href="https://aws.amazon.com/contact-us/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">Contact AWS Sales</a></li>
                    <li><a href="https://aws.amazon.com/professional-services/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Professional Services</a></li>
                    <li><a href="https://aws.amazon.com/support/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Support Plans</a></li>
                    <li><a href="https://aws.amazon.com/compliance/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Compliance</a></li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default IntegrationGuide;