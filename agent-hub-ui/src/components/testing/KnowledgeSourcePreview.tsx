/**
 * KnowledgeSourcePreview Component
 * Feature: Agent Testing Knowledge Integration
 * 
 * Displays execution flow preview and performance impact for knowledge sources
 */

import React from 'react';
import Card from '../common/Card';
import { theme } from '../../styles/theme';
import { KnowledgeConfig } from '../../types/testing';

interface KnowledgeSourcePreviewProps {
  config: KnowledgeConfig;
  estimatedLatency: number;
  estimatedCost: number;
}

const KnowledgeSourcePreview: React.FC<KnowledgeSourcePreviewProps> = ({
  config,
  estimatedLatency,
  estimatedCost
}) => {
  const hasVectorDB = config.vectorDB.enabled;
  const hasMCP = config.mcp.enabled;
  const hasAny = hasVectorDB || hasMCP;

  // Calculate execution flow steps
  const getExecutionFlow = () => {
    const steps = [];
    
    if (hasVectorDB) {
      steps.push({
        icon: '🔍',
        label: 'Search Vector DB',
        detail: `${config.vectorDB.knowledgeBases.length} knowledge base(s), top ${config.vectorDB.retrievalConfig.topK} docs`
      });
    }
    
    if (hasMCP) {
      steps.push({
        icon: '🔧',
        label: 'Execute MCP Tools',
        detail: `${config.mcp.selectedServers.length} server(s) available`
      });
    }
    
    steps.push({
      icon: '🤖',
      label: 'Generate LLM Response',
      detail: hasAny ? 'With context from knowledge sources' : 'Direct LLM call'
    });
    
    return steps;
  };

  const executionFlow = getExecutionFlow();

  if (!hasAny) {
    return (
      <Card style={{ marginTop: theme.spacing.lg }}>
        <Card.Body>
          <div style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.gray100,
            borderRadius: theme.borderRadius.md,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.sm
            }}>
              💡 LLM-Only Mode
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Tests will use direct LLM responses without knowledge sources
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: theme.spacing.lg }}>
      <Card.Body>
        <div style={{
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.primaryLight,
          borderRadius: theme.borderRadius.md
        }}>
          {/* Header */}
          <div style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.primary,
            marginBottom: theme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            <span>💡</span>
            <span>Test Execution Preview</span>
          </div>

          {/* Execution Flow */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.md
            }}>
              Your tests will execute in this order:
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {executionFlow.map((step, index) => (
                <div key={index}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: theme.spacing.md,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.white,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.gray300}`
                  }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.xl,
                      minWidth: '32px',
                      textAlign: 'center'
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.textPrimary,
                        marginBottom: theme.spacing.xs
                      }}>
                        {index + 1}. {step.label}
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.textSecondary
                      }}>
                        {step.detail}
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow between steps */}
                  {index < executionFlow.length - 1 && (
                    <div style={{
                      textAlign: 'center',
                      color: theme.colors.gray400,
                      fontSize: theme.typography.fontSize.sm,
                      padding: `${theme.spacing.xs} 0`
                    }}>
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Performance Impact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.md,
            marginTop: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.gray300}`
          }}>
            {/* Latency Impact */}
            <div style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.gray300}`
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs
              }}>
                Estimated Latency Impact
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.warning
              }}>
                +{estimatedLatency}ms
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.xs
              }}>
                per test execution
              </div>
            </div>

            {/* Cost Impact */}
            <div style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.gray300}`
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.xs
              }}>
                Estimated Cost Impact
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.success
              }}>
                +${estimatedCost.toFixed(2)}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.xs
              }}>
                per 1K queries
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.infoLight,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.info}`,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.info
          }}>
            <strong>Note:</strong> Tests will use the first high-confidence answer found. 
            If Vector DB returns a match with &gt;90% similarity, MCP and LLM steps will be skipped.
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default KnowledgeSourcePreview;
