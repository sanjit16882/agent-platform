import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { theme } from '../../styles/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';

interface VersionComparisonProps {
  agentId?: string;
  runIds?: string[];
}

interface TestRun {
  id?: string;
  run_id?: string;
  agentId?: string;
  agent_id?: string;
  agentName?: string;
  agent_name?: string;
  startTime?: string;
  timestamp?: string;
  created_at?: string;
  totalTests?: number;
  passedTests?: number;
  passRate?: number;
  averageScore?: number;
  overall_score?: number;
  duration?: number;
  status?: string;
  summary?: string | any;
  scores?: string | any;
}

interface TestResult {
  testName: string;
  category: string;
  passed: boolean;
  score: number;
  explanation: string;
}

interface ComparisonResult {
  testName: string;
  category: string;
  runs: {
    runId: string;
    passed: boolean;
    score: number;
    explanation: string;
  }[];
  status: 'improved' | 'regressed' | 'unchanged';
  delta: number;
}

/**
 * VersionComparison Component
 * 
 * Compares test results across multiple test runs to identify
 * improvements, regressions, and changes in agent performance.
 */
const VersionComparison: React.FC<VersionComparisonProps> = ({
  agentId: initialAgentId,
  runIds: initialRunIds = []
}) => {
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId || '');
  const [availableRuns, setAvailableRuns] = useState<TestRun[]>([]);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>(
    initialRunIds.length >= 2 ? initialRunIds.slice(0, 2) : ['', '']
  );
  const [selectedRuns, setSelectedRuns] = useState<TestRun[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // Fetch available agents
  useEffect(() => {
    fetchAvailableAgents();
  }, []);

  // Fetch available runs when agent changes
  useEffect(() => {
    if (selectedAgentId) {
      fetchAvailableRuns();
      // Reset selected runs when agent changes
      setSelectedRunIds(['', '']);
      setSelectedRuns([]);
      setComparisonData([]);
    }
  }, [selectedAgentId]);

  // Fetch and compare when runs selected
  useEffect(() => {
    const validRunIds = selectedRunIds.filter(id => id !== '');
    if (validRunIds.length >= 2) {
      compareRuns(validRunIds);
    } else {
      setComparisonData([]);
      setSelectedRuns([]);
    }
  }, [selectedRunIds]);

  const fetchAvailableAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/testing/runs`);
      if (!response.ok) throw new Error('Failed to fetch test runs');
      
      const responseData = await response.json();
      const runs = Array.isArray(responseData) ? responseData : responseData.data || [];
      
      // Extract unique agents
      const agentMap = new Map<string, string>();
      runs.forEach((run: any) => {
        const agentId = run.agentId || run.agent_id;
        const agentName = run.agentName || run.agent_name || agentId;
        if (agentId && !agentMap.has(agentId)) {
          agentMap.set(agentId, agentName);
        }
      });
      
      const agents = Array.from(agentMap.entries()).map(([id, name]) => ({ id, name }));
      setAvailableAgents(agents);
      
      // Auto-select first agent if none selected
      if (!selectedAgentId && agents.length > 0) {
        setSelectedAgentId(agents[0].id);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const fetchAvailableRuns = async () => {
    if (!selectedAgentId) {
      setAvailableRuns([]);
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/testing/runs?agentId=${selectedAgentId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch test runs');
      
      const responseData = await response.json();
      const runs = Array.isArray(responseData) ? responseData : responseData.data || [];
      
      // Filter completed runs only for the selected agent
      const completedRuns = runs.filter((run: any) => {
        const runAgentId = run.agentId || run.agent_id;
        return run.status === 'completed' && runAgentId === selectedAgentId;
      });
      
      // Sort by date, newest first
      completedRuns.sort((a: any, b: any) => {
        const dateA = new Date(a.timestamp || a.created_at || a.startTime || 0).getTime();
        const dateB = new Date(b.timestamp || b.created_at || b.startTime || 0).getTime();
        return dateB - dateA;
      });
      
      setAvailableRuns(completedRuns);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const compareRuns = async (runIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch details for each run
      const runPromises = runIds.map(id => 
        fetch(`${API_BASE_URL}/api/testing/runs/${id}`).then(res => res.json())
      );
      
      const responses = await Promise.all(runPromises);
      // Extract data from API response (backend wraps in {success: true, data: {...}})
      const runs = responses.map(r => r.data || r);
      setSelectedRuns(runs);
      console.log('🔍 Comparing runs:', runs);

      // Build comparison data - First collect all unique tests
      const testMap = new Map<string, ComparisonResult>();

      // First pass: identify all unique tests
      runs.forEach((run) => {
        const results = run.results || [];
        results.forEach((result: any) => {
          const testName = result.testName || result.test_name;
          if (!testMap.has(testName)) {
            testMap.set(testName, {
              testName,
              category: result.category || result.test_category || 'unknown',
              runs: [],
              status: 'unchanged',
              delta: 0
            });
          }
        });
      });

      // Second pass: populate results for each test across all runs
      runs.forEach((run, runIndex) => {
        const results = run.results || [];
        const resultsByTest = new Map<string, any>(
          results.map((r: any) => [r.testName || r.test_name, r])
        );

        // For each test, add this run's result (or null if test wasn't run)
        testMap.forEach((comparison, testName) => {
          const result: any = resultsByTest.get(testName);
          if (result) {
            comparison.runs.push({
              runId: run.run_id || run.id,
              passed: result.passed || false,
              score: result.score || 0,
              explanation: result.explanation || ''
            });
          } else {
            // Test wasn't run in this execution - add placeholder
            comparison.runs.push({
              runId: run.run_id || run.id,
              passed: false,
              score: 0,
              explanation: 'Test not executed in this run'
            });
          }
        });
      });

      // Calculate status and delta for each test
      const comparisons = Array.from(testMap.values()).map(comp => {
        if (comp.runs.length >= 2) {
          const firstRun = comp.runs[0];
          const lastRun = comp.runs[comp.runs.length - 1];
          
          comp.delta = lastRun.score - firstRun.score;
          
          if (firstRun.passed === lastRun.passed) {
            comp.status = comp.delta > 5 ? 'improved' : comp.delta < -5 ? 'regressed' : 'unchanged';
          } else if (!firstRun.passed && lastRun.passed) {
            comp.status = 'improved';
          } else if (firstRun.passed && !lastRun.passed) {
            comp.status = 'regressed';
          }
        }
        return comp;
      });

      // Sort by significance (biggest changes first)
      comparisons.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

      setComparisonData(comparisons);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunChange = (index: number, runId: string) => {
    const newRunIds = [...selectedRunIds];
    newRunIds[index] = runId;
    setSelectedRunIds(newRunIds);
  };

  const addRunSlot = () => {
    if (selectedRunIds.length < 5) {
      setSelectedRunIds([...selectedRunIds, '']);
    }
  };

  const removeRunSlot = (index: number) => {
    if (selectedRunIds.length > 2) {
      const newRunIds = selectedRunIds.filter((_, i) => i !== index);
      setSelectedRunIds(newRunIds);
    }
  };

  const exportComparison = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const data = {
        runs: selectedRuns,
        comparisons: comparisonData,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison-${Date.now()}.json`;
      a.click();
    } else {
      // CSV export
      const headers = ['Test Name', 'Category', ...selectedRuns.map((r, i) => `Run ${i + 1} Score`), 'Delta', 'Status'];
      const rows = comparisonData.map(comp => [
        comp.testName,
        comp.category,
        ...comp.runs.map(r => r.score),
        comp.delta,
        comp.status
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison-${Date.now()}.csv`;
      a.click();
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatRunLabel = (run: any): string => {
    // Handle date safely
    let dateStr = 'Unknown Date';
    const dateValue = run.timestamp || run.created_at || run.startTime || run.start_time;
    if (dateValue) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        dateStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
    // Handle summary safely
    let summary: any = {};
    try {
      summary = typeof run.summary === 'string' ? JSON.parse(run.summary) : run.summary || {};
    } catch (e) {
      summary = {};
    }
    
    const passRate = summary.pass_rate || run.passRate || 0;
    const passed = summary.passed || run.passedTests || 0;
    const total = summary.total || run.totalTests || 0;
    const score = run.overall_score || run.averageScore || 0;
    
    // Format: "Nov 26, 2025, 12:09 PM - Score: 52% (2/3 passed)"
    return `${dateStr} - Score: ${score.toFixed(0)}% (${passed}/${total} passed)`;
  };

  const getStatusVariant = (status: string): 'success' | 'danger' | 'secondary' => {
    switch (status) {
      case 'improved': return 'success';
      case 'regressed': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'improved': return '↑';
      case 'regressed': return '↓';
      default: return '→';
    }
  };

  const calculateSummaryDelta = (metric: keyof TestRun): string => {
    if (selectedRuns.length < 2) return '-';
    const first = selectedRuns[0][metric] as number;
    const last = selectedRuns[selectedRuns.length - 1][metric] as number;
    const delta = last - first;
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)} ${arrow}`;
  };

  const filteredComparisons = filterCategory === 'all'
    ? comparisonData
    : comparisonData.filter(comp => comp.category === filterCategory);

  if (loading && availableRuns.length === 0) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            Loading test runs...
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.dangerLight,
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: theme.borderRadius.md,
            textAlign: 'center'
          }}>
            <div style={{ color: theme.colors.danger, marginBottom: theme.spacing.md }}>
              ⚠ Error loading comparison
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm }}>
              {error}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Agent Selection */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Step 1: Select Agent</Card.Title>
          <Card.Text>Choose the agent whose test runs you want to compare</Card.Text>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <label style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              minWidth: '80px'
            }}>
              Agent:
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              style={{
                padding: theme.spacing.md,
                fontSize: theme.typography.fontSize.base,
                border: `2px solid ${theme.colors.primary}`,
                borderRadius: theme.borderRadius.md,
                minWidth: '400px',
                backgroundColor: theme.colors.white,
                cursor: 'pointer'
              }}
            >
              <option value="">Select an agent...</option>
              {availableAgents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            {selectedAgentId && availableRuns.length > 0 && (
              <Badge variant="primary" style={{ fontSize: theme.typography.fontSize.sm }}>
                {availableRuns.length} run{availableRuns.length !== 1 ? 's' : ''} available
              </Badge>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Run Selection */}
      {selectedAgentId && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title>Step 2: Select Runs to Compare</Card.Title>
            <Card.Text>Choose 2 or more test runs from {availableAgents.find(a => a.id === selectedAgentId)?.name || 'the selected agent'}</Card.Text>
          </Card.Header>
          <Card.Body>
            {availableRuns.length === 0 ? (
              <div style={{
                padding: theme.spacing.xl,
                textAlign: 'center',
                color: theme.colors.textSecondary,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: theme.borderRadius.md
              }}>
                <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm }}>
                  No test runs found
                </div>
                <div style={{ fontSize: theme.typography.fontSize.sm }}>
                  This agent doesn't have any completed test runs yet.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedRunIds.map((runId, index) => (
              <div key={index} style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                <select
                  value={runId}
                  onChange={(e) => handleRunChange(index, e.target.value)}
                  style={{
                    padding: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    minWidth: '300px'
                  }}
                >
                  <option value="">Select Run {index + 1}</option>
                  {availableRuns
                    .filter(run => {
                      const runIdValue = run.run_id || run.id;
                      // Show this run if it's not selected in any other dropdown (except current one)
                      const isSelectedElsewhere = selectedRunIds.some((selectedId, selectedIndex) => 
                        selectedIndex !== index && selectedId !== '' && selectedId === runIdValue
                      );
                      return !isSelectedElsewhere;
                    })
                    .map(run => (
                      <option key={run.run_id || run.id} value={run.run_id || run.id}>
                        {formatRunLabel(run)}
                      </option>
                    ))}
                </select>
                {selectedRunIds.length > 2 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeRunSlot(index)}
                  >
                    ✗
                  </Button>
                )}
              </div>
            ))}
                {selectedRunIds.length < 5 && (
                  <Button variant="outline-primary" size="sm" onClick={addRunSlot}>
                    + Add Run
                  </Button>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Show message if agent selected but less than 2 runs selected */}
      {selectedAgentId && selectedRuns.length < 2 && availableRuns.length > 0 && (
        <Card>
          <Card.Body>
            <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
              <div style={{ fontSize: theme.typography.fontSize['2xl'], marginBottom: theme.spacing.lg }}>
                📊
              </div>
              <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>
                Select at least 2 test runs to compare
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Choose runs from the dropdowns above to see a detailed comparison
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Key Insights Banner */}
      {selectedRuns.length >= 2 && (() => {
        const firstRun = selectedRuns[0];
        const lastRun = selectedRuns[selectedRuns.length - 1];
        const passRateDelta = (lastRun.passRate || 0) - (firstRun.passRate || 0);
        const scoreDelta = (lastRun.averageScore || lastRun.overall_score || 0) - (firstRun.averageScore || firstRun.overall_score || 0);
        const improved = comparisonData.filter(c => c.status === 'improved').length;
        const regressed = comparisonData.filter(c => c.status === 'regressed').length;

        return (
          <Card style={{ marginBottom: theme.spacing.xl, backgroundColor: '#f0f9ff', border: '2px solid #0066cc' }}>
            <Card.Header>
              <Card.Title>📊 Key Insights</Card.Title>
            </Card.Header>
            <Card.Body>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: theme.spacing.lg
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: passRateDelta > 0 ? theme.colors.success : passRateDelta < 0 ? theme.colors.danger : theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs
                  }}>
                    {passRateDelta > 0 ? '+' : ''}{passRateDelta.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    Pass Rate Change
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>
                    {firstRun.passRate}% → {lastRun.passRate}%
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: scoreDelta > 0 ? theme.colors.success : scoreDelta < 0 ? theme.colors.danger : theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs
                  }}>
                    {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    Score Change
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.success,
                    marginBottom: theme.spacing.xs
                  }}>
                    {improved}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    Tests Improved
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.danger,
                    marginBottom: theme.spacing.xs
                  }}>
                    {regressed}
                  </div>
                  <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                    Tests Regressed
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: theme.spacing.xl,
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.white,
                borderRadius: theme.borderRadius.md,
                textAlign: 'center'
              }}>
                <strong style={{ fontSize: theme.typography.fontSize.lg }}>
                  {passRateDelta > 5 ? '🎉 Significant Improvement!' : 
                   passRateDelta < -5 ? '⚠️ Performance Regression Detected' :
                   '→ Stable Performance'}
                </strong>
                <div style={{ marginTop: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
                  {passRateDelta > 5 ? 'Your agent is performing better than before. Great work!' :
                   passRateDelta < -5 ? 'Consider reviewing the changes that led to this regression.' :
                   'Performance is consistent across runs.'}
                </div>
              </div>
            </Card.Body>
          </Card>
        );
      })()}

      {/* Summary Comparison */}
      {selectedRuns.length >= 2 && (
        <>
          <Card style={{ marginBottom: theme.spacing.xl }}>
            <Card.Header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Card.Title>Summary Comparison</Card.Title>
                  <Card.Text>Comparing {selectedRuns.length} test runs</Card.Text>
                </div>
                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <Button variant="outline-primary" size="sm" onClick={() => exportComparison('json')}>
                    Export JSON
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={() => exportComparison('csv')}>
                    Export CSV
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: theme.typography.fontSize.sm
                }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
                      <th style={{ padding: theme.spacing.md, textAlign: 'left', fontWeight: theme.typography.fontWeight.semibold }}>Metric</th>
                      {selectedRuns.map((run, index) => {
                        const dateValue = run.timestamp || run.startTime || run.created_at || (run as any).start_time;
                        let dateDisplay = 'Unknown Date';
                        if (dateValue) {
                          const date = new Date(dateValue);
                          if (!isNaN(date.getTime())) {
                            dateDisplay = date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }
                        }
                        
                        return (
                          <th key={`run-header-${index}-${run.run_id || run.id}`} style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                            <div style={{ fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs }}>
                              Run {index + 1}
                            </div>
                            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, fontWeight: 'normal' }}>
                              {dateDisplay}
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ padding: theme.spacing.md, textAlign: 'center', fontWeight: theme.typography.fontWeight.semibold }}>
                        Delta
                        <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, fontWeight: 'normal' }}>
                          (First → Last)
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.backgroundSecondary }}>
                      <td style={{ padding: theme.spacing.md, fontWeight: theme.typography.fontWeight.medium }}>Pass Rate</td>
                      {selectedRuns.map((run, index) => {
                        const passRate = run.passRate || 0;
                        return (
                          <td key={`passrate-${index}-${run.run_id || run.id}`} style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                            <Badge variant={passRate >= 75 ? 'success' : passRate >= 60 ? 'warning' : 'danger'}>
                              {passRate.toFixed(0)}%
                            </Badge>
                          </td>
                        );
                      })}
                      <td style={{ padding: theme.spacing.md, textAlign: 'center', fontWeight: 'bold' }}>
                        {(() => {
                          const delta = (selectedRuns[selectedRuns.length - 1].passRate || 0) - (selectedRuns[0].passRate || 0);
                          return (
                            <span style={{ color: delta > 0 ? theme.colors.success : delta < 0 ? theme.colors.danger : theme.colors.textSecondary }}>
                              {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                              {delta > 0 ? ' ↑' : delta < 0 ? ' ↓' : ' →'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <td style={{ padding: theme.spacing.md, fontWeight: theme.typography.fontWeight.medium }}>Tests Passed</td>
                      {selectedRuns.map((run, index) => (
                        <td key={`passed-${index}-${run.run_id || run.id}`} style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                          <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>{run.passedTests}</span>
                          <span style={{ color: theme.colors.textSecondary }}> / {run.totalTests}</span>
                        </td>
                      ))}
                      <td style={{ padding: theme.spacing.md, textAlign: 'center', fontWeight: 'bold' }}>
                        {(() => {
                          const delta = (selectedRuns[selectedRuns.length - 1].passedTests || 0) - (selectedRuns[0].passedTests || 0);
                          return (
                            <span style={{ color: delta > 0 ? theme.colors.success : delta < 0 ? theme.colors.danger : theme.colors.textSecondary }}>
                              {delta > 0 ? '+' : ''}{delta}
                              {delta > 0 ? ' ↑' : delta < 0 ? ' ↓' : ' →'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: theme.colors.backgroundSecondary }}>
                      <td style={{ padding: theme.spacing.md, fontWeight: theme.typography.fontWeight.medium }}>Average Score</td>
                      {selectedRuns.map((run, index) => {
                        const score = run.averageScore || run.overall_score || 0;
                        return (
                          <td key={`avgscore-${index}-${run.run_id || run.id}`} style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                            <span style={{
                              fontWeight: theme.typography.fontWeight.semibold,
                              color: score >= 80 ? theme.colors.success : score >= 60 ? theme.colors.warning : theme.colors.danger
                            }}>
                              {score.toFixed(1)}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding: theme.spacing.md, textAlign: 'center', fontWeight: 'bold' }}>
                        {(() => {
                          const firstScore = selectedRuns[0].averageScore || selectedRuns[0].overall_score || 0;
                          const lastScore = selectedRuns[selectedRuns.length - 1].averageScore || selectedRuns[selectedRuns.length - 1].overall_score || 0;
                          const delta = lastScore - firstScore;
                          return (
                            <span style={{ color: delta > 0 ? theme.colors.success : delta < 0 ? theme.colors.danger : theme.colors.textSecondary }}>
                              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                              {delta > 0 ? ' ↑' : delta < 0 ? ' ↓' : ' →'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>

          {/* Detailed Comparison */}
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.md }}>
                <div>
                  <Card.Title>Detailed Test Comparison</Card.Title>
                  <Card.Text>
                    {filteredComparisons.length} test{filteredComparisons.length !== 1 ? 's' : ''} 
                    {filterCategory !== 'all' && ` in ${filterCategory} category`}
                  </Card.Text>
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    padding: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md
                  }}
                >
                  <option value="all">All Categories ({comparisonData.length})</option>
                  <option value="hallucination">Hallucination ({comparisonData.filter(c => c.category === 'hallucination').length})</option>
                  <option value="functional">Functional ({comparisonData.filter(c => c.category === 'functional').length})</option>
                  <option value="tool_usage">Tool Usage ({comparisonData.filter(c => c.category === 'tool_usage').length})</option>
                  <option value="emotional">Emotional ({comparisonData.filter(c => c.category === 'emotional').length})</option>
                  <option value="safety">Safety ({comparisonData.filter(c => c.category === 'safety').length})</option>
                </select>
              </div>
            </Card.Header>
            <Card.Body>
              {filteredComparisons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textSecondary }}>
                  No tests found for this category
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {filteredComparisons.map(comparison => (
                    <div
                      key={comparison.testName}
                      style={{
                        padding: theme.spacing.lg,
                        border: `2px solid ${
                          comparison.status === 'improved' ? theme.colors.success :
                          comparison.status === 'regressed' ? theme.colors.danger :
                          theme.colors.border
                        }`,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: comparison.status === 'improved' ? `${theme.colors.success}05` :
                                        comparison.status === 'regressed' ? `${theme.colors.danger}05` :
                                        theme.colors.white
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: theme.spacing.md,
                        flexWrap: 'wrap',
                        gap: theme.spacing.sm
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: theme.typography.fontSize.base,
                            fontWeight: theme.typography.fontWeight.semibold,
                            marginBottom: theme.spacing.xs
                          }}>
                            {comparison.testName}
                          </div>
                          <Badge variant="secondary" style={{ fontSize: theme.typography.fontSize.xs }}>
                            {comparison.category}
                          </Badge>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                          <Badge 
                            variant={getStatusVariant(comparison.status)}
                            style={{ fontSize: theme.typography.fontSize.sm, padding: `${theme.spacing.xs} ${theme.spacing.md}` }}
                          >
                            {getStatusIcon(comparison.status)} {comparison.status.toUpperCase()}
                          </Badge>
                          <div style={{
                            fontSize: theme.typography.fontSize.xl,
                            fontWeight: theme.typography.fontWeight.bold,
                            color: comparison.delta > 0 ? theme.colors.success : comparison.delta < 0 ? theme.colors.danger : theme.colors.textSecondary
                          }}>
                            {comparison.delta > 0 ? '+' : ''}{comparison.delta.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Visual score progression */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${comparison.runs.length}, 1fr)`,
                        gap: theme.spacing.md,
                        marginTop: theme.spacing.lg
                      }}>
                        {comparison.runs.map((run, index) => (
                          <div
                            key={`comparison-${comparison.testName}-${index}-${run.runId}`}
                            style={{
                              padding: theme.spacing.md,
                              backgroundColor: theme.colors.white,
                              borderRadius: theme.borderRadius.md,
                              border: `2px solid ${run.passed ? theme.colors.success : theme.colors.danger}`,
                              textAlign: 'center',
                              position: 'relative'
                            }}
                          >
                            <div style={{ 
                              fontSize: theme.typography.fontSize.xs, 
                              color: theme.colors.textSecondary, 
                              marginBottom: theme.spacing.sm,
                              fontWeight: theme.typography.fontWeight.medium
                            }}>
                              Run {index + 1}
                            </div>
                            <div style={{ 
                              fontSize: theme.typography.fontSize['2xl'], 
                              marginBottom: theme.spacing.xs
                            }}>
                              {run.passed ? '✅' : '❌'}
                            </div>
                            <div style={{ 
                              fontSize: theme.typography.fontSize.xl, 
                              fontWeight: theme.typography.fontWeight.bold,
                              color: run.score >= 80 ? theme.colors.success : run.score >= 60 ? theme.colors.warning : theme.colors.danger
                            }}>
                              {run.score.toFixed(0)}%
                            </div>
                            
                            {/* Show delta arrow between runs */}
                            {index < comparison.runs.length - 1 && (() => {
                              const nextRun = comparison.runs[index + 1];
                              const delta = nextRun.score - run.score;
                              if (Math.abs(delta) > 0.1) {
                                return (
                                  <div style={{
                                    position: 'absolute',
                                    right: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: theme.typography.fontSize.xl,
                                    color: delta > 0 ? theme.colors.success : theme.colors.danger
                                  }}>
                                    {delta > 0 ? '→' : '→'}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ))}
                      </div>

                      {/* Show explanation for first and last run if different */}
                      {comparison.runs.length >= 2 && comparison.runs[0].explanation !== comparison.runs[comparison.runs.length - 1].explanation && (
                        <details style={{ marginTop: theme.spacing.md }}>
                          <summary style={{
                            cursor: 'pointer',
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.primary,
                            fontWeight: theme.typography.fontWeight.medium
                          }}>
                            View Explanations
                          </summary>
                          <div style={{
                            marginTop: theme.spacing.md,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: theme.spacing.md
                          }}>
                            <div style={{
                              padding: theme.spacing.md,
                              backgroundColor: theme.colors.backgroundSecondary,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.typography.fontSize.xs
                            }}>
                              <strong>Run 1:</strong>
                              <div style={{ marginTop: theme.spacing.xs, color: theme.colors.textSecondary }}>
                                {comparison.runs[0].explanation || 'No explanation'}
                              </div>
                            </div>
                            <div style={{
                              padding: theme.spacing.md,
                              backgroundColor: theme.colors.backgroundSecondary,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: theme.typography.fontSize.xs
                            }}>
                              <strong>Run {comparison.runs.length}:</strong>
                              <div style={{ marginTop: theme.spacing.xs, color: theme.colors.textSecondary }}>
                                {comparison.runs[comparison.runs.length - 1].explanation || 'No explanation'}
                              </div>
                            </div>
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default VersionComparison;
