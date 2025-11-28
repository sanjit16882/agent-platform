import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

interface BatchJob {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  modelIds: string[];
  testIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  runId?: string;
  createdAt: string;
  completedAt?: string;
}

const BatchTestExecution: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const pollIntervalsRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Form state
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [batchName, setBatchName] = useState('');

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds to sync with catalog changes
    const refreshInterval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
      // Clean up all polling intervals
      pollIntervalsRef.current.forEach(interval => clearInterval(interval));
      pollIntervalsRef.current.clear();
    };
  }, []);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    
    try {
      // Load agents from testing API (synced with catalog)
      const agentsPromise = fetch(`${API_BASE_URL}/api/testing/agents`)
        .then(r => r.json())
        .catch(() => ({ success: false, agents: [] }));

      // Load models
      const modelsPromise = fetch(`${API_BASE_URL}/api/v1/models/available`)
        .then(r => r.json())
        .catch(() => ({ models: [] }));

      // Load tests from test library (correct endpoint)
      const testsPromise = fetch(`${API_BASE_URL}/api/testing/library/list`)
        .then(r => r.json())
        .catch(() => ({ success: false, data: [] }));

      const [agentsData, modelsData, testsData] = await Promise.all([
        agentsPromise,
        modelsPromise,
        testsPromise
      ]);

      const agentsList = agentsData.agents || [];
      const modelsList = modelsData.models || [];
      const testsList = testsData.data || [];

      console.log('Loaded agents:', agentsList);
      console.log('Loaded models:', modelsList);
      console.log('Loaded tests:', testsList);

      setAgents(agentsList);
      setModels(modelsList);
      setTests(testsList);
      setLastRefresh(new Date());

      if (agentsList.length === 0) {
        console.warn('No agents loaded from API - check if agents exist in catalog');
      }
      if (testsList.length === 0) {
        console.warn('No tests loaded from API - check if tests exist in library');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  const createBatchJob = async () => {
    if (selectedAgents.length === 0 || selectedModels.length === 0 || selectedTests.length === 0) {
      alert('Please select at least one agent, model, and test');
      return;
    }

    setLoading(true);

    try {
      // Create batch jobs for each agent
      const jobs: BatchJob[] = selectedAgents.map(agentId => {
        const agent = agents.find(a => a.id === agentId);
        return {
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: batchName || `Batch Test - ${new Date().toLocaleString()}`,
          agentId,
          agentName: agent?.name || agentId,
          modelIds: selectedModels,
          testIds: selectedTests,
          status: 'pending' as const,
          progress: 0,
          createdAt: new Date().toISOString()
        };
      });

      setBatchJobs(prev => [...jobs, ...prev]);

      // Execute each job
      for (const job of jobs) {
        executeBatchJob(job);
      }

      // Reset form
      setSelectedAgents([]);
      setSelectedModels([]);
      setSelectedTests([]);
      setBatchName('');
    } catch (error) {
      console.error('Error creating batch job:', error);
      alert('Failed to create batch job');
    } finally {
      setLoading(false);
    }
  };

  const executeBatchJob = async (job: BatchJob) => {
    // Update status to running
    setBatchJobs(prev => prev.map(j => 
      j.id === job.id ? { ...j, status: 'running' as const } : j
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/api/testing/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: job.agentId,
          modelIds: job.modelIds,
          testIds: job.testIds,
          inputs: {} // Would need to be configured
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute tests: ${errorText}`);
      }

      const data = await response.json();
      const runId = data.runId;

      // Validate runId before polling
      if (!runId) {
        console.error('No runId returned from API:', data);
        throw new Error('No runId returned from test execution');
      }

      // Update job with runId
      setBatchJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, runId } : j
      ));

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE_URL}/api/testing/runs/${runId}`);
          
          if (!statusRes.ok) {
            console.error(`Failed to fetch run status: ${statusRes.status}`);
            clearInterval(pollInterval);
            pollIntervalsRef.current.delete(job.id);
            setBatchJobs(prev => prev.map(j => 
              j.id === job.id ? { ...j, status: 'failed' as const } : j
            ));
            return;
          }

          const statusData = await statusRes.json();
          const run = statusData.data;

          if (!run) {
            console.error('No run data returned:', statusData);
            clearInterval(pollInterval);
            pollIntervalsRef.current.delete(job.id);
            return;
          }

          if (run.status === 'completed' || run.status === 'failed') {
            clearInterval(pollInterval);
            pollIntervalsRef.current.delete(job.id);
            setBatchJobs(prev => prev.map(j => 
              j.id === job.id ? {
                ...j,
                status: run.status,
                progress: 100,
                completedAt: new Date().toISOString()
              } : j
            ));
          } else {
            // Update progress
            const progress = run.results ? (run.results.length / job.testIds.length) * 100 : 0;
            setBatchJobs(prev => prev.map(j => 
              j.id === job.id ? { ...j, progress } : j
            ));
          }
        } catch (error) {
          console.error('Error polling status:', error);
          clearInterval(pollInterval);
          pollIntervalsRef.current.delete(job.id);
          setBatchJobs(prev => prev.map(j => 
            j.id === job.id ? { ...j, status: 'failed' as const } : j
          ));
        }
      }, 2000);

      // Store interval for cleanup
      pollIntervalsRef.current.set(job.id, pollInterval);
    } catch (error) {
      console.error('Error executing batch job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setBatchJobs(prev => prev.map(j => 
        j.id === job.id ? { 
          ...j, 
          status: 'failed' as const,
          completedAt: new Date().toISOString()
        } : j
      ));
      alert(`Failed to execute batch job: ${errorMessage}`);
    }
  };

  const toggleSelection = (array: string[], value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <div style={{ 
        marginBottom: theme.spacing.xl,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h1 style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm
          }}>
            Batch Test Execution
          </h1>
          <p style={{
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary
          }}>
            Run tests across multiple agents simultaneously
          </p>
          {lastRefresh && (
            <p style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.xs
            }}>
              Last synced: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 30s
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={{ minWidth: '120px' }}
        >
          {refreshing ? '🔄 Syncing...' : '🔄 Refresh'}
        </Button>
      </div>

      {/* Create Batch Job */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Create Batch Test Job</Card.Title>
        </Card.Header>
        <Card.Body>
          {/* Batch Name */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm
            }}>
              Batch Name (Optional)
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Nightly Regression Tests"
              style={{
                width: '100%',
                padding: theme.spacing.md,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm
              }}
            />
          </div>

          {/* Select Agents */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm
            }}>
              Select Agents ({selectedAgents.length} of {agents.length} selected)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: theme.spacing.md,
              maxHeight: '200px',
              overflowY: 'auto',
              padding: theme.spacing.md,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.backgroundSecondary
            }}>
              {agents.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: theme.spacing.xl,
                  textAlign: 'center',
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm
                }}>
                  <div style={{ marginBottom: theme.spacing.sm }}>
                    📭 No agents available
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.xs }}>
                    Create agents in the Agent Catalog, then click Refresh to sync
                  </div>
                </div>
              ) : (
                agents.map(agent => {
                  const agentId = agent.id || agent.agent_id;
                  const agentName = agent.name || agent.agent_name || 'Unnamed Agent';
                  const agentCategory = agent.category || 'General';
                  return (
                    <label
                      key={agentId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: theme.spacing.sm,
                        backgroundColor: selectedAgents.includes(agentId) ? theme.colors.primaryLight : theme.colors.white,
                        border: `1px solid ${selectedAgents.includes(agentId) ? theme.colors.primary : theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agentId)}
                          onChange={() => toggleSelection(selectedAgents, agentId, setSelectedAgents)}
                          style={{ marginRight: theme.spacing.sm }}
                        />
                        <span style={{ 
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium
                        }}>
                          {agentName}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.textSecondary,
                        marginLeft: '24px',
                        marginTop: '2px'
                      }}>
                        {agentCategory}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Select Models */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm
            }}>
              Select Models ({selectedModels.length} selected)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: theme.spacing.md,
              padding: theme.spacing.md,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md
            }}>
              {models.map(model => (
                <label
                  key={model.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: theme.spacing.sm,
                    backgroundColor: selectedModels.includes(model.id) ? theme.colors.primaryLight : theme.colors.white,
                    border: `1px solid ${selectedModels.includes(model.id) ? theme.colors.primary : theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.id)}
                    onChange={() => toggleSelection(selectedModels, model.id, setSelectedModels)}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <span style={{ fontSize: theme.typography.fontSize.sm }}>{model.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Select Tests */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm
            }}>
              Select Tests ({selectedTests.length} of {tests.length} selected)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: theme.spacing.md,
              maxHeight: '200px',
              overflowY: 'auto',
              padding: theme.spacing.md,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.backgroundSecondary
            }}>
              {tests.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: theme.spacing.xl,
                  textAlign: 'center',
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm
                }}>
                  <div style={{ marginBottom: theme.spacing.sm }}>
                    📋 No tests available
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.xs }}>
                    Create tests in the Test Library, then click Refresh to sync
                  </div>
                </div>
              ) : (
                tests.map(test => {
                  const testId = test.id || test.test_id;
                  const testName = test.name || test.test_name || 'Unnamed Test';
                  const testCategory = test.category || 'General';
                  return (
                    <label
                      key={testId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: theme.spacing.sm,
                        backgroundColor: selectedTests.includes(testId) ? theme.colors.primaryLight : theme.colors.white,
                        border: `1px solid ${selectedTests.includes(testId) ? theme.colors.primary : theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(testId)}
                          onChange={() => toggleSelection(selectedTests, testId, setSelectedTests)}
                          style={{ marginRight: theme.spacing.sm }}
                        />
                        <span style={{ 
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium
                        }}>
                          {testName}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.textSecondary,
                        marginLeft: '24px',
                        marginTop: '2px'
                      }}>
                        {testCategory}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={createBatchJob}
            disabled={loading || selectedAgents.length === 0 || selectedModels.length === 0 || selectedTests.length === 0}
            style={{ width: '100%' }}
          >
            {loading ? 'Creating Batch Job...' : `Create Batch Job (${selectedAgents.length} agents × ${selectedModels.length} models × ${selectedTests.length} tests)`}
          </Button>
        </Card.Body>
      </Card>

      {/* Batch Jobs List */}
      <Card>
        <Card.Header>
          <Card.Title>Batch Jobs ({batchJobs.length})</Card.Title>
        </Card.Header>
        <Card.Body>
          {batchJobs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.textSecondary
            }}>
              No batch jobs yet. Create one above to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {batchJobs.map(job => (
                <div
                  key={job.id}
                  style={{
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.colors.backgroundSecondary
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing.sm
                  }}>
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.semibold
                      }}>
                        {job.name}
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary
                      }}>
                        {job.agentName} • {job.modelIds.length} models • {job.testIds.length} tests
                      </div>
                    </div>
                    <div style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      backgroundColor: 
                        job.status === 'completed' ? theme.colors.successLight :
                        job.status === 'failed' ? theme.colors.dangerLight :
                        job.status === 'running' ? theme.colors.warningLight :
                        theme.colors.gray100,
                      color:
                        job.status === 'completed' ? theme.colors.success :
                        job.status === 'failed' ? theme.colors.danger :
                        job.status === 'running' ? theme.colors.warning :
                        theme.colors.textSecondary,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.semibold
                    }}>
                      {job.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {job.status === 'running' && (
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: theme.colors.gray200,
                      borderRadius: theme.borderRadius.full,
                      overflow: 'hidden',
                      marginBottom: theme.spacing.sm
                    }}>
                      <div style={{
                        width: `${job.progress}%`,
                        height: '100%',
                        backgroundColor: theme.colors.primary,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textSecondary
                  }}>
                    <span>Created: {new Date(job.createdAt).toLocaleString()}</span>
                    {job.completedAt && (
                      <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                    )}
                    {job.runId && (
                      <a
                        href={`/agent-testing/results/${job.runId}`}
                        style={{
                          color: theme.colors.primary,
                          textDecoration: 'none',
                          fontWeight: theme.typography.fontWeight.semibold
                        }}
                      >
                        View Results →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default BatchTestExecution;
