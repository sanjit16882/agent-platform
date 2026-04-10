/**
 * Enhanced Multi-Agent Workflow Component
 * Main page for creating and executing multi-agent workflows with enhanced UI
 */

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Badge, 
  Spinner,
  Accordion
} from 'react-bootstrap';
import { multiAgentService, WorkflowTask, WorkflowResult } from '../services/multiAgentService';
import { AVAILABLE_AGENTS, WORKFLOW_TEMPLATES, TestingAgentOutput, Agent } from '../types/workflow';
import { TestingAgentResults } from './workflow/TestingAgentResults';
import { s3AgentService } from '../services/s3AgentService';

interface ExecutionStep {
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
}

export const EnhancedMultiAgentWorkflow: React.FC = () => {
  const [code, setCode] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['code-analysis-agent', 'testing-agent']);
  const [workflowType, setWorkflowType] = useState('code-review');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(AVAILABLE_AGENTS);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Sample code for demo
  const sampleCode = `function calculateUserDiscount(user, cart) {
  let total = 0;
  for (let i = 0; i < cart.items.length; i++) {
    total += cart.items[i].price * cart.items[i].quantity;
  }
  if (user.isPremium) {
    total = total * 0.9;
  }
  if (total > 100) {
    total = total - 10;
  }
  return total;
}`;

  useEffect(() => {
    if (code === '') {
      setCode(sampleCode);
    }
    loadAgentsFromS3();
  }, []);

  const loadAgentsFromS3 = async () => {
    try {
      setLoadingAgents(true);
      console.log('🔍 Loading agents from S3 for multi-agent workflow...');
      
      const s3Agents = await s3AgentService.getAllAgents();
      console.log(`✅ Loaded ${s3Agents.length} agents from S3`);
      
      // Convert S3 agents to Agent format
      const formattedAgents: Agent[] = s3Agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        category: agent.category || 'general',
        capabilities: agent.capabilities || [],
        description: agent.description || agent.purpose || '',
        model: (agent as any).model
      }));
      
      // Combine with default agents (in case S3 is empty)
      const allAgents = formattedAgents.length > 0 ? formattedAgents : AVAILABLE_AGENTS;
      
      setAvailableAgents(allAgents);
      console.log(`📋 Available agents for workflow: ${allAgents.length}`);
      
    } catch (error) {
      console.error('❌ Error loading agents from S3:', error);
      // Fallback to default agents
      setAvailableAgents(AVAILABLE_AGENTS);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setWorkflowType(templateId);
      setSelectedAgents(template.agents);
    }
  };

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const selectAllAgents = () => {
    setSelectedAgents(availableAgents.map(a => a.id));
  };

  const clearAllAgents = () => {
    setSelectedAgents([]);
  };

  const executeWorkflow = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    if (selectedAgents.length === 0) {
      setError('Please select at least one agent');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);
    
    // Initialize execution steps
    const steps: ExecutionStep[] = selectedAgents.map(agentId => {
      const agent = availableAgents.find(a => a.id === agentId);
      return {
        agentName: agent?.name || agentId,
        status: 'pending'
      };
    });
    setExecutionSteps(steps);
    setCurrentStep(0);

    try {
      console.log('🎯 [UI] Starting workflow execution');
      console.log('Selected agents:', selectedAgents);
      console.log('Workflow type:', workflowType);
      console.log('Code length:', code.length);

      const task: WorkflowTask = {
        type: workflowType,
        input: code,
        agentSequence: selectedAgents,
        metadata: {
          requestId: `ui-workflow-${Date.now()}`,
          timestamp: new Date().toISOString()
        }
      };

      console.log('📦 [UI] Task prepared:', task);

      // Simulate step-by-step execution for UI feedback
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          const newStep = prev + 1;
          if (newStep < steps.length) {
            setExecutionSteps(current => 
              current.map((step, index) => ({
                ...step,
                status: index < newStep ? 'completed' : index === newStep ? 'running' : 'pending'
              }))
            );
          }
          return newStep;
        });
      }, 2000);

      console.log('📡 [UI] Calling multiAgentService.executeWorkflow...');
      const workflowResult = await multiAgentService.executeWorkflow(task);
      console.log('✅ [UI] Workflow result received:', workflowResult);
      
      clearInterval(stepInterval);
      
      // Mark all steps as completed
      setExecutionSteps(current => 
        current.map(step => ({ ...step, status: 'completed' }))
      );
      
      setResult(workflowResult);
    } catch (err) {
      console.error('❌ [UI] Workflow execution failed:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Mark current step as failed
      setExecutionSteps(current => 
        current.map((step, index) => ({
          ...step,
          status: index === currentStep ? 'failed' : step.status
        }))
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const getTestingAgentResult = (): TestingAgentOutput | null => {
    if (!result) return null;
    
    const testingResult = result.results.find(r => 
      r.agentName && r.agentName.toLowerCase().includes('testing')
    );
    
    if (testingResult && testingResult.output && typeof testingResult.output === 'object') {
      return testingResult.output as TestingAgentOutput;
    }
    
    return null;
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">🔄 Multi-Agent Workflows</h2>
              <p className="text-muted mb-0">
                Execute collaborative AI workflows with Code Analysis, Testing, Documentation, and Monitoring agents
              </p>
            </div>
            <Badge bg="primary" className="fs-6">
              Enhanced Testing Agent
            </Badge>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={4}>
          {/* Configuration Panel */}
          <Card className="mb-4 sticky-top" style={{ top: '20px' }}>
            <Card.Header>
              <h5 className="mb-0">⚙️ Workflow Configuration</h5>
            </Card.Header>
            <Card.Body>
              {/* Workflow Templates */}
              <div className="mb-3">
                <Form.Label>📋 Workflow Template</Form.Label>
                <div className="d-grid gap-2">
                  {WORKFLOW_TEMPLATES.map(template => (
                    <Button
                      key={template.id}
                      variant={workflowType === template.id ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="text-start">
                        <div className="fw-bold">{template.name}</div>
                        <div className="small text-muted">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Agent Selection */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="mb-0">🤖 Select Agents ({selectedAgents.length}/{availableAgents.length})</Form.Label>
                  <div className="d-flex gap-1">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={selectAllAgents}
                      disabled={loadingAgents}
                    >
                      All
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={clearAllAgents}
                      disabled={loadingAgents}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                {loadingAgents ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span className="text-muted">Loading agents...</span>
                  </div>
                ) : (
                  <div className="d-grid gap-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {availableAgents.map(agent => (
                      <div key={agent.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={agent.id}
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => handleAgentToggle(agent.id)}
                        />
                        <label className="form-check-label w-100" htmlFor={agent.id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-bold">{agent.name}</div>
                              <div className="small text-muted">{agent.description}</div>
                            </div>
                            <Badge bg="secondary" className="ms-2">
                              {agent.category}
                            </Badge>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Execute Button */}
              <div className="d-grid">
                <Button
                  variant="success"
                  size="lg"
                  onClick={executeWorkflow}
                  disabled={isExecuting || selectedAgents.length === 0}
                >
                  {isExecuting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Executing Workflow...
                    </>
                  ) : (
                    <>
                      🚀 Execute Workflow
                    </>
                  )}
                </Button>
              </div>

              {/* Execution Progress */}
              {isExecuting && executionSteps.length > 0 && (
                <div className="mt-3">
                  <div className="mb-2">
                    <small className="text-muted">Execution Progress</small>
                  </div>
                  {executionSteps.map((step, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <span className="me-2">{getStepIcon(step.status)}</span>
                      <span className={`small ${step.status === 'running' ? 'fw-bold' : ''}`}>
                        {step.agentName}
                      </span>
                      {step.status === 'running' && (
                        <Spinner size="sm" className="ms-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {/* Code Input */}
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📝 Code Input</h5>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setCode(sampleCode)}
                >
                  Load Sample
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={12}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your code here..."
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                />
              </Form.Group>
              <div className="mt-2 text-muted small">
                {code.split('\n').length} lines, {code.length} characters
              </div>
            </Card.Body>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>❌ Execution Failed</Alert.Heading>
              {error}
            </Alert>
          )}

          {/* Results */}
          {result && (
            <div>
              {/* Workflow Summary */}
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📊 Workflow Results</h5>
                    <div className="d-flex gap-2">
                      <Badge bg="success">
                        {result.summary.successfulAgents}/{result.summary.totalAgents} Agents
                      </Badge>
                      <Badge bg="info">
                        {result.summary.totalDuration}
                      </Badge>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-2">
                        <strong>Workflow ID:</strong> {result.workflowId}
                      </div>
                      <div className="mb-2">
                        <strong>Type:</strong> {result.summary.type}
                      </div>
                      <div className="mb-2">
                        <strong>Status:</strong> 
                        <Badge bg={result.success ? 'success' : 'danger'} className="ms-2">
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-2">
                        <strong>Duration:</strong> {result.summary.totalDuration}
                      </div>
                      <div className="mb-2">
                        <strong>Started:</strong> {new Date(result.summary.startTime).toLocaleTimeString()}
                      </div>
                      <div className="mb-2">
                        <strong>Completed:</strong> {new Date(result.summary.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Enhanced Testing Agent Results */}
              {getTestingAgentResult() && (
                <TestingAgentResults output={getTestingAgentResult()!} />
              )}

              {/* Other Agent Results */}
              <Accordion className="mb-4">
                {result.results.map((agentResult, index) => {
                  // Skip Testing Agent as it's displayed above
                  if (agentResult.agentName && agentResult.agentName.toLowerCase().includes('testing')) {
                    return null;
                  }

                  return (
                    <Accordion.Item key={index} eventKey={index.toString()}>
                      <Accordion.Header>
                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                          <div className="d-flex align-items-center gap-2">
                            <span>{agentResult.status === 'success' ? '✅' : '❌'}</span>
                            <strong>{agentResult.agentName}</strong>
                          </div>
                          <div className="d-flex gap-2">
                            <Badge bg={agentResult.status === 'success' ? 'success' : 'danger'}>
                              {agentResult.status}
                            </Badge>
                            <Badge bg="secondary">
                              {agentResult.duration}ms
                            </Badge>
                          </div>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        {agentResult.status === 'success' ? (
                          <div>
                            {typeof agentResult.output === 'string' ? (
                              <pre className="bg-light p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto' }}>
                                {agentResult.output}
                              </pre>
                            ) : (
                              <pre className="bg-light p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto' }}>
                                {JSON.stringify(agentResult.output, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <Alert variant="danger">
                            <strong>Error:</strong> {agentResult.error}
                          </Alert>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};
