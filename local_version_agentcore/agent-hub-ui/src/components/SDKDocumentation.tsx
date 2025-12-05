import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
import { theme } from '../styles/theme';

const SDKDocumentation: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const sdks = {
    javascript: {
      name: 'JavaScript/TypeScript SDK',
      version: '1.0.0',
      npm: '@agenthub/sdk',
      install: 'npm install @agenthub/sdk',
      github: 'https://github.com/agenthub/javascript-sdk'
    },
    python: {
      name: 'Python SDK',
      version: '1.0.0',
      pypi: 'agenthub-sdk',
      install: 'pip install agenthub-sdk',
      github: 'https://github.com/agenthub/python-sdk'
    },
    java: {
      name: 'Java SDK',
      version: '1.0.0',
      maven: 'com.agenthub:agenthub-sdk',
      install: 'Maven/Gradle dependency',
      github: 'https://github.com/agenthub/java-sdk'
    },
    go: {
      name: 'Go SDK',
      version: '1.0.0',
      module: 'github.com/agenthub/go-sdk',
      install: 'go get github.com/agenthub/go-sdk',
      github: 'https://github.com/agenthub/go-sdk'
    }
  };

  return (
    <Container fluid style={{ 
      padding: theme.spacing['3xl'], 
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <h1 style={{ 
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm
        }}>
          🔧 SDKs & Libraries
        </h1>
        <p style={{ 
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.textSecondary
        }}>
          Official SDKs for integrating AgentHub into your applications
        </p>
      </div>

      <Alert variant="info" className="mb-4">
        <strong>Official SDKs:</strong> Use our official SDKs for seamless integration with type safety, 
        error handling, and automatic retries. All SDKs are open-source and actively maintained.
      </Alert>

      <Row className="mb-4">
        {Object.entries(sdks).map(([key, sdk]) => (
          <Col md={6} lg={3} key={key} className="mb-3">
            <Card 
              className={`h-100 ${selectedLanguage === key ? 'border-primary border-3' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedLanguage(key)}
            >
              <Card.Body>
                <h5>{sdk.name}</h5>
                <Badge bg="success" className="mb-2">v{sdk.version}</Badge>
                <p className="small text-muted mb-2">{sdk.install}</p>
                {selectedLanguage === key && (
                  <Badge bg="primary">Selected</Badge>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Quick Start - {sdks[selectedLanguage as keyof typeof sdks].name}</h5>
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="install" className="mb-3">
            <Tab eventKey="install" title="Installation">
              <h6>Install the SDK</h6>
              <pre className="bg-dark text-light p-3 rounded">
                <code>{sdks[selectedLanguage as keyof typeof sdks].install}</code>
              </pre>
              
              {selectedLanguage === 'java' && (
                <>
                  <h6 className="mt-3">Maven</h6>
                  <pre className="bg-dark text-light p-3 rounded">
                    <code>{`<dependency>
  <groupId>com.agenthub</groupId>
  <artifactId>agenthub-sdk</artifactId>
  <version>1.0.0</version>
</dependency>`}</code>
                  </pre>
                  <h6 className="mt-3">Gradle</h6>
                  <pre className="bg-dark text-light p-3 rounded">
                    <code>{`implementation 'com.agenthub:agenthub-sdk:1.0.0'`}</code>
                  </pre>
                </>
              )}
            </Tab>

            <Tab eventKey="quickstart" title="Quick Start">
              {selectedLanguage === 'javascript' && (
                <pre className="bg-dark text-light p-3 rounded">
                  <code>{`import { AgentHubClient } from '@agenthub/sdk';

// Initialize client
const client = new AgentHubClient({
  apiKey: process.env.AGENTHUB_API_KEY,
  baseURL: 'https://api.agenthub.com/v1'
});

// List available agents
const agents = await client.agents.list();
console.log('Available agents:', agents.length);

// Execute an agent
const result = await client.agents.execute('qe-test-generator-v2', {
  requirements: 'Generate login tests',
  framework: 'cypress',
  language: 'typescript'
});

console.log('Execution completed:', result.executionId);
console.log('Results:', result.results);`}</code>
                </pre>
              )}

              {selectedLanguage === 'python' && (
                <pre className="bg-dark text-light p-3 rounded">
                  <code>{`from agenthub import AgentHubClient
import os

# Initialize client
client = AgentHubClient(
    api_key=os.getenv('AGENTHUB_API_KEY'),
    base_url='https://api.agenthub.com/v1'
)

# List available agents
agents = client.agents.list()
print(f'Available agents: {len(agents)}')

# Execute an agent
result = client.agents.execute(
    agent_id='qe-test-generator-v2',
    inputs={
        'requirements': 'Generate login tests',
        'framework': 'cypress',
        'language': 'typescript'
    }
)

print(f'Execution completed: {result.execution_id}')
print(f'Results: {result.results}')`}</code>
                </pre>
              )}

              {selectedLanguage === 'java' && (
                <pre className="bg-dark text-light p-3 rounded">
                  <code>{`import com.agenthub.sdk.AgentHubClient;
import com.agenthub.sdk.models.*;

public class QuickStart {
    public static void main(String[] args) {
        // Initialize client
        AgentHubClient client = AgentHubClient.builder()
            .apiKey(System.getenv("AGENTHUB_API_KEY"))
            .baseUrl("https://api.agenthub.com/v1")
            .build();
        
        // List available agents
        List<Agent> agents = client.agents().list();
        System.out.println("Available agents: " + agents.size());
        
        // Execute an agent
        ExecutionResult result = client.agents()
            .execute("qe-test-generator-v2")
            .input("requirements", "Generate login tests")
            .input("framework", "cypress")
            .input("language", "typescript")
            .executeSync();
        
        System.out.println("Execution completed: " + result.getExecutionId());
        System.out.println("Results: " + result.getResults());
    }
}`}</code>
                </pre>
              )}

              {selectedLanguage === 'go' && (
                <pre className="bg-dark text-light p-3 rounded">
                  <code>{`package main

import (
    "fmt"
    "os"
    "github.com/agenthub/go-sdk"
)

func main() {
    // Initialize client
    client := agenthub.NewClient(
        agenthub.WithAPIKey(os.Getenv("AGENTHUB_API_KEY")),
        agenthub.WithBaseURL("https://api.agenthub.com/v1"),
    )
    
    // List available agents
    agents, err := client.Agents.List()
    if err != nil {
        panic(err)
    }
    fmt.Printf("Available agents: %d\\n", len(agents))
    
    // Execute an agent
    result, err := client.Agents.Execute("qe-test-generator-v2", map[string]interface{}{
        "requirements": "Generate login tests",
        "framework": "cypress",
        "language": "typescript",
    })
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Execution completed: %s\\n", result.ExecutionID)
    fmt.Printf("Results: %v\\n", result.Results)
}`}</code>
                </pre>
              )}
            </Tab>

            <Tab eventKey="features" title="Features">
              <h6>SDK Features</h6>
              <ul>
                <li>✅ Type-safe API client with full TypeScript/type definitions</li>
                <li>✅ Automatic retry logic with exponential backoff</li>
                <li>✅ Built-in error handling and validation</li>
                <li>✅ Async/await support for modern workflows</li>
                <li>✅ Streaming support for long-running executions</li>
                <li>✅ Webhook integration helpers</li>
                <li>✅ Comprehensive logging and debugging</li>
                <li>✅ Connection pooling and rate limiting</li>
              </ul>

              <h6 className="mt-4">Documentation</h6>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="me-2"
                onClick={() => window.open(sdks[selectedLanguage as keyof typeof sdks].github, '_blank')}
              >
                View on GitHub
              </Button>
              <Button variant="outline-info" size="sm">
                API Reference
              </Button>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">📚 Resources</h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">📖 Complete API Reference</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">🎓 SDK Tutorials</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">💡 Code Examples</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">🐛 Report Issues</a>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">🆘 Support</h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">💬 Community Forum</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">📧 Email Support</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">💼 Enterprise Support</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-decoration-none">🔔 Release Notes</a>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SDKDocumentation;
