import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { theme } from '../../styles/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';

interface StepResultsProps {
  runId: string | null;
  onResultsLoaded: (results: any) => void;
}

const StepResults: React.FC<StepResultsProps> = ({ runId, onResultsLoaded }) => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (runId) {
      loadResults();
    }
  }, [runId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';
      const response = await fetch(`${API_BASE_URL}/api/testing/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to load results');
      
      const responseData = await response.json();
      const runData = responseData.data; // Backend wraps in { success: true, data: {...} }
      setResults(runData);
      onResultsLoaded(runData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!runId) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            No test run available
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            Loading results...
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
            <div style={{ color: theme.colors.danger }}>⚠ Error: {error}</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Backend returns run data at root level with results array
  const testResults = results?.results || [];
  const scores = results?.scores || {};
  const summary = results?.summary || {};

  const passedTests = testResults.filter((r: any) => r.passed).length;
  const failedTests = testResults.filter((r: any) => !r.passed).length;

  const exportToJSON = () => {
    const exportData = {
      runId,
      exportedAt: new Date().toISOString(),
      summary: {
        totalTests: testResults.length,
        passed: passedTests,
        failed: failedTests,
        passRate: testResults.length > 0 ? (passedTests / testResults.length * 100).toFixed(1) : 0
      },
      results: testResults.map((r: any) => ({
        ...r,
        knowledgeSource: r.knowledgeSource || 'llm',
        retrievedDocuments: r.retrievedDocuments || 0,
        mcpToolsUsed: r.mcpToolsUsed || [],
        ragLatency: r.ragLatency || 0,
        mcpLatency: r.mcpLatency || 0,
        llmLatency: r.llmLatency || 0,
        totalLatency: r.totalLatency || 0
      })),
      scores
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${runId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Test Name', 'Category', 'Status', 'Score', 'Knowledge Source', 'Retrieved Docs', 'MCP Tools', 'RAG Latency (ms)', 'MCP Latency (ms)', 'LLM Latency (ms)', 'Total Latency (ms)', 'Cost ($)', 'Error'];
    const rows = testResults.map((result: any) => [
      result.test_name || result.testName || 'Unknown',
      result.test_category || result.category || 'N/A',
      result.passed ? 'PASS' : 'FAIL',
      result.score || 0,
      result.knowledgeSource || 'llm',
      result.retrievedDocuments || 0,
      (result.mcpToolsUsed || []).join('; '),
      result.ragLatency || 0,
      result.mcpLatency || 0,
      result.llmLatency || 0,
      result.totalLatency || result.latency || result.execution_time || 0,
      (result.cost || 0).toFixed(4),
      result.error || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${runId}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Results - ${runId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1e3a8a; margin-bottom: 10px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card .value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
    .summary-card .label { color: #666; font-size: 14px; }
    .pass { color: #10b981; }
    .fail { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f8f9fa; font-weight: 600; color: #374151; }
    tr:hover { background: #f9fafb; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-pass { background: #d1fae5; color: #065f46; }
    .badge-fail { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Test Results Report</h1>
    <div class="meta">
      <strong>Run ID:</strong> ${runId}<br>
      <strong>Generated:</strong> ${new Date().toLocaleString()}
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <div class="value">${testResults.length}</div>
        <div class="label">Total Tests</div>
      </div>
      <div class="summary-card">
        <div class="value pass">${passedTests}</div>
        <div class="label">Passed</div>
      </div>
      <div class="summary-card">
        <div class="value fail">${failedTests}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card">
        <div class="value">${testResults.length > 0 ? (passedTests / testResults.length * 100).toFixed(1) : 0}%</div>
        <div class="label">Pass Rate</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Category</th>
          <th>Status</th>
          <th>Score</th>
          <th>Latency</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>
        ${testResults.map((result: any) => `
          <tr>
            <td>${result.test_name || result.testName || 'Unknown'}</td>
            <td>${result.test_category || result.category || 'N/A'}</td>
            <td><span class="badge ${result.passed ? 'badge-pass' : 'badge-fail'}">${result.passed ? 'PASS' : 'FAIL'}</span></td>
            <td>${result.score || 0}</td>
            <td>${result.latency || result.execution_time || 0}ms</td>
            <td>$${(result.cost || 0).toFixed(4)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${runId}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Card.Title>Test Results</Card.Title>
              <Card.Text>View detailed test execution results</Card.Text>
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <button
                onClick={exportToJSON}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.white,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                📄 Export JSON
              </button>
              <button
                onClick={exportToCSV}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.success,
                  color: theme.colors.white,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                📊 Export CSV
              </button>
              <button
                onClick={exportToHTML}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.info,
                  color: theme.colors.white,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                🌐 Export HTML
              </button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            fontFamily: 'monospace',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ color: theme.colors.textMuted }}>Run ID: </span>
              <span style={{ color: theme.colors.primary, fontWeight: theme.typography.fontWeight.semibold }}>
                {runId}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(runId || '');
                alert('Run ID copied to clipboard!');
              }}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                backgroundColor: theme.colors.primary,
                color: theme.colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium
              }}
            >
              📋 Copy
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.xl
      }}>
        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.primary
            }}>
              {testResults.length}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Total Tests
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.success
            }}>
              {passedTests}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Passed
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.danger
            }}>
              {failedTests}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Failed
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.primary
            }}>
              {results?.overall_score?.toFixed(1) || 'N/A'}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Overall Score
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Category Scores */}
      {Object.keys(scores).length > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
              Category Scores
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {Object.entries(scores).map(([category, scoreData]: [string, any]) => {
                const scoreValue = typeof scoreData === 'number' ? scoreData : scoreData?.score || 0;
                return (
                  <div key={category}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: theme.spacing.xs,
                      fontSize: theme.typography.fontSize.sm
                    }}>
                      <span style={{ textTransform: 'capitalize' }}>{category.replace('_', ' ')}</span>
                      <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>
                        {scoreValue.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: theme.colors.gray200,
                      borderRadius: theme.borderRadius.full,
                      overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${scoreValue}%`,
                          backgroundColor: scoreValue >= 80 ? theme.colors.success : scoreValue >= 60 ? theme.colors.warning : theme.colors.danger,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Individual Test Results */}
      <Card>
        <Card.Header>
          <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
            Individual Test Results
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {testResults.map((result: any, index: number) => (
              <div
                key={result.id || result.test_id || index}
                style={{
                  padding: theme.spacing.lg,
                  backgroundColor: result.passed ? theme.colors.successLight : theme.colors.dangerLight,
                  border: `1px solid ${result.passed ? theme.colors.success : theme.colors.danger}`,
                  borderRadius: theme.borderRadius.md
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: theme.spacing.sm
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textPrimary
                    }}>
                      {result.passed ? '✓' : '✗'} {result.test_name}
                    </div>
                    
                    {/* Knowledge Source Badge */}
                    {result.knowledgeSource && (
                      <span style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: 
                          result.knowledgeSource === 'vector_db' ? '#e0f2fe' :
                          result.knowledgeSource === 'mcp' ? '#fef3c7' :
                          result.knowledgeSource === 'hybrid' ? '#ddd6fe' :
                          '#f3f4f6',
                        color:
                          result.knowledgeSource === 'vector_db' ? '#0369a1' :
                          result.knowledgeSource === 'mcp' ? '#92400e' :
                          result.knowledgeSource === 'hybrid' ? '#5b21b6' :
                          '#374151',
                        borderRadius: theme.borderRadius.full,
                        fontSize: theme.typography.fontSize.xs,
                        fontWeight: theme.typography.fontWeight.semibold,
                        textTransform: 'uppercase'
                      }}>
                        {result.knowledgeSource === 'vector_db' ? '📚 Vector DB' :
                         result.knowledgeSource === 'mcp' ? '🔌 MCP' :
                         result.knowledgeSource === 'hybrid' ? '🔄 Hybrid' :
                         '🤖 LLM'}
                      </span>
                    )}
                  </div>
                  <div style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    backgroundColor: result.passed ? theme.colors.success : theme.colors.danger,
                    color: theme.colors.white,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.semibold
                  }}>
                    {result.score?.toFixed(1) || 0}%
                  </div>
                </div>

                {result.explanation && (
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.sm
                  }}>
                    {result.explanation}
                  </div>
                )}

                {/* Knowledge Source Metrics */}
                {result.knowledgeSource && (result.retrievedDocuments > 0 || result.mcpToolsUsed?.length > 0 || result.ragLatency || result.mcpLatency || result.llmLatency) && (
                  <div style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.white,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.xs
                  }}>
                    <div style={{
                      fontWeight: theme.typography.fontWeight.semibold,
                      marginBottom: theme.spacing.sm,
                      color: theme.colors.textPrimary
                    }}>
                      Knowledge Source Metrics:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      {result.retrievedDocuments > 0 && (
                        <div>📚 Retrieved {result.retrievedDocuments} document(s) from Vector DB</div>
                      )}
                      {result.mcpToolsUsed && result.mcpToolsUsed.length > 0 && (
                        <div>🔌 Used MCP tools: {result.mcpToolsUsed.join(', ')}</div>
                      )}
                      {(result.ragLatency || result.mcpLatency || result.llmLatency) && (
                        <div style={{ marginTop: theme.spacing.xs }}>
                          <strong>Latency Breakdown:</strong>
                          <div style={{ marginLeft: theme.spacing.md, marginTop: theme.spacing.xs }}>
                            {result.ragLatency > 0 && <div>Vector DB: {result.ragLatency}ms</div>}
                            {result.mcpLatency > 0 && <div>MCP: {result.mcpLatency}ms</div>}
                            {result.llmLatency > 0 && <div>LLM: {result.llmLatency}ms</div>}
                            {result.totalLatency && (
                              <div style={{ marginTop: theme.spacing.xs, fontWeight: theme.typography.fontWeight.semibold }}>
                                Total: {result.totalLatency}ms
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Input/Output Preview */}
                <details style={{ marginTop: theme.spacing.md }}>
                  <summary style={{
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.primary
                  }}>
                    View Details
                  </summary>
                  <div style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.white,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.xs,
                    fontFamily: 'monospace'
                  }}>
                    <div style={{ marginBottom: theme.spacing.md }}>
                      <strong>Input:</strong>
                      <pre style={{ marginTop: theme.spacing.xs, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {result.input_used}
                      </pre>
                    </div>
                    <div>
                      <strong>Output:</strong>
                      <pre style={{ marginTop: theme.spacing.xs, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {result.actual_output}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StepResults;
