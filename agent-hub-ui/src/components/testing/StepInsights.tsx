import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

interface StepInsightsProps {
  runId: string | null;
  testResults: any;
  onInsightsGenerated: (insights: any) => void;
}

const StepInsights: React.FC<StepInsightsProps> = ({
  runId,
  testResults,
  onInsightsGenerated
}) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate insights when component mounts
  React.useEffect(() => {
    if (runId && !insights && !loading) {
      console.log('🤖 Auto-generating insights for runId:', runId);
      generateInsights();
    }
  }, [runId]);

  const generateInsights = async () => {
    try {
      console.log('🔍 Starting insights generation for runId:', runId);
      setLoading(true);
      setError(null);

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      
      // First, fetch the test run data
      console.log('📥 Fetching test run data...');
      const runResponse = await fetch(`${API_BASE_URL}/api/testing/runs/${runId}`);
      console.log('📥 Test run response status:', runResponse.status);
      
      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error('❌ Failed to fetch test run:', errorText);
        throw new Error('Failed to fetch test run data');
      }
      
      const runData = await runResponse.json();
      console.log('✅ Test run data:', runData);
      const testRun = runData.data;
      
      // Prepare data for insights generation
      const insightsPayload = {
        agentName: testRun.agent_id || 'Unknown Agent',
        testSuiteName: testRun.test_suite_name || 'Test Suite',
        testType: 'General',
        overallScore: testRun.overall_score || 0,
        testResults: testRun.results || [],
        modelId: testRun.model_id
      };
      
      console.log('🤖 Generating insights with payload:', insightsPayload);
      
      // Generate insights
      const response = await fetch(`${API_BASE_URL}/api/testing/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insightsPayload)
      });

      console.log('🤖 Insights response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Insights generation failed:', errorData);
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const data = await response.json();
      console.log('✅ Insights generated:', data);
      
      // Extract insights from response
      const generatedInsights = data.insights || data.data?.insights || data.data;
      
      if (!generatedInsights) {
        console.error('❌ No insights in response:', data);
        throw new Error('No insights data in response');
      }
      
      // Check if using fallback insights (this is OK, fallback insights are accurate)
      if (data.metadata?.fallback) {
        console.log('ℹ️ Using rule-based insights (fallback):', data.metadata.fallbackReason);
      }
      
      setInsights(generatedInsights);
      onInsightsGenerated(generatedInsights);
      
      console.log('✅ Insights set in state');
      console.log('📊 Insights structure:', {
        hasHallucinations: !!generatedInsights.hallucinations,
        hallucinationsCount: generatedInsights.hallucinations?.length || 0,
        hasMisunderstood: !!generatedInsights.misunderstoodIntent,
        misunderstoodCount: generatedInsights.misunderstoodIntent?.length || 0,
        hasToolErrors: !!generatedInsights.toolUsageErrors,
        toolErrorsCount: generatedInsights.toolUsageErrors?.length || 0,
        hasStrengths: !!generatedInsights.reasoningStrengths,
        strengthsCount: generatedInsights.reasoningStrengths?.length || 0,
        hasRecommendations: !!generatedInsights.recommendations,
        recommendationsCount: generatedInsights.recommendations?.length || 0
      });
    } catch (err: any) {
      console.error('❌ Error generating insights:', err);
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

  return (
    <div>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>AI-Powered Insights</Card.Title>
          <Card.Text>Generate intelligent analysis of test results</Card.Text>
        </Card.Header>
      </Card>

      {!insights && !loading && (
        <Card>
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
      )}

      {loading && (
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
      )}

      {error && (
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
                ⚠ Error: {error}
              </div>
              <Button variant="outline-danger" onClick={generateInsights}>
                Retry
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {insights && (
        <div>
          {console.log('🎨 Rendering insights:', insights)}
          
          {/* Show message if no issues but also no strengths/recommendations */}
          {(!insights.hallucinations || insights.hallucinations.length === 0) &&
           (!insights.misunderstoodIntent || insights.misunderstoodIntent.length === 0) &&
           (!insights.toolUsageErrors || insights.toolUsageErrors.length === 0) &&
           (!insights.reasoningStrengths || insights.reasoningStrengths.length === 0) &&
           (!insights.recommendations || insights.recommendations.length === 0) && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Body>
                <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
                  <div style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    marginBottom: theme.spacing.lg
                  }}>
                    ✨
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.success,
                    marginBottom: theme.spacing.md
                  }}>
                    No Insights Available
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    Unable to generate insights from the test results.
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
          
          {/* Show success message if only strengths, no issues */}
          {(!insights.hallucinations || insights.hallucinations.length === 0) &&
           (!insights.misunderstoodIntent || insights.misunderstoodIntent.length === 0) &&
           (!insights.toolUsageErrors || insights.toolUsageErrors.length === 0) &&
           (insights.reasoningStrengths && insights.reasoningStrengths.length > 0) &&
           (!insights.recommendations || insights.recommendations.length === 0) && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Body>
                <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                  <div style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    marginBottom: theme.spacing.md
                  }}>
                    🎉
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.success,
                    marginBottom: theme.spacing.sm
                  }}>
                    Excellent Performance!
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    All tests passed with no issues detected. See strengths below.
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
          
          {/* Hallucinations */}
          {insights.hallucinations && insights.hallucinations.length > 0 && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Header>
                <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
                  🔍 Hallucinations Detected
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {insights.hallucinations.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: theme.spacing.md,
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
          {insights.misunderstood_intent && insights.misunderstood_intent.length > 0 && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Header>
                <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
                  ⚠️ Misunderstood Intent
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {insights.misunderstood_intent.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: theme.spacing.md,
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
          {insights.tool_usage_errors && insights.tool_usage_errors.length > 0 && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Header>
                <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
                  🔧 Tool Usage Errors
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {insights.tool_usage_errors.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: theme.spacing.md,
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
          {insights.reasoning_strengths && insights.reasoning_strengths.length > 0 && (
            <Card style={{ marginBottom: theme.spacing.xl }}>
              <Card.Header>
                <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
                  ✨ Reasoning Strengths
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {insights.reasoning_strengths.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: theme.spacing.md,
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
          {insights.recommendations && insights.recommendations.length > 0 && (
            <Card>
              <Card.Header>
                <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
                  💡 Recommendations
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {insights.recommendations.map((rec: any, index: number) => (
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
                          {rec.issue || rec.title}
                        </div>
                        <span style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          backgroundColor: rec.priority?.toLowerCase() === 'high' ? theme.colors.danger : rec.priority?.toLowerCase() === 'medium' ? theme.colors.warning : theme.colors.info,
                          color: theme.colors.white,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: theme.typography.fontSize.xs,
                          textTransform: 'uppercase'
                        }}>
                          {rec.priority}
                        </span>
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                        marginBottom: theme.spacing.sm
                      }}>
                        {rec.recommendation || rec.description}
                      </div>
                      {rec.expectedImpact && (
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.success,
                          fontStyle: 'italic'
                        }}>
                          💡 {rec.expectedImpact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StepInsights;
