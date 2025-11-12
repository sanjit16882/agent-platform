import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table } from 'react-bootstrap';

interface EndpointInfo {
  method: string;
  path: string;
  description: string;
  cli: string;
  response: string;
}

interface CategoryInfo {
  title: string;
  color: string;
  endpoints: Record<string, EndpointInfo>;
}

const RealAPIDocumentation: React.FC = () => {
  // UPDATED VERSION 3.0 - BLACK TEXT FIX
  const [activeCategory, setActiveCategory] = useState('agents');
  const [selectedEndpoint, setSelectedEndpoint] = useState('list-agents');
  const [copiedCommand, setCopiedCommand] = useState('');
  const [activeView, setActiveView] = useState<'interactive' | 'cli'>('interactive');

  const apiCategories: Record<string, CategoryInfo> = {
    agents: {
      title: '🤖 Agent Management',
      color: '#0d6efd',
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
      "description": "Generates comprehensive test cases",
      "category": "qa",
      "framework": "crew",
      "status": "active"
    }
  ],
  "count": 15
}`
        },
        'list-s3-agents': {
          method: 'GET',
          path: '/api/v1/agents/s3',
          description: 'Get all custom agents from S3 bucket',
          cli: 'curl http://localhost:3002/api/v1/agents/s3',
          response: `{
  "success": true,
  "data": [...],
  "count": 15
}`
        },
        'get-agent': {
          method: 'GET',
          path: '/api/v1/agents/:id',
          description: 'Get detailed information about a specific agent',
          cli: 'curl http://localhost:3002/api/v1/agents/agent-123',
          response: `{
  "success": true,
  "agent": {
    "id": "agent-123",
    "name": "QE Test Generator",
    "description": "...",
    "metadata": {...}
  }
}`
        },
        'upload-agent': {
          method: 'POST',
          path: '/api/v1/agents/upload',
          description: 'Upload a new custom agent to S3',
          cli: `curl -X POST http://localhost:3002/api/v1/agents/upload \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Custom Agent",
    "description": "Agent description",
    "category": "qa",
    "framework": "custom"
  }'`,
          response: `{
  "success": true,
  "agent": {
    "id": "new-agent-id",
    "name": "My Custom Agent"
  }
}`
        },
        'delete-agent': {
          method: 'DELETE',
          path: '/api/v1/agents/:id',
          description: 'Delete an agent from S3',
          cli: 'curl -X DELETE http://localhost:3002/api/v1/agents/agent-123',
          response: `{
  "success": true,
  "message": "Agent deleted successfully"
}`
        }
      }
    },
    testing: {
      title: '🧪 Agent Testing Framework',
      color: '#198754',
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
      "description": "Tests core functionality",
      "testCount": 5,
      "testCases": [
        {
          "id": "test-1",
          "name": "Prompt Output Validation",
          "description": "Validates agent response quality"
        }
      ]
    }
  ]
}`
        },
        'get-test-agents': {
          method: 'GET',
          path: '/api/testing/agents',
          description: 'Get all agents available for testing',
          cli: 'curl http://localhost:3002/api/testing/agents',
          response: `{
  "success": true,
  "agents": [...]
}`
        },
        'run-tests': {
          method: 'POST',
          path: '/api/testing/run/category',
          description: 'Execute tests for selected agents and test category',
          cli: `curl -X POST http://localhost:3002/api/testing/run/category \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentIds": ["agent-123", "agent-456"],
    "categoryId": "functional-validation"
  }'`,
          response: `{
  "success": true,
  "runId": "run-abc-123",
  "status": "running",
  "message": "Test execution started"
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
      "categoryName": "Functional Validation",
      "totalTests": 5,
      "passedTests": 3,
      "failedTests": 2,
      "startTime": "2025-11-11T19:08:22.306Z",
      "endTime": "2025-11-11T19:08:27.123Z"
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
  "run": {
    "id": "run-123",
    "status": "completed",
    "totalTests": 5,
    "passedTests": 3
  },
  "results": [
    {
      "id": "result-1",
      "testCaseId": "test-1",
      "testCaseName": "Prompt Output Validation",
      "agentId": "agent-123",
      "status": "passed",
      "passed": true,
      "duration": 1004,
      "evaluation": {
        "accuracy": 0.835,
        "coherence": 0.70,
        "relevance": 0.286,
        "completeness": 0.80
      }
    }
  ]
}`
        },
        'get-metrics': {
          method: 'GET',
          path: '/api/testing/metrics',
          description: 'Get testing metrics with cost analysis and performance data',
          cli: 'curl "http://localhost:3002/api/testing/metrics?days=7"',
          response: `{
  "success": true,
  "metrics": {
    "summary": {
      "totalRuns": 6,
      "completedRuns": 6,
      "totalTests": 40,
      "passedTests": 27,
      "failedTests": 13,
      "passRate": 68,
      "avgExecutionTime": 2.5,
      "totalCost": 0.0234,
      "totalTokens": 45000,
      "avgCostPerTest": 0.000585
    },
    "performance": [
      {
        "date": "Mon",
        "responseTime": 1005,
        "tokenUsage": 1125,
        "passRate": 68,
        "cost": 0.0234
      }
    ],
    "costs": [
      {
        "agent": "github-mcp-agent",
        "cost": 0.0089,
        "tests": 15,
        "tokens": 17000,
        "avgCostPerTest": 0.000593
      }
    ],
    "agentPerformance": [
      {
        "agent": "github-mcp-agent",
        "tests": 15,
        "cost": 0.0089,
        "efficiency": 1685.39
      }
    ]
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
    "recommendations": [
      {
        "id": "low-pass-rate",
        "type": "prompt_modification",
        "priority": "high",
        "description": "Low pass rate detected (67.5%) across 35 failing tests",
        "improvement": "Review and optimize agent prompts to improve test success rate by ~3%"
      }
    ],
    "patterns": [
      {
        "id": "pattern-0",
        "type": "other",
        "description": "Unknown failure",
        "occurrences": 30
      }
    ],
    "summary": {
      "totalRuns": 6,
      "totalFailures": 35,
      "lowAccuracyCount": 8,
      "slowTestsCount": 5
    }
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
  "testsToday": 40,
  "qualityDistribution": {
    "excellent": 7,
    "good": 4,
    "fair": 1,
    "poor": 3
  },
  "trends": [
    {
      "date": "Tue",
      "passRate": 68,
      "testsRun": 40
    }
  ],
  "recentRuns": [...]
}`
        }
      }
    },
    hybrid: {
      title: '🔄 Hybrid Agent Execution',
      color: '#6f42c1',
      endpoints: {
        'execute-hybrid': {
          method: 'POST',
          path: '/api/v1/agents/hybrid/execute',
          description: 'Execute hybrid agent with natural language query',
          cli: `curl -X POST http://localhost:3002/api/v1/agents/hybrid/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Generate test cases for login functionality",
    "context": {}
  }'`,
          response: `{
  "success": true,
  "result": {
    "output": "Generated comprehensive test cases...",
    "agentUsed": "qe-test-generator",
    "executionTime": 2500
  }
}`
        }
      }
    },
    finops: {
      title: '💰 FinOps & Cost Management',
      color: '#ffc107',
      endpoints: {
        'get-dashboard': {
          method: 'GET',
          path: '/api/v1/finops/dashboard',
          description: 'Get FinOps dashboard data with cost analysis',
          cli: 'curl http://localhost:3002/api/v1/finops/dashboard',
          response: `{
  "totalCost": 1234.56,
  "costByService": [
    {
      "service": "EC2",
      "cost": 456.78,
      "percentage": 37
    }
  ],
  "recommendations": [
    {
      "type": "cost-optimization",
      "description": "Right-size EC2 instances",
      "potentialSavings": 150.00
    }
  ]
}`
        },
        'get-cost-explorer': {
          method: 'GET',
          path: '/api/v1/finops/cost-explorer',
          description: 'Get detailed cost breakdown and trends',
          cli: 'curl http://localhost:3002/api/v1/finops/cost-explorer',
          response: `{
  "costs": [...],
  "trends": [...],
  "forecast": {...}
}`
        }
      }
    },
    dashboard: {
      title: '📊 Real-Time Dashboard',
      color: '#17a2b8',
      endpoints: {
        'get-stats': {
          method: 'GET',
          path: '/api/v1/dashboard/stats',
          description: 'Get real-time dashboard statistics',
          cli: 'curl http://localhost:3002/api/v1/dashboard/stats',
          response: `{
  "totalAgents": 15,
  "activeExecutions": 3,
  "totalExecutions": 1234,
  "successRate": 92.5
}`
        },
        'get-executions': {
          method: 'GET',
          path: '/api/v1/analytics/executions',
          description: 'Get agent execution history and analytics',
          cli: 'curl http://localhost:3002/api/v1/analytics/executions',
          response: `{
  "executions": [
    {
      "id": "exec-123",
      "agentId": "agent-123",
      "status": "completed",
      "duration": 2500,
      "timestamp": "2025-11-11T19:08:22.306Z"
    }
  ],
  "total": 1234
}`
        },
        'get-cloudwatch-metrics': {
          method: 'GET',
          path: '/api/v1/cloudwatch/metrics',
          description: 'Get CloudWatch metrics for system monitoring',
          cli: 'curl http://localhost:3002/api/v1/cloudwatch/metrics',
          response: `{
  "metrics": {
    "cpu": 45.2,
    "memory": 62.8,
    "requests": 1234,
    "errors": 12
  },
  "timestamp": "2025-11-11T19:08:22.306Z"
}`
        }
      }
    },
    catalog: {
      title: '📚 Agent Catalog',
      color: '#20c997',
      endpoints: {
        'search-agents': {
          method: 'GET',
          path: '/api/v1/agents/search',
          description: 'Search agents by name, category, or capabilities',
          cli: 'curl "http://localhost:3002/api/v1/agents/search?q=test&category=qa"',
          response: `{
  "success": true,
  "results": [...],
  "count": 5
}`
        },
        'get-categories': {
          method: 'GET',
          path: '/api/v1/agents/categories',
          description: 'Get all agent categories',
          cli: 'curl http://localhost:3002/api/v1/agents/categories',
          response: `{
  "categories": ["QE", "DevOps", "Security", "Data", "Custom"]
}`
        }
      }
    }
  };

  const currentEndpoints = apiCategories[activeCategory]?.endpoints || {};
  const currentEndpoint: EndpointInfo | undefined = currentEndpoints[selectedEndpoint];

  const copyToClipboard = (text: string, commandId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandId);
    setTimeout(() => setCopiedCommand(''), 2000);
  };

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Row className="mb-4">
        <Col>
          <h2 style={{ fontSize: '2em', fontWeight: 'bold', color: '#000000' }}>📚 Complete API Documentation</h2>
          <p style={{ fontSize: '1.15em', color: '#000000 !important', fontWeight: 500 }}>
            Comprehensive API reference with ready-to-use CLI commands for all Agent Hub endpoints
          </p>
          <Alert variant="info" style={{ fontSize: '1.1em', color: '#000000', fontWeight: 500 }}>
            <strong style={{ color: '#000000' }}>Base URL:</strong> <code style={{ color: '#000000', fontSize: '1em' }}>http://localhost:3002</code>
            {' | '}
            <strong style={{ color: '#000000' }}>Format:</strong> <span style={{ color: '#000000' }}>JSON</span>
            {' | '}
            <strong style={{ color: '#000000' }}>Total Endpoints:</strong> <span style={{ color: '#000000' }}>{Object.values(apiCategories).reduce((sum, cat) => sum + Object.keys(cat.endpoints).length, 0)}</span>
          </Alert>
          
          {/* View Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <Button
              variant={activeView === 'interactive' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveView('interactive')}
              style={{ marginRight: '10px', fontSize: '1.05em', padding: '10px 20px' }}
            >
              📖 Interactive Docs
            </Button>
            <Button
              variant={activeView === 'cli' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveView('cli')}
              style={{ fontSize: '1.05em', padding: '10px 20px' }}
            >
              💻 CLI Commands
            </Button>
          </div>
        </Col>
      </Row>

      {/* CLI Commands View */}
      {activeView === 'cli' && (
        <Row>
          <Col>
            {Object.entries(apiCategories).map(([catKey, category]) => (
              <Card key={catKey} className="shadow-sm mb-4">
                <Card.Header style={{ backgroundColor: '#f8f9fa', color: '#000000', fontWeight: 600, fontSize: '1.3em', padding: '15px' }}>
                  {category.title}
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                  {Object.entries(category.endpoints).map(([endKey, endpoint]: [string, any]) => (
                    <div key={endKey} style={{ marginBottom: '25px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <Badge bg={
                          endpoint.method === 'GET' ? 'success' :
                          endpoint.method === 'POST' ? 'primary' :
                          endpoint.method === 'PUT' ? 'warning' :
                          'danger'
                        } style={{ fontSize: '0.9em', marginRight: '10px' }}>
                          {endpoint.method}
                        </Badge>
                        <code style={{ fontSize: '1.05em', color: '#000000', fontWeight: 600 }}>
                          {endpoint.path}
                        </code>
                      </div>
                      <p style={{ fontSize: '1em', color: '#495057', marginBottom: '10px' }}>
                        {endpoint.description}
                      </p>
                      <div style={{ position: 'relative' }}>
                        <pre style={{
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          padding: '20px',
                          borderRadius: '6px',
                          fontSize: '1.05em',
                          lineHeight: '1.6',
                          marginBottom: 0,
                          fontFamily: 'Consolas, Monaco, monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          <code>{endpoint.cli}</code>
                        </pre>
                        <Button
                          variant="light"
                          size="sm"
                          style={{ position: 'absolute', top: '10px', right: '10px' }}
                          onClick={() => {
                            navigator.clipboard.writeText(endpoint.cli);
                            setCopiedCommand(endKey);
                            setTimeout(() => setCopiedCommand(''), 2000);
                          }}
                        >
                          {copiedCommand === endKey ? '✓ Copied!' : '📋 Copy'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            ))}
          </Col>
        </Row>
      )}

      {/* Interactive View */}
      {activeView === 'interactive' && (
      <Row>
        {/* Sidebar - Categories */}
        <Col md={2}>
          <Card className="shadow-sm sticky-top" style={{ top: '20px', minHeight: '80vh' }}>
            <Card.Header style={{ backgroundColor: '#f8f9fa', color: '#000000', fontWeight: 600, fontSize: '1.15em', padding: '12px' }}>
              📑 Categories
            </Card.Header>
            <Card.Body style={{ padding: 0, minHeight: '70vh' }}>
              {Object.entries(apiCategories).map(([key, category]) => (
                <div
                  key={key}
                  onClick={() => {
                    setActiveCategory(key);
                    setSelectedEndpoint(Object.keys(category.endpoints)[0]);
                  }}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    backgroundColor: activeCategory === key ? '#e7f1ff' : 'white',
                    borderLeft: activeCategory === key ? `3px solid ${category.color}` : '3px solid transparent',
                    fontWeight: activeCategory === key ? 600 : 500,
                    fontSize: '1.05em',
                    color: '#000000',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeCategory !== key) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeCategory !== key) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {category.title}
                  <Badge bg="secondary" className="float-end">
                    {Object.keys(category.endpoints).length}
                  </Badge>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Middle - Endpoints List */}
        <Col md={3}>
          <Card className="shadow-sm" style={{ minHeight: '80vh' }}>
            <Card.Header style={{ backgroundColor: '#f8f9fa', fontWeight: 600, fontSize: '1.15em', color: '#000000', padding: '12px' }}>
              🔗 Endpoints
            </Card.Header>
            <Card.Body style={{ padding: 0, minHeight: '70vh', maxHeight: '80vh', overflowY: 'auto' }}>
              {Object.entries(currentEndpoints).map(([key, endpoint]: [string, any]) => (
                <div
                  key={key}
                  onClick={() => setSelectedEndpoint(key)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    backgroundColor: selectedEndpoint === key ? '#e7f1ff' : 'white',
                    borderLeft: selectedEndpoint === key ? '3px solid #0d6efd' : '3px solid transparent',
                    fontSize: '1em',
                    color: '#000000',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEndpoint !== key) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEndpoint !== key) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <Badge bg={
                    endpoint.method === 'GET' ? 'success' :
                    endpoint.method === 'POST' ? 'primary' :
                    endpoint.method === 'PUT' ? 'warning' :
                    'danger'
                  } className="me-2" style={{ fontSize: '0.75em' }}>
                    {endpoint.method}
                  </Badge>
                  <div style={{ fontSize: '1.05em', marginTop: '4px', color: '#000000', fontWeight: 600 }}>
                    {endpoint.path}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content - Endpoint Details */}
        <Col md={7}>
          {currentEndpoint && (
            <>
              {/* Endpoint Header */}
              <Card className="shadow-sm mb-3">
                <Card.Body style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Badge bg={
                      currentEndpoint.method === 'GET' ? 'success' :
                      currentEndpoint.method === 'POST' ? 'primary' :
                      currentEndpoint.method === 'PUT' ? 'warning' :
                      'danger'
                    } style={{ fontSize: '1.1em', padding: '10px 18px' }}>
                      {currentEndpoint.method}
                    </Badge>
                    <code style={{ fontSize: '1.2em', fontWeight: 600, flex: 1, color: '#212529' }}>
                      {currentEndpoint.path}
                    </code>
                  </div>
                  <p style={{ fontSize: '1.15em', marginBottom: 0, color: '#000000', lineHeight: '1.6', fontWeight: 500 }}>
                    {currentEndpoint.description}
                  </p>
                </Card.Body>
              </Card>

              {/* CLI Command */}
              <Card className="shadow-sm mb-3">
                <Card.Header style={{ backgroundColor: '#f8f9fa', color: '#000000', fontWeight: 600, fontSize: '1.2em' }}>
                  🖥️ CLI Command
                </Card.Header>
                <Card.Body style={{ backgroundColor: '#000000', padding: 0 }}>
                  <pre style={{ 
                    marginBottom: 0, 
                    padding: '30px',
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-all',
                    color: '#ffffff',
                    fontSize: '1.4em',
                    lineHeight: '2',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontWeight: 600
                  }}>
                    <code>{currentEndpoint.cli}</code>
                  </pre>
                  <div style={{ padding: '16px', backgroundColor: '#1a1a1a', borderTop: '1px solid #333333' }}>
                    <Button
                      variant="success"
                      onClick={() => copyToClipboard(currentEndpoint.cli, selectedEndpoint)}
                      style={{ fontSize: '1em', padding: '10px 20px' }}
                    >
                      {copiedCommand === selectedEndpoint ? '✓ Copied!' : '📋 Copy Command'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Response Example */}
              <Card className="shadow-sm">
                <Card.Header style={{ backgroundColor: '#f8f9fa', fontWeight: 600, fontSize: '1.2em', color: '#000000' }}>
                  📤 Response Example
                </Card.Header>
                <Card.Body style={{ backgroundColor: '#f8f9fa', padding: 0 }}>
                  <pre style={{ 
                    marginBottom: 0, 
                    padding: '30px',
                    fontSize: '1.2em',
                    lineHeight: '1.9',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    color: '#000000',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontWeight: 600
                  }}>
                    <code>{currentEndpoint.response}</code>
                  </pre>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
      )}

      {/* Quick Reference Table */}
      <Row className="mt-5">
        <Col>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#f8f9fa', color: '#000000', fontWeight: 600, fontSize: '1.2em' }}>
              🚀 Quick Reference - All Endpoints
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ fontSize: '1.05em', color: '#000000', fontWeight: 600 }}>Method</th>
                    <th style={{ fontSize: '1.05em', color: '#000000', fontWeight: 600 }}>Endpoint</th>
                    <th style={{ fontSize: '1.05em', color: '#000000', fontWeight: 600 }}>Description</th>
                    <th style={{ fontSize: '1.05em', color: '#000000', fontWeight: 600 }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(apiCategories).map(([catKey, category]) =>
                    Object.entries(category.endpoints).map(([endKey, endpoint]: [string, any]) => (
                      <tr 
                        key={`${catKey}-${endKey}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setActiveCategory(catKey);
                          setSelectedEndpoint(endKey);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <td>
                          <Badge bg={
                            endpoint.method === 'GET' ? 'success' :
                            endpoint.method === 'POST' ? 'primary' :
                            endpoint.method === 'PUT' ? 'warning' :
                            'danger'
                          } style={{ fontSize: '0.95em' }}>
                            {endpoint.method}
                          </Badge>
                        </td>
                        <td><code style={{ fontSize: '1em', color: '#000000' }}>{endpoint.path}</code></td>
                        <td style={{ fontSize: '1em', color: '#000000' }}>{endpoint.description}</td>
                        <td><Badge bg="secondary" style={{ fontSize: '0.9em' }}>{category.title}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RealAPIDocumentation;
