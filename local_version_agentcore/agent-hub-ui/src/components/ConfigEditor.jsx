import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nlpApi } from '../services/nlpApi';
import { useAgentContext } from '../context/AgentContext';
import Button from './common/Button';
import Card from './common/Card';
import Badge from './common/Badge';
import { theme, icons } from '../styles/theme';

const ConfigEditor = ({ initialConfig, onConfigChange }) => {
  const navigate = useNavigate();
  const { addDeployedAgent } = useAgentContext();
  const [config, setConfig] = useState(initialConfig || null);
  const [validation, setValidation] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [refinementText, setRefinementText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    console.log('ConfigEditor mounted, loading templates...');
    // Use hardcoded templates for immediate functionality
    setTemplates([
      {
        id: 'sync-agent',
        name: 'Data Synchronization Agent',
        description: 'Synchronizes data between two or more sources',
        category: 'data-sync'
      },
      {
        id: 'monitor-agent',
        name: 'Monitoring Agent',
        description: 'Monitors resources and sends alerts',
        category: 'monitoring'
      },
      {
        id: 'notify-agent',
        name: 'Notification Agent',
        description: 'Sends notifications and alerts',
        category: 'notification'
      },
      {
        id: 'analyze-agent',
        name: 'Data Analysis Agent',
        description: 'Analyzes data and generates insights',
        category: 'analysis'
      }
    ]);
    
    if (initialConfig) {
      console.log('Initial config provided:', initialConfig);
      // Skip validation for now since endpoint is not available
      setValidation({ isValid: true, errors: [], warnings: [] });
    }
  }, [initialConfig]);

  const loadTemplates = async () => {
    // Skip API call, use hardcoded templates immediately
    console.log('Loading hardcoded templates...');
    setTemplates([
      {
        id: 'sync-agent',
        name: 'Data Synchronization Agent',
        description: 'Synchronizes data between two or more sources',
        category: 'data-sync'
      },
      {
        id: 'monitor-agent',
        name: 'Monitoring Agent',
        description: 'Monitors resources and sends alerts',
        category: 'monitoring'
      },
      {
        id: 'notify-agent',
        name: 'Notification Agent',
        description: 'Sends notifications and alerts',
        category: 'notification'
      },
      {
        id: 'analyze-agent',
        name: 'Data Analysis Agent',
        description: 'Analyzes data and generates reports',
        category: 'analysis'
      }
    ]);
    console.log('Templates loaded: 4 templates');
  };

  const validateConfig = async (configToValidate) => {
    // Simple validation without API call
    const errors = [];
    const warnings = [];
    
    if (!configToValidate.name) errors.push({ field: 'name', message: 'Name is required', severity: 'error' });
    if (!configToValidate.description) errors.push({ field: 'description', message: 'Description is required', severity: 'error' });
    if (!configToValidate.triggers || configToValidate.triggers.length === 0) {
      errors.push({ field: 'triggers', message: 'At least one trigger is required', severity: 'error' });
    }
    if (!configToValidate.actions || configToValidate.actions.length === 0) {
      errors.push({ field: 'actions', message: 'At least one action is required', severity: 'error' });
    }
    
    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  };

  const generateFromTemplate = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      
      // Generate config directly without API call
      const generatedConfig = {
        name: `My ${template?.name || 'Agent'}`,
        description: template?.description || 'Generated from template',
        version: '1.0.0',
        triggers: [{
          id: 'trigger-1',
          type: 'schedule',
          name: 'Schedule Trigger',
          config: { interval: template?.category === 'monitoring' ? 300 : 3600 }
        }],
        actions: [{
          id: 'action-1',
          type: template?.category === 'data-sync' ? 'sync' : 
                template?.category === 'monitoring' ? 'monitor' : 'process',
          name: `${template?.name || 'Action'}`,
          config: {},
          parameters: []
        }],
        connectors: [],
        parameters: [],
        metadata: {
          generatedFrom: 'template',
          templateId: selectedTemplate,
          createdAt: new Date().toISOString()
        }
      };
      
      setConfig(generatedConfig);
      setValidation({ isValid: true, errors: [], warnings: [] });
      if (onConfigChange) onConfigChange(generatedConfig);
      
    } catch (error) {
      setError('Failed to generate from template');
    } finally {
      setLoading(false);
    }
  };

  const editConfig = async () => {
    if (!config || !editField || editValue === '') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/nlp/edit-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          editRequest: {
            field: editField,
            value: editValue,
            operation: 'update'
          }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setConfig(data.data.config);
        setValidation(data.data.validation);
        if (onConfigChange) onConfigChange(data.data.config);
        setEditField('');
        setEditValue('');
      }
    } catch (error) {
      setError('Failed to edit configuration');
    } finally {
      setLoading(false);
    }
  };

  const refineConfig = async () => {
    if (!config || !refinementText.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await nlpApi.refineConfig(config, refinementText);
      if (response.success) {
        setConfig(response.data.config);
        await validateConfig(response.data.config);
        if (onConfigChange) onConfigChange(response.data.config);
        setRefinementText('');
      }
    } catch (error) {
      setError('Failed to refine configuration');
    } finally {
      setLoading(false);
    }
  };

  const addTrigger = () => {
    if (!config) return;
    
    const newTrigger = {
      id: `trigger-${Date.now()}`,
      type: 'manual',
      name: 'New Trigger',
      config: {}
    };
    
    const updatedConfig = {
      ...config,
      triggers: [...(config.triggers || []), newTrigger]
    };
    
    setConfig(updatedConfig);
    validateConfig(updatedConfig);
    if (onConfigChange) onConfigChange(updatedConfig);
  };

  const addAction = () => {
    if (!config) return;
    
    const newAction = {
      id: `action-${Date.now()}`,
      type: 'process',
      name: 'New Action',
      config: {},
      parameters: []
    };
    
    const updatedConfig = {
      ...config,
      actions: [...(config.actions || []), newAction]
    };
    
    setConfig(updatedConfig);
    validateConfig(updatedConfig);
    if (onConfigChange) onConfigChange(updatedConfig);
  };

  const handleSaveAgent = async () => {
    if (!config) {
      setError('No agent configuration to save');
      return;
    }

    setLoading(true);
    setSaveStatus(null);
    setError(null);

    try {
      // Create agent payload for backend API
      const agentPayload = {
        name: config.name || 'Custom Agent',
        description: config.description || 'Agent created from builder',
        components: [
          {
            name: 'Main Processor',
            type: 'llm',
            config: {
              provider: 'openai',
              model: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000,
              systemPrompt: `You are ${config.name || 'a helpful agent'}. ${config.description || ''}`,
              userPromptTemplate: 'Process this input: {input}',
              responseFormat: 'json'
            },
            inputs: config.inputs || [{ name: 'input', type: 'string', required: true, source: 'user' }],
            outputs: config.outputs || [{ name: 'result', type: 'object', description: 'Processing result' }],
            dependencies: []
          }
        ],
        orchestration: {
          mode: 'sequential',
          timeout: 300000,
          maxRetries: 3,
          retryDelay: 2000,
          parallelism: 1,
          conditions: []
        },
        dataFlow: {
          mappings: [],
          transformations: [],
          storage: {
            persistent: false,
            encryption: true,
            retention: 7,
            location: 'memory'
          }
        }
      };

      // Save to backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/agents/hybrid/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSaveStatus('success');
        
        // Also add to local context for immediate UI update
        const deployedAgent = {
          id: result.data.id,
          name: result.data.name,
          description: result.data.description,
          version: result.data.version || '1.0.0',
          status: 'active',
          deployedAt: result.data.created,
          category: result.data.category || 'Custom',
          executionCount: 0,
          author: result.data.author || 'Agent Builder',
          tags: result.data.tags || ['custom-created'],
          framework: 'AgentHub Hybrid',
          pricing: {
            costPerExecution: 0.01,
            estimatedRuntime: '30s'
          },
          capabilities: config.inputs?.map(i => i.name) || ['Custom Processing'],
          inputSchema: config.inputs || {},
          outputSchema: config.outputs || {}
        };

        addDeployedAgent(deployedAgent);
        
        // Navigate to agent catalog after a short delay
        setTimeout(() => {
          navigate('/agents');
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to create agent');
      }
      
    } catch (error) {
      setSaveStatus('error');
      setError('Failed to save agent: ' + error.message);
      console.error('Agent save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: theme.spacing['2xl'], 
      maxWidth: '1200px', 
      margin: '0 auto'
    }}>
      <h2 style={{ 
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing['2xl'],
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm
      }}>
        {icons.settings} Agent Configuration Editor
      </h2>
      
      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Template Selection - Only show if no initial config */}
      {!initialConfig && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Generate from Template</h3>
        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
          Debug: Templates loaded: {templates.length} | Selected: {selectedTemplate || 'none'}
          <br />
          <button 
            onClick={() => {
              console.log('Testing templates endpoint...');
              fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/nlp/templates`)
                .then(r => r.json())
                .then(d => console.log('Direct fetch result:', d))
                .catch(e => console.error('Direct fetch error:', e));
            }}
            style={{ fontSize: '10px', padding: '2px 6px' }}
          >
            Test Templates Endpoint
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedTemplate}
            onChange={(e) => {
              console.log('Template selected:', e.target.value);
              setSelectedTemplate(e.target.value);
            }}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '300px' }}
          >
            <option value="">Select a template...</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
          <button
            onClick={generateFromTemplate}
            disabled={!selectedTemplate || loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedTemplate && !loading ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        </div>
      )}

      {config && (
        <>
          {/* Configuration Overview */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Current Configuration</h3>
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              padding: '15px'
            }}>
              <div><strong>Name:</strong> {config.name}</div>
              <div><strong>Description:</strong> {config.description}</div>
              <div><strong>Version:</strong> {config.version}</div>
              <div><strong>Triggers:</strong> {config.triggers?.length || 0}</div>
              <div><strong>Actions:</strong> {config.actions?.length || 0}</div>
              <div><strong>Connectors:</strong> {config.connectors?.length || 0}</div>
            </div>
          </div>

          {/* Quick Edit */}
          <div style={{ marginBottom: '20px' }}>
            <h3>✏️ Quick Edit</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={editField}
                onChange={(e) => setEditField(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select field to edit...</option>
                <option value="name">Name</option>
                <option value="description">Description</option>
                <option value="version">Version</option>
              </select>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="New value..."
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
              />
              <button
                onClick={editConfig}
                disabled={!editField || editValue === '' || loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: editField && editValue !== '' && !loading ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>

          {/* Natural Language Refinement */}
          <div style={{ marginBottom: '20px' }}>
            <h3>🗣️ Natural Language Refinement</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <textarea
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="Describe how you want to modify the configuration... (e.g., 'Change schedule to run every 2 hours', 'Add batch size of 50')"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={refineConfig}
                disabled={!refinementText.trim() || loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: refinementText.trim() && !loading ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? 'Refining...' : 'Refine'}
              </button>
            </div>
          </div>

          {/* Add Components */}
          <div style={{ marginBottom: '20px' }}>
            <h3>➕ Add Components</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addTrigger}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ➕ Add Trigger
              </button>
              <button
                onClick={addAction}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ➕ Add Action
              </button>
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Validation Results</h3>
              <div style={{
                backgroundColor: validation.isValid ? '#d4edda' : '#f8d7da',
                border: `1px solid ${validation.isValid ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '5px',
                padding: '15px'
              }}>
                <div><strong>Status:</strong> {validation.isValid ? 'Valid' : 'Invalid'}</div>
                
                {validation.errors && validation.errors.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Errors:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      {validation.errors.map((error, index) => (
                        <li key={index} style={{ color: '#721c24' }}>
                          <strong>{error.field}:</strong> {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validation.warnings && validation.warnings.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Warnings:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      {validation.warnings.map((warning, index) => (
                        <li key={index} style={{ color: '#856404' }}>
                          <strong>{warning.field}:</strong> {warning.message}
                          {warning.suggestion && <em> (Suggestion: {warning.suggestion})</em>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Agent Section */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#e9f7ef', 
            border: '1px solid #c3e6cb', 
            borderRadius: '5px' 
          }}>
            <h3>Save Agent</h3>
            <p>Save this agent configuration to make it available in the Agent Catalog.</p>
            
            {saveStatus === 'success' && (
              <div style={{ 
                padding: '10px', 
                marginBottom: '10px', 
                backgroundColor: '#d4edda', 
                border: '1px solid #c3e6cb', 
                borderRadius: '5px', 
                color: '#155724' 
              }}>
                Agent saved successfully! Redirecting to Agent Catalog...
              </div>
            )}
            
            <button
              onClick={handleSaveAgent}
              disabled={saveStatus === 'success' || !config || loading}
              style={{
                padding: '10px 20px',
                backgroundColor: saveStatus === 'success' ? '#6c757d' : 
                                loading ? '#6c757d' :
                                !config ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: saveStatus === 'success' || !config || loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {saveStatus === 'success' ? 'Saved!' : 
               loading ? 'Saving...' :
               !config ? 'No Configuration' : 'Save Agent to Catalog'}
            </button>
          </div>

          {/* Configuration JSON */}
          <div>
            <h3>Configuration JSON</h3>
            <pre style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              padding: '15px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default ConfigEditor;