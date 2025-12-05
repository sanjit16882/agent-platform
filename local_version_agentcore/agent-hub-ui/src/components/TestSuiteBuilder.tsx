import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';

const TestSuiteBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [suite, setSuite] = useState({
    name: '',
    description: '',
    type: 'agent',
    adapter: 'agent',
    enabled: true,
    schedule: 'manual',
    tags: [] as string[],
    agentId: ''
  });

  const [newTag, setNewTag] = useState('');
  const [saved, setSaved] = useState(false);

  const testTypes = [
    { 
      value: 'unit', 
      label: 'Unit Tests', 
      description: 'Validate internal logic or prompt templates',
      example: 'Check if the prompt generates expected structure'
    },
    { 
      value: 'functional', 
      label: 'Functional Tests', 
      description: 'Ensure agent performs its defined workflow correctly',
      example: 'FinOps agent correctly pulls AWS cost data'
    },
    { 
      value: 'integration', 
      label: 'Integration Tests', 
      description: 'Verify communication with external MCP servers or APIs',
      example: 'GitHub MCP actions create issues as expected'
    },
    { 
      value: 'regression', 
      label: 'Regression Tests', 
      description: 'Validate previous capabilities after an update',
      example: 'Ensure "summarize ticket" task still works after prompt change'
    },
    { 
      value: 'performance', 
      label: 'Load & Performance Tests', 
      description: 'Assess response time, throughput, and scaling',
      example: '50 parallel agent executions maintain response time < 3s'
    },
    { 
      value: 'security', 
      label: 'Security Tests', 
      description: 'Check for prompt injection, data leakage, or API misuse',
      example: 'Red-team tests to detect data exposure'
    },
    { 
      value: 'ab-testing', 
      label: 'A/B Evaluation Tests', 
      description: 'Compare agent performance between prompt/model versions',
      example: 'Evaluate accuracy improvement after model change'
    },
    { 
      value: 'compliance', 
      label: 'Compliance Tests', 
      description: 'Ensure regulatory and policy compliance',
      example: 'Validate required disclaimers and regulatory requirements'
    }
  ];

  const scheduleOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'on-deploy', label: 'On Deploy' },
    { value: 'on-commit', label: 'On Commit' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
  ];

  const commonTags = [
    'production', 'staging', 'critical', 'compliance', 
    'security', 'performance', 'regression', 'smoke'
  ];

  const addTag = (tag: string) => {
    if (tag && !suite.tags.includes(tag)) {
      setSuite({ ...suite, tags: [...suite.tags, tag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSuite({ ...suite, tags: suite.tags.filter(t => t !== tag) });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/v1/testing/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suite)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => {
          navigate('/testing');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save test suite:', error);
      alert('Failed to save test suite. Please try again.');
    }
  };

  return (
    <Container fluid style={{ padding: theme.spacing['3xl'] }}>
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h1 style={{ 
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary
        }}>
          Create Test Suite
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Define a new test suite for your agents
        </p>
      </div>

      {saved && (
        <Alert variant="success">
          <strong>Success!</strong> Test suite created. Redirecting to dashboard...
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Form>
            {/* Basic Information */}
            <h5 style={{ marginBottom: theme.spacing.lg }}>Basic Information</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Suite Name *</Form.Label>
                  <Form.Control 
                    type="text"
                    placeholder="e.g., Customer Support Agent - Quality Tests"
                    value={suite.name}
                    onChange={(e) => setSuite({ ...suite, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Type *</Form.Label>
                  <Form.Select 
                    value={suite.type}
                    onChange={(e) => setSuite({ ...suite, type: e.target.value, adapter: e.target.value })}
                  >
                    {testTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    <div style={{ marginTop: '8px' }}>
                      <strong>Purpose:</strong> {testTypes.find(t => t.value === suite.type)?.description}
                      <br />
                      <strong>Example:</strong> {testTypes.find(t => t.value === suite.type)?.example}
                    </div>
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                placeholder="Describe what this test suite validates..."
                value={suite.description}
                onChange={(e) => setSuite({ ...suite, description: e.target.value })}
              />
            </Form.Group>

            {/* Configuration */}
            <h5 style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>Configuration</h5>

            <Row>
              {suite.type === 'agent' && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Agent ID</Form.Label>
                    <Form.Control 
                      type="text"
                      placeholder="e.g., customer-support-agent-v2"
                      value={suite.agentId}
                      onChange={(e) => setSuite({ ...suite, agentId: e.target.value })}
                    />
                    <Form.Text className="text-muted">
                      The agent to test (leave empty for all agents)
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule</Form.Label>
                  <Form.Select 
                    value={suite.schedule}
                    onChange={(e) => setSuite({ ...suite, schedule: e.target.value })}
                  >
                    {scheduleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    When should this test suite run automatically?
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Enable this test suite"
                checked={suite.enabled}
                onChange={(e) => setSuite({ ...suite, enabled: e.target.checked })}
              />
            </Form.Group>

            {/* Tags */}
            <h5 style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>Tags</h5>
            
            <div style={{ marginBottom: theme.spacing.md }}>
              <strong>Common Tags:</strong>
              <div style={{ marginTop: theme.spacing.sm }}>
                {commonTags.map(tag => (
                  <Badge 
                    key={tag}
                    bg="secondary" 
                    style={{ 
                      marginRight: '8px', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      opacity: suite.tags.includes(tag) ? 0.5 : 1
                    }}
                    onClick={() => addTag(tag)}
                  >
                    {suite.tags.includes(tag) ? '✓ ' : '+ '}{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Custom Tag</Form.Label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Form.Control 
                  type="text"
                  placeholder="Add custom tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newTag);
                    }
                  }}
                />
                <Button variant="outline-primary" onClick={() => addTag(newTag)}>
                  Add
                </Button>
              </div>
            </Form.Group>

            {suite.tags.length > 0 && (
              <div style={{ marginBottom: theme.spacing.lg }}>
                <strong>Selected Tags:</strong>
                <div style={{ marginTop: theme.spacing.sm }}>
                  {suite.tags.map(tag => (
                    <Badge 
                      key={tag}
                      bg="primary" 
                      style={{ marginRight: '8px', marginBottom: '8px', cursor: 'pointer' }}
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Test Type Reference Table */}
            <Card style={{ backgroundColor: '#f8f9fa', marginTop: theme.spacing.xl }}>
              <Card.Body>
                <h6><strong>📋 Complete Test Type Reference</strong></h6>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-sm table-bordered" style={{ fontSize: theme.typography.fontSize.sm }}>
                    <thead style={{ backgroundColor: '#e9ecef' }}>
                      <tr>
                        <th>Test Type</th>
                        <th>Purpose</th>
                        <th>Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Unit Tests</strong></td>
                        <td>Validate internal logic or prompt templates</td>
                        <td>Check if the prompt generates expected structure</td>
                      </tr>
                      <tr>
                        <td><strong>Functional Tests</strong></td>
                        <td>Ensure agent performs its defined workflow correctly</td>
                        <td>FinOps agent correctly pulls AWS cost data</td>
                      </tr>
                      <tr>
                        <td><strong>Integration Tests</strong></td>
                        <td>Verify communication with external MCP servers or APIs</td>
                        <td>GitHub MCP actions create issues as expected</td>
                      </tr>
                      <tr>
                        <td><strong>Regression Tests</strong></td>
                        <td>Validate previous capabilities after an update</td>
                        <td>Ensure "summarize ticket" task still works after prompt change</td>
                      </tr>
                      <tr>
                        <td><strong>Load & Performance Tests</strong></td>
                        <td>Assess response time, throughput, and scaling</td>
                        <td>50 parallel agent executions maintain response time &lt; 3s</td>
                      </tr>
                      <tr>
                        <td><strong>Security Tests</strong></td>
                        <td>Check for prompt injection, data leakage, or API misuse</td>
                        <td>Red-team tests to detect data exposure</td>
                      </tr>
                      <tr>
                        <td><strong>A/B Evaluation Tests</strong></td>
                        <td>Compare agent performance between prompt/model versions</td>
                        <td>Evaluate accuracy improvement after model change</td>
                      </tr>
                      <tr>
                        <td><strong>Compliance Tests</strong></td>
                        <td>Ensure regulatory and policy compliance</td>
                        <td>Validate required disclaimers and regulatory requirements</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>

            {/* Actions */}
            <div style={{ 
              marginTop: theme.spacing.xl, 
              display: 'flex', 
              gap: theme.spacing.md,
              justifyContent: 'flex-end'
            }}>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/testing')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={!suite.name || !suite.type}
              >
                Create Test Suite
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Next Steps Info */}
      <Alert variant="info" style={{ marginTop: theme.spacing.xl }}>
        <strong>📝 Next Steps:</strong> After creating the test suite, you can add test cases, 
        configure assertions, and integrate with your CI/CD pipeline.
      </Alert>
    </Container>
  );
};

export default TestSuiteBuilder;
