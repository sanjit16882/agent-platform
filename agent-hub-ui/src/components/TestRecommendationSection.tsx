import React, { useState, useEffect } from 'react';
import { Card, Form, Alert } from 'react-bootstrap';

interface TestRecommendationSectionProps {
  category: string | null;
  agentSubType: string | null;
  onCategoryChange: (category: string) => void;
  onAgentSubTypeChange: (subType: string) => void;
  disabled?: boolean;
}

interface AgentType {
  id: string;
  description: string;
  coreTestCount: number;
}

const TestRecommendationSection: React.FC<TestRecommendationSectionProps> = ({
  category,
  agentSubType,
  onCategoryChange,
  onAgentSubTypeChange,
  disabled = false
}) => {
  const [agentTypes, setAgentTypes] = useState<AgentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent types when category changes
  useEffect(() => {
    if (category) {
      fetchAgentTypes(category);
    } else {
      setAgentTypes([]);
      onAgentSubTypeChange('');
    }
  }, [category]);

  const fetchAgentTypes = async (selectedCategory: string) => {
    setLoading(true);
    setError(null);

    try {
      // Temporary: Use hardcoded agent types until backend route is fixed
      const agentTypesByCategory: Record<string, AgentType[]> = {
        'QE': [
          { id: 'Test Case Creation', description: 'Agents that generate test cases', coreTestCount: 6 },
          { id: 'Defect Reporting', description: 'Agents that analyze and report defects', coreTestCount: 5 },
          { id: 'Test Automation', description: 'Agents that create automated tests', coreTestCount: 5 },
          { id: 'API Testing', description: 'Agents that test REST APIs', coreTestCount: 4 }
        ],
        'Testing': [
          { id: 'Test Execution', description: 'Agents that execute test suites', coreTestCount: 7 },
          { id: 'Test Analysis', description: 'Agents that analyze test results', coreTestCount: 5 }
        ],
        'Documentation': [
          { id: 'API Documentation', description: 'Agents that generate API docs', coreTestCount: 4 },
          { id: 'User Guides', description: 'Agents that create user guides', coreTestCount: 3 }
        ],
        'DevOps': [
          { id: 'CI/CD Pipeline', description: 'Agents that manage CI/CD', coreTestCount: 5 },
          { id: 'Infrastructure as Code', description: 'Agents that generate IaC', coreTestCount: 5 },
          { id: 'Container Management', description: 'Agents for Docker/K8s', coreTestCount: 4 }
        ],
        'SRE': [
          { id: 'Performance Monitoring', description: 'Agents that monitor performance', coreTestCount: 4 },
          { id: 'Incident Response', description: 'Agents that assist with incidents', coreTestCount: 4 }
        ],
        'Security': [
          { id: 'Vulnerability Assessment', description: 'Agents that identify vulnerabilities', coreTestCount: 5 },
          { id: 'Security Audit', description: 'Agents that perform security audits', coreTestCount: 5 }
        ],
        'Security Testing': [
          { id: 'Penetration Testing', description: 'Agents that perform pen testing', coreTestCount: 4 },
          { id: 'Security Test Case Generation', description: 'Agents that generate security tests', coreTestCount: 4 }
        ],
        'Automated Testing': [
          { id: 'Test Framework Setup', description: 'Agents that set up test frameworks', coreTestCount: 4 },
          { id: 'Test Script Generation', description: 'Agents that generate test scripts', coreTestCount: 4 }
        ],
        'Development': [
          { id: 'Code Generation', description: 'Agents that generate code', coreTestCount: 5 },
          { id: 'Code Review', description: 'Agents that review code', coreTestCount: 4 },
          { id: 'Bug Fixing', description: 'Agents that fix bugs', coreTestCount: 4 },
          { id: 'Documentation', description: 'Agents that generate docs', coreTestCount: 4 }
        ],
        'Business Analysis': [
          { id: 'Requirements Analysis', description: 'Agents that analyze requirements', coreTestCount: 4 },
          { id: 'User Story Creation', description: 'Agents that create user stories', coreTestCount: 4 },
          { id: 'Process Mapping', description: 'Agents that map processes', coreTestCount: 4 }
        ],
        'Product Management': [
          { id: 'Feature Prioritization', description: 'Agents that prioritize features', coreTestCount: 4 },
          { id: 'Roadmap Planning', description: 'Agents that plan roadmaps', coreTestCount: 4 },
          { id: 'Market Analysis', description: 'Agents that analyze markets', coreTestCount: 4 }
        ],
        'Project Management': [
          { id: 'Project Planning', description: 'Agents that create project plans', coreTestCount: 4 },
          { id: 'Risk Management', description: 'Agents that manage risks', coreTestCount: 4 },
          { id: 'Status Reporting', description: 'Agents that generate status reports', coreTestCount: 4 }
        ],
        'Production Support': [
          { id: 'Incident Analysis', description: 'Agents that analyze incidents', coreTestCount: 4 },
          { id: 'Root Cause Analysis', description: 'Agents that perform RCA', coreTestCount: 4 },
          { id: 'Troubleshooting', description: 'Agents that troubleshoot issues', coreTestCount: 4 }
        ]
      };

      setAgentTypes(agentTypesByCategory[selectedCategory] || []);
      console.log(`✅ Loaded ${agentTypesByCategory[selectedCategory]?.length || 0} agent types for category: ${selectedCategory}`);
    } catch (err) {
      console.error('Error fetching agent types:', err);
      setError('Failed to load agent types. Please try again.');
      setAgentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    onCategoryChange(newCategory);
    // Reset agent sub-type when category changes
    onAgentSubTypeChange('');
  };

  const handleAgentSubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onAgentSubTypeChange(e.target.value);
  };

  return (
    <Card className="mb-3" style={{ border: '1px solid #0ea5e9' }}>
      <Card.Header 
        className="d-flex align-items-center"
        style={{ 
          backgroundColor: '#f0f9ff',
          borderBottom: '1px solid #0ea5e9',
          color: '#0369a1'
        }}
      >
        <span style={{ marginRight: '8px' }}>ℹ️</span>
        <span>Test Recommendations (Optional)</span>
      </Card.Header>
      <Card.Body>
        <Alert variant="light" className="mb-3">
          <small className="text-muted">
            Help us recommend relevant tests by categorizing your agent. 
            This is optional but improves test selection in the Agent Testing workflow.
          </small>
        </Alert>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Agent Category</Form.Label>
          <Form.Select
            value={category || ''}
            onChange={handleCategoryChange}
            disabled={disabled}
          >
            <option value="">Select a category (optional)...</option>
            <option value="QE">Quality Engineering</option>
            <option value="DevOps">DevOps Engineering</option>
            <option value="Security">Security</option>
            <option value="Security Testing">Security Testing</option>
            <option value="Automated Testing">Automated Testing</option>
            <option value="Development">Development</option>
            <option value="Business Analysis">Business Analysis</option>
            <option value="Product Management">Product Management</option>
            <option value="Project Management">Project Management</option>
            <option value="Production Support">Production Support</option>
            <option value="SRE">Site Reliability Engineering</option>
          </Form.Select>
          <Form.Text className="text-muted">
            Select the primary domain for this agent
          </Form.Text>
        </Form.Group>

        <Form.Group>
          <Form.Label>Agent Sub-Type</Form.Label>
          <Form.Select
            value={agentSubType || ''}
            onChange={handleAgentSubTypeChange}
            disabled={!category || disabled || loading}
          >
            <option value="">
              {!category 
                ? 'Select a category first...' 
                : loading 
                ? 'Loading...' 
                : 'Select a sub-type (optional)...'}
            </option>
            {agentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.id} ({type.coreTestCount} tests)
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            This helps us recommend relevant tests when you test this agent
          </Form.Text>
        </Form.Group>

        {category && agentSubType && (
          <Alert variant="success" className="mt-3 mb-0">
            <small>
              ✅ When testing this agent, we'll recommend{' '}
              <strong>
                {agentTypes.find(t => t.id === agentSubType)?.coreTestCount || 0} CORE tests
              </strong>{' '}
              specifically for {category} - {agentSubType} agents.
            </small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default TestRecommendationSection;
