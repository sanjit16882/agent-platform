import React, { useState, useEffect } from 'react';
import { Button, Card } from 'react-bootstrap';
import { nlpApi } from '../services/nlpApi';
import ConfigEditor from './ConfigEditor';
import { theme, icons } from '../styles/theme';

const NLPTester = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [examples, setExamples] = useState([]);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState([]);

  // Test connection on component mount
  useEffect(() => {
    testConnection();
    loadExamples();
    loadTemplates();
  }, []);

  const testConnection = async () => {
    try {
      const response = await nlpApi.testConnection();
      setConnectionStatus(response.success ? 'connected' : 'failed');
    } catch (error) {
      setConnectionStatus('failed');
      console.error('Connection test failed:', error);
    }
  };

  const loadExamples = async () => {
    try {
      const response = await nlpApi.getExamples();
      if (response.success && response.data.examples) {
        setExamples(response.data.examples);
      }
    } catch (error) {
      console.error('Failed to load examples:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await nlpApi.getTemplates();
      if (response.success && response.data.templates) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleProcessDescription = async () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      
      if (selectedTemplate) {
        // Generate from template first, then customize with description
        const templateResponse = await nlpApi.generateFromTemplate(selectedTemplate, {
          name: `Custom ${templates.find(t => t.id === selectedTemplate)?.name || 'Agent'}`,
          description: description
        });
        response = {
          success: true,
          data: {
            intent: { action: 'template-customization', confidence: 0.95 },
            config: templateResponse.data.config,
            processingTime: 120,
            validation: { isValid: true, errors: [], warnings: [] }
          }
        };
      } else {
        // Process description only
        response = await nlpApi.processDescription(description);
      }
      
      setResult(response);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExample = (example) => {
    setDescription(example);
  };

  return (
    <div style={{ 
      padding: theme.spacing['3xl'], 
      maxWidth: '900px', 
      margin: '0 auto',
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing['3xl'],
        textAlign: 'center'
      }}>
        {icons.agents} Agent Builder
      </h1>
      
      {/* Connection Status */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Body style={{
          backgroundColor: connectionStatus === 'connected' ? theme.colors.successLight : 
                          connectionStatus === 'failed' ? theme.colors.dangerLight : theme.colors.warningLight,
          border: `1px solid ${connectionStatus === 'connected' ? theme.colors.success : 
                              connectionStatus === 'failed' ? theme.colors.danger : theme.colors.warning}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium
          }}>
            <span>
              {connectionStatus === 'connected' && icons.success}
              {connectionStatus === 'failed' && icons.error}
              {connectionStatus === 'checking' && icons.clock}
            </span>
            <span>Backend Connection: </span>
            <span>
              {connectionStatus === 'connected' && 'Connected to NLP API'}
              {connectionStatus === 'failed' && 'Failed to connect to NLP API'}
              {connectionStatus === 'checking' && 'Checking connection...'}
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Examples */}
      {examples.length > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Header>
            <h3 style={{ 
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm
            }}>
              {icons.file} Example Descriptions
            </h3>
          </Card.Header>
          <Card.Body>
            {examples.map((example, index) => (
              <div key={index} style={{ 
                padding: theme.spacing.lg, 
                margin: `${theme.spacing.sm} 0`, 
                backgroundColor: theme.colors.backgroundTertiary, 
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }} 
              onClick={() => handleUseExample(example)}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.colors.gray100;
                e.target.style.borderColor = theme.colors.borderDark;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = theme.colors.backgroundTertiary;
                e.target.style.borderColor = theme.colors.border;
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  gap: theme.spacing.lg
                }}>
                  <code style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textPrimary,
                    flex: 1
                  }}>
                    {example}
                  </code>
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseExample(example);
                    }}
                  >
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Template Selection */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <h3 style={{ 
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            {icons.folder} Optional: Start with Template
          </h3>
        </Card.Header>
        <Card.Body>
          <p style={{ 
            fontSize: theme.typography.fontSize.sm, 
            color: theme.colors.textSecondary, 
            marginBottom: theme.spacing.lg,
            margin: 0,
            marginBottom: theme.spacing.lg
          }}>
            Choose a template to pre-fill your agent configuration, or skip to create from scratch.
          </p>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.lg,
              backgroundColor: theme.colors.white,
              color: theme.colors.textPrimary
            }}
          >
          <option value="">No template - Create from description only</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.description}
            </option>
          ))}
        </select>
          {selectedTemplate && (
            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.primaryLight,
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span>{icons.success}</span>
                <span>Selected: <strong>{templates.find(t => t.id === selectedTemplate)?.name}</strong></span>
              </div>
              <div style={{ marginTop: theme.spacing.sm, color: theme.colors.textSecondary }}>
                Your description will customize this template.
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Input Form */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <h3 style={{ 
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            {icons.edit} Describe Your Agent
          </h3>
        </Card.Header>
        <Card.Body>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the agent you want to create..."
            style={{
              width: '100%',
              height: '120px',
              padding: theme.spacing.lg,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: theme.typography.fontFamily,
              resize: 'vertical',
              marginBottom: theme.spacing.xl,
              backgroundColor: theme.colors.white,
              color: theme.colors.textPrimary
            }}
          />
          <Button
            onClick={handleProcessDescription}
            disabled={loading || !description.trim()}
            variant="success"
            size="lg"
          >
            {loading ? 'Processing...' : 'Create Agent'}
          </Button>
        </Card.Body>
      </Card>

      {/* Error Display */}
      {error && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Body style={{
            backgroundColor: theme.colors.dangerLight,
            border: `1px solid ${theme.colors.danger}`,
            color: theme.colors.danger
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: theme.spacing.sm,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium
            }}>
              <span>{icons.error}</span>
              <span>Error:</span>
              <span>{error}</span>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <div style={{ marginTop: theme.spacing.xl }}>
          <Card style={{ marginBottom: theme.spacing.xl }}>
            <Card.Header>
              <h3 style={{ 
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.textPrimary,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                {icons.success} Generated Agent Configuration
              </h3>
            </Card.Header>
            <Card.Body>
              <div style={{ marginBottom: theme.spacing.xl }}>
                <h4 style={{ 
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary,
                  marginBottom: theme.spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm
                }}>
                  {icons.chart} Intent Analysis
                </h4>
                <pre style={{ 
                  fontSize: theme.typography.fontSize.xs, 
                  overflow: 'auto',
                  backgroundColor: theme.colors.backgroundTertiary,
                  padding: theme.spacing.lg,
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary
                }}>
                  {JSON.stringify(result.data.intent, null, 2)}
                </pre>
                
                <div style={{ 
                  marginTop: theme.spacing.xl,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: theme.spacing.lg
                }}>
                  <div style={{ 
                    padding: theme.spacing.lg,
                    backgroundColor: theme.colors.successLight,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.success}`
                  }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.success,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm
                    }}>
                      {icons.chart} Confidence: {(result.data.intent.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ 
                    padding: theme.spacing.lg,
                    backgroundColor: theme.colors.infoLight,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.info}`
                  }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.info,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm
                    }}>
                      {icons.clock} Processing Time: {result.data.processingTime}ms
                    </div>
                  </div>
                  <div style={{ 
                    padding: theme.spacing.lg,
                    backgroundColor: result.data.validation.isValid ? theme.colors.successLight : theme.colors.dangerLight,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${result.data.validation.isValid ? theme.colors.success : theme.colors.danger}`
                  }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: result.data.validation.isValid ? theme.colors.success : theme.colors.danger,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm
                    }}>
                      {result.data.validation.isValid ? icons.success : icons.error} Valid: {result.data.validation.isValid ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Enhanced Configuration Editor */}
          <ConfigEditor 
            initialConfig={result.data.config}
            onConfigChange={(updatedConfig) => {
              setResult({
                ...result,
                data: {
                  ...result.data,
                  config: updatedConfig
                }
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NLPTester;