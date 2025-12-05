import React, { useState } from 'react';
import TestInputEditor from './TestInputEditor';
import Card from '../common/Card';
import { theme } from '../../styles/theme';

/**
 * Demo page for TestInputEditor component
 * This can be used for testing and development
 */
const TestInputEditorDemo: React.FC = () => {
  const [savedContent, setSavedContent] = useState<string>('');
  const [savedFormat, setSavedFormat] = useState<string>('');

  const handleSave = (content: string, format: string) => {
    setSavedContent(content);
    setSavedFormat(format);
    console.log('Saved:', { content, format });
  };

  const handleChange = (content: string, format: string) => {
    console.log('Changed:', { content, format });
  };

  return (
    <div style={{ 
      padding: theme.spacing['3xl'],
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md
        }}>
          Test Input Editor Demo
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing['3xl']
        }}>
          Test the TestInputEditor component with different input formats
        </p>

        {/* Editor Component */}
        <TestInputEditor
          initialValue=""
          initialFormat="plain_text"
          onSave={handleSave}
          onChange={handleChange}
        />

        {/* Saved Content Display */}
        {savedContent && (
          <Card>
            <Card.Header>
              <Card.Title>Saved Content</Card.Title>
            </Card.Header>
            <Card.Body>
              <div style={{ marginBottom: theme.spacing.md }}>
                <strong>Format:</strong> {savedFormat}
              </div>
              <div style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.gray50,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {savedContent}
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestInputEditorDemo;
