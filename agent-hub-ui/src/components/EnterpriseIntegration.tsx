import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal, Tabs, Tab, Accordion, Spinner } from 'react-bootstrap';
import { Icon } from './Icon';
import { s3AgentService } from '../services/s3AgentService';

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
}

const EnterpriseIntegration: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'curl'>('python');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);

  // Load agents dynamically from S3
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoadingAgents(true);
        setAgentError(null);
        console.log('🔍 Loading agents for Enterprise Integration...');
        
        const s3Agents = await s3AgentService.getAllAgents();
        console.log('✅ Loaded agents:', s3Agents.length);
        
        // Transform S3 agents to match our interface
        const transformedAgents: Agent[] = s3Agents.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          category: agent.category || 'General',
          description: agent.description || 'No description available',
          inputSchema: agent.inputSchema || {},
          outputSchema: agent.outputSchema || {}
        }));
        
        setAgents(transformedAgents);
        
        // Auto-select first agent if available
        if (transformedAgents.length > 0 && !selectedAgent) {
          setSelectedAgent(transformedAgents[0]);
        }
      } catch (error) {
        console.error('❌ Failed to load agents:', error);
        setAgentError('Failed to load agents. Please try again later.');
        
        // Fallback to sample agents
        const fallbackAgents: Agent[] = [
          {
            id: 'qe-test-generator-v2',
            name: 'QE Test Generator',
            category: 'QE & Testing',
            description: 'Generate comprehensive test suites from requirements',
            inputSchema: {
              requirements: 'string',
              framework: 'cypress|selenium|playwright',
              language: 'typescript|javascript|python'
            },
            outputSchema: {
              test_files: 'array',
              coverage_report: 'object',
              execution_time: 'number'
            }
          },
          {
            id: 'devops-monitor-v1',
            name: 'DevOps Infrastructure Monitor',
            category: 'DevOps',
            description: 'Analyze and optimize cloud infrastructure costs',
            inputSchema: {
              cloud_provider: 'aws|azure|gcp',
              account_id: 'string',
              analysis_type: 'cost|performance|security'
            },
            outputSchema: {
              monthly_savings: 'number',
              recommendations: 'array',
              risk_assessment: 'object'
            }
          },
          {
            id: 'security-scanner-v1',
            name: 'Security Scanner',
            category: 'Security',
            description: 'Comprehensive security vulnerability assessment',
            inputSchema: {
              target_type: 'kubernetes|docker|code',
              scan_depth: 'basic|comprehensive',
              compliance_framework: 'SOC2|HIPAA|PCI'
            },
            outputSchema: {
              vulnerabilities: 'array',
              compliance_status: 'object',
              remediation_steps: 'array'
            }
          }
        ];
        setAgents(fallbackAgents);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAgents();
  }, []);

  const generateApiKey = () => {
    const key = 'af_' + Math.random().toString(36).substr(2, 32);
    setApiKey(key);
    setShowApiKeyModal(true);
  };

  const getCodeExample = (agent: Agent, language: string) => {
    const baseUrl = 'https://agent-factory.company.com/api/v1';
    
    switch (language) {
      case 'python':
        return `# Python SDK Integration
from agent_factory import AgentFactoryClient
import asyncio

# Initialize client
client = AgentFactoryClient(
    base_url="${baseUrl}",
    api_key="${apiKey || 'your-api-key'}"
)

async def execute_${agent.id.replace(/-/g, '_')}():
    """Execute ${agent.name} agent"""
    
    # Define input parameters
    inputs = ${JSON.stringify({
      ...Object.keys(agent.inputSchema).reduce((acc, key) => {
        acc[key] = `"example_${key}"`;
        return acc;
      }, {} as any)
    }, null, 8).replace(/"/g, '')}
    
    try:
        # Execute agent
        result = await client.execute_agent(
            agent_id="${agent.id}",
            inputs=inputs,
            timeout=300  # 5 minutes
        )
        
        print(f"Execution completed in {result.duration}s")
        print(f"Results: {result.data}")
        
        return result.data
        
    except Exception as e:
        print(f"Execution failed: {e}")
        return None

# Run the agent
if __name__ == "__main__":
    result = asyncio.run(execute_${agent.id.replace(/-/g, '_')}())`;

      case 'javascript':
        return `// JavaScript/Node.js SDK Integration
const { AgentFactoryClient } = require('@company/agent-factory-sdk');

// Initialize client
const client = new AgentFactoryClient({
    baseURL: '${baseUrl}',
    apiKey: '${apiKey || 'your-api-key'}'
});

async function execute${agent.name.replace(/\s+/g, '')}() {
    // Define input parameters
    const inputs = ${JSON.stringify({
      ...Object.keys(agent.inputSchema).reduce((acc, key) => {
        acc[key] = `example_${key}`;
        return acc;
      }, {} as any)
    }, null, 4)};
    
    try {
        // Execute agent
        const result = await client.executeAgent('${agent.id}', inputs);
        
        console.log(\`Execution completed in \${result.duration}s\`);
        console.log('Results:', result.data);
        
        return result.data;
        
    } catch (error) {
        console.error('Execution failed:', error.message);
        return null;
    }
}

// Run the agent
execute${agent.name.replace(/\s+/g, '')}()
    .then(result => {
        if (result) {
            console.log('Agent execution successful');
        }
    });`;

      case 'java':
        return `// Java SDK Integration
import com.company.agentfactory.AgentFactoryClient;
import com.company.agentfactory.models.*;
import java.util.concurrent.CompletableFuture;

public class ${agent.name.replace(/\s+/g, '')}Integration {
    private AgentFactoryClient client;
    
    public ${agent.name.replace(/\s+/g, '')}Integration() {
        this.client = new AgentFactoryClient.Builder()
            .baseUrl("${baseUrl}")
            .apiKey("${apiKey || 'your-api-key'}")
            .build();
    }
    
    public CompletableFuture<ExecutionResult> execute${agent.name.replace(/\s+/g, '')}() {
        // Define input parameters
        ExecutionRequest request = ExecutionRequest.builder()
            .agentId("${agent.id}")
${Object.keys(agent.inputSchema).map(key => 
            `            .input("${key}", "example_${key}")`
          ).join('\n')}
            .timeout(Duration.ofMinutes(5))
            .build();
            
        return client.executeAgent(request)
            .thenApply(result -> {
                System.out.println("Execution completed in " + result.getDuration() + "s");
                System.out.println("Results: " + result.getData());
                return result;
            })
            .exceptionally(throwable -> {
                System.err.println("Execution failed: " + throwable.getMessage());
                return null;
            });
    }
}`;

      case 'curl':
        return `# cURL REST API Integration

# Step 1: Execute Agent
curl -X POST "${baseUrl}/agents/${agent.id}/execute" \\
  -H "Authorization: Bearer ${apiKey || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
${Object.keys(agent.inputSchema).map(key => 
    `    "${key}": "example_${key}"`
  ).join(',\n')}
  }'

# Response: {"execution_id": "exec_123456", "status": "running"}

# Step 2: Check Status
curl -X GET "${baseUrl}/executions/exec_123456" \\
  -H "Authorization: Bearer ${apiKey || 'your-api-key'}"

# Step 3: Get Results (when status = "completed")
curl -X GET "${baseUrl}/executions/exec_123456/results" \\
  -H "Authorization: Bearer ${apiKey || 'your-api-key'}"`;

      default:
        return '';
    }
  };

  const getCiCdExample = (agent: Agent) => {
    return `# GitHub Actions Integration
name: Execute ${agent.name}
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  execute-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Execute ${agent.name}
        uses: company/agent-factory-action@v1
        with:
          agent-id: '${agent.id}'
          api-key: \${{ secrets.AGENT_FACTORY_API_KEY }}
          input: |
            {
${Object.keys(agent.inputSchema).map(key => 
              `              "${key}": "example_${key}"`
            ).join(',\n')}
            }
          
      - name: Process Results
        run: |
          echo "Agent execution completed"
          # Process results from previous step
          
---

# Jenkins Pipeline Integration
pipeline {
    agent any
    
    environment {
        AGENT_FACTORY_API_KEY = credentials('agent-factory-api-key')
    }
    
    stages {
        stage('Execute ${agent.name}') {
            steps {
                script {
                    def result = sh(
                        script: """
                            curl -X POST "https://agent-factory.company.com/api/v1/agents/${agent.id}/execute" \\
                              -H "Authorization: Bearer \${AGENT_FACTORY_API_KEY}" \\
                              -H "Content-Type: application/json" \\
                              -d '{
${Object.keys(agent.inputSchema).map(key => 
                                `                                "${key}": "example_${key}"`
                              ).join(',\n')}
                              }'
                        """,
                        returnStdout: true
                    ).trim()
                    
                    echo "Agent execution result: \${result}"
                }
            }
        }
    }
}`;
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="text-center mb-4">
            <h1 className="display-5 fw-bold text-primary d-flex align-items-center justify-content-center">
              <Icon name="enterprise" size="large" className="me-3" />
              Enterprise Integration
            </h1>
            <p className="lead">Integrate Agent Factory into your existing workflows and applications</p>
          </div>
          
          <Alert variant="info">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="fas fa-info-circle fa-2x"></i>
              </div>
              <div>
                <h6 className="mb-1">API-First Integration</h6>
                <p className="mb-0">
                  Use any agent from our catalog directly in your applications, CI/CD pipelines, or custom tools. 
                  No need to use our UI - integrate programmatically with REST APIs, SDKs, or CLI tools.
                </p>
              </div>
            </div>
          </Alert>
        </Col>
      </Row>

      {/* API Key Generation */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Icon name="security" size="small" className="me-2" />
                Step 1: Get Your API Key
              </h5>
            </Card.Header>
            <Card.Body>
              <p>Generate an API key to authenticate your applications with the Agent Factory platform.</p>
              <Button variant="success" onClick={generateApiKey}>
                Generate API Key
              </Button>
              {apiKey && (
                <Alert variant="success" className="mt-3">
                  <strong>Your API Key:</strong> <code>{apiKey}</code>
                  <br />
                  <small>Store this securely - it won't be shown again!</small>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Agent Selection */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Icon name="agent" size="small" className="me-2" />
                Step 2: Choose an Agent
              </h5>
            </Card.Header>
            <Card.Body>
              {agentError && (
                <Alert variant="warning" className="mb-3">
                  <strong>Note:</strong> {agentError} Showing sample agents for demonstration.
                </Alert>
              )}
              
              <p>Select any agent from our catalog to see integration examples:</p>
              
              {loadingAgents ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading available agents...</p>
                </div>
              ) : agents.length === 0 ? (
                <Alert variant="info">
                  No agents available. Please create agents in the Agent Catalog first.
                </Alert>
              ) : (
                <>
                  <div className="mb-3">
                    <Badge bg="info" className="me-2">
                      {agents.length} agents available
                    </Badge>
                    <Badge bg="success">
                      Dynamically loaded from system
                    </Badge>
                  </div>
                  <Row>
                    {agents.map((agent) => (
                      <Col md={4} key={agent.id} className="mb-3">
                        <Card 
                          className={`h-100 ${selectedAgent?.id === agent.id ? 'border-primary border-3' : ''}`}
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title">{agent.name}</h6>
                              <Badge bg="secondary">{agent.category}</Badge>
                            </div>
                            <p className="card-text small text-muted">{agent.description}</p>
                            {selectedAgent?.id === agent.id && (
                              <Badge bg="primary">
                                <i className="fas fa-check me-1"></i>
                                Selected
                              </Badge>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Integration Examples */}
      {selectedAgent && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <Icon name="settings" size="small" className="me-2" />
                  Step 3: Integration Examples for {selectedAgent.name}
                </h5>
              </Card.Header>
              <Card.Body>
                <Tabs defaultActiveKey="sdk" className="mb-3">
                  <Tab eventKey="sdk" title="SDK Integration">
                    <div className="mb-3">
                      <Form.Select 
                        value={selectedLanguage} 
                        onChange={(e) => setSelectedLanguage(e.target.value as any)}
                        style={{ width: '200px' }}
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript/Node.js</option>
                        <option value="java">Java</option>
                        <option value="curl">cURL (REST API)</option>
                      </Form.Select>
                    </div>
                    
                    <pre className="bg-dark text-light p-3 rounded">
                      <code>{getCodeExample(selectedAgent, selectedLanguage)}</code>
                    </pre>
                    
                    <div className="mt-3">
                      <h6 className="d-flex align-items-center">
                        <Icon name="download" size="small" className="me-2" />
                        Installation:
                      </h6>
                      {selectedLanguage === 'python' && (
                        <pre className="bg-light p-2 rounded"><code>pip install agent-factory-sdk</code></pre>
                      )}
                      {selectedLanguage === 'javascript' && (
                        <pre className="bg-light p-2 rounded"><code>npm install @company/agent-factory-sdk</code></pre>
                      )}
                      {selectedLanguage === 'java' && (
                        <pre className="bg-light p-2 rounded"><code>{'<dependency>\n  <groupId>com.company</groupId>\n  <artifactId>agent-factory-sdk</artifactId>\n  <version>1.0.0</version>\n</dependency>'}</code></pre>
                      )}
                    </div>
                  </Tab>
                  
                  <Tab eventKey="cicd" title="CI/CD Integration">
                    <p>Integrate agents directly into your CI/CD pipelines:</p>
                    <pre className="bg-dark text-light p-3 rounded">
                      <code>{getCiCdExample(selectedAgent)}</code>
                    </pre>
                  </Tab>
                  
                  <Tab eventKey="webhook" title="Webhook Integration">
                    <p>Set up webhooks to receive real-time notifications:</p>
                    <pre className="bg-dark text-light p-3 rounded">
                      <code>{`# Webhook Configuration
POST /api/v1/webhooks
{
  "url": "https://your-app.com/webhook/agent-factory",
  "events": ["execution.completed", "execution.failed"],
  "agent_ids": ["${selectedAgent.id}"]
}

# Webhook Handler Example (Express.js)
app.post('/webhook/agent-factory', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'execution.completed':
      console.log('Agent execution completed:', data.executionId);
      // Process results
      processAgentResults(data.results);
      break;
      
    case 'execution.failed':
      console.log('Agent execution failed:', data.error);
      // Handle failure
      handleExecutionFailure(data.executionId, data.error);
      break;
  }
  
  res.status(200).json({ received: true });
});`}</code>
                    </pre>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Use Cases */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0 d-flex align-items-center">
                <Icon name="target" size="small" className="me-2" />
                Common Integration Patterns & Use Cases
              </h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-4">
                <strong>Real-World Examples:</strong> These patterns are used by enterprise teams to automate workflows, 
                improve quality, reduce costs, and accelerate delivery. Each pattern includes implementation details and code examples.
              </Alert>
              
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <Icon name="agent" size="small" className="me-2" />
                    <strong>QA Team: Automated Test Generation in CI/CD</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <h6 className="text-primary">📋 Scenario</h6>
                      <p>Automatically generate comprehensive test suites when requirements change, ensuring 100% test coverage without manual effort.</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">🔄 Workflow</h6>
                      <ol>
                        <li><strong>Trigger:</strong> Developer creates PR with requirement changes in JIRA/Confluence</li>
                        <li><strong>Detection:</strong> GitHub Action detects requirement file changes</li>
                        <li><strong>Generation:</strong> QE Test Generator agent creates test suites (Cypress, Selenium, Playwright)</li>
                        <li><strong>Validation:</strong> Generated tests are reviewed and validated</li>
                        <li><strong>Commit:</strong> Tests are automatically committed to the repository</li>
                        <li><strong>Execution:</strong> Tests run in CI/CD pipeline with coverage reports</li>
                      </ol>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">💻 Implementation Example</h6>
                      <pre className="bg-dark text-light p-3 rounded small">
{`# GitHub Actions Workflow
name: Auto-Generate Tests
on:
  pull_request:
    paths:
      - 'requirements/**'
      - 'specs/**'

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Generate Test Suite
        run: |
          curl -X POST "https://api.agenthub.com/v1/agents/qe-test-generator-v2/execute" \\
            -H "Authorization: Bearer ${'${{ secrets.AGENTHUB_API_KEY }}'}" \\
            -H "Content-Type: application/json" \\
            -d '{
              "requirements": "${'${{ github.event.pull_request.body }}'}",
              "framework": "cypress",
              "language": "typescript",
              "coverage_target": 95
            }' > test-results.json
      
      - name: Commit Generated Tests
        run: |
          git config user.name "AgentHub Bot"
          git add cypress/e2e/generated/
          git commit -m "Auto-generated tests for PR #${'${{ github.event.number }}'}"
          git push`}
                      </pre>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">📊 Benefits</h6>
                      <Row>
                        <Col md={6}>
                          <ul>
                            <li><strong>80% time savings</strong> on test creation</li>
                            <li><strong>95%+ test coverage</strong> automatically</li>
                            <li><strong>Zero manual effort</strong> for routine tests</li>
                          </ul>
                        </Col>
                        <Col md={6}>
                          <ul>
                            <li><strong>Consistent quality</strong> across all tests</li>
                            <li><strong>Faster releases</strong> with automated QA</li>
                            <li><strong>Reduced bugs</strong> in production</li>
                          </ul>
                        </Col>
                      </Row>
                    </div>
                    
                    <div>
                      <Badge bg="info" className="me-2">Cypress</Badge>
                      <Badge bg="info" className="me-2">Selenium</Badge>
                      <Badge bg="info" className="me-2">Playwright</Badge>
                      <Badge bg="success" className="me-2">GitHub Actions</Badge>
                      <Badge bg="success">Jenkins</Badge>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="1">
                  <Accordion.Header>
                    <Icon name="settings" size="small" className="me-2" />
                    <strong>DevOps Team: Continuous Infrastructure Optimization</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <h6 className="text-primary">📋 Scenario</h6>
                      <p>Continuously monitor and optimize cloud infrastructure costs, identifying savings opportunities and preventing cost overruns.</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">🔄 Workflow</h6>
                      <ol>
                        <li><strong>Schedule:</strong> Daily/weekly automated infrastructure analysis</li>
                        <li><strong>Analysis:</strong> DevOps Monitor agent scans AWS/Azure/GCP resources</li>
                        <li><strong>Identification:</strong> Finds unused resources, oversized instances, inefficient configurations</li>
                        <li><strong>Recommendations:</strong> Generates actionable optimization suggestions</li>
                        <li><strong>Reporting:</strong> Sends detailed reports to Slack/Email with cost projections</li>
                        <li><strong>Automation:</strong> Optionally auto-applies safe optimizations</li>
                      </ol>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">💻 Implementation Example</h6>
                      <pre className="bg-dark text-light p-3 rounded small">
{`# Kubernetes CronJob for Daily Cost Analysis
apiVersion: batch/v1
kind: CronJob
metadata:
  name: infrastructure-optimizer
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: optimizer
            image: agenthub/devops-optimizer:latest
            env:
            - name: AGENTHUB_API_KEY
              valueFrom:
                secretKeyRef:
                  name: agenthub-secrets
                  key: api-key
            - name: CLOUD_PROVIDER
              value: "aws"
            - name: SLACK_WEBHOOK
              valueFrom:
                secretKeyRef:
                  name: slack-secrets
                  key: webhook-url
            command:
            - /bin/sh
            - -c
            - |
              # Run infrastructure analysis
              RESULT=$(curl -X POST "https://api.agenthub.com/v1/agents/devops-monitor-v1/execute" \\
                -H "Authorization: Bearer $AGENTHUB_API_KEY" \\
                -H "Content-Type: application/json" \\
                -d '{
                  "cloud_provider": "aws",
                  "account_id": "'$AWS_ACCOUNT_ID'",
                  "analysis_type": "cost",
                  "auto_optimize": false
                }')
              
              # Extract savings and send to Slack
              SAVINGS=$(echo $RESULT | jq -r '.monthly_savings')
              curl -X POST $SLACK_WEBHOOK \\
                -H "Content-Type: application/json" \\
                -d "{
                  \\"text\\": \\"💰 Daily Cost Analysis: Potential savings of $$SAVINGS/month identified\\",
                  \\"attachments\\": [{
                    \\"text\\": \\"$(echo $RESULT | jq -r '.recommendations | join(\\"\\\\n\\")')\\",
                    \\"color\\": \\"good\\"
                  }]
                }"
          restartPolicy: OnFailure`}
                      </pre>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">📊 Real Results</h6>
                      <Row>
                        <Col md={6}>
                          <Card className="border-success mb-2">
                            <Card.Body className="py-2">
                              <strong className="text-success">$50K+</strong> monthly savings identified
                            </Card.Body>
                          </Card>
                          <Card className="border-info mb-2">
                            <Card.Body className="py-2">
                              <strong className="text-info">30%</strong> reduction in cloud costs
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="border-warning mb-2">
                            <Card.Body className="py-2">
                              <strong className="text-warning">100+</strong> unused resources found
                            </Card.Body>
                          </Card>
                          <Card className="border-primary mb-2">
                            <Card.Body className="py-2">
                              <strong className="text-primary">24/7</strong> continuous monitoring
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                    
                    <div>
                      <Badge bg="info" className="me-2">AWS</Badge>
                      <Badge bg="info" className="me-2">Azure</Badge>
                      <Badge bg="info" className="me-2">GCP</Badge>
                      <Badge bg="success" className="me-2">Kubernetes</Badge>
                      <Badge bg="success" className="me-2">Terraform</Badge>
                      <Badge bg="warning">Slack Integration</Badge>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="2">
                  <Accordion.Header>
                    <Icon name="security" size="small" className="me-2" />
                    <strong>Security Team: Automated Compliance & Vulnerability Scanning</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <h6 className="text-primary">📋 Scenario</h6>
                      <p>Continuously scan deployments for security vulnerabilities and compliance violations, blocking risky deployments automatically.</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">🔄 Workflow</h6>
                      <ol>
                        <li><strong>Pre-Deployment:</strong> Security scan triggered before production deployment</li>
                        <li><strong>Scanning:</strong> Security Scanner agent analyzes containers, code, and configurations</li>
                        <li><strong>Compliance Check:</strong> Validates against SOC2, HIPAA, PCI-DSS standards</li>
                        <li><strong>Vulnerability Assessment:</strong> Identifies CVEs and security risks</li>
                        <li><strong>Decision:</strong> Automatically approves or blocks deployment based on severity</li>
                        <li><strong>Reporting:</strong> Generates detailed security reports for audit trails</li>
                      </ol>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">💻 Implementation Example</h6>
                      <pre className="bg-dark text-light p-3 rounded small">
{`# GitLab CI/CD Pipeline with Security Gate
stages:
  - build
  - security-scan
  - deploy

security-scan:
  stage: security-scan
  script:
    - echo "Running security compliance scan..."
    - |
      SCAN_RESULT=$(curl -X POST "https://api.agenthub.com/v1/agents/security-scanner-v1/execute" \\
        -H "Authorization: Bearer $AGENTHUB_API_KEY" \\
        -H "Content-Type: application/json" \\
        -d '{
          "target_type": "kubernetes",
          "scan_depth": "comprehensive",
          "compliance_framework": "SOC2",
          "container_image": "'$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA'",
          "kubernetes_manifests": "./k8s/",
          "fail_on_high": true,
          "fail_on_critical": true
        }')
    
    - echo "$SCAN_RESULT" | jq '.'
    
    # Check for critical vulnerabilities
    - |
      CRITICAL_COUNT=$(echo "$SCAN_RESULT" | jq -r '.vulnerabilities | map(select(.severity == "CRITICAL")) | length')
      HIGH_COUNT=$(echo "$SCAN_RESULT" | jq -r '.vulnerabilities | map(select(.severity == "HIGH")) | length')
      
      if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo "❌ DEPLOYMENT BLOCKED: $CRITICAL_COUNT critical vulnerabilities found"
        exit 1
      fi
      
      if [ "$HIGH_COUNT" -gt 5 ]; then
        echo "⚠️  WARNING: $HIGH_COUNT high-severity vulnerabilities found"
        echo "Manual approval required for deployment"
        exit 1
      fi
      
      echo "✅ Security scan passed - deployment approved"
    
    # Generate compliance report
    - echo "$SCAN_RESULT" | jq -r '.compliance_status' > compliance-report.json
  
  artifacts:
    reports:
      security: compliance-report.json
    paths:
      - compliance-report.json
    expire_in: 90 days

deploy-production:
  stage: deploy
  dependencies:
    - security-scan
  script:
    - kubectl apply -f k8s/
  only:
    - main
  when: on_success`}
                      </pre>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">🛡️ Security Metrics</h6>
                      <Row>
                        <Col md={4}>
                          <Card className="border-danger mb-2">
                            <Card.Body className="text-center py-2">
                              <h4 className="text-danger mb-0">0</h4>
                              <small>Critical vulnerabilities in production</small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={4}>
                          <Card className="border-success mb-2">
                            <Card.Body className="text-center py-2">
                              <h4 className="text-success mb-0">100%</h4>
                              <small>SOC2 compliance rate</small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={4}>
                          <Card className="border-info mb-2">
                            <Card.Body className="text-center py-2">
                              <h4 className="text-info mb-0">15</h4>
                              <small>Blocked risky deployments</small>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                    
                    <div>
                      <Badge bg="danger" className="me-2">SOC2</Badge>
                      <Badge bg="danger" className="me-2">HIPAA</Badge>
                      <Badge bg="danger" className="me-2">PCI-DSS</Badge>
                      <Badge bg="info" className="me-2">Kubernetes</Badge>
                      <Badge bg="info" className="me-2">Docker</Badge>
                      <Badge bg="success">GitLab CI/CD</Badge>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="3">
                  <Accordion.Header>
                    <Icon name="analytics" size="small" className="me-2" />
                    <strong>Business Team: Automated BI Reports & Forecasting</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <h6 className="text-primary">📋 Scenario</h6>
                      <p>Automatically generate business intelligence reports, sales forecasts, and executive dashboards without manual data analysis.</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">🔄 Workflow</h6>
                      <ol>
                        <li><strong>Schedule:</strong> Daily/weekly/monthly automated report generation</li>
                        <li><strong>Data Collection:</strong> Agent pulls data from databases, APIs, spreadsheets</li>
                        <li><strong>Analysis:</strong> Performs trend analysis, forecasting, anomaly detection</li>
                        <li><strong>Visualization:</strong> Creates charts, graphs, and interactive dashboards</li>
                        <li><strong>Distribution:</strong> Sends reports via email, Slack, or uploads to SharePoint</li>
                        <li><strong>Insights:</strong> Highlights key findings and actionable recommendations</li>
                      </ol>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">💻 Implementation Example</h6>
                      <pre className="bg-dark text-light p-3 rounded small">
{`# Python Script for Automated Weekly Business Reports
import requests
import pandas as pd
from datetime import datetime, timedelta

def generate_weekly_report():
    # Configuration
    api_key = os.getenv('AGENTHUB_API_KEY')
    base_url = 'https://api.agenthub.com/v1'
    
    # Get last week's date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    # Execute Business Intelligence Agent
    response = requests.post(
        f'{base_url}/agents/business-analyzer/execute',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={
            'data_sources': {
                'salesforce': {
                    'query': 'SELECT * FROM Opportunities WHERE CloseDate >= LAST_WEEK'
                },
                'database': {
                    'connection': 'postgresql://...',
                    'query': 'SELECT * FROM sales WHERE date >= $1',
                    'params': [start_date.isoformat()]
                },
                'google_sheets': {
                    'spreadsheet_id': '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
                    'range': 'Sales!A1:Z1000'
                }
            },
            'analysis_type': 'comprehensive',
            'include_forecast': True,
            'forecast_periods': 4,  # 4 weeks ahead
            'generate_visualizations': True,
            'output_format': 'pdf'
        }
    )
    
    result = response.json()
    
    # Extract insights
    insights = result['results']['insights']
    forecast = result['results']['forecast']
    report_url = result['results']['report_url']
    
    # Send to Slack
    send_to_slack({
        'channel': '#executive-reports',
        'text': f'📊 Weekly Business Report - Week of {'{'} start_date.strftime("%Y-%m-%d"){'}'}',
        'attachments': [{'{'} 
            'color': 'good',
            'fields': [
                {'{'}'title': 'Revenue', 'value': f"${'{'} insights['revenue']:,.2f{'}'}", 'short': True{'}'},
                {'{'}'title': 'Growth', 'value': f"{'{'} insights['growth_rate']:.1f{'}'} %", 'short': True{'}'},
                {'{'}'title': 'Forecast (4 weeks)', 'value': f"${'{'} forecast['total']:,.2f{'}'}", 'short': True{'}'},
                {'{'}'title': 'Confidence', 'value': f"{'{'} forecast['confidence']:.0%{'}'}", 'short': True{'}'}
            ],
            'actions': [{'{'} 
                'type': 'button',
                'text': 'View Full Report',
                'url': report_url
            {'}'}]
        {'}'}]
    {'}'})
    
    # Email to executives
    send_email(
        to=['ceo@company.com', 'cfo@company.com'],
        subject=f'Weekly Business Report - {'{'} start_date.strftime("%b %d, %Y"){'}'}',
        body=f'''
        <h2>Weekly Business Intelligence Report</h2>
        <p>Key Highlights:</p>
        <ul>
            <li>Revenue: ${'{'} insights['revenue']:,.2f{'}'} ({'{'} insights['growth_rate']:+.1f{'}'} % vs last week)</li>
            <li>New Customers: {'{'} insights['new_customers']{'}'} ({'{'} insights['customer_growth']:+.1f{'}'} %)</li>
            <li>Churn Rate: {'{'} insights['churn_rate']:.1f{'}'} %</li>
        </ul>
        <p><a href="{'{'} report_url{'}'}">View Full Report with Visualizations</a></p>
        ''',
        attachments=[report_url]
    )

# Schedule with cron: 0 9 * * 1 (Every Monday at 9 AM)
if __name__ == '__main__':
    generate_weekly_report()`}
                      </pre>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">📈 Business Impact</h6>
                      <Row>
                        <Col md={6}>
                          <ul>
                            <li><strong>20 hours/week</strong> saved on manual reporting</li>
                            <li><strong>Real-time insights</strong> for faster decisions</li>
                            <li><strong>95% accuracy</strong> in sales forecasting</li>
                          </ul>
                        </Col>
                        <Col md={6}>
                          <ul>
                            <li><strong>Automated alerts</strong> for anomalies</li>
                            <li><strong>Executive dashboards</strong> always up-to-date</li>
                            <li><strong>Data-driven decisions</strong> across organization</li>
                          </ul>
                        </Col>
                      </Row>
                    </div>
                    
                    <div>
                      <Badge bg="info" className="me-2">Salesforce</Badge>
                      <Badge bg="info" className="me-2">SQL Databases</Badge>
                      <Badge bg="info" className="me-2">Google Sheets</Badge>
                      <Badge bg="success" className="me-2">PowerBI</Badge>
                      <Badge bg="success" className="me-2">Tableau</Badge>
                      <Badge bg="warning">Email/Slack</Badge>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="4">
                  <Accordion.Header>
                    <Icon name="settings" size="small" className="me-2" />
                    <strong>Platform Team: Multi-Cloud Resource Management</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <h6 className="text-primary">📋 Scenario</h6>
                      <p>Manage resources across AWS, Azure, and GCP from a single interface, ensuring consistency and compliance.</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">🔄 Use Cases</h6>
                      <ul>
                        <li><strong>Resource Provisioning:</strong> Deploy infrastructure across multiple clouds with consistent configurations</li>
                        <li><strong>Cost Allocation:</strong> Track and allocate costs by team, project, or environment</li>
                        <li><strong>Compliance Enforcement:</strong> Ensure all resources meet security and compliance standards</li>
                        <li><strong>Disaster Recovery:</strong> Automated failover and backup across cloud providers</li>
                      </ul>
                    </div>
                    
                    <div>
                      <Badge bg="primary" className="me-2">Multi-Cloud</Badge>
                      <Badge bg="info" className="me-2">Terraform</Badge>
                      <Badge bg="success">Infrastructure as Code</Badge>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="5">
                  <Accordion.Header>
                    <Icon name="agent" size="small" className="me-2" />
                    <strong>Development Team: Code Quality & Review Automation</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <h6 className="text-primary">📋 Scenario</h6>
                      <p>Automatically review code for quality, security, and best practices before merging pull requests.</p>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">🔄 Automated Checks</h6>
                      <ul>
                        <li><strong>Code Quality:</strong> Complexity analysis, code smells, maintainability scores</li>
                        <li><strong>Security:</strong> Vulnerability scanning, secret detection, dependency analysis</li>
                        <li><strong>Best Practices:</strong> Style guide compliance, design pattern validation</li>
                        <li><strong>Performance:</strong> Identify performance bottlenecks and optimization opportunities</li>
                        <li><strong>Documentation:</strong> Check for missing docs, outdated comments</li>
                      </ul>
                    </div>
                    
                    <div>
                      <Badge bg="info" className="me-2">SonarQube</Badge>
                      <Badge bg="info" className="me-2">ESLint</Badge>
                      <Badge bg="success" className="me-2">GitHub Actions</Badge>
                      <Badge bg="warning">Code Review</Badge>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Benefits */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0 d-flex align-items-center">
                <Icon name="success" size="small" className="me-2" />
                Integration Benefits
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="upload" size="small" className="me-2" />
                  <strong>No UI Required:</strong> Pure API integration
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="agentHub" size="small" className="me-2" />
                  <strong>Fast Setup:</strong> 5-minute integration
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="settings" size="small" className="me-2" />
                  <strong>Flexible:</strong> Use any programming language
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="activity" size="small" className="me-2" />
                  <strong>CI/CD Ready:</strong> Pipeline integration
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="chart" size="small" className="me-2" />
                  <strong>Real-time:</strong> Webhook notifications
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="security" size="small" className="me-2" />
                  <strong>Secure:</strong> API key authentication
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0 d-flex align-items-center">
                <Icon name="analytics" size="small" className="me-2" />
                Integration Features
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="activity" size="small" className="me-2" />
                  <strong>Multi-Language:</strong> Python, JavaScript, Java, cURL
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="settings" size="small" className="me-2" />
                  <strong>CI/CD Ready:</strong> GitHub Actions, Jenkins
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="chart" size="small" className="me-2" />
                  <strong>Event-Driven:</strong> Webhook notifications
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="security" size="small" className="me-2" />
                  <strong>Enterprise:</strong> API key authentication
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="target" size="small" className="me-2" />
                  <strong>Scalable:</strong> REST API architecture
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <Icon name="view" size="small" className="me-2" />
                  <strong>Documented:</strong> Complete integration guides
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Support */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Icon name="users" size="small" className="me-2" />
                Support & Resources
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <h6 className="d-flex align-items-center">
                    <Icon name="view" size="small" className="me-2" />
                    Documentation
                  </h6>
                  <ul className="list-unstyled">
                    <li><a href="https://docs.aws.amazon.com/lambda/latest/api/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Lambda API Reference</a></li>
                    <li><a href="https://boto3.amazonaws.com/v1/documentation/api/latest/index.html" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS SDK Documentation</a></li>
                    <li><a href="https://docs.aws.amazon.com/lambda/latest/dg/welcome.html" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Integration Guides</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6 className="d-flex align-items-center">
                    <Icon name="settings" size="small" className="me-2" />
                    Tools
                  </h6>
                  <ul className="list-unstyled">
                    <li><a href="https://aws.amazon.com/cli/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS CLI Tool</a></li>
                    <li><a href="https://www.postman.com/aws-api-gateway-team/workspace/aws-api-gateway/overview" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS API Gateway Postman</a></li>
                    <li><a href="https://swagger.io/specification/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">OpenAPI 3.0 Specification</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6 className="d-flex align-items-center">
                    <Icon name="users" size="small" className="me-2" />
                    Community
                  </h6>
                  <ul className="list-unstyled">
                    <li><a href="https://github.com/aws/aws-lambda-developers/discussions" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Lambda Discussions</a></li>
                    <li><a href="https://aws-developers-slack-hq.herokuapp.com/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Developers Slack</a></li>
                    <li><a href="https://stackoverflow.com/questions/tagged/aws-lambda" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Lambda on Stack Overflow</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6 className="d-flex align-items-center">
                    <Icon name="target" size="small" className="me-2" />
                    Support
                  </h6>
                  <ul className="list-unstyled">
                    <li><a href="https://aws.amazon.com/support/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Enterprise Support</a></li>
                    <li><a href="https://aws.amazon.com/training/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Training & Certification</a></li>
                    <li><a href="https://aws.amazon.com/professional-services/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">AWS Professional Services</a></li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* API Key Modal */}
      <Modal show={showApiKeyModal} onHide={() => setShowApiKeyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <Icon name="security" size="small" className="me-2" />
            API Key Generated
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <h6>Your API Key:</h6>
            <code className="d-block p-2 bg-light rounded">{apiKey}</code>
          </Alert>
          <Alert variant="warning">
            <strong>Important:</strong> Store this API key securely. It won't be displayed again.
            <ul className="mt-2 mb-0">
              <li>Add it to your environment variables</li>
              <li>Use it in your CI/CD secrets</li>
              <li>Never commit it to version control</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApiKeyModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EnterpriseIntegration;