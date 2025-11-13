import React, { useState, useEffect } from 'react';
import { Modal, Tab, Tabs } from 'react-bootstrap';
import Button from './Button';
import { Agent, AgentConfiguration } from '../../types/agent';
import { Icon } from '../Icon';
import { theme } from '../../styles/theme';
import AgentAnalytics from '../AgentAnalytics';

interface AgentDetailsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (configuration: AgentConfiguration) => void;
  mode: 'view' | 'configure' | 'edit';
}

const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
  mode = 'view'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [configuration, setConfiguration] = useState<Partial<AgentConfiguration>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (agent && isOpen) {
      // Reset state when modal opens with new agent
      setActiveTab('overview');
      setConfiguration({});
      setHasChanges(false);
    }
  }, [agent, isOpen]);

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleSave = () => {
    if (onSave && configuration) {
      onSave(configuration as AgentConfiguration);
      setHasChanges(false);
    }
  };

  const handleConfigurationChange = (newConfig: Partial<AgentConfiguration>) => {
    setConfiguration(prev => ({ ...prev, ...newConfig }));
    setHasChanges(true);
  };

  if (!agent) return null;

  const getModalTitle = () => {
    switch (mode) {
      case 'configure':
        return `Configure ${agent.name}`;
      case 'edit':
        return `Edit ${agent.name}`;
      default:
        return `Agent Details - ${agent.name}`;
    }
  };

  const getModalSize = () => {
    return mode === 'view' ? 'lg' : 'xl';
  };

  return (
    <Modal 
      show={isOpen} 
      onHide={handleClose}
      size={getModalSize()}
      centered
      backdrop={hasChanges ? 'static' : true}
      keyboard={!hasChanges}
    >
      <Modal.Header 
        closeButton={!hasChanges}
        style={{ 
          backgroundColor: agent.agent_type === 'production' ? '#f0f9ff' : '#f8fafc',
          borderBottom: `2px solid ${agent.agent_type === 'production' ? '#0ea5e9' : '#64748b'}`
        }}
      >
        <Modal.Title style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: theme.spacing.md,
          color: agent.agent_type === 'production' ? '#0369a1' : '#475569'
        }}>
          <Icon 
            name={agent.agent_type === 'production' ? 'success' : 'activity'} 
            size="large" 
          />
          {getModalTitle()}
          {hasChanges && (
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#dc2626',
              fontWeight: 'normal'
            }}>
              (Unsaved Changes)
            </span>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onSelect={(tab) => setActiveTab(tab || 'overview')}
          className="nav-tabs-custom"
          style={{ 
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}
        >
          {/* Overview Tab */}
          <Tab 
            eventKey="overview" 
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="view" size="small" />
                Overview
              </span>
            }
          >
            <div style={{ padding: theme.spacing.xl }}>
              <AgentOverviewTab agent={agent} />
            </div>
          </Tab>

          {/* Configuration Tab */}
          {(mode === 'configure' || mode === 'edit') && (
            <Tab 
              eventKey="configuration" 
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="settings" size="small" />
                  Configuration
                  {hasChanges && <span style={{ color: '#dc2626' }}>●</span>}
                </span>
              }
            >
              <div style={{ padding: theme.spacing.xl }}>
                <AgentConfigurationTab 
                  agent={agent}
                  configuration={configuration}
                  onChange={handleConfigurationChange}
                />
              </div>
            </Tab>
          )}

          {/* Deployment Tab */}
          {agent.agent_type === 'production' && (
            <Tab 
              eventKey="deployment" 
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="upload" size="small" />
                  Deployment
                </span>
              }
            >
              <div style={{ padding: theme.spacing.xl }}>
                <AgentDeploymentTab agent={agent} />
              </div>
            </Tab>
          )}

          {/* Metrics Tab */}
          <Tab 
            eventKey="metrics" 
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="chart" size="small" />
                Metrics
              </span>
            }
          >
            <div style={{ padding: theme.spacing.xl }}>
              <AgentMetricsTab agent={agent} />
            </div>
          </Tab>

          {/* Analytics Tab */}
          <Tab 
            eventKey="analytics" 
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="chart" size="small" />
                Analytics
              </span>
            }
          >
            <div style={{ padding: theme.spacing.xl }}>
              <AgentAnalytics agentId={agent.agent_id} agentName={agent.name} />
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer style={{ 
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          {hasChanges && (
            <small style={{ color: '#dc2626', fontStyle: 'italic' }}>
              You have unsaved changes
            </small>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            icon="close"
          >
            {hasChanges ? 'Cancel' : 'Close'}
          </Button>
          
          {(mode === 'configure' || mode === 'edit') && (
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={!hasChanges}
              icon="success"
            >
              Save Configuration
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// Tab Components
const AgentOverviewTab: React.FC<{ agent: Agent & { 
  vectorDB?: { enabled: boolean; knowledgeBases?: string[]; provider?: string };
  executionMode?: 'bedrock-only' | 'rag' | 'mcp' | 'full-stack';
  estimatedCost?: number;
  estimatedLatency?: number;
}}> = ({ agent }) => {
  const getExecutionModeLabel = (mode?: string) => {
    const labels: Record<string, string> = {
      'bedrock-only': '🤖 Bedrock Only (LLM)',
      'rag': '📚 RAG (Vector DB + LLM)',
      'mcp': '🔧 MCP (LLM + Tools)',
      'full-stack': '⚡ Full Stack (All Components)'
    };
    return labels[mode || ''] || 'Not configured';
  };

  return (
    <div>
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h5 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
          Agent Information
        </h5>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: theme.spacing.lg,
          padding: theme.spacing.lg,
          backgroundColor: '#f9fafb',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <strong>Name:</strong> {agent.name}
          </div>
          <div>
            <strong>Category:</strong> {agent.category}
          </div>
          <div>
            <strong>Type:</strong> {agent.agent_type === 'production' ? 'Production-Ready' : 'Demo'}
          </div>
          <div>
            <strong>Usage Count:</strong> {agent.usage_count.toLocaleString()}
          </div>
          <div>
            <strong>Rating:</strong> {agent.average_rating.toFixed(1)}★
          </div>
          <div>
            <strong>Created:</strong> {new Date(agent.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Execution Mode Section */}
      {agent.executionMode && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h5 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
            Execution Configuration
          </h5>
          <div style={{ 
            padding: theme.spacing.lg,
            backgroundColor: '#f0f9ff',
            borderRadius: theme.borderRadius.lg,
            border: '1px solid #0ea5e9'
          }}>
            <div style={{ marginBottom: theme.spacing.md }}>
              <strong>Execution Mode:</strong> {getExecutionModeLabel(agent.executionMode)}
            </div>
            
            {/* Vector DB Configuration */}
            {agent.vectorDB?.enabled && (
              <div style={{ marginBottom: theme.spacing.md }}>
                <strong>Vector DB:</strong> Enabled
                <div style={{ marginLeft: theme.spacing.lg, marginTop: theme.spacing.sm }}>
                  <div>Provider: {agent.vectorDB.provider || 'Not specified'}</div>
                  <div>Knowledge Bases: {agent.vectorDB.knowledgeBases?.length || 0} configured</div>
                </div>
              </div>
            )}
            
            {/* Cost and Latency Estimates */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: theme.spacing.md,
              marginTop: theme.spacing.lg,
              paddingTop: theme.spacing.lg,
              borderTop: '1px solid #bae6fd'
            }}>
              {agent.estimatedCost !== undefined && (
                <div>
                  <strong>Estimated Cost:</strong>
                  <div style={{ fontSize: '1.2rem', color: '#0369a1' }}>
                    ${agent.estimatedCost.toFixed(2)}/1K queries
                  </div>
                </div>
              )}
              {agent.estimatedLatency !== undefined && (
                <div>
                  <strong>Estimated Latency:</strong>
                  <div style={{ fontSize: '1.2rem', color: '#0369a1' }}>
                    {agent.estimatedLatency}ms avg
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h5 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
          Description
        </h5>
        <p style={{ 
          lineHeight: 1.6, 
          color: '#6b7280',
          padding: theme.spacing.lg,
          backgroundColor: '#f9fafb',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid #e5e7eb'
        }}>
          {agent.description}
        </p>
      </div>
    </div>
  );
};

const AgentConfigurationTab: React.FC<{
  agent: Agent;
  configuration: Partial<AgentConfiguration>;
  onChange: (config: Partial<AgentConfiguration>) => void;
}> = ({ agent, configuration, onChange }) => (
  <div>
    <h5 style={{ color: '#374151', marginBottom: theme.spacing.lg }}>
      Configuration Settings
    </h5>
    <p style={{ color: '#6b7280', marginBottom: theme.spacing.xl }}>
      Configure the runtime settings and parameters for this agent.
    </p>
    
    {/* Placeholder for configuration form - will be implemented in later tasks */}
    <div style={{
      padding: theme.spacing.xl,
      backgroundColor: '#f0f9ff',
      borderRadius: theme.borderRadius.lg,
      border: '2px dashed #0ea5e9',
      textAlign: 'center'
    }}>
      <Icon name="settings" size="xlarge" style={{ color: '#0ea5e9', marginBottom: theme.spacing.md }} />
      <h6 style={{ color: '#0369a1' }}>Configuration Wizard</h6>
      <p style={{ color: '#0369a1', margin: 0 }}>
        Step-by-step configuration interface will be implemented here
      </p>
    </div>
  </div>
);

const AgentDeploymentTab: React.FC<{ agent: Agent }> = ({ agent }) => (
  <div>
    <h5 style={{ color: '#374151', marginBottom: theme.spacing.lg }}>
      Deployment Status
    </h5>
    <div style={{
      padding: theme.spacing.xl,
      backgroundColor: '#f0fdf4',
      borderRadius: theme.borderRadius.lg,
      border: '1px solid #22c55e'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <Icon name="success" size="large" style={{ color: '#22c55e' }} />
        <div>
          <h6 style={{ color: '#15803d', margin: 0 }}>Production Ready</h6>
          <p style={{ color: '#166534', margin: 0 }}>
            This agent is deployed and ready for production use
          </p>
        </div>
      </div>
    </div>
  </div>
);

const AgentMetricsTab: React.FC<{ agent: Agent }> = ({ agent }) => (
  <div>
    <h5 style={{ color: '#374151', marginBottom: theme.spacing.lg }}>
      Performance Metrics
    </h5>
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: theme.spacing.lg
    }}>
      <div style={{
        padding: theme.spacing.lg,
        backgroundColor: '#f0f9ff',
        borderRadius: theme.borderRadius.lg,
        border: '1px solid #0ea5e9',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>
          {agent.usage_count.toLocaleString()}
        </div>
        <div style={{ color: '#0369a1' }}>Total Executions</div>
      </div>
      
      <div style={{
        padding: theme.spacing.lg,
        backgroundColor: '#f0fdf4',
        borderRadius: theme.borderRadius.lg,
        border: '1px solid #22c55e',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>
          {agent.average_rating.toFixed(1)}★
        </div>
        <div style={{ color: '#15803d' }}>Average Rating</div>
      </div>
      
      <div style={{
        padding: theme.spacing.lg,
        backgroundColor: '#fefce8',
        borderRadius: theme.borderRadius.lg,
        border: '1px solid #eab308',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a16207' }}>
          99.2%
        </div>
        <div style={{ color: '#a16207' }}>Success Rate</div>
      </div>
    </div>
  </div>
);

export default AgentDetailsModal;