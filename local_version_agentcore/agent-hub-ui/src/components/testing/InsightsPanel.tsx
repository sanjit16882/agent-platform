import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';

interface InsightsPanelProps {
  runId?: string;
  insights?: any; // Can accept pre-loaded insights
  onGenerate?: () => void;
  autoGenerate?: boolean; // Auto-generate on mount
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  runId,
  insights: initialInsights,
  onGenerate,
  autoGenerate = false
}) => {
  const [insights, setInsights] = useState<any>(initialInsights || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoGenerate && runId && !initialInsights) {
      generateInsights();
    }
  }, [runId, autoGenerate]);

  const generateInsights = async () => {
    if (onGenerate) {
      onGenerate();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/testing/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId })
      });

      if (!response.ok) throw new Error('Failed to generate insights');

      const data = await response.json();
      setInsights(data.insights);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              marginBottom: theme.spacing.lg
            }}>
              ⚡
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.primary,
              marginBottom: theme.spacing.sm
            }}>
              Generating Insights...
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              AI is analyzing your test results
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
              ⚠ Error generating insights
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
              {error}
            </div>
            <Button variant="outline-danger" onClick={generateInsights}>
              Retry
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>AI-Powered Insights</Card.Title>
          <Card.Text>Generate intelligent analysis of test results</Card.Text>
        </Card.Header>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              marginBottom: theme.spacing.lg
            }}>
              🤖
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.md
            }}>
              Generate AI Insights
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xl,
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              Use AI to analyze test results and get actionable recommendations for improving your agent
            </div>
            <Button variant="primary" size="lg" onClick={generateInsights}>
              Generate Insights
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Count insights by category
  const counts = {
    hallucinations: insights.hallucinations?.length || 0,
    misunderstood: insights.misunderstood_intent?.length || 0,
    toolErrors: insights.tool_usage_errors?.length || 0,
    strengths: insights.reasoning_strengths?.length || 0,
    recommendations: insights.recommendations?.length || 0
  };

  const totalIssues = counts.hallucinations + counts.misunderstood + counts.toolErrors;
  const hasIssues = totalIssues > 0;

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Card.Title>AI-Powered Insights</Card.Title>
              <Card.Text>Intelligent analysis and recommendations</Card.Text>
            </div>
            <Button variant="outline-primary" size="sm" onClick={generateInsights}>
              Regenerate
            </Button>
          </div>
        </Card.Header>
      </Card>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.xl
      }}>
        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.danger
            }}>
              {totalIssues}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textSecondary
            }}>
              Issues Found
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.success
            }}>
              {counts.strengths}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textSecondary
            }}>
              Strengths
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.primary
            }}>
              {counts.recommendations}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textSecondary
            }}>
              Recommendations
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Overall Status */}
      {!hasIssues && counts.strengths > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Body>
            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.successLight,
              border: `1px solid ${theme.colors.success}`,
              borderRadius: theme.borderRadius.md,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.success,
                marginBottom: theme.spacing.sm
              }}>
                ✓ Excellent Performance!
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                No critical issues detected. Your agent is performing well.
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Hallucinations */}
      {counts.hallucinations > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
              🔍 Hallucinations Detected ({counts.hallucinations})
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {insights.hallucinations.map((item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: theme.spacing.lg,
                    backgroundColor: theme.colors.dangerLight,
                    border: `1px solid ${theme.colors.danger}`,
                    borderRadius: theme.borderRadius.md
                  }}
                >
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.danger,
                    marginBottom: theme.spacing.xs
                  }}>
                    {item.test}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    {item.issue}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Misunderstood Intent */}
      {counts.misunderstood > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
              ⚠️ Misunderstood Intent ({counts.misunderstood})
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {insights.misunderstood_intent.map((item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: theme.spacing.lg,
                    backgroundColor: theme.colors.warningLight,
                    border: `1px solid ${theme.colors.warning}`,
                    borderRadius: theme.borderRadius.md
                  }}
                >
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.warning,
                    marginBottom: theme.spacing.xs
                  }}>
                    {item.test}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    {item.issue}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Tool Usage Errors */}
      {counts.toolErrors > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
              🔧 Tool Usage Errors ({counts.toolErrors})
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {insights.tool_usage_errors.map((item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: theme.spacing.lg,
                    backgroundColor: theme.colors.dangerLight,
                    border: `1px solid ${theme.colors.danger}`,
                    borderRadius: theme.borderRadius.md
                  }}
                >
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.danger,
                    marginBottom: theme.spacing.xs
                  }}>
                    {item.test}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    {item.issue}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Reasoning Strengths */}
      {counts.strengths > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
              ✨ Reasoning Strengths ({counts.strengths})
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {insights.reasoning_strengths.map((item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: theme.spacing.lg,
                    backgroundColor: theme.colors.successLight,
                    border: `1px solid ${theme.colors.success}`,
                    borderRadius: theme.borderRadius.md
                  }}
                >
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.success,
                    marginBottom: theme.spacing.xs
                  }}>
                    {item.test}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    {item.strength}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Recommendations */}
      {counts.recommendations > 0 && (
        <Card>
          <Card.Header>
            <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
              💡 Recommendations ({counts.recommendations})
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {insights.recommendations.map((rec: any, index: number) => {
                const priorityColors = {
                  high: theme.colors.danger,
                  medium: theme.colors.warning,
                  low: theme.colors.info
                };
                const priorityColor = priorityColors[rec.priority as keyof typeof priorityColors] || theme.colors.info;

                return (
                  <div
                    key={index}
                    style={{
                      padding: theme.spacing.lg,
                      backgroundColor: theme.colors.primaryLight,
                      border: `1px solid ${theme.colors.primary}`,
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
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.primary
                      }}>
                        {rec.title}
                      </div>
                      <span style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: priorityColor,
                        color: theme.colors.white,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        textTransform: 'uppercase',
                        fontWeight: theme.typography.fontWeight.semibold
                      }}>
                        {rec.priority}
                      </span>
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary
                    }}>
                      {rec.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* No Insights */}
      {!hasIssues && counts.strengths === 0 && counts.recommendations === 0 && (
        <Card>
          <Card.Body>
            <div style={{
              textAlign: 'center',
              padding: theme.spacing['3xl'],
              color: theme.colors.textSecondary
            }}>
              <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>
                No insights available
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm }}>
                The AI analysis did not generate any specific insights for this test run.
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default InsightsPanel;
