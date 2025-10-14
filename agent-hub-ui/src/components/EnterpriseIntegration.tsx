import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal, Tabs, Tab, Accordion } from 'react-bootstrap';

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

  // Sample agents from the catalog
  const agents: Agent[] = [
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
            <h1 className="display-5 fw-bold text-primary">🔌 Enterprise Integration</h1>
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
              <h5 className="mb-0">🔑 Step 1: Get Your API Key</h5>
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
              <h5 className="mb-0">🤖 Step 2: Choose an Agent</h5>
            </Card.Header>
            <Card.Body>
              <p>Select any agent from our catalog to see integration examples:</p>
              <Row>
                {agents.map((agent) => (
                  <Col md={4} key={agent.id} className="mb-3">
                    <Card 
                      className={`h-100 ${selectedAgent?.id === agent.id ? 'border-primary' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title">{agent.name}</h6>
                          <Badge bg="secondary">{agent.category}</Badge>
                        </div>
                        <p className="card-text small">{agent.description}</p>
                        {selectedAgent?.id === agent.id && (
                          <Badge bg="primary">Selected</Badge>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
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
                <h5 className="mb-0">💻 Step 3: Integration Examples for {selectedAgent.name}</h5>
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
                      <h6>📦 Installation:</h6>
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
              <h5 className="mb-0">🎯 Common Integration Patterns</h5>
            </Card.Header>
            <Card.Body>
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>🧪 QA Team: Automated Test Generation</Accordion.Header>
                  <Accordion.Body>
                    <strong>Scenario:</strong> Generate tests automatically when requirements change
                    <ul className="mt-2">
                      <li>Trigger on PR creation with requirement changes</li>
                      <li>Generate comprehensive test suites using QE agents</li>
                      <li>Commit generated tests back to the repository</li>
                      <li>Run tests in CI/CD pipeline</li>
                    </ul>
                    <Badge bg="success">95% time reduction</Badge>
                    <Badge bg="info" className="ms-2">Cypress, Selenium, Playwright support</Badge>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="1">
                  <Accordion.Header>⚙️ DevOps Team: Infrastructure Optimization</Accordion.Header>
                  <Accordion.Body>
                    <strong>Scenario:</strong> Continuous cost optimization and monitoring
                    <ul className="mt-2">
                      <li>Schedule daily infrastructure analysis</li>
                      <li>Identify cost optimization opportunities</li>
                      <li>Generate automated reports for management</li>
                      <li>Alert on unusual spending patterns</li>
                    </ul>
                    <Badge bg="success">$25K+ monthly savings</Badge>
                    <Badge bg="info" className="ms-2">AWS, Azure, GCP support</Badge>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="2">
                  <Accordion.Header>🔒 Security Team: Continuous Compliance</Accordion.Header>
                  <Accordion.Body>
                    <strong>Scenario:</strong> Automated security scanning and compliance
                    <ul className="mt-2">
                      <li>Scan deployments for vulnerabilities</li>
                      <li>Check compliance with SOC2, HIPAA, PCI standards</li>
                      <li>Generate security reports for audits</li>
                      <li>Block deployments that fail security checks</li>
                    </ul>
                    <Badge bg="success">60% faster compliance</Badge>
                    <Badge bg="info" className="ms-2">Kubernetes, Docker, Code scanning</Badge>
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="3">
                  <Accordion.Header>📊 Business Team: Data Analysis Automation</Accordion.Header>
                  <Accordion.Body>
                    <strong>Scenario:</strong> Automated business intelligence and reporting
                    <ul className="mt-2">
                      <li>Generate daily/weekly business reports</li>
                      <li>Analyze sales trends and forecasting</li>
                      <li>Customer churn prediction and analysis</li>
                      <li>Automated executive dashboards</li>
                    </ul>
                    <Badge bg="success">80% faster insights</Badge>
                    <Badge bg="info" className="ms-2">SQL, Excel, PowerBI integration</Badge>
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
              <h6 className="mb-0">✅ Integration Benefits</h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-2">🚀 <strong>No UI Required:</strong> Pure API integration</li>
                <li className="mb-2">⚡ <strong>Fast Setup:</strong> 5-minute integration</li>
                <li className="mb-2">🔧 <strong>Flexible:</strong> Use any programming language</li>
                <li className="mb-2">🔄 <strong>CI/CD Ready:</strong> Pipeline integration</li>
                <li className="mb-2">📊 <strong>Real-time:</strong> Webhook notifications</li>
                <li className="mb-2">🔐 <strong>Secure:</strong> API key authentication</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">📈 Expected ROI</h6>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <h4 className="text-primary">95%</h4>
                  <small>Time Reduction</small>
                </div>
                <div className="col-6 mb-3">
                  <h4 className="text-success">$150K+</h4>
                  <small>Annual Savings</small>
                </div>
                <div className="col-6">
                  <h4 className="text-info">753%</h4>
                  <small>Year 1 ROI</small>
                </div>
                <div className="col-6">
                  <h4 className="text-warning">1.4mo</h4>
                  <small>Payback Period</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Support */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">🆘 Support & Resources</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <h6>📚 Documentation</h6>
                  <ul className="list-unstyled">
                    <li><a href="#" className="text-decoration-none">API Reference</a></li>
                    <li><a href="#" className="text-decoration-none">SDK Documentation</a></li>
                    <li><a href="#" className="text-decoration-none">Integration Guides</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6>🛠️ Tools</h6>
                  <ul className="list-unstyled">
                    <li><a href="#" className="text-decoration-none">CLI Tool</a></li>
                    <li><a href="#" className="text-decoration-none">Postman Collection</a></li>
                    <li><a href="#" className="text-decoration-none">OpenAPI Spec</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6>💬 Community</h6>
                  <ul className="list-unstyled">
                    <li><a href="#" className="text-decoration-none">GitHub Discussions</a></li>
                    <li><a href="#" className="text-decoration-none">Slack Channel</a></li>
                    <li><a href="#" className="text-decoration-none">Stack Overflow</a></li>
                  </ul>
                </Col>
                <Col md={3}>
                  <h6>🎯 Support</h6>
                  <ul className="list-unstyled">
                    <li><a href="#" className="text-decoration-none">Enterprise Support</a></li>
                    <li><a href="#" className="text-decoration-none">Training Sessions</a></li>
                    <li><a href="#" className="text-decoration-none">Custom Integration</a></li>
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
          <Modal.Title>🔑 API Key Generated</Modal.Title>
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