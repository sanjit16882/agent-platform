import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { theme } from '../../styles/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

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
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
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

  return (
    <div>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Test Results</Card.Title>
          <Card.Text>View detailed test execution results</Card.Text>
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
                  <div style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textPrimary
                  }}>
                    {result.passed ? '✓' : '✗'} {result.test_name}
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
