import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

interface TestResult {
  test_id: string;
  test_name: string;
  passed: boolean;
  score: number;
  execution_time: number;
  error?: string;
}

interface ModelTestRun {
  model_id: string;
  model_name: string;
  run_id: string;
  overall_score: number;
  pass_rate: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  total_time: number;
  results: TestResult[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

const AVAILABLE_MODELS: Model[] = [
  {
    id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet v2',
    provider: 'Anthropic',
    description: 'Most capable model, best for complex tasks'
  },
  {
    id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient, good for simple tasks'
  },
  {
    id: 'anthropic.claude-3-opus-20240229-v1:0',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Previous generation flagship model'
  },
  {
    id: 'anthropic.claude-3-sonnet-20240229-v1:0',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed'
  }
];

const ModelComparison: React.FC = () => {
  const [step, setStep] = useState(1);
  const [agents, setAgents] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [modelRuns, setModelRuns] = useState<ModelTestRun[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('');

  useEffect(() => {
    loadAgents();
    loadTests();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/agents/s3`);
      const agentsList = response.data.data || response.data.agents || [];
      setAgents(agentsList);
      console.log('✅ Loaded agents:', agentsList);
    } catch (error) {
      console.error('❌ Error loading agents:', error);
    }
  };

  const loadTests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/testing/library/list`);
      const testsList = response.data.data || [];
      setTests(testsList);
      console.log('✅ Loaded tests:', testsList);
    } catch (error) {
      console.error('❌ Error loading tests:', error);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const toggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const executeComparison = async () => {
    if (!selectedAgent || selectedModels.length === 0 || selectedTests.length === 0) {
      alert('Please select an agent, at least one model, and at least one test');
      return;
    }

    setIsExecuting(true);
    setStep(4);

    // Initialize model runs
    const initialRuns: ModelTestRun[] = selectedModels.map(modelId => ({
      model_id: modelId,
      model_name: AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId,
      run_id: '',
      overall_score: 0,
      pass_rate: 0,
      total_tests: selectedTests.length,
      passed_tests: 0,
      failed_tests: 0,
      total_time: 0,
      results: [],
      status: 'pending'
    }));

    setModelRuns(initialRuns);

    // Execute tests for each model sequentially
    for (let i = 0; i < selectedModels.length; i++) {
      const modelId = selectedModels[i];
      const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
      
      setCurrentModel(modelName);
      
      // Update status to running
      setModelRuns(prev => prev.map((run, idx) =>
        idx === i ? { ...run, status: 'running' } : run
      ));

      try {
        const response = await axios.post(`${API_BASE_URL}/api/testing/execute`, {
          agentId: selectedAgent,
          testIds: selectedTests,
          options: {
            modelId: modelId,
            timeout: 30000
          }
        });

        const result = response.data.data;

        // Update with results
        setModelRuns(prev => prev.map((run, idx) =>
          idx === i ? {
            ...run,
            run_id: result.run_id,
            overall_score: result.summary.overall_score,
            pass_rate: result.summary.pass_rate,
            passed_tests: result.summary.passed,
            failed_tests: result.summary.failed,
            total_time: result.summary.total_execution_time,
            results: result.results,
            status: 'completed'
          } : run
        ));

      } catch (error: any) {
        console.error(`Error executing tests for model ${modelName}:`, error);
        
        // Update with error
        setModelRuns(prev => prev.map((run, idx) =>
          idx === i ? {
            ...run,
            status: 'failed',
            error: error.response?.data?.error || error.message
          } : run
        ));
      }
    }

    setIsExecuting(false);
    setCurrentModel('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return '#f59e0b';
    return theme.colors.danger;
  };

  const getBestModel = () => {
    const completed = modelRuns.filter(r => r.status === 'completed');
    if (completed.length === 0) return null;
    return completed.reduce((best, current) =>
      current.overall_score > best.overall_score ? current : best
    );
  };

  const exportResults = () => {
    const data = {
      agent_id: selectedAgent,
      agent_name: agents.find(a => a.id === selectedAgent)?.name,
      timestamp: new Date().toISOString(),
      models: modelRuns.map(run => ({
        model_id: run.model_id,
        model_name: run.model_name,
        overall_score: run.overall_score,
        pass_rate: run.pass_rate,
        total_tests: run.total_tests,
        passed_tests: run.passed_tests,
        failed_tests: run.failed_tests,
        total_time: run.total_time,
        results: run.results
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-comparison-${Date.now()}.json`;
    a.click();
  };

  return (
    <div style={{ padding: theme.spacing.xl }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm
        }}>
          Model Comparison
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.textSecondary
        }}>
          Run tests across multiple models and compare their performance
        </p>
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.lg
      }}>
        {['Select Agent', 'Select Models', 'Select Tests', 'Results'].map((label, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              backgroundColor: step > idx + 1 ? theme.colors.success : step === idx + 1 ? theme.colors.primary : theme.colors.background,
              color: step >= idx + 1 ? '#fff' : theme.colors.textSecondary,
              fontWeight: step === idx + 1 ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal
            }}
          >
            {idx + 1}. {label}
          </div>
        ))}
      </div>

      {/* Step 1: Select Agent */}
      {step === 1 && (
        <Card>
          <Card.Header>
            <Card.Title>Step 1: Select Agent</Card.Title>
          </Card.Header>
          <Card.Body>
            {agents.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: theme.spacing['3xl'],
                color: theme.colors.textSecondary 
              }}>
                <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>
                  No agents found
                </div>
                <div style={{ fontSize: theme.typography.fontSize.sm }}>
                  Please create an agent first or check your backend connection
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: theme.spacing.lg 
              }}>
                {agents.map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    style={{
                      padding: theme.spacing.lg,
                      border: `2px solid ${selectedAgent === agent.id ? theme.colors.primary : theme.colors.border}`,
                      borderRadius: theme.borderRadius.lg,
                      cursor: 'pointer',
                      backgroundColor: selectedAgent === agent.id ? theme.colors.primaryLight : theme.colors.background,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ 
                      fontWeight: theme.typography.fontWeight.semibold, 
                      marginBottom: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.base
                    }}>
                      {agent.name}
                    </div>
                    <div style={{ 
                      fontSize: theme.typography.fontSize.sm, 
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.md
                    }}>
                      {agent.description || 'No description'}
                    </div>
                    {agent.model && (
                      <div style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.gray100,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.textSecondary,
                        display: 'inline-block'
                      }}>
                        {agent.model}
                      </div>
                    )}
                    {selectedAgent === agent.id && (
                      <div style={{
                        marginTop: theme.spacing.sm,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.white,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        display: 'inline-block',
                        marginLeft: theme.spacing.sm
                      }}>
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: theme.spacing.xl, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!selectedAgent}
              >
                Next: Select Models →
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Step 2: Select Models */}
      {step === 2 && (
        <Card>
          <Card.Header>
            <Card.Title>Step 2: Select Models to Compare</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Select 2 or more models to compare (recommended: 2-4 models)
            </p>
            <div style={{ display: 'grid', gap: theme.spacing.md }}>
              {AVAILABLE_MODELS.map(model => (
                <div
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  style={{
                    padding: theme.spacing.lg,
                    border: `2px solid ${selectedModels.includes(model.id) ? theme.colors.primary : theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    backgroundColor: selectedModels.includes(model.id) ? `${theme.colors.primary}10` : theme.colors.background
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.id)}
                      onChange={() => {}}
                      style={{ width: 20, height: 20 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs }}>
                        {model.name}
                      </div>
                      <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                        {model.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: theme.spacing.xl, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={selectedModels.length < 2}
              >
                Next: Select Tests →
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Step 3: Select Tests */}
      {step === 3 && (
        <Card>
          <Card.Header>
            <Card.Title>Step 3: Select Tests</Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ 
              marginBottom: theme.spacing.lg,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.infoLight,
              borderRadius: theme.borderRadius.md
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
                💡 Select tests to run across all {selectedModels.length} models. Recommended: 5-15 tests for optimal comparison.
              </div>
              {selectedTests.length > 0 && (
                <div style={{ 
                  marginTop: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.primary
                }}>
                  {selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {tests.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: theme.spacing['3xl'],
                color: theme.colors.textSecondary 
              }}>
                <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>
                  No tests found
                </div>
                <div style={{ fontSize: theme.typography.fontSize.sm }}>
                  Please create tests first or check your backend connection
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: theme.spacing.md, maxHeight: '500px', overflowY: 'auto', padding: theme.spacing.xs }}>
                {tests.map(test => (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test.id)}
                    style={{
                      padding: theme.spacing.md,
                      border: `2px solid ${selectedTests.includes(test.id) ? theme.colors.primary : theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      backgroundColor: selectedTests.includes(test.id) ? theme.colors.primaryLight : theme.colors.background,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.id)}
                        onChange={() => {}}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: theme.spacing.xs }}>
                          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{test.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                          <span style={{
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: theme.colors.backgroundSecondary,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.textSecondary
                          }}>
                            {test.category}
                          </span>
                          {test.type && (
                            <span style={{
                              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                              backgroundColor: theme.colors.gray100,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.textSecondary
                            }}>
                              {test.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: theme.spacing.xl, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                onClick={executeComparison}
                disabled={selectedTests.length === 0}
              >
                Run Comparison ({selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''}) →
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <>
          {isExecuting && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Body>
                <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                  <div style={{ fontSize: theme.typography.fontSize['2xl'], marginBottom: theme.spacing.md }}>
                    ⚡ Running Tests...
                  </div>
                  <div style={{ color: theme.colors.textSecondary }}>
                    Currently testing: <strong>{currentModel}</strong>
                  </div>
                  <div style={{ marginTop: theme.spacing.lg }}>
                    {modelRuns.filter(r => r.status === 'completed').length} / {modelRuns.length} models completed
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Summary */}
          {!isExecuting && modelRuns.some(r => r.status === 'completed') && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Header>
                <Card.Title>Comparison Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.lg }}>
                  <div>
                    <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                      Best Model
                    </div>
                    <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold }}>
                      {getBestModel()?.model_name || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                      Best Score
                    </div>
                    <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: getScoreColor(getBestModel()?.overall_score || 0) }}>
                      {getBestModel()?.overall_score.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                      Models Tested
                    </div>
                    <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold }}>
                      {modelRuns.filter(r => r.status === 'completed').length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                      Tests Per Model
                    </div>
                    <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold }}>
                      {selectedTests.length}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Model Results */}
          {modelRuns.map((run, idx) => (
            <Card key={idx} style={{ marginBottom: theme.spacing.lg }}>
              <Card.Header>
                <Card.Title>
                  {run.model_name}
                  {run.status === 'running' && ' (Running...)'}
                  {run.status === 'pending' && ' (Pending)'}
                  {run.status === 'failed' && ' (Failed)'}
                </Card.Title>
              </Card.Header>
              <Card.Body>
                {run.status === 'completed' && (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: theme.spacing.lg,
                      marginBottom: theme.spacing.xl
                    }}>
                      <div>
                        <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                          Overall Score
                        </div>
                        <div style={{
                          fontSize: theme.typography.fontSize['2xl'],
                          fontWeight: theme.typography.fontWeight.bold,
                          color: getScoreColor(run.overall_score)
                        }}>
                          {run.overall_score.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                          Pass Rate
                        </div>
                        <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                          {run.pass_rate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                          Tests Passed
                        </div>
                        <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                          {run.passed_tests}/{run.total_tests}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                          Total Time
                        </div>
                        <div style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                          {(run.total_time / 1000).toFixed(1)}s
                        </div>
                      </div>
                    </div>

                    {/* Individual Test Results */}
                    <div style={{ marginTop: theme.spacing.xl }}>
                      <h4 style={{ marginBottom: theme.spacing.md }}>Test Results</h4>
                      <div style={{ display: 'grid', gap: theme.spacing.sm }}>
                        {run.results.map((result, resultIdx) => (
                          <div
                            key={resultIdx}
                            style={{
                              padding: theme.spacing.md,
                              backgroundColor: result.passed ? `${theme.colors.success}10` : `${theme.colors.danger}10`,
                              borderLeft: `4px solid ${result.passed ? theme.colors.success : theme.colors.danger}`,
                              borderRadius: theme.borderRadius.sm
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{result.test_name}</span>
                              <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
                                <span style={{ fontSize: theme.typography.fontSize.sm }}>
                                  Score: {result.score.toFixed(1)}%
                                </span>
                                <span style={{ fontSize: theme.typography.fontSize.sm }}>
                                  {(result.execution_time / 1000).toFixed(2)}s
                                </span>
                                <span style={{ fontSize: theme.typography.fontSize.lg }}>
                                  {result.passed ? '✅' : '❌'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {run.status === 'failed' && (
                  <div style={{ padding: theme.spacing.lg, backgroundColor: `${theme.colors.danger}10`, borderRadius: theme.borderRadius.md }}>
                    <strong>Error:</strong> {run.error}
                  </div>
                )}

                {run.status === 'pending' && (
                  <div style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.textSecondary }}>
                    Waiting to execute...
                  </div>
                )}

                {run.status === 'running' && (
                  <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
                    <div style={{ fontSize: theme.typography.fontSize.xl }}>⚡</div>
                    <div style={{ color: theme.colors.textSecondary }}>Running tests...</div>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}

          {/* Actions */}
          {!isExecuting && modelRuns.some(r => r.status === 'completed') && (
            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'center', marginTop: theme.spacing.xl }}>
              <Button variant="secondary" onClick={() => {
                setStep(1);
                setModelRuns([]);
                setSelectedModels([]);
                setSelectedTests([]);
              }}>
                Start New Comparison
              </Button>
              <Button variant="primary" onClick={exportResults}>
                Export Results
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModelComparison;
