/**
 * Agent Testing Performance Tab
 * Displays comprehensive testing results and model comparison for a specific agent
 * Used in Agent Executor page
 */

import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { theme } from '../../styles/theme';
import { agentTestingService, AgentTestingDetailed } from '../../services/agentTestingService';

interface AgentTestingPerformanceTabProps {
  agentId: string;
}

const AgentTestingPerformanceTab: React.FC<AgentTestingPerformanceTabProps> = ({ agentId }) => {
  const [loading, setLoading] = useState(true);
  const [testingData, setTestingData] = useState<AgentTestingDetailed | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTestingData();
  }, [agentId]);

  const loadTestingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentTestingService.getAgentTestingDetailed(agentId);
      setTestingData(data);
    } catch (err: any) {
      console.error('Error loading testing data:', err);
      setError(err.message || 'Failed to load testing data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return theme.colors.success;
    if (score >= 80) return '#10b981';
    if (score >= 70) return theme.colors.warning;
    if (score >= 60) return '#f59e0b';
    return theme.colors.danger;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Acceptable';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: theme.spacing['3xl'],
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spinner animation="border" variant="primary" />
        <div style={{ 
          marginTop: theme.spacing.lg,
          color: theme.colors.textSecondary 
        }}>
          Loading testing data...
        </div>
      </div>
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
            <div style={{ 
              color: theme.colors.danger, 
              marginBottom: theme.spacing.md,
              fontSize: theme.typography.fontSize.lg
            }}>
              ⚠️ Error Loading Testing Data
            </div>
            <div style={{ 
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.lg
            }}>
              {error}
            </div>
            <Button variant="outline-danger" onClick={loadTestingData}>
              Retry
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!testingData || !testingData.hasTestData) {
    return (
      <Card>
        <Card.Body>
          <div style={{ 
            textAlign: 'center', 
            padding: theme.spacing['3xl'] 
          }}>
            <div style={{ 
              fontSize: theme.typography.fontSize['2xl'],
              marginBottom: theme.spacing.lg
            }}>
              📊
            </div>
            <div style={{ 
              fontSize: theme.typography.fontSize.lg,
              marginBottom: theme.spacing.md,
              color: theme.colors.textPrimary
            }}>
              No Testing Data Available
            </div>
            <div style={{ 
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xl
            }}>
              This agent hasn't been tested yet. Run tests to see performance metrics and model comparisons.
            </div>
            <Button
              variant="primary"
              onClick={() => window.location.href = `/agent-testing/workflow?agentId=${agentId}`}
            >
              Run First Test
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
      {/* Header with Summary */}
      <Card>
        <Card.Header>
          <Card.Title>📊 Testing & Performance Overview</Card.Title>
          <Card.Text>
            Comprehensive analysis of model performance for this agent
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary
              }}>
                {testingData.models.length}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Models Tested
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary
              }}>
                {testingData.totalTests}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Total Tests
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: getScoreColor(testingData.bestModel?.score || 0)
              }}>
                {testingData.bestModel?.score.toFixed(1)}%
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Best Score
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary
              }}>
                {agentTestingService.formatRelativeTime(testingData.lastTested)}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Last Tested
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Best Model Recommendation */}
      {testingData.bestModel && (
        <Card>
          <Card.Body>
            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: '#e7f3ff',
              border: '2px solid #0066cc',
              borderRadius: theme.borderRadius.lg
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.md
              }}>
                <span style={{ fontSize: '2rem' }}>🏆</span>
                <div>
                  <div style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.textPrimary
                  }}>
                    Recommended Model: {testingData.bestModel.name}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    Best overall performance for this agent
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: theme.spacing.lg,
                flexWrap: 'wrap'
              }}>
                <div>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>Score: </span>
                  <Badge bg="success">{testingData.bestModel.score.toFixed(1)}%</Badge>
                </div>
                <div>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>Pass Rate: </span>
                  <Badge bg="success">{testingData.bestModel.passRate.toFixed(1)}%</Badge>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Model Performance Comparison Table */}
      <Card>
        <Card.Header>
          <Card.Title>📈 Model Performance Comparison</Card.Title>
          <Card.Text>
            Overall performance metrics across all tested models
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: theme.typography.fontSize.sm
            }}>
              <thead>
                <tr style={{
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderBottom: `2px solid ${theme.colors.border}`
                }}>
                  <th style={{ padding: theme.spacing.md, textAlign: 'left' }}>Model</th>
                  <th style={{ padding: theme.spacing.md, textAlign: 'center' }}>Overall Score</th>
                  <th style={{ padding: theme.spacing.md, textAlign: 'center' }}>Pass Rate</th>
                  <th style={{ padding: theme.spacing.md, textAlign: 'center' }}>Total Cost</th>
                  <th style={{ padding: theme.spacing.md, textAlign: 'center' }}>Avg Speed</th>
                  <th style={{ padding: theme.spacing.md, textAlign: 'center' }}>Quality</th>
                </tr>
              </thead>
              <tbody>
                {testingData.models.map((model, index) => (
                  <tr
                    key={model.modelId}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                      backgroundColor: index === 0 ? '#f0f9ff' : 'transparent'
                    }}
                  >
                    <td style={{ padding: theme.spacing.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                        {index === 0 && <span>🏆</span>}
                        <span style={{ fontWeight: index === 0 ? theme.typography.fontWeight.bold : 'normal' }}>
                          {model.modelName}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                      <div style={{
                        fontWeight: theme.typography.fontWeight.bold,
                        color: getScoreColor(model.overallScore)
                      }}>
                        {model.overallScore.toFixed(1)}%
                      </div>
                    </td>
                    <td style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                      <Badge bg={model.passRate >= 80 ? 'success' : model.passRate >= 60 ? 'warning' : 'danger'}>
                        {model.passRate.toFixed(0)}%
                      </Badge>
                    </td>
                    <td style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                      ${model.totalCost.toFixed(3)}
                    </td>
                    <td style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                      {model.avgSpeed.toFixed(1)}s
                    </td>
                    <td style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                      <Badge bg={
                        model.overallScore >= 90 ? 'success' :
                        model.overallScore >= 70 ? 'warning' : 'danger'
                      }>
                        {getScoreLabel(model.overallScore)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Category Breakdown */}
      {testingData.models.length > 0 && testingData.models[0].categoryScores && 
       Object.keys(testingData.models[0].categoryScores).length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>📊 Category-by-Category Breakdown</Card.Title>
            <Card.Text>
              Performance comparison across different test categories
            </Card.Text>
          </Card.Header>
          <Card.Body>
            {Object.keys(testingData.models[0].categoryScores).map(category => (
              <div key={category} style={{ marginBottom: theme.spacing.xl }}>
                <div style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  marginBottom: theme.spacing.md,
                  textTransform: 'capitalize'
                }}>
                  {category.replace(/_/g, ' ')}
                </div>
                {testingData.models.map((model, index) => {
                  const score = model.categoryScores[category] || 0;
                  return (
                    <div key={model.modelId} style={{ marginBottom: theme.spacing.sm }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: theme.spacing.xs,
                        fontSize: theme.typography.fontSize.sm
                      }}>
                        <span style={{
                          fontWeight: index === 0 ? theme.typography.fontWeight.semibold : 'normal'
                        }}>
                          {model.modelName}
                        </span>
                        <span style={{
                          fontWeight: theme.typography.fontWeight.bold,
                          color: getScoreColor(score)
                        }}>
                          {score.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{
                        height: '24px',
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderRadius: theme.borderRadius.sm,
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${score}%`,
                          height: '100%',
                          backgroundColor: getScoreColor(score),
                          transition: 'width 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: theme.spacing.sm
                        }}>
                          {score >= 15 && (
                            <span style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.white,
                              fontWeight: theme.typography.fontWeight.semibold
                            }}>
                              {score.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Individual Test Results */}
      {testingData.models.length > 0 && testingData.models[0].testResults.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>🧪 Individual Test Results</Card.Title>
            <Card.Text>
              Detailed results for each test across all models
            </Card.Text>
          </Card.Header>
          <Card.Body>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: theme.typography.fontSize.sm
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderBottom: `2px solid ${theme.colors.border}`
                  }}>
                    <th style={{ padding: theme.spacing.md, textAlign: 'left', minWidth: '200px' }}>
                      Test Name
                    </th>
                    {testingData.models.map(model => (
                      <th key={model.modelId} style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                        {model.modelName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testingData.models[0].testResults.map((test, testIndex) => (
                    <tr
                      key={testIndex}
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`
                      }}
                    >
                      <td style={{ padding: theme.spacing.md }}>
                        {test.testName}
                      </td>
                      {testingData.models.map(model => {
                        const modelTest = model.testResults.find(t => t.testName === test.testName);
                        if (!modelTest) {
                          return (
                            <td key={model.modelId} style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                              <span style={{ color: theme.colors.textMuted }}>N/A</span>
                            </td>
                          );
                        }
                        return (
                          <td key={model.modelId} style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: theme.spacing.xs
                            }}>
                              <span>{modelTest.passed ? '✅' : '❌'}</span>
                              <span style={{
                                fontWeight: theme.typography.fontWeight.semibold,
                                color: getScoreColor(modelTest.score)
                              }}>
                                {modelTest.score.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <Card.Body>
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="primary"
              onClick={() => window.location.href = `/agent-testing/workflow?agentId=${agentId}`}
            >
              Run New Test
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => window.location.href = `/agent-testing/analytics?agentId=${agentId}`}
            >
              View Full Analytics
            </Button>
            <Button
              variant="outline-secondary"
              onClick={loadTestingData}
            >
              Refresh Data
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AgentTestingPerformanceTab;
