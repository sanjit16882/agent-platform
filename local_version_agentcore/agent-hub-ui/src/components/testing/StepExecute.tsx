import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import { KnowledgeConfig } from '../../types/testing';

interface StepExecuteProps {
  agent: any;
  models: string[];
  tests: any[];
  inputs: Record<string, { content: string; format: string }>;
  knowledgeConfig: KnowledgeConfig;
  onExecutionComplete: (runId: string, status: 'completed' | 'failed') => void;
}

const StepExecute: React.FC<StepExecuteProps> = ({
  agent,
  models,
  tests,
  inputs,
  knowledgeConfig,
  onExecutionComplete
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeTests = async () => {
    try {
      setStatus('running');
      setProgress(0);
      setError(null);

      // Send full test objects (supports both library and custom tests)
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

      // If multiple models selected, execute for each model
      if (models.length > 1) {
        console.log(`🔬 Multi-model testing: Running tests across ${models.length} models`);
        
        let lastRunId = '';
        const totalSteps = models.length * tests.length;
        let currentStep = 0;

        for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
          const modelId = models[modelIndex];
          const modelName = modelId.split(':')[0].replace('anthropic.', '');
          
          setCurrentTest(`Model ${modelIndex + 1}/${models.length}: ${modelName}`);
          
          // Execute tests for this model
          const response = await fetch(`${API_BASE_URL}/api/testing/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: agent.id,
              tests: tests, // Send full test objects
              options: {
                modelId: modelId,
                customInputs: Object.keys(inputs).length > 0 ? inputs : undefined,
                knowledgeConfig: knowledgeConfig // Include knowledge config
              }
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Model ${modelName}: ${errorData.error || 'Test execution failed'}`);
          }

          const responseData = await response.json();
          const result = responseData.data;
          lastRunId = result.run_id;
          
          // Update progress
          currentStep += tests.length;
          setProgress((currentStep / totalSteps) * 100);
          
          // Small delay between models
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        setRunId(lastRunId);
        setStatus('completed');
        onExecutionComplete(lastRunId, 'completed');
        
        console.log('✅ Multi-model testing completed');
      } else {
        // Single model execution
        const modelId = models[0];
        console.log(`🧪 Single model testing: ${modelId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/testing/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            tests: tests, // Send full test objects
            options: {
              modelId: modelId,
              customInputs: Object.keys(inputs).length > 0 ? inputs : undefined,
              knowledgeConfig: knowledgeConfig // Include knowledge config
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Test execution failed');
        }

        const responseData = await response.json();
        const result = responseData.data;
        const runId = result.run_id;
        
        setRunId(runId);

        // Simulate progress updates
        for (let i = 0; i < tests.length; i++) {
          setCurrentTest(tests[i].name);
          setProgress(((i + 1) / tests.length) * 100);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setStatus('completed');
        onExecutionComplete(runId, 'completed');
      }
      
      // Emit event to refresh Agent Catalog with updated test results
      console.log('🔔 Emitting test-results-updated event for Agent Catalog');
      window.dispatchEvent(new CustomEvent('test-results-updated', {
        detail: {
          runId: runId,
          agentIds: [agent.id],
          timestamp: new Date().toISOString(),
          testCount: tests.length,
          modelCount: models.length
        }
      }));
    } catch (err: any) {
      setStatus('failed');
      setError(err.message);
      onExecutionComplete('', 'failed');
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Execute Tests</Card.Title>
        <Card.Text>Run tests against the selected agent</Card.Text>
      </Card.Header>

      <Card.Body>
        {/* Execution Summary */}
        <div style={{
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: theme.spacing.lg,
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary
              }}>
                {agent?.name}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary
              }}>
                Agent
              </div>
            </div>
            <div>
              <div style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary
              }}>
                {tests.length}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary
              }}>
                Tests
              </div>
            </div>
            <div>
              <div style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary
              }}>
                {knowledgeConfig.vectorDB.enabled && knowledgeConfig.mcp.enabled
                  ? 'Full-stack'
                  : knowledgeConfig.vectorDB.enabled
                  ? 'RAG'
                  : knowledgeConfig.mcp.enabled
                  ? 'MCP'
                  : 'LLM Only'}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary
              }}>
                Execution Mode
              </div>
            </div>
          </div>

          {/* Knowledge Sources Info */}
          {(knowledgeConfig.vectorDB.enabled || knowledgeConfig.mcp.enabled) && (
            <div style={{
              marginTop: theme.spacing.lg,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.infoLight,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.info}`,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.info
            }}>
              <div style={{ fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs }}>
                Knowledge Sources Enabled:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                {knowledgeConfig.vectorDB.enabled && (
                  <div>
                    📚 Vector DB: {knowledgeConfig.vectorDB.knowledgeBases.length} knowledge base(s)
                  </div>
                )}
                {knowledgeConfig.mcp.enabled && (
                  <div>
                    🔌 MCP: {knowledgeConfig.mcp.selectedServers.length} server(s)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Display */}
        {status === 'idle' && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl']
          }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              marginBottom: theme.spacing.lg
            }}>
              🚀
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.md
            }}>
              Ready to Execute
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xl
            }}>
              Click the button below to start test execution
            </div>
            <Button variant="primary" size="lg" onClick={executeTests}>
              Start Execution
            </Button>
          </div>
        )}

        {status === 'running' && (
          <div>
            <div style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.xl
            }}>
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
                Executing Tests...
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                {currentTest}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: theme.spacing.md }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{
                height: '12px',
                backgroundColor: theme.colors.gray200,
                borderRadius: theme.borderRadius.full,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: theme.colors.primary,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl']
          }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              marginBottom: theme.spacing.lg
            }}>
              ✅
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.success,
              marginBottom: theme.spacing.sm
            }}>
              Execution Complete!
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.md
            }}>
              All tests have been executed successfully
            </div>
            {runId && (
              <div style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.successLight,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.xs,
                fontFamily: 'monospace',
                color: theme.colors.textSecondary
              }}>
                Run ID: {runId}
              </div>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl']
          }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              marginBottom: theme.spacing.lg
            }}>
              ❌
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.danger,
              marginBottom: theme.spacing.sm
            }}>
              Execution Failed
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xl
            }}>
              {error || 'An error occurred during test execution'}
            </div>
            <Button variant="outline-danger" onClick={executeTests}>
              Retry Execution
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default StepExecute;
