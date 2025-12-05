import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import ScoreBreakdown from './ScoreBreakdown';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

interface TestResultsViewerProps {
  runId?: string;
  results?: any; // Can accept pre-loaded results
  onExport?: (format: 'json' | 'csv') => void;
}

type SortField = 'name' | 'score' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'passed' | 'failed';

const TestResultsViewer: React.FC<TestResultsViewerProps> = ({
  runId: propRunId,
  results: initialResults,
  onExport
}) => {
  // Get runId from URL params if not provided as prop
  const { runId: urlRunId } = useParams<{ runId: string }>();
  const runId = propRunId || urlRunId;
  const [results, setResults] = useState<any>(initialResults || null);
  const [loading, setLoading] = useState(!initialResults);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and sorting
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (runId && !initialResults) {
      loadResults();
    }
  }, [runId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/testing/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to load results');
      
      const responseData = await response.json();
      // Backend returns { success: true, data: {...} }
      const runData = responseData.data || responseData;
      
      // Transform to expected format
      setResults({
        testRun: runData,
        results: runData.results || []
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (onExport) {
      onExport(format);
      return;
    }

    // Use backend export endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/testing/runs/${runId}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-results-${runId}.${format === 'csv' ? 'csv' : 'json'}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      
      // Fallback to client-side export
      if (format === 'json') {
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `test-results-${runId || 'export'}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const testResults = results?.results || [];
        const headers = ['Test Name', 'Status', 'Score', 'Explanation'];
        const rows = testResults.map((r: any) => [
          r.test_name,
          r.passed ? 'Passed' : 'Failed',
          r.score?.toFixed(1) || '0',
          r.explanation || ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `test-results-${runId || 'export'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            <div style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.textSecondary }}>
              Loading results...
            </div>
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
              ⚠ Error loading results
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              {error}
            </div>
            <Button
              variant="outline-danger"
              onClick={loadResults}
              style={{ marginTop: theme.spacing.md }}
            >
              Retry
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            <div style={{ fontSize: theme.typography.fontSize.lg, color: theme.colors.textSecondary }}>
              No results available
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const testRun = results?.testRun || {};
  const testResults = results?.results || [];
  // scores and summary are already objects from the transformed API response
  const scores = testRun.scores_by_category || testRun.scores || {};
  const summary = testRun.summary || {};

  const passedTests = testResults.filter((r: any) => r.passed).length;
  const failedTests = testResults.filter((r: any) => !r.passed).length;

  // Apply filters and sorting
  let filteredResults = [...testResults];
  
  // Filter by status
  if (filterStatus === 'passed') {
    filteredResults = filteredResults.filter(r => r.passed);
  } else if (filterStatus === 'failed') {
    filteredResults = filteredResults.filter(r => !r.passed);
  }
  
  // Filter by search term
  if (searchTerm) {
    filteredResults = filteredResults.filter(r =>
      r.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Sort
  filteredResults.sort((a, b) => {
    let aVal, bVal;
    
    switch (sortField) {
      case 'name':
        aVal = a.test_name || '';
        bVal = b.test_name || '';
        break;
      case 'score':
        aVal = a.score || 0;
        bVal = b.score || 0;
        break;
      case 'status':
        aVal = a.passed ? 1 : 0;
        bVal = b.passed ? 1 : 0;
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Card.Title>Test Results</Card.Title>
              <Card.Text>
                {testRun.test_suite_name || 'Test Run'} • {testRun.startTime ? new Date(testRun.startTime).toLocaleString() : 'N/A'}
              </Card.Text>
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button variant="outline-secondary" size="sm" onClick={() => handleExport('json')}>
                Export JSON
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={() => handleExport('csv')}>
                Export CSV
              </Button>
            </div>
          </div>
        </Card.Header>
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
              color: testRun.overall_score >= 80 ? theme.colors.success : testRun.overall_score >= 60 ? theme.colors.warning : theme.colors.danger
            }}>
              {testRun.overall_score?.toFixed(1) || 'N/A'}
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

      {/* Score Breakdown */}
      <ScoreBreakdown
        overallScore={testRun.overall_score || 0}
        categoryScores={scores}
        showDetails={true}
      />

      {/* Filters and Search */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Body>
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button
                variant={filterStatus === 'all' ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All ({testResults.length})
              </Button>
              <Button
                variant={filterStatus === 'passed' ? 'success' : 'outline-secondary'}
                size="sm"
                onClick={() => setFilterStatus('passed')}
              >
                Passed ({passedTests})
              </Button>
              <Button
                variant={filterStatus === 'failed' ? 'danger' : 'outline-secondary'}
                size="sm"
                onClick={() => setFilterStatus('failed')}
              >
                Failed ({failedTests})
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Results Table */}
      <Card>
        <Card.Header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
              Test Results ({filteredResults.length})
            </Card.Title>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
              Sort by:
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('name')}
                style={{ marginLeft: theme.spacing.xs }}
              >
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('score')}
              >
                Score {sortField === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('status')}
              >
                Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredResults.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: theme.spacing['3xl'],
              color: theme.colors.textSecondary
            }}>
              No results match your filters
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {filteredResults.map((result: any, index: number) => (
                <div
                  key={result.id}
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

                  {/* Expandable Details */}
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
                      {result.expected_output && (
                        <div style={{ marginTop: theme.spacing.md }}>
                          <strong>Expected:</strong>
                          <pre style={{ marginTop: theme.spacing.xs, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {result.expected_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TestResultsViewer;
