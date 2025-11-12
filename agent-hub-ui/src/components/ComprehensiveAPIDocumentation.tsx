import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, Table, Form } from 'react-bootstrap';

interface EndpointInfo {
  method: string;
  path: string;
  description: string;
  cli: string;
  response: string;
}

interface CategoryInfo {
  title: string;
  endpoints: Record<string, EndpointInfo>;
}

const ComprehensiveAPIDocumentation: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('agents');
  const [selectedEndpoint, setSelectedEndpoint] = useState('list-agents');

  const apiCategories: Record<string, CategoryInfo> = {
    agents: {
      title: '🤖 Agent Management',
      endpoints: {
        'list-agents': {
          method: 'GET',
          path: '/api/v1/agents',
          description: 'Retrieve all available agents from S3 storage',
          cli: 'curl http://localhost:3002/api/v1/agents',
          response: `{
  "success": true,
  "data": [
    {
      "id": "agent-123",
      "name": "QE Test Generator",
      "description": "Generates test cases",
      "category": "qa",
      "framework": "crew"
    }
  ],
  "count": 15
}`
        },
        'get-agent': {
          method: 'GET',
          path: '/api/v1/agents/:id',
          description: 'Get details of a specific agent',
          cli: 'curl http://localhost:3002/api/v1/agents/agent-123',
          response: `{
  "success": true,
  "agent": {
    "id": "agent-123",
    "name": "QE Test Generator",
    "metadata": {...}
  }
}`
        },
        'upload-agent': {
          method: 'POST',
          path: '/api/v1/agents/upload',
          description: 'Upload a new agent to S3',
          cli: `curl -X POST http://localhost:3002/api/v1/agents/upload \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Agent",
    "description": "Agent description",
    "category": "qa"
  }'`,
          response: `{
  "success": true,
  "agent": {
    "id": "new-agent-id",
    "name": "My Agent"
  }
}`
        }
      }
    },
    testing: {
      title: '🧪 Agent Testing',
      endpoints: {
        'list-test-suites': {
          method: 'GET',
          path: '/api/testing/suites/universal',
          description: 'Get all test categories and test cases',
          cli: 'curl http://localhost:3002/api/testing/suites/universal',
          response: `{
  "success": true,
  "categories": [
    {
      "id": "functional-validation",
      "name": "Functional Validation",
      "testCount": 5,
      "testCases": [...]
    }
  ]
}`
        },
        'run-tests': {
          method: 'POST',
          path: '/api/testing/run/category',
          description: 'Execute tests for selected agents and category',
          cli: `curl -X POST http://localhost:3002/api/testing/run/category \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentIds": ["agent-123"],
    "categoryId": "functional-validation"
  }'`,
          response: `{
  "success": true,
  "runId": "run-abc-123",
  "status": "running"
}`
        },
        'get-test-runs': {
          method: 'GET',
          path: '/api/testing/test-runs',
          description: 'Get all test execution history',
          cli: 'curl http://localhost:3002/api/testing/test-runs',
          response: `{
  "success": true,
  "runs": [
    {
      "id": "run-123",
      "status": "completed",
      "totalTests": 5,
      "passedTests": 3,
      "startTime": "2025-11-11T..."
    }
  ]
}`
        },
        'get-test-run-details': {
          method: 'GET',
          path: '/api/testing/test-runs/:runId',
          description: 'Get detailed results for a specific test run',
          cli: 'curl http://localhost:3002/api/testing/test-runs/run-123',
          response: `{
  "success": true,
  "run": {...},
  "results": [
    {
      "testCaseId": "test-1",
      "passed": true,
      "duration": 1000,
      "evaluation": {...}
    }
  ]
}`
        },
        'get-metrics': {
          method: 'GET',
          path: '/api/testing/metrics?days=7',
          description: 'Get testing metrics with cost analysis',
          cli: 'curl "http://localhost:3002/api/testing/metrics?days=7"',
          response: `{
  "success": true,
  "metrics": {
    "summary": {
      "totalCost": 0.0234,
      "totalTests": 40,
      "passRate": 68
    },
    "performance": [...],
    "costs": [...]
  }
}`
        },
        'get-insights': {
          method: 'GET',
          path: '/api/testing/insights',
          description: 'Get AI-powered testing insights and recommendations',
          cli: 'curl http://localhost:3002/api/testing/insights',
          response: `{
  "success": true,
  "insights": {
    "recommendations": [...],
    "patterns": [...]
  }
}`
        },
        'get-overview': {
          method: 'GET',
          path: '/api/testing/analytics/overview',
          description: 'Get testing overview dashboard metrics',
          cli: 'curl http://localhost:3002/api/testing/analytics/overview',
          response: `{
  "totalAgents": 15,
  "testCoverage": 40,
  "overallPassRate": 68,
  "trends": [...],
  "recentRuns": [...]
}`
        }
      }
    },
    hybrid: {
      title: '🔄 Hybrid Agent',
      endpoints: {
        'execute-hybrid': {
          method: 'POST',
          path: '/api/v1/agents/hybrid/execute',
          description: 'Execute hybrid agent with natural language query',
          cli: `curl -X POST http://localhost:3002/api/v1/agents/hybrid/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Generate test cases for login functionality"
  }'`,
          response: `{
  "success": true,
  "result": {
    "output": "Generated test cases...",
    "agentUsed": "qe-test-generator"
  }
}`
        }
      }
    },
    finops: {
      title: '💰 FinOps',
      endpoints: {
        'get-dashboard': {
          method: 'GET',
          path: '/api/v1/finops/dashboard',
          description: 'Get FinOps dashboard data with cost analysis',
          cli: 'curl http://localhost:3002/api/v1/finops/dashboard',
          response: `{
  "totalCost": 1234.56,
  "costByService": [...],
  "recommendations": [...]
}`
        },
        'get-cost-explorer': {
          method: 'GET',
          path: '/api/v1/finops/cost-explorer',
          description: 'Get detailed cost breakdown',
          cli: 'curl http://localhost:3002/api/v1/finops/cost-explorer',
          response: `{
  "costs": [...],
  "trends": [...]
}`
        }
      }
    },
    dashboard: {
      title: '📊 Real-Time Dashboard',
      endpoints: {
        'get-stats': {
          method: 'GET',
          path: '/api/v1/dashboard/stats',
          description: 'Get real-time dashboard statistics',
          cli: 'curl http://localhost:3002/api/v1/dashboard/stats',
          response: `{
  "totalAgents": 15,
  "activeExecutions": 3,
  "totalExecutions": 1234
}`
        },
        'get-executions': {
          method: 'GET',
          path: '/api/v1/analytics/executions',
          description: 'Get agent execution history',
          cli: 'curl http://localhost:3002/api/v1/analytics/executions',
          response: `{
  "executions": [
    {
      "id": "exec-123",
      "agentId": "agent-123",
      "status": "completed",
      "timestamp": "2025-11-11T..."
    }
  ]
}`
        },
        'get-cloudwatch-metrics': {
          method: 'GET',
          path: '/api/v1/cloudwatch/metrics',
          description: 'Get CloudWatch metrics for monitoring',
          cli: 'curl http://localhost:3002/api/v1/cloudwatch/metrics',
          response: `{
  "metrics": {
    "cpu": 45.2,
    "memory": 62.8,
    "requests": 1234
  }
}`
        }
      }
    }
  };

  const currentEndpoints = apiCategories[activeCategory]?.endpoints || {};
  const currentEndpoint: EndpointInfo | undefined = currentEndpoints[selectedEndpoint];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>📚 API Documentation & CLI Commands</h2>
          <p className="text-muted">
            Complete API reference with curl commands for all Agent Hub endpoints
          </p>
        </Col>
      </Row>

      <Row>
        {/* Sidebar */}
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#f8f9fa', fontWeight: 600 }}>
              API Categories
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              {Object.entries(apiCategories).map(([key, category]) => (
                <div
                  key={key}
                  onClick={() => {
                    setActiveCategory(key);
                    setSelectedEndpoint(Object.keys(category.endpoints)[0]);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: activeCategory === key ? '#e7f1ff' : 'white',
                    borderLeft: activeCategory === key ? '3px solid #0d6efd' : '3px solid transparent',
                    fontWeight: activeCategory === key ? 600 : 400
                  }}
                >
                  {category.title}
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Endpoints List */}
          <Card className="shadow-sm mt-3">
            <Card.Header style={{ backgroundColor: '#f8f9fa', fontWeight: 600 }}>
              Endpoints
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              {Object.entries(currentEndpoints).map(([key, endpoint]: [string, any]) => (
                <div
                  key={key}
                  onClick={() => setSelectedEndpoint(key)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    backgroundColor: selectedEndpoint === key ? '#e7f1ff' : 'white',
                    borderLeft: selectedEndpoint === key ? '3px solid #0d6efd' : '3px solid transparent',
                    fontSize: '0.9em'
                  }}
                >
                  <Badge bg={
                    endpoint.method === 'GET' ? 'success' :
                    endpoint.method === 'POST' ? 'primary' :
                    endpoint.method === 'PUT' ? 'warning' :
                    'danger'
                  } className="me-2">
                    {endpoint.method}
                  </Badge>
                  <code style={{ fontSize: '0.85em' }}>{endpoint.path.split('/').pop()}</code>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col md={9}>
          {currentEndpoint && (
            <>
              <Card className="shadow-sm mb-3">
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Badge bg={
                      currentEndpoint.method === 'GET' ? 'success' :
                      currentEndpoint.method === 'POST' ? 'primary' :
                      currentEndpoint.method === 'PUT' ? 'warning' :
                      'danger'
                    } style={{ fontSize: '1em', padding: '8px 12px' }}>
                      {currentEndpoint.method}
                    </Badge>
                    <code style={{ fontSize: '1.1em', fontWeight: 600 }}>
                      {currentEndpoint.path}
                    </code>
                  </div>
                  <p style={{ fontSize: '1.05em', marginBottom: 0 }}>
                    {currentEndpoint.description}
                  </p>
                </Card.Body>
              </Card>

              {/* CLI Command */}
              <Card className="shadow-sm mb-3">
                <Card.Header style={{ backgroundColor: '#f8f9fa', fontWeight: 600 }}>
                  🖥️ CLI Command
                </Card.Header>
                <Card.Body>
                  <Alert variant="dark" style={{ marginBottom: 0 }}>
                    <pre style={{ marginBottom: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      <code>{currentEndpoint.cli}</code>
                    </pre>
                  </Alert>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(currentEndpoint.cli);
                      alert('Copied to clipboard!');
                    }}
                  >
                    📋 Copy Command
                  </Button>
                </Card.Body>
              </Card>

              {/* Response Example */}
              <Card className="shadow-sm">
                <Card.Header style={{ backgroundColor: '#f8f9fa', fontWeight: 600 }}>
                  📤 Response Example
                </Card.Header>
                <Card.Body>
                  <Alert variant="light" style={{ marginBottom: 0 }}>
                    <pre style={{ marginBottom: 0, fontSize: '0.9em' }}>
                      <code>{currentEndpoint.response}</code>
                    </pre>
                  </Alert>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>

      {/* Quick Start Guide */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#d1ecf1', fontWeight: 600 }}>
              🚀 Quick Start Guide
            </Card.Header>
            <Card.Body>
              <h5>Using the API</h5>
              <ol>
                <li>All endpoints are available at <code>http://localhost:3002</code></li>
                <li>Copy any CLI command from above and run it in your terminal</li>
                <li>For POST requests, modify the JSON data as needed</li>
                <li>Responses are in JSON format</li>
              </ol>

              <h5 className="mt-4">Authentication</h5>
              <p>Most endpoints don't require authentication. For protected endpoints, include:</p>
              <Alert variant="dark">
                <code>-H "x-api-key: your-api-key-here"</code>
              </Alert>

              <h5 className="mt-4">Common Use Cases</h5>
              <Table bordered size="sm">
                <thead>
                  <tr>
                    <th>Use Case</th>
                    <th>Endpoints to Use</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>List all agents</td>
                    <td><code>GET /api/v1/agents</code></td>
                  </tr>
                  <tr>
                    <td>Run tests on agents</td>
                    <td><code>POST /api/testing/run/category</code></td>
                  </tr>
                  <tr>
                    <td>Get test results</td>
                    <td><code>GET /api/testing/test-runs/:runId</code></td>
                  </tr>
                  <tr>
                    <td>View cost metrics</td>
                    <td><code>GET /api/testing/metrics</code></td>
                  </tr>
                  <tr>
                    <td>Get AI insights</td>
                    <td><code>GET /api/testing/insights</code></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ComprehensiveAPIDocumentation;
