/**
 * Testing Summary Badge Component
 * Displays testing performance summary on Agent Catalog cards
 */

import React, { useState, useEffect } from 'react';
import { Collapse, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import { agentTestingService, AgentTestingSummary } from '../../services/agentTestingService';

interface TestingSummaryBadgeProps {
  agentId: string;
}

const TestingSummaryBadge: React.FC<TestingSummaryBadgeProps> = ({ agentId }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AgentTestingSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && !summary) {
      loadSummary();
    }
  }, [open]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await agentTestingService.getAgentTestingSummary(agentId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading testing summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullAnalysis = () => {
    navigate(`/agents/${agentId}/execute`, { state: { activeTab: 'testing' } });
  };

  const handleRunQuickTest = () => {
    navigate(`/agent-testing/workflow`, { state: { preselectedAgent: agentId } });
  };

  return (
    <div style={{ marginTop: theme.spacing.md }}>
      {/* Toggle Button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.backgroundTertiary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <span style={{ fontSize: '1.2rem' }}>🧪</span>
          <span style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary
          }}>
            Test Performance Summary
          </span>
        </div>
        <span style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </div>

      {/* Collapsible Content */}
      <Collapse in={open}>
        <div style={{
          marginTop: theme.spacing.xs,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <Spinner animation="border" size="sm" />
              <div style={{
                marginTop: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Loading test data...
              </div>
            </div>
          ) : !summary || !summary.hasTestData ? (
            <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.md
              }}>
                No test data available for this agent yet.
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunQuickTest}
              >
                Run First Test
              </Button>
            </div>
          ) : (
            <>
              {/* Best Model & Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.md,
                paddingBottom: theme.spacing.md,
                borderBottom: `1px solid ${theme.colors.border}`
              }}>
                <div>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs
                  }}>
                    🏆 Best Model
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.primary
                  }}>
                    {summary.bestModel?.name || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    Score: {summary.bestModel?.score || 0}% | Pass Rate: {summary.bestModel?.passRate || 0}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs
                  }}>
                    📅 Last Tested
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textPrimary
                  }}>
                    {agentTestingService.formatRelativeTime(summary.lastTested)}
                  </div>
                  {summary.lastTested && (
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.textMuted,
                      marginTop: '2px'
                    }}>
                      {new Date(summary.lastTested).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.xs
                  }}>
                    {summary.totalTests} test{summary.totalTests !== 1 ? 's' : ''} in suite
                  </div>
                </div>
              </div>

              {/* Model Comparison Bar Chart */}
              <div style={{ marginBottom: theme.spacing.md }}>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.sm,
                  fontWeight: theme.typography.fontWeight.semibold
                }}>
                  📊 Model Comparison
                </div>
                {summary.modelComparison.map((model, index) => (
                  <div key={model.modelId} style={{ marginBottom: theme.spacing.sm }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: theme.spacing.xs
                    }}>
                      <span style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textPrimary
                      }}>
                        {model.model}
                      </span>
                      <span style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: index === 0 ? theme.colors.success : theme.colors.textSecondary
                      }}>
                        {model.score}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderRadius: theme.borderRadius.sm,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${model.score}%`,
                        height: '100%',
                        backgroundColor: index === 0 ? theme.colors.success : 
                                       index === 1 ? theme.colors.info : 
                                       theme.colors.warning,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: theme.spacing.sm,
                paddingTop: theme.spacing.md,
                borderTop: `1px solid ${theme.colors.border}`
              }}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleRunQuickTest}
                  style={{ flex: 1 }}
                >
                  Run Quick Test
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleViewFullAnalysis}
                  style={{ flex: 1 }}
                >
                  View Full Analysis →
                </Button>
              </div>
            </>
          )}
        </div>
      </Collapse>
    </div>
  );
};

export default TestingSummaryBadge;
