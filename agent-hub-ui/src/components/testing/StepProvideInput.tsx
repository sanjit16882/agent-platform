import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import TestInputEditor from './TestInputEditor';
import { theme } from '../../styles/theme';

interface StepProvideInputProps {
  selectedTests: any[];
  testInputs: Record<string, { content: string; format: string }>;
  samplePrompts?: string[];
  onUpdateInputs: (inputs: Record<string, { content: string; format: string }>) => void;
}

const StepProvideInput: React.FC<StepProvideInputProps> = ({
  selectedTests,
  testInputs,
  samplePrompts = [],
  onUpdateInputs
}) => {
  const handleInputSave = (testId: string, content: string, format: string) => {
    onUpdateInputs({
      ...testInputs,
      [testId]: { content, format }
    });
  };

  if (selectedTests.length === 0) {
    return (
      <Card>
        <Card.Body>
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl'],
            color: theme.colors.textSecondary
          }}>
            No tests selected. Please go back and select tests.
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Configure Test Inputs</Card.Title>
          <Card.Text>
            Provide input for each selected test ({selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''})
          </Card.Text>
        </Card.Header>
      </Card>



      {/* Progress Summary */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Body>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              Configuration Progress
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: Object.keys(testInputs).length === selectedTests.length 
                ? theme.colors.success 
                : theme.colors.warning
            }}>
              {Object.keys(testInputs).length} / {selectedTests.length} configured
            </div>
          </div>
          <div style={{
            marginTop: theme.spacing.md,
            height: '8px',
            backgroundColor: theme.colors.gray200,
            borderRadius: theme.borderRadius.full,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(Object.keys(testInputs).length / selectedTests.length) * 100}%`,
              backgroundColor: Object.keys(testInputs).length === selectedTests.length 
                ? theme.colors.success 
                : theme.colors.primary,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </Card.Body>
      </Card>

      {/* Test Input Editors */}
      {selectedTests.map((test, index) => {
        const hasInput = testInputs[test.id];
        return (
          <div key={test.id} style={{ marginBottom: theme.spacing.xl }}>
            {/* Test Header */}
            <div style={{
              padding: theme.spacing.md,
              backgroundColor: hasInput ? theme.colors.successLight : theme.colors.warningLight,
              border: `1px solid ${hasInput ? theme.colors.success : theme.colors.warning}`,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textPrimary
                  }}>
                    {index + 1}. {test.name}
                  </span>
                  <span style={{
                    marginLeft: theme.spacing.md,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor: theme.colors.gray100,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.xs
                  }}>
                    {test.category}
                  </span>
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: hasInput ? theme.colors.success : theme.colors.warning
                }}>
                  {hasInput ? '✓ Configured' : '⚠ Not configured'}
                </div>
              </div>
              {test.description && (
                <div style={{
                  marginTop: theme.spacing.xs,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary
                }}>
                  {test.description}
                </div>
              )}
            </div>

            {/* Sample Prompts for this test */}
            {samplePrompts && samplePrompts.length > 0 && (
              <Card style={{ marginBottom: theme.spacing.md, border: `1px solid ${theme.colors.primary}` }}>
                <Card.Body>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textPrimary,
                    marginBottom: theme.spacing.sm
                  }}>
                    💡 Sample Prompts for {test.name}:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    {samplePrompts.slice(0, 3).map((prompt, promptIndex) => (
                      <button
                        key={promptIndex}
                        onClick={() => {
                          handleInputSave(test.id, prompt, test.input_format || 'plain_text');
                          console.log(`✅ Applied sample prompt to test ${index + 1}:`, test.name);
                        }}
                        style={{
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.backgroundSecondary,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
                        }}
                      >
                        {prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt}
                      </button>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Input Editor */}
            <TestInputEditor
              initialValue={testInputs[test.id]?.content || ''}
              initialFormat={testInputs[test.id]?.format || test.input_format || 'plain_text'}
              onSave={(content, format) => handleInputSave(test.id, content, format)}
              onChange={(content, format) => handleInputSave(test.id, content, format)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StepProvideInput;
