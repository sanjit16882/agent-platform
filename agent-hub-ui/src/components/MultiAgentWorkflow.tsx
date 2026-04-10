import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useAgentContext } from '../context/AgentContext';

interface Agent {
  id: string;
  name: string;
  category: string;
}

interface WorkflowResult {
  agentId: string;
  agentName: string;
  status: 'success' | 'failed';
  output?: string;
  error?: string;
  duration: number;
  timestamp: string;
}

const MultiAgentWorkflow: React.FC<{ agents?: Agent[] }> = ({ agents: propAgents }) => {
  const { deployedAgents } = useAgentContext();
  const agents = propAgents || deployedAgents || [];
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<WorkflowResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const executeWorkflow = async () => {
    if (selectedAgents.length === 0 || !input) {
      alert('Please select agents and provide input');
      return;
    }

    setIsExecuting(true);
    setResults([]);
    setCurrentStep(0);

    try {
      const response = await fetch('http://localhost:3002/api/v1/multi-agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'multi-agent-workflow',
          input,
          agentSequence: selectedAgents,
          metadata: {
            timestamp: new Date().toISOString(),
            agentCount: selectedAgents.length
          }
        })
      });

      const data = await response.json();

      console.log('📊 Workflow Response:', data);

      if (data.success) {
        setResults(data.results);
        setCurrentStep(data.results.length);
        
        // Log each result for debugging
        data.results.forEach((result: WorkflowResult, i: number) => {
          console.log(`Step ${i + 1}: ${result.agentName} - ${result.status}`);
          if (result.error) {
            console.error(`  Error: ${result.error}`);
          }
          if (result.output) {
            console.log(`  Output: ${result.output.substring(0, 100)}...`);
          }
        });
      } else {
        console.error('Workflow failed:', data.error);
        alert(`Workflow failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const moveAgentUp = (index: number) => {
    if (index === 0) return;
    const newAgents = [...selectedAgents];
    [newAgents[index - 1], newAgents[index]] = [newAgents[index], newAgents[index - 1]];
    setSelectedAgents(newAgents);
  };

  const moveAgentDown = (index: number) => {
    if (index === selectedAgents.length - 1) return;
    const newAgents = [...selectedAgents];
    [newAgents[index], newAgents[index + 1]] = [newAgents[index + 1], newAgents[index]];
    setSelectedAgents(newAgents);
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-diagram-3 me-2 text-primary"></i>
                Multi-Agent Collaboration Workflow
              </h2>
              <p className="text-muted mb-0">Orchestrate multiple AI agents to work together on complex tasks</p>
            </div>
            {selectedAgents.length > 0 && (
              <div className="badge bg-primary fs-5 px-3 py-2">
                {selectedAgents.length} Agent{selectedAgents.length !== 1 ? 's' : ''} Selected
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column - Configuration */}
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Workflow Configuration
              </h5>
            </div>
            <div className="card-body">
              
              {/* Agent Selection */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-robot me-2 text-primary"></i>
                  Available Agents
                </label>
                <p className="text-muted small mb-3">Click on agents to add them to your workflow sequence</p>
                <div className="row g-3">
                  {agents.map((agent: Agent) => (
                    <div key={agent.id} className="col-md-6 col-xl-4">
                      <div
                        onClick={() => toggleAgent(agent.id)}
                        className={`card h-100 transition-all ${
                          selectedAgents.includes(agent.id)
                            ? 'border-primary border-3 shadow-sm'
                            : 'border hover-shadow'
                        }`}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          transform: selectedAgents.includes(agent.id) ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="card-title mb-1 fw-bold">{agent.name}</h6>
                              <span className="badge bg-secondary">{agent.category}</span>
                            </div>
                            {selectedAgents.includes(agent.id) && (
                              <div className="ms-2">
                                <span className="badge bg-primary fs-6 px-2 py-1">
                                  #{selectedAgents.indexOf(agent.id) + 1}
                                </span>
                              </div>
                            )}
                          </div>
                          {selectedAgents.includes(agent.id) && (
                            <div className="mt-2">
                              <small className="text-primary">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Added to workflow
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {agents.length === 0 && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    No agents available. Please create agents first.
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-code-square me-2 text-primary"></i>
                  Task Input
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="form-control font-monospace"
                  rows={8}
                  placeholder="Enter your code, description, or task details here...&#10;&#10;Example:&#10;function calculateTotal(items) {&#10;  return items.reduce((sum, item) => sum + item.price, 0);&#10;}"
                  style={{ fontSize: '0.9rem' }}
                />
                <div className="form-text">Provide the code, feature description, or task that agents will work on</div>
              </div>

              {/* Execute Button */}
              <div className="d-grid">
                <button
                  onClick={executeWorkflow}
                  disabled={isExecuting || selectedAgents.length === 0 || !input}
                  className="btn btn-primary btn-lg"
                  style={{ padding: '1rem' }}
                >
                  {isExecuting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Executing Workflow...
                    </>
                  ) : (
                    <>
                      <Play size={20} className="me-2" style={{ display: 'inline' }} />
                      Execute Multi-Agent Workflow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Execution Sequence & Info */}
        <div className="col-lg-4">
          {/* Execution Sequence */}
          {selectedAgents.length > 0 ? (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-arrow-right-circle me-2"></i>
                  Execution Sequence
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  {selectedAgents.map((agentId, index) => {
                    const agent = agents.find((a: Agent) => a.id === agentId);
                    return (
                      <div key={agentId}>
                        <div className="d-flex align-items-center">
                          <div className="badge bg-primary rounded-circle me-3" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            {index + 1}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold">{agent?.name}</div>
                            <small className="text-muted">{agent?.category}</small>
                          </div>
                        </div>
                        {index < selectedAgents.length - 1 && (
                          <div className="ms-3 ps-2 border-start border-2 border-primary" style={{ height: '20px', marginTop: '8px', marginBottom: '8px' }}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm mb-4 border-warning">
              <div className="card-body text-center py-5">
                <i className="bi bi-info-circle text-warning" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3">No Agents Selected</h5>
                <p className="text-muted">Click on agents to build your workflow sequence</p>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="card shadow-sm border-info">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">
                <i className="bi bi-lightbulb me-2"></i>
                How It Works
              </h6>
            </div>
            <div className="card-body">
              <ol className="mb-0 ps-3">
                <li className="mb-2">Select agents in the order you want them to execute</li>
                <li className="mb-2">Each agent receives output from the previous agent</li>
                <li className="mb-2">Results are combined into a final report</li>
                <li className="mb-0">Monitor progress in real-time</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">
                  <i className="bi bi-check-circle me-2"></i>
                  Workflow Results
                </h4>
              </div>
              <div className="card-body">
                <div className="accordion" id="resultsAccordion">
                  {results.map((result, index) => (
                    <div key={index} className="accordion-item border mb-2">
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${expandedIndex !== index ? 'collapsed' : ''} ${result.status === 'success' ? 'bg-light' : 'bg-danger bg-opacity-10'}`}
                          type="button"
                          onClick={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
                          aria-expanded={expandedIndex === index ? 'true' : 'false'}
                        >
                          <div className="d-flex align-items-center w-100 pe-3">
                            <div className="badge bg-primary rounded-circle me-3" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {index + 1}
                            </div>
                            {result.status === 'success' ? (
                              <CheckCircle size={24} className="text-success me-3" />
                            ) : (
                              <XCircle size={24} className="text-danger me-3" />
                            )}
                            <div className="flex-grow-1">
                              <div className="fw-bold">{result.agentName}</div>
                              <small className="text-muted">
                                {result.status === 'success' ? 'Completed successfully' : 'Failed'}
                              </small>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-secondary">{result.duration}ms</span>
                              <Clock size={16} className="text-muted" />
                            </div>
                          </div>
                        </button>
                      </h2>
                      <div
                        id={`collapse${index}`}
                        className={`accordion-collapse collapse ${expandedIndex === index ? 'show' : ''}`}
                        style={{ display: expandedIndex === index ? 'block' : 'none' }}
                      >
                        <div className="accordion-body">
                          {result.status === 'failed' && result.error ? (
                            <div className="alert alert-danger mb-0">
                              <h6 className="alert-heading">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Error
                              </h6>
                              <hr />
                              <pre className="mb-0 font-monospace" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.9rem' }}>
                                {result.error}
                              </pre>
                            </div>
                          ) : (
                            <div className={`alert ${result.status === 'success' ? 'alert-success' : 'alert-danger'} mb-0`}>
                              <h6 className="alert-heading">
                                <i className="bi bi-file-text me-2"></i>
                                Output
                              </h6>
                              <hr />
                              <pre className="mb-0 font-monospace" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.9rem' }}>
                                {result.output || 'No output'}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                <div className="mt-4 p-3 bg-light rounded">
                  <div className="row text-center">
                    <div className="col-md-3">
                      <div className="fw-bold text-primary" style={{ fontSize: '1.5rem' }}>{results.length}</div>
                      <small className="text-muted">Total Steps</small>
                    </div>
                    <div className="col-md-3">
                      <div className="fw-bold text-success" style={{ fontSize: '1.5rem' }}>
                        {results.filter(r => r.status === 'success').length}
                      </div>
                      <small className="text-muted">Successful</small>
                    </div>
                    <div className="col-md-3">
                      <div className="fw-bold text-danger" style={{ fontSize: '1.5rem' }}>
                        {results.filter(r => r.status === 'failed').length}
                      </div>
                      <small className="text-muted">Failed</small>
                    </div>
                    <div className="col-md-3">
                      <div className="fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>
                        {results.reduce((sum, r) => sum + r.duration, 0)}ms
                      </div>
                      <small className="text-muted">Total Time</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiAgentWorkflow;
