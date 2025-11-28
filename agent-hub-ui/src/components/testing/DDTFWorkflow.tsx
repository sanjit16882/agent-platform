import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import StepSelectAgent from './StepSelectAgent';
import StepSelectModels from './StepSelectModels';
import StepSelectTest from './StepSelectTest';
import StepCreateCustomTests from './StepCreateCustomTests';
import StepProvideInput from './StepProvideInput';
import StepReview from './StepReview';
import StepExecute from './StepExecute';
import StepResults from './StepResults';
import StepInsights from './StepInsights';

interface WorkflowState {
  // Step 1: Agent Selection
  selectedAgent: any | null;
  
  // Step 2: Model Selection
  selectedModels: string[];
  
  // Step 3: Test Selection
  selectedTests: any[];
  samplePrompts: string[];
  
  // Step 4: Custom Tests (Optional)
  customTests: any[];
  
  // Step 5: Input Configuration
  testInputs: Record<string, { content: string; format: string }>;
  
  // Step 6: Review (no additional state)
  
  // Step 7: Execution
  executionStatus: 'idle' | 'running' | 'completed' | 'failed';
  runId: string | null;
  
  // Step 8: Results
  testResults: any | null;
  
  // Step 9: Insights
  insights: any | null;
}

const STEPS = [
  { id: 1, name: 'Select Agent', description: 'Choose the agent to test' },
  { id: 2, name: 'Select Models', description: 'Choose AI models to test' },
  { id: 3, name: 'Select Tests', description: 'Choose tests to run' },
  { id: 4, name: 'Custom Tests', description: 'Create custom tests (optional)' },
  { id: 5, name: 'Provide Input', description: 'Configure test inputs' },
  { id: 6, name: 'Review', description: 'Review your configuration' },
  { id: 7, name: 'Execute', description: 'Run the tests' },
  { id: 8, name: 'Results', description: 'View test results' },
  { id: 9, name: 'Insights', description: 'Generate AI insights' }
];

const DDTFWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    selectedAgent: null,
    selectedModels: [],
    selectedTests: [],
    samplePrompts: [],
    customTests: [],
    testInputs: {},
    executionStatus: 'idle',
    runId: null,
    testResults: null,
    insights: null
  });

  const updateWorkflowState = (updates: Partial<WorkflowState>) => {
    setWorkflowState(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Select Agent
        return workflowState.selectedAgent !== null;
      case 1: // Select Models
        return workflowState.selectedModels.length > 0;
      case 2: // Select Tests
        return workflowState.selectedTests.length > 0;
      case 3: // Custom Tests (Optional - always can proceed)
        return true;
      case 4: // Provide Input
        const allTests = [...workflowState.selectedTests, ...workflowState.customTests];
        return Object.keys(workflowState.testInputs).length === allTests.length;
      case 5: // Review
        return true;
      case 6: // Execute
        return workflowState.executionStatus === 'completed';
      case 7: // Results
        return workflowState.testResults !== null;
      case 8: // Insights
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setWorkflowState({
      selectedAgent: null,
      selectedModels: [],
      selectedTests: [],
      samplePrompts: [],
      customTests: [],
      testInputs: {},
      executionStatus: 'idle',
      runId: null,
      testResults: null,
      insights: null
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepSelectAgent
            selectedAgent={workflowState.selectedAgent}
            onSelectAgent={(agent) => updateWorkflowState({ selectedAgent: agent })}
          />
        );
      case 1:
        return (
          <StepSelectModels
            selectedModels={workflowState.selectedModels}
            onSelectModels={(models) => updateWorkflowState({ selectedModels: models })}
          />
        );
      case 2:
        return (
          <StepSelectTest
            selectedAgent={workflowState.selectedAgent}
            selectedTests={workflowState.selectedTests}
            onSelectTests={(tests) => updateWorkflowState({ selectedTests: tests })}
            onSamplePromptsLoaded={(prompts) => updateWorkflowState({ samplePrompts: prompts })}
          />
        );
      case 3:
        return (
          <StepCreateCustomTests
            customTests={workflowState.customTests}
            libraryTestCount={workflowState.selectedTests.length}
            onCustomTestsChange={(tests) => updateWorkflowState({ customTests: tests })}
          />
        );
      case 4:
        const allTests = [...workflowState.selectedTests, ...workflowState.customTests];
        return (
          <StepProvideInput
            selectedTests={allTests}
            testInputs={workflowState.testInputs}
            samplePrompts={workflowState.samplePrompts}
            onUpdateInputs={(inputs) => updateWorkflowState({ testInputs: inputs })}
          />
        );
      case 5:
        const allTestsForReview = [...workflowState.selectedTests, ...workflowState.customTests];
        return (
          <StepReview
            agent={workflowState.selectedAgent}
            models={workflowState.selectedModels}
            tests={allTestsForReview}
            inputs={workflowState.testInputs}
          />
        );
      case 6:
        const allTestsForExecution = [...workflowState.selectedTests, ...workflowState.customTests];
        return (
          <StepExecute
            agent={workflowState.selectedAgent}
            models={workflowState.selectedModels}
            tests={allTestsForExecution}
            inputs={workflowState.testInputs}
            onExecutionComplete={(runId, status) => 
              updateWorkflowState({ runId, executionStatus: status })
            }
          />
        );
      case 7:
        return (
          <StepResults
            runId={workflowState.runId}
            onResultsLoaded={(results) => updateWorkflowState({ testResults: results })}
          />
        );
      case 8:
        return (
          <StepInsights
            runId={workflowState.runId}
            testResults={workflowState.testResults}
            onInsightsGenerated={(insights) => updateWorkflowState({ insights })}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div style={{ 
      padding: theme.spacing['3xl'],
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: theme.spacing['3xl'] }}>
          <h1 style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm
          }}>
            Data-Driven Testing Framework
          </h1>
          <p style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.textSecondary
          }}>
            Test your agents with comprehensive, data-driven test suites
            {workflowState.selectedAgent && (
              <span style={{
                marginLeft: theme.spacing.md,
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                backgroundColor: theme.colors.primaryLight,
                color: theme.colors.primary,
                borderRadius: theme.borderRadius.full,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold
              }}>
                Testing: {workflowState.selectedAgent.name}
              </span>
            )}
          </p>
        </div>

        {/* Progress Indicator */}
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Body>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.lg
            }}>
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Step Circle */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: index <= currentStep ? theme.colors.primary : theme.colors.gray300,
                    color: theme.colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontWeight: theme.typography.fontWeight.bold,
                    fontSize: theme.typography.fontSize.sm,
                    transition: 'all 0.3s ease'
                  }}>
                    {index < currentStep ? '✓' : step.id}
                  </div>
                  
                  {/* Step Label */}
                  <div style={{
                    marginTop: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.xs,
                    color: index === currentStep ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: index === currentStep ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal
                  }}>
                    {step.name}
                  </div>
                  
                  {/* Connector Line */}
                  {index < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '50%',
                      width: '100%',
                      height: '2px',
                      backgroundColor: index < currentStep ? theme.colors.primary : theme.colors.gray300,
                      zIndex: -1,
                      transition: 'all 0.3s ease'
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Info */}
            <div style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.primaryLight,
              borderRadius: theme.borderRadius.md,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.primary,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].name}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing.xs
              }}>
                {STEPS[currentStep].description}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Step Content */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <Card>
          <Card.Body>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                {currentStep > 0 && (
                  <Button
                    variant="outline-secondary"
                    onClick={handlePrevious}
                  >
                    ← Previous
                  </Button>
                )}
              </div>

              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                {!canProceed() && currentStep < STEPS.length - 1 && (
                  <span style={{ color: theme.colors.warning }}>
                    ⚠ Please complete this step to continue
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: theme.spacing.md }}>
                {currentStep === STEPS.length - 1 ? (
                  <>
                    <Button
                      variant="outline-secondary"
                      onClick={handleReset}
                    >
                      Start New Test
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => window.location.href = '/agent-testing/analytics'}
                    >
                      📈 View Analytics
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => console.log('Export results')}
                    >
                      Export Results
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    Next →
                  </Button>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default DDTFWorkflow;
