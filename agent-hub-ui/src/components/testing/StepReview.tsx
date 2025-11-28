import React from 'react';
import Card from '../common/Card';
import { theme } from '../../styles/theme';

interface StepReviewProps {
  agent: any;
  models: string[];
  tests: any[];
  inputs: Record<string, { content: string; format: string }>;
}

const StepReview: React.FC<StepReviewProps> = ({ agent, models, tests, inputs }) => {
  return (
    <div>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Review Configuration</Card.Title>
          <Card.Text>Review your test configuration before execution</Card.Text>
        </Card.Header>
      </Card>

      {/* Agent Summary */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
            Agent
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: theme.spacing.md,
            fontSize: theme.typography.fontSize.sm
          }}>
            <div style={{ fontWeight: theme.typography.fontWeight.semibold }}>Name:</div>
            <div>{agent?.name || 'N/A'}</div>
            
            <div style={{ fontWeight: theme.typography.fontWeight.semibold }}>Description:</div>
            <div>{agent?.description || 'N/A'}</div>
            
            <div style={{ fontWeight: theme.typography.fontWeight.semibold }}>Model:</div>
            <div>{agent?.model || 'N/A'}</div>
          </div>
        </Card.Body>
      </Card>

      {/* Models Summary */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
            AI Models ({models.length})
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {models.length === 1 ? (
            <div style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.infoLight,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm
            }}>
              Testing with 1 model: <strong>{models[0].split(':')[0].replace('anthropic.', '')}</strong>
            </div>
          ) : (
            <>
              <div style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.warningLight,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.md
              }}>
                ⚡ <strong>Model Comparison Mode:</strong> Tests will run sequentially across {models.length} models
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {models.map((modelId, index) => (
                  <div
                    key={modelId}
                    style={{
                      padding: theme.spacing.md,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: theme.typography.fontSize.sm
                    }}
                  >
                    {index + 1}. {modelId.split(':')[0].replace('anthropic.', '')}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Tests Summary */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title style={{ fontSize: theme.typography.fontSize.base }}>
            Tests ({tests.length})
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {tests.map((test, index) => (
              <div
                key={test.id}
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.sm
                }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold
                  }}>
                    {index + 1}. {test.name}
                  </div>
                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <span style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: theme.colors.infoLight,
                      color: theme.colors.info,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.xs
                    }}>
                      {test.category}
                    </span>
                    <span style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: theme.colors.gray100,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.xs
                    }}>
                      {inputs[test.id]?.format || test.input_format}
                    </span>
                  </div>
                </div>
                
                {/* Input Preview */}
                <div style={{
                  marginTop: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  backgroundColor: theme.colors.white,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.xs,
                  fontFamily: 'monospace',
                  maxHeight: '100px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {inputs[test.id]?.content?.substring(0, 200) || test.input_content?.substring(0, 200)}
                  {(inputs[test.id]?.content?.length > 200 || test.input_content?.length > 200) && '...'}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Summary Stats */}
      <Card>
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
                1
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Agent
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary
              }}>
                {tests.length}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Test{tests.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.success
              }}>
                {Object.keys(inputs).length}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                Configured
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Ready to Execute */}
      <div style={{
        marginTop: theme.spacing.xl,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.successLight,
        border: `1px solid ${theme.colors.success}`,
        borderRadius: theme.borderRadius.md,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.success,
          marginBottom: theme.spacing.sm
        }}>
          ✓ Ready to Execute
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary
        }}>
          Click "Next" to proceed with test execution
        </div>
      </div>
    </div>
  );
};

export default StepReview;
