import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

interface TestInputEditorProps {
  initialValue?: string;
  initialFormat?: 'plain_text' | 'json' | 'multi_turn' | 'parameterized';
  onSave?: (content: string, format: string) => void;
  onChange?: (content: string, format: string) => void;
  readOnly?: boolean;
}

interface ValidationError {
  message: string;
  line?: number;
}

const TestInputEditor: React.FC<TestInputEditorProps> = ({
  initialValue = '',
  initialFormat = 'plain_text',
  onSave,
  onChange,
  readOnly = false
}) => {
  const [format, setFormat] = useState<string>(initialFormat);
  const [content, setContent] = useState<string>(initialValue);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Update content when initialValue changes (e.g., when sample prompt is applied)
  useEffect(() => {
    if (initialValue !== content) {
      setContent(initialValue);
    }
  }, [initialValue]);

  // Validate content based on format
  useEffect(() => {
    validateContent(content, format);
    if (format === 'parameterized') {
      generatePreview(content, parameters);
    }
  }, [content, format, parameters]);

  const validateContent = (text: string, fmt: string) => {
    const errors: ValidationError[] = [];

    if (!text.trim()) {
      errors.push({ message: 'Content cannot be empty' });
      setValidationErrors(errors);
      return;
    }

    switch (fmt) {
      case 'json':
        try {
          JSON.parse(text);
        } catch (e: any) {
          errors.push({ 
            message: `Invalid JSON: ${e.message}`,
            line: e.lineNumber 
          });
        }
        break;

      case 'multi_turn':
        try {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) {
            errors.push({ message: 'Multi-turn format must be an array' });
          } else {
            parsed.forEach((turn, idx) => {
              if (!turn.role || !turn.content) {
                errors.push({ 
                  message: `Turn ${idx + 1} must have 'role' and 'content' fields` 
                });
              }
              if (!['user', 'assistant', 'system'].includes(turn.role)) {
                errors.push({ 
                  message: `Turn ${idx + 1} has invalid role: ${turn.role}` 
                });
              }
            });
          }
        } catch (e: any) {
          errors.push({ message: `Invalid JSON: ${e.message}` });
        }
        break;

      case 'parameterized':
        // Extract parameters from ${variable} syntax
        const paramRegex = /\$\{([^}]+)\}/g;
        const matches = text.matchAll(paramRegex);
        const foundParams = new Set<string>();
        
        const matchArray = Array.from(matches);
        for (const match of matchArray) {
          foundParams.add(match[1]);
        }

        // Update parameters state if new ones found
        const newParams = { ...parameters };
        let hasNewParams = false;
        foundParams.forEach(param => {
          if (!(param in newParams)) {
            newParams[param] = '';
            hasNewParams = true;
          }
        });
        if (hasNewParams) {
          setParameters(newParams);
        }

        // Check for missing parameter values
        Object.entries(newParams).forEach(([key, value]) => {
          if (foundParams.has(key) && !value) {
            errors.push({ message: `Parameter '${key}' has no value` });
          }
        });
        break;
    }

    setValidationErrors(errors);
  };

  const generatePreview = (text: string, params: Record<string, string>) => {
    let preview = text;
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      preview = preview.replace(regex, value || `\${${key}}`);
    });
    setPreviewContent(preview);
  };

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    setValidationErrors([]);
    
    // Provide format-specific templates
    if (!content.trim()) {
      switch (newFormat) {
        case 'json':
          setContent('{\n  "prompt": "Your prompt here",\n  "context": "Additional context"\n}');
          break;
        case 'multi_turn':
          setContent('[\n  {\n    "role": "user",\n    "content": "Hello"\n  },\n  {\n    "role": "assistant",\n    "content": "Hi! How can I help?"\n  }\n]');
          break;
        case 'parameterized':
          setContent('Hello ${name}, your order ${orderId} is ready!');
          break;
        default:
          setContent('');
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onChange) {
      onChange(newContent, format);
    }
  };

  const handleParameterChange = (key: string, value: string) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    generatePreview(content, newParams);
  };

  const handleSave = () => {
    if (validationErrors.length === 0 && onSave) {
      onSave(content, format);
    }
  };

  const handleLoad = () => {
    // This would typically open a file picker or load from API
    // For now, just a placeholder
    console.log('Load functionality would go here');
  };

  const renderSyntaxHighlighted = (text: string) => {
    if (format !== 'json' && format !== 'multi_turn') {
      return text;
    }

    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return text;
    }
  };

  return (
    <Card style={{ marginBottom: theme.spacing.xl }}>
      <Card.Header>
        <Card.Title>Test Input Editor</Card.Title>
        <Card.Text>Configure your test input format and content</Card.Text>
      </Card.Header>

      <Card.Body>
        {/* Format Selector */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm
          }}>
            Input Format
          </label>
          <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            {[
              { value: 'plain_text', label: 'Plain Text' },
              { value: 'json', label: 'JSON' },
              { value: 'multi_turn', label: 'Multi-turn' },
              { value: 'parameterized', label: 'Parameterized' }
            ].map(option => (
              <Button
                key={option.value}
                variant={format === option.value ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => handleFormatChange(option.value)}
                disabled={readOnly}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Format Description */}
        <div style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary
        }}>
          {format === 'plain_text' && 'Simple text prompts for straightforward testing'}
          {format === 'json' && 'Structured data with key-value pairs for complex inputs'}
          {format === 'multi_turn' && 'Conversation arrays with role and content fields'}
          {format === 'parameterized' && 'Text with ${variable} placeholders for dynamic testing'}
        </div>

        {/* Content Editor */}
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{
            display: 'block',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm
          }}>
            Content
          </label>
          <textarea
            value={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            rows={4}
            style={{
              width: '100%',
              minHeight: '100px',
              maxHeight: '300px',
              padding: theme.spacing.md,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: format === 'json' || format === 'multi_turn' ? 'monospace' : 'inherit',
              border: `1px solid ${validationErrors.length > 0 ? theme.colors.danger : theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              backgroundColor: readOnly ? theme.colors.gray100 : theme.colors.white,
              color: theme.colors.textPrimary,
              resize: 'vertical',
              outline: 'none'
            }}
            placeholder={content ? `Enter your ${format.replace('_', ' ')} content here...` : `💡 Tip: Use a sample prompt above, or write your own ${format.replace('_', ' ')} content here...`}
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.dangerLight,
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.xl
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.danger,
              marginBottom: theme.spacing.sm
            }}>
              ⚠ Validation Errors:
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: theme.spacing.xl,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.danger
            }}>
              {validationErrors.map((error, idx) => (
                <li key={idx}>
                  {error.line && `Line ${error.line}: `}{error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Parameter Inputs (for parameterized format) */}
        {format === 'parameterized' && Object.keys(parameters).length > 0 && (
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.sm
            }}>
              Parameters
            </label>
            <div style={{
              padding: theme.spacing.md,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`
            }}>
              {Object.keys(parameters).map(key => (
                <div key={key} style={{ marginBottom: theme.spacing.md }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs
                  }}>
                    ${'{' + key + '}'}
                  </label>
                  <input
                    type="text"
                    value={parameters[key]}
                    onChange={(e) => handleParameterChange(key, e.target.value)}
                    disabled={readOnly}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      fontSize: theme.typography.fontSize.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      backgroundColor: readOnly ? theme.colors.gray100 : theme.colors.white
                    }}
                    placeholder={`Value for ${key}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview (for parameterized format) */}
        {format === 'parameterized' && (
          <div style={{ marginBottom: theme.spacing.xl }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: theme.spacing.sm
            }}>
              <label style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textPrimary
              }}>
                Preview
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
            {showPreview && (
              <div style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.gray50,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textPrimary,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace'
              }}>
                {previewContent || 'Enter parameter values to see preview'}
              </div>
            )}
          </div>
        )}
      </Card.Body>

      {/* Actions */}
      {!readOnly && (
        <Card.Footer>
          <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
            <Button
              variant="outline-secondary"
              onClick={handleLoad}
            >
              Load
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={validationErrors.length > 0}
            >
              Save
            </Button>
          </div>
        </Card.Footer>
      )}
    </Card>
  );
};

export default TestInputEditor;
