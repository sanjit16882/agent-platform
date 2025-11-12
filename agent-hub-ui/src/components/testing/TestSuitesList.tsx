import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Spinner, Alert, Accordion } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../../styles/theme';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  testCount: number;
  testCases: TestCase[];
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  example: string;
}

const TestSuitesList: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      
      console.log('🔍 TestSuitesList: Loading data from', apiUrl);
      
      const [agentsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/testing/agents`),
        axios.get(`${apiUrl}/api/testing/suites/universal`)
      ]);
      
      console.log('✅ Agents response:', agentsResponse.data);
      console.log('✅ Categories response:', categoriesResponse.data);
      
      setAgents(agentsResponse.data.agents || []);
      setCategories(categoriesResponse.data.categories || []);
      setError(null);
      
      console.log('✅ State updated - agents:', agentsResponse.data.agents?.length, 'categories:', categoriesResponse.data.categories?.length);
    } catch (err: any) {
      console.error('❌ Failed to load data:', err);
      setError('Failed to load testing data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSelectAllAgents = () => {
    setSelectedAgents(selectedAgents.length === agents.length ? [] : agents.map(a => a.id));
  };

  const handleExecuteTests = async () => {
    if (selectedAgents.length === 0) {
      alert('Please select at least one agent');
      return;
    }
    
    if (!selectedCategory) {
      alert('Please select a test category');
      return;
    }

    setExecuting(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      await axios.post(`${apiUrl}/api/testing/run/category`, {
        agentIds: selectedAgents,
        categoryId: selectedCategory
      });
      
      alert('Test execution started! Redirecting to results...');
      
      // Navigate to Test Results tab immediately
      navigate('/agent-testing/results');
    } catch (err: any) {
      alert('Failed to execute tests');
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  console.log('🎨 TestSuitesList rendering - agents:', agents.length, 'categories:', categories.length);

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <h4>🧪 AI Agent Testing Framework</h4>
          <p className="text-muted">Select agents and test categories</p>
          <p className="text-muted small">Debug: {agents.length} agents, {categories.length} categories loaded</p>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>Step 1: Select Agents</strong></span>
            <div>
              <Badge bg="primary" className="me-2">{selectedAgents.length} of {agents.length} selected</Badge>
              <Button variant="outline-primary" size="sm" onClick={handleSelectAllAgents}>
                {selectedAgents.length === agents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {agents.length === 0 ? (
            <Alert variant="info">
              No agents available. Please ensure agents are configured in the system.
            </Alert>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  onClick={() => handleAgentSelection(agent.id)}
                  style={{
                    padding: '12px',
                    border: selectedAgents.includes(agent.id) ? '2px solid #0d6efd' : '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: selectedAgents.includes(agent.id) ? '#e7f1ff' : 'white',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedAgents.includes(agent.id)) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedAgents.includes(agent.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedAgents.includes(agent.id)}
                    onChange={() => {}}
                    style={{ marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95em', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#6c757d', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.description}
                    </div>
                    <Badge bg="secondary" style={{ fontSize: '0.75em' }}>{agent.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <strong>Step 2: Select Test Category</strong>
        </Card.Header>
        <Card.Body>
          {categories.length === 0 ? (
            <Alert variant="info">
              No test categories available. Please check backend configuration.
            </Alert>
          ) : (
            <Accordion>
              {categories.map((category, index) => (
              <Accordion.Item eventKey={String(index)} key={category.id}>
                <Accordion.Header>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: '20px' }}>
                    <span>
                      <strong>{category.name}</strong>
                      {selectedCategory === category.id && <Badge bg="success" className="ms-2">Selected</Badge>}
                    </span>
                    <Badge bg="info">{category.testCount} tests</Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <p className="text-muted">{category.description}</p>
                  <h6>Test Cases:</h6>
                  {category.testCases.map((testCase) => (
                    <Card key={testCase.id} className="mb-2">
                      <Card.Body className="py-2">
                        <strong>{testCase.name}</strong>
                        <p className="text-muted small mb-1">{testCase.description}</p>
                        <p className="text-muted small mb-0"><em>{testCase.example}</em></p>
                      </Card.Body>
                    </Card>
                  ))}
                  <Button 
                    variant={selectedCategory === category.id ? "success" : "primary"}
                    className="mt-3"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {selectedCategory === category.id ? '✓ Selected' : 'Select This Category'}
                  </Button>
                </Accordion.Body>
              </Accordion.Item>
            ))}
            </Accordion>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <strong>Step 3: Execute Tests</strong>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="mb-2"><strong>Selected Agents:</strong> {selectedAgents.length}</p>
              <p className="mb-0"><strong>Category:</strong> {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'None'}</p>
            </div>
            <Button 
              variant="success" 
              size="lg"
              onClick={handleExecuteTests}
              disabled={executing || selectedAgents.length === 0 || !selectedCategory}
            >
              {executing ? <><Spinner animation="border" size="sm" className="me-2" />Executing...</> : '▶️ Execute Tests'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TestSuitesList;
