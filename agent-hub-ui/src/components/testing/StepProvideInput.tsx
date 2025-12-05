import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import TestInputEditor from './TestInputEditor';
import { theme } from '../../styles/theme';

interface StepProvideInputProps {
  selectedAgent: any;
  selectedTests: any[];
  testInputs: Record<string, { content: string; format: string }>;
  onUpdateInputs: (inputs: Record<string, { content: string; format: string }>) => void;
}

const StepProvideInput: React.FC<StepProvideInputProps> = ({
  selectedAgent,
  selectedTests,
  testInputs,
  onUpdateInputs
}) => {
  const [testPrompts, setTestPrompts] = useState<Record<string, any[]>>({});
  const [loadingPrompts, setLoadingPrompts] = useState<Record<string, boolean>>({});

  // Load sample prompts for each test
  useEffect(() => {
    if (selectedAgent && selectedTests.length > 0) {
      selectedTests.forEach(test => {
        loadSamplePromptsForTest(test);
      });
    }
  }, [selectedAgent, selectedTests]);

  const loadSamplePromptsForTest = async (test: any) => {
    if (!selectedAgent || !test) return;

    setLoadingPrompts(prev => ({ ...prev, [test.id]: true }));

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      
      const requestBody = {
        agent: {
          id: selectedAgent.id || selectedAgent.agent_id,
          name: selectedAgent.name,
          category: selectedAgent.category,
          subtype: selectedAgent.agentSubType || selectedAgent.agent_sub_type
        },
        test: {
          id: test.id,
          name: test.name,
          category: test.category || 'Universal',  // Fallback to Universal if missing
          subtype: test.subtype || test.type || 'general'  // Fallback to general if missing
        },
        limit: 3
      };
      
      console.log(`🔍 DEBUG: Loading sample prompts for test: ${test.name}`);
      console.log('Test object:', test);
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/testing/sample-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DEBUG: API Response:', data);
        const prompts = data.data?.prompts || [];
        setTestPrompts(prev => ({ ...prev, [test.id]: prompts }));
        console.log(`✅ Loaded ${prompts.length} sample prompts for test: ${test.name}`);
      } else {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => null);
        console.error('Error data:', errorData);
      }
    } catch (error) {
      console.error(`❌ Error loading sample prompts for test ${test.name}:`, error);
      setTestPrompts(prev => ({ ...prev, [test.id]: [] }));
    } finally {
      setLoadingPrompts(prev => ({ ...prev, [test.id]: false }));
    }
  };
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
            {testPrompts[test.id] && testPrompts[test.id].length > 0 && (
              <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.colors.primaryLight, border: `2px solid ${theme.colors.primary}` }}>
                <Card.Body>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.primary,
                    marginBottom: theme.spacing.xs
                  }}>
                    💡 Sample Prompts for {test.name}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.md
                  }}>
                    Click a prompt to use it as your test input
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {testPrompts[test.id].map((prompt: any, promptIndex: number) => (
                      <div
                        key={prompt.id || promptIndex}
                        style={{
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.white,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                        onClick={() => {
                          handleInputSave(test.id, prompt.prompt_text, test.input_format || 'plain_text');
                          console.log(`✅ Applied sample prompt to test: ${test.name}`);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = theme.colors.primary;
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = theme.colors.border;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Relevance Score Badge */}
                        <div style={{
                          position: 'absolute',
                          top: theme.spacing.sm,
                          right: theme.spacing.sm,
                          padding: `2px ${theme.spacing.xs}`,
                          backgroundColor: prompt.relevance_score >= 70 
                            ? theme.colors.success 
                            : prompt.relevance_score >= 50 
                            ? theme.colors.warning 
                            : theme.colors.textSecondary,
                          color: theme.colors.white,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: '10px',
                          fontWeight: theme.typography.fontWeight.bold
                        }}>
                          Score: {prompt.relevance_score}
                        </div>

                        {/* Prompt Text */}
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.textPrimary,
                          paddingRight: '80px',
                          lineHeight: '1.5'
                        }}>
                          {prompt.prompt_text}
                        </div>

                        {/* Tags */}
                        {prompt.tags && prompt.tags.length > 0 && (
                          <div style={{
                            display: 'flex',
                            gap: theme.spacing.xs,
                            flexWrap: 'wrap',
                            marginTop: theme.spacing.sm
                          }}>
                            {prompt.tags.slice(0, 3).map((tag: string, i: number) => (
                              <span
                                key={i}
                                style={{
                                  padding: `2px ${theme.spacing.xs}`,
                                  backgroundColor: theme.colors.gray100,
                                  color: theme.colors.textSecondary,
                                  borderRadius: theme.borderRadius.sm,
                                  fontSize: '10px'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Loading State */}
            {loadingPrompts[test.id] && (
              <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.colors.gray50 }}>
                <Card.Body>
                  <div style={{
                    textAlign: 'center',
                    padding: theme.spacing.md,
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm
                  }}>
                    Loading sample prompts...
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
