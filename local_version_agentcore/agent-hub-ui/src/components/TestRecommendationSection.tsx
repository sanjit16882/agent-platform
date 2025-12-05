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
      const response = await fetch(
        `http://localhost:4002/api/v1/test-metadata/agent-types/${selectedCategory}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch agent types');
      }

      const data = await response.json();
      setAgentTypes(data.agentTypes || []);
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
