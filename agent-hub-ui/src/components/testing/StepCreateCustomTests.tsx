import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

interface CustomTest {
  id: string;
  name: string;
  category: string;
  input_content: string;
  expected_behavior: string;
  input_format: string;
  type: string;
}

interface StepCreateCustomTestsProps {
  customTests: CustomTest[];
  libraryTestCount: number;
  onCustomTestsChange: (tests: CustomTest[]) => void;
}

const StepCreateCustomTests: React.FC<StepCreateCustomTestsProps> = ({
  customTests: initialTests,
  libraryTestCount,
  onCustomTestsChange
}) => {
  const [tests, setTests] = useState<CustomTest[]>(initialTests || []);

  const addTest = () => {
    const newTest: CustomTest = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      category: 'functional',
      input_content: '',
      expected_behavior: '',
      input_format: 'plain_text',
      type: 'custom'
    };
    const updatedTests = [...tests, newTest];
    setTests(updatedTests);
    onCustomTestsChange(updatedTests);
  };

  const removeTest = (id: string) => {
    const updatedTests = tests.filter(t => t.id !== id);
    setTests(updatedTests);
    onCustomTestsChange(updatedTests);
  };

  const updateTest = (id: string, updates: Partial<CustomTest>) => {
    const updatedTests = tests.map(t => t.id === id ? { ...t, ...updates } : t);
    setTests(updatedTests);
    onCustomTestsChange(updatedTests);
  };

  const isTestValid = (test: CustomTest) => {
    return test.name.trim() !== '' && 
           test.input_content.trim() !== '' && 
           test.expected_behavior.trim() !== '';
  };

  const allTestsValid = tests.length === 0 || tests.every(isTestValid);

  return (
    <div>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Create Custom Tests (Optional)</Card.Title>
          <Card.Text>
            Add your own test scenarios or skip to continue with library tests only
          </Card.Text>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="primary" 
            onClick={addTest}
            style={{ marginBottom: theme.spacing.lg }}
          >
            + Add Custom Test
          </Button>

          {tests.length === 0 && (
            <div style={{
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.borderRadius.md,
              textAlign: 'center',
              color: theme.colors.textSecondary
            }}>
              <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm }}>
                No custom tests added
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm }}>
                Click "Add Custom Test" to create your own test scenarios, or click "Next" to skip this step
              </div>
            </div>
          )}

          {tests.map((test, index) => (
            <Card 
              key={test.id} 
              style={{ 
                marginTop: index === 0 ? 0 : theme.spacing.lg,
                border: !isTestValid(test) ? `2px solid ${theme.colors.warning}` : undefined
              }}
            >
              <Card.Header>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>
                    Custom Test #{index + 1}
                  </span>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => removeTest(test.id)}
                  >
                    Remove
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {/* Test Name */}
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.xs,
                    color: theme.colors.textPrimary
                  }}>
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={test.name}
                    onChange={(e) => updateTest(test.id, { name: e.target.value })}
                    placeholder="e.g., Test API Error Handling"
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md
                    }}
                  />
                </div>

                {/* Category */}
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.xs,
                    color: theme.colors.textPrimary
                  }}>
                    Category
                  </label>
                  <select
                    value={test.category}
                    onChange={(e) => updateTest(test.id, { category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md
                    }}
                  >
                    <option value="functional">Functional</option>
                    <option value="hallucination">Hallucination</option>
                    <option value="emotional">Emotional</option>
                    <option value="safety">Safety</option>
                    <option value="tool_usage">Tool Usage</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Test Input */}
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.xs,
                    color: theme.colors.textPrimary
                  }}>
                    Test Input *
                  </label>
                  <textarea
                    value={test.input_content}
                    onChange={(e) => updateTest(test.id, { input_content: e.target.value })}
                    placeholder="What to send to the agent..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Expected Behavior */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.xs,
                    color: theme.colors.textPrimary
                  }}>
                    Expected Behavior *
                  </label>
                  <textarea
                    value={test.expected_behavior}
                    onChange={(e) => updateTest(test.id, { expected_behavior: e.target.value })}
                    placeholder="What the agent should do or return..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {!isTestValid(test) && (
                  <div style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.warningLight,
                    border: `1px solid ${theme.colors.warning}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.warning
                  }}>
                    ⚠ Please fill in all required fields (marked with *)
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}

          {/* Summary */}
          {tests.length > 0 && (
            <div style={{
              marginTop: theme.spacing.lg,
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.primaryLight,
              borderRadius: theme.borderRadius.md
            }}>
              <div style={{ 
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.sm,
                color: theme.colors.primary
              }}>
                Test Summary
              </div>
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                <div>Custom Tests: {tests.length}</div>
                <div>Library Tests: {libraryTestCount}</div>
                <div style={{ fontWeight: theme.typography.fontWeight.semibold, marginTop: theme.spacing.xs }}>
                  Total Tests: {tests.length + libraryTestCount}
                </div>
              </div>
            </div>
          )}

          {!allTestsValid && tests.length > 0 && (
            <div style={{
              marginTop: theme.spacing.lg,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.warningLight,
              border: `1px solid ${theme.colors.warning}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.warning
            }}>
              ⚠ Some custom tests are incomplete. Please fill in all required fields or remove incomplete tests before proceeding.
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default StepCreateCustomTests;
