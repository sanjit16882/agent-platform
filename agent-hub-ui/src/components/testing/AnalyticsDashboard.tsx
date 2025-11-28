import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { theme } from '../../styles/theme';

interface AnalyticsDashboardProps {
  agentId?: string;
  dateRange?: { start: string; end: string };
}

interface TestRun {
  id: string;
  agentId: string;
  agentName?: string;
  startTime: string;
  totalTests: number;
  passedTests: number;
  passRate: number;
  averageScore: number;
  cost?: number;
}

interface AnalyticsData {
  totalTests: number;
  totalRuns: number;
  averagePassRate: number;
  averageScore: number;
  totalCost: number;
  passRateTrend: Array<{ date: string; passRate: number; runs: number }>;
  categoryPerformance: Array<{ category: string; passRate: number; count: number; avgScore: number }>;
  recentRuns: TestRun[];
}

/**
 * AnalyticsDashboard Component
 * 
 * Comprehensive analytics dashboard for visualizing testing trends,
 * performance metrics, and insights across test runs.
 */
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  agentId: initialAgentId,
  dateRange: initialDateRange
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState(initialAgentId || 'all');
  const [selectedDays, setSelectedDays] = useState('30');
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAvailableAgents();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedAgent, selectedDays]);

  const fetchAvailableAgents = async () => {
    try {
      // Fetch unique agents from test runs
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/testing/runs`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      
      const data = await response.json();
      const runs = Array.isArray(data) ? data : data.runs || [];
      
      // Extract unique agents
      const agentMap = new Map<string, string>();
      runs.forEach((run: any) => {
        if (run.agentId && !agentMap.has(run.agentId)) {
          agentMap.set(run.agentId, run.agentName || run.agentId);
        }
      });
      
      const agents = Array.from(agentMap.entries()).map(([id, name]) => ({ id, name }));
      setAvailableAgents(agents);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedDays));

      // Fetch test runs
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const url = selectedAgent === 'all'
        ? `${API_BASE_URL}/api/testing/runs`
        : `${API_BASE_URL}/api/testing/runs?agentId=${selectedAgent}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      const allRuns = Array.isArray(data) ? data : data.runs || [];
      
      // Filter by date range and completed status
      const runs = allRuns.filter((run: any) => {
        const runDate = new Date(run.startTime);
        return run.status === 'completed' && runDate >= startDate && runDate <= endDate;
      });

      if (runs.length === 0) {
        setAnalytics({
          totalTests: 0,
          totalRuns: 0,
          averagePassRate: 0,
          averageScore: 0,
          totalCost: 0,
          passRateTrend: [],
          categoryPerformance: [],
          recentRuns: []
        });
        setLoading(false);
        return;
      }

      // Calculate analytics
      const totalTests = runs.reduce((sum: number, run: any) => sum + (run.totalTests || 0), 0);
      const totalPassed = runs.reduce((sum: number, run: any) => sum + (run.passedTests || 0), 0);
      const averagePassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
      const averageScore = runs.reduce((sum: number, run: any) => sum + (run.averageScore || 0), 0) / runs.length;
      
      // Calculate total cost from individual test results
      const totalCost = runs.reduce((sum: number, run: any) => {
        const results = run.results || [];
        const runCost = results.reduce((rSum: number, result: any) => rSum + (result.cost || 0), 0);
        return sum + runCost;
      }, 0);

      // Calculate pass rate trend (group by day)
      const trendMap = new Map<string, { passRate: number; count: number; runs: number }>();
      runs.forEach((run: any) => {
        const date = new Date(run.startTime).toLocaleDateString();
        if (!trendMap.has(date)) {
          trendMap.set(date, { passRate: 0, count: 0, runs: 0 });
        }
        const trend = trendMap.get(date)!;
        trend.passRate += run.passRate || 0;
        trend.count += 1;
        trend.runs += 1;
      });

      const passRateTrend = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          date,
          passRate: data.passRate / data.count,
          runs: data.runs
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Last 30 data points

      // Calculate category performance
      const categoryMap = new Map<string, { passed: number; total: number; scores: number[] }>();
      
      runs.forEach((run: any) => {
        const results = run.results || [];
        results.forEach((result: any) => {
          const category = result.test_category || result.category || 'Unknown';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { passed: 0, total: 0, scores: [] });
          }
          const cat = categoryMap.get(category)!;
          cat.total += 1;
          if (result.passed) cat.passed += 1;
          if (result.score) cat.scores.push(result.score);
        });
      });

      const categoryPerformance = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          passRate: data.total > 0 ? (data.passed / data.total) * 100 : 0,
          count: data.total,
          avgScore: data.scores.length > 0 
            ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
            : 0
        }))
        .sort((a, b) => b.passRate - a.passRate);

      // Get recent runs - group by agent first to ensure all agents are represented
      const runsByAgent = new Map<string, any[]>();
      runs.forEach((run: any) => {
        const agentKey = run.agentName || run.agentId;
        if (!runsByAgent.has(agentKey)) {
          runsByAgent.set(agentKey, []);
        }
        runsByAgent.get(agentKey)!.push(run);
      });

      // Get most recent run from each agent, then sort by time
      const recentRuns: any[] = [];
      runsByAgent.forEach((agentRuns) => {
        // Sort agent's runs by time and take the most recent 3
        const sortedRuns = agentRuns
          .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .slice(0, 3); // Take up to 3 most recent runs per agent
        recentRuns.push(...sortedRuns);
      });

      // Sort all recent runs by time
      recentRuns.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      setAnalytics({
        totalTests,
        totalRuns: runs.length,
        averagePassRate,
        averageScore,
        totalCost,
        passRateTrend,
        categoryPerformance,
        recentRuns
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = (format: 'json' | 'csv') => {
    if (!analytics) return;

    if (format === 'json') {
      const data = {
        analytics,
        filters: {
          agent: selectedAgent,
          days: selectedDays
        },
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.json`;
      a.click();
    } else {
      // CSV export
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Tests', analytics.totalTests],
        ['Total Runs', analytics.totalRuns],
        ['Average Pass Rate', `${analytics.averagePassRate.toFixed(1)}%`],
        ['Average Score', analytics.averageScore.toFixed(1)],
        ['Total Cost', `$${analytics.totalCost.toFixed(2)}`]
      ];
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.csv`;
      a.click();
    }
  };

  const getColorForPassRate = (passRate: number): string => {
    if (passRate >= 90) return theme.colors.success;
    if (passRate >= 75) return theme.colors.primary;
    if (passRate >= 60) return theme.colors.warning;
    return theme.colors.danger;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && !analytics) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            Loading analytics...
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
              ⚠ Error loading analytics
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm }}>
              {error}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!analytics || analytics.totalRuns === 0) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            <div style={{ fontSize: theme.typography.fontSize['2xl'], marginBottom: theme.spacing.lg }}>
              📊
            </div>
            <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>
              No test data available
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Run some tests to see analytics and insights
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Filters */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Analytics Dashboard</Card.Title>
          <Card.Text>Testing performance and trends</Card.Text>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.xs
              }}>
                Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                style={{
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  minWidth: '200px'
                }}
              >
                <option value="all">All Agents</option>
                {availableAgents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.xs
              }}>
                Time Period
              </label>
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(e.target.value)}
                style={{
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  minWidth: '150px'
                }}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: theme.spacing.sm }}>
              <Button variant="outline-primary" size="sm" onClick={() => exportAnalytics('json')}>
                Export JSON
              </Button>
              <Button variant="outline-primary" size="sm" onClick={() => exportAnalytics('csv')}>
                Export CSV
              </Button>
            </div>
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
              {analytics.totalTests}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Total Tests
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textMuted,
              marginTop: theme.spacing.xs
            }}>
              {analytics.totalRuns} runs
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: getColorForPassRate(analytics.averagePassRate)
            }}>
              {analytics.averagePassRate.toFixed(1)}%
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Avg Pass Rate
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
              {analytics.averageScore.toFixed(1)}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Avg Score
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
              ${analytics.totalCost.toFixed(2)}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Total Cost
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Pass Rate Trend */}
      {analytics.passRateTrend.length > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title>Daily Pass Rate Trend</Card.Title>
            <Card.Text>
              {analytics.passRateTrend.length === 1 
                ? 'Single day of testing - run tests on multiple days to see trends'
                : `Pass rates averaged by day across ${analytics.passRateTrend.length} days`}
            </Card.Text>
          </Card.Header>
          <Card.Body>
            {analytics.passRateTrend.length === 1 ? (
              // Single data point - show as informative card
              <div style={{ 
                padding: theme.spacing.xl,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: theme.borderRadius.md,
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: theme.spacing.lg,
                  padding: theme.spacing.xl,
                  backgroundColor: theme.colors.white,
                  borderRadius: theme.borderRadius.lg,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div>
                    <div style={{
                      fontSize: theme.typography.fontSize['3xl'],
                      fontWeight: theme.typography.fontWeight.bold,
                      color: getColorForPassRate(analytics.passRateTrend[0].passRate),
                      marginBottom: theme.spacing.xs
                    }}>
                      {analytics.passRateTrend[0].passRate.toFixed(1)}%
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary
                    }}>
                      Average Pass Rate
                    </div>
                  </div>
                  <div style={{
                    borderLeft: `2px solid ${theme.colors.border}`,
                    paddingLeft: theme.spacing.lg,
                    textAlign: 'left'
                  }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.xs
                    }}>
                      📅 {analytics.passRateTrend[0].date}
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary
                    }}>
                      🔄 {analytics.passRateTrend[0].runs} test run(s)
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.textMuted,
                      marginTop: theme.spacing.sm,
                      fontStyle: 'italic'
                    }}>
                      {analytics.passRateTrend[0].runs > 1 
                        ? 'This is the average of all runs on this day'
                        : 'Run tests on multiple days to see trend analysis'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Multiple data points - show bar chart with better context
              <div style={{ padding: theme.spacing.lg }}>
                {/* Chart explanation */}
                <div style={{
                  marginBottom: theme.spacing.lg,
                  padding: theme.spacing.md,
                  backgroundColor: '#e7f3ff',
                  border: '1px solid #0066cc',
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textPrimary
                }}>
                  <strong>ℹ️ How to read this chart:</strong> Each bar represents one day. The height shows the <strong>average pass rate</strong> for all test runs on that day. 
                  If multiple runs occurred on the same day, they are averaged together. See individual run details in the "Recent Test Runs" table below.
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: 'flex-start',
                  height: '180px',
                  gap: theme.spacing.lg,
                  borderBottom: `2px solid ${theme.colors.border}`,
                  paddingBottom: theme.spacing.md,
                  paddingLeft: theme.spacing.lg,
                  paddingRight: theme.spacing.lg,
                  position: 'relative'
                }}>
                  {/* Y-axis reference lines */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    pointerEvents: 'none'
                  }}>
                    {[25, 50, 75].map(percent => (
                      <div
                        key={percent}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: `${percent}%`,
                          borderTop: `1px dashed ${theme.colors.border}`,
                          opacity: 0.3
                        }}
                      />
                    ))}
                  </div>
                  
                  {analytics.passRateTrend.map((item, index) => {
                    const barHeight = Math.max(item.passRate, 5); // Minimum 5% for visibility
                    const barColor = getColorForPassRate(item.passRate);
                    
                    return (
                      <div
                        key={index}
                        style={{
                          width: '80px',
                          minWidth: '60px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end',
                          position: 'relative'
                        }}
                      >
                        {/* Value label above bar */}
                        <div style={{
                          marginBottom: theme.spacing.xs,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.bold,
                          color: barColor
                        }}>
                          {item.passRate.toFixed(0)}%
                        </div>
                        
                        {/* Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: `${barHeight}%`,
                            backgroundColor: barColor,
                            borderRadius: `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`,
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`${item.date}: ${item.passRate.toFixed(1)}% (${item.runs} run${item.runs > 1 ? 's' : ''})`}
                        >
                          {/* Run count badge */}
                          {item.runs > 1 && (
                            <div style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.white,
                              fontWeight: theme.typography.fontWeight.semibold,
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              padding: `2px 6px`,
                              borderRadius: theme.borderRadius.full
                            }}>
                              {item.runs}
                            </div>
                          )}
                        </div>
                        
                        {/* Date label below */}
                        <div style={{
                          marginTop: theme.spacing.sm,
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%'
                        }}>
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        
                        {/* Runs count indicator */}
                        {item.runs > 1 && (
                          <div style={{
                            marginTop: '2px',
                            fontSize: '9px',
                            color: theme.colors.textMuted,
                            textAlign: 'center'
                          }}>
                            ({item.runs} runs avg)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div style={{
                  marginTop: theme.spacing.lg,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: theme.spacing.xl,
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.textSecondary
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: theme.colors.success, borderRadius: '2px' }} />
                    <span>≥90% Excellent</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: theme.colors.primary, borderRadius: '2px' }} />
                    <span>≥75% Good</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: theme.colors.warning, borderRadius: '2px' }} />
                    <span>≥60% Fair</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: theme.colors.danger, borderRadius: '2px' }} />
                    <span>&lt;60% Needs Work</span>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Category Performance */}
      {analytics.categoryPerformance.length > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title>Category Performance</Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
              {analytics.categoryPerformance.map(cat => (
                <div key={cat.category}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.xs
                  }}>
                    <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>
                      {cat.category}
                    </span>
                    <span style={{ color: getColorForPassRate(cat.passRate) }}>
                      {cat.passRate.toFixed(1)}% ({cat.count} tests)
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '24px',
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderRadius: theme.borderRadius.sm,
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${cat.passRate}%`,
                      height: '100%',
                      backgroundColor: getColorForPassRate(cat.passRate),
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: theme.spacing.sm
                    }}>
                      <span style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.white,
                        fontWeight: theme.typography.fontWeight.semibold
                      }}>
                        {cat.passRate >= 20 && `${cat.passRate.toFixed(0)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Recent Test Runs - Grouped by Agent */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Test Runs (Grouped by Agent)</Card.Title>
          <Card.Text>
            Test runs organized by agent. Click on an agent to expand and see individual runs.
          </Card.Text>
        </Card.Header>
        <Card.Body>
          {(() => {
            // Group runs by agent
            const groupedRuns = analytics.recentRuns.reduce((acc, run) => {
              const agentKey = run.agentName || run.agentId;
              if (!acc[agentKey]) {
                acc[agentKey] = {
                  agentName: agentKey,
                  agentId: run.agentId,
                  runs: [],
                  totalRuns: 0,
                  avgPassRate: 0,
                  avgScore: 0,
                  totalCost: 0
                };
              }
              acc[agentKey].runs.push(run);
              acc[agentKey].totalRuns++;
              acc[agentKey].avgPassRate += run.passRate;
              acc[agentKey].avgScore += run.averageScore || 0;
              acc[agentKey].totalCost += run.cost || 0;
              return acc;
            }, {} as Record<string, any>);

            // Calculate averages
            Object.values(groupedRuns).forEach((group: any) => {
              group.avgPassRate = group.avgPassRate / group.totalRuns;
              group.avgScore = group.avgScore / group.totalRuns;
            });

            const toggleGroup = (agentName: string) => {
              const newExpanded = new Set(expandedGroups);
              if (newExpanded.has(agentName)) {
                newExpanded.delete(agentName);
              } else {
                newExpanded.add(agentName);
              }
              setExpandedGroups(newExpanded);
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                {Object.values(groupedRuns).map((group: any) => {
                  const isExpanded = expandedGroups.has(group.agentName);
                  
                  return (
                    <div
                      key={group.agentName}
                      style={{
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Group Header */}
                      <div
                        onClick={() => toggleGroup(group.agentName)}
                        style={{
                          padding: theme.spacing.lg,
                          backgroundColor: theme.colors.backgroundSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.gray200}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                          <span style={{ fontSize: theme.typography.fontSize.lg }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <div>
                            <div style={{
                              fontSize: theme.typography.fontSize.base,
                              fontWeight: theme.typography.fontWeight.semibold,
                              color: theme.colors.textPrimary
                            }}>
                              {group.agentName}
                            </div>
                            <div style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.textMuted
                            }}>
                              {group.totalRuns} test run{group.totalRuns !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: theme.spacing.xl, alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.textMuted,
                              marginBottom: '2px'
                            }}>
                              Avg Pass Rate
                            </div>
                            <Badge variant={group.avgPassRate >= 75 ? 'success' : group.avgPassRate >= 60 ? 'warning' : 'danger'}>
                              {group.avgPassRate.toFixed(0)}%
                            </Badge>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.textMuted,
                              marginBottom: '2px'
                            }}>
                              Avg Score
                            </div>
                            <div style={{
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.semibold
                            }}>
                              {group.avgScore.toFixed(1)}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.textMuted,
                              marginBottom: '2px'
                            }}>
                              Total Cost
                            </div>
                            <div style={{
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.semibold
                            }}>
                              ${group.totalCost.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Runs Table */}
                      {isExpanded && (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: theme.typography.fontSize.sm
                          }}>
                            <thead>
                              <tr style={{
                                backgroundColor: theme.colors.gray100,
                                borderBottom: `1px solid ${theme.colors.border}`
                              }}>
                                <th style={{ padding: theme.spacing.sm, textAlign: 'left', paddingLeft: theme.spacing.xl }}>Date</th>
                                <th style={{ padding: theme.spacing.sm, textAlign: 'center' }}>Results</th>
                                <th style={{ padding: theme.spacing.sm, textAlign: 'center' }}>Pass Rate</th>
                                <th style={{ padding: theme.spacing.sm, textAlign: 'center' }}>Score</th>
                                <th style={{ padding: theme.spacing.sm, textAlign: 'right' }}>Cost</th>
                                <th style={{ padding: theme.spacing.sm, textAlign: 'center' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.runs.map((run: TestRun) => (
                                <tr
                                  key={run.id}
                                  style={{
                                    borderBottom: `1px solid ${theme.colors.border}`,
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <td style={{ padding: theme.spacing.sm, paddingLeft: theme.spacing.xl }}>
                                    {formatDate(run.startTime)}
                                  </td>
                                  <td style={{ padding: theme.spacing.sm, textAlign: 'center' }}>
                                    {run.passedTests}/{run.totalTests}
                                  </td>
                                  <td style={{ padding: theme.spacing.sm, textAlign: 'center' }}>
                                    <Badge variant={run.passRate >= 75 ? 'success' : run.passRate >= 60 ? 'warning' : 'danger'}>
                                      {run.passRate.toFixed(0)}%
                                    </Badge>
                                  </td>
                                  <td style={{ padding: theme.spacing.sm, textAlign: 'center' }}>
                                    {run.averageScore?.toFixed(1) || 'N/A'}
                                  </td>
                                  <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                                    ${(run.cost || 0).toFixed(2)}
                                  </td>
                                  <td style={{ padding: theme.spacing.sm, textAlign: 'center' }}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => window.location.href = `/agent-testing/results/${run.id}`}
                                    >
                                      View Details
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
