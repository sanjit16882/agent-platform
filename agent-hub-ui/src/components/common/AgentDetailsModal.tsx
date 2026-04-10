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
  const [hasAnalyticsData, setHasAnalyticsData] = useState(false);

  useEffect(() => {
    if (agent && isOpen) {
      // Reset state when modal opens with new agent
      setActiveTab('overview');
      setConfiguration({});
      setHasChanges(false);
      
      // Check if agent has analytics data
      checkAnalyticsData();
    }
  }, [agent, isOpen]);
  
  const checkAnalyticsData = async () => {
    if (!agent) return;
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/v1/analytics/agent/${agent.agent_id}`);
      const data = await response.json();
      
      // Check if there's any execution data
      const hasData = data.success && data.data?.overall?.total_executions > 0;
      setHasAnalyticsData(hasData);
    } catch (error) {
      console.error('Error checking analytics data:', error);
      setHasAnalyticsData(false);
    }
  };

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

          {/* Deployment Tab - Available for all agents */}
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

          {/* Analytics Tab - Removed: Only relevant for production executions, not testing */}
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
  testingStatus?: {
    lastTestRun?: string;
    passRate?: number;
    totalTests?: number;
    quality?: 'excellent' | 'good' | 'fair' | 'poor' | 'not-tested';
    universalTests?: { total: number; passed: number; passRate: number };
  };
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

      {/* Testing Status - Simplified */}
      {agent.testingStatus && agent.testingStatus.quality !== 'not-tested' && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h5 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
            🧪 Testing Status
          </h5>
          <div style={{ 
            padding: theme.spacing.lg,
            backgroundColor: '#f0fdf4',
            borderRadius: theme.borderRadius.lg,
            border: '2px solid #22c55e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.md
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d', marginBottom: '8px' }}>
                ✅ Agent Tested & Validated
              </div>
              <div style={{ fontSize: '0.9rem', color: '#166534', display: 'flex', gap: theme.spacing.lg, flexWrap: 'wrap' }}>
                <div>
                  <strong>Pass Rate:</strong> <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{agent.testingStatus.passRate}%</span>
                </div>
                <div>
                  <strong>Total Tests:</strong> <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{agent.testingStatus.totalTests}</span>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.href = `/agent-testing/analytics?agentId=${agent.agent_id}`}
            >
              📊 View Test History
            </Button>
          </div>
        </div>
      )}

      {/* Not Tested State */}
      {(!agent.testingStatus || agent.testingStatus.quality === 'not-tested') && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h5 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
            🧪 Testing Status
          </h5>
          <div style={{ 
            padding: theme.spacing.xl,
            backgroundColor: '#fef3c7',
            borderRadius: theme.borderRadius.lg,
            border: '2px dashed #eab308',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: theme.spacing.md }}>🧪</div>
            <h6 style={{ color: '#92400e', marginBottom: theme.spacing.md }}>
              Agent Not Tested Yet
            </h6>
            <p style={{ color: '#78350f', marginBottom: theme.spacing.lg }}>
              Run comprehensive tests to evaluate this agent's performance across multiple categories and get actionable insights.
            </p>
            <Button
              variant="warning"
              onClick={() => window.location.href = `/agent-testing?agentId=${agent.agent_id}&action=new`}
            >
              Start Testing Now
            </Button>
          </div>
        </div>
      )}

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

const AgentDeploymentTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [selectedTarget, setSelectedTarget] = React.useState<string>('docker');
  const [downloading, setDownloading] = React.useState(false);
  const [showChecklist, setShowChecklist] = React.useState(false);

  const deploymentTargets = [
    { id: 'docker', name: 'Docker Compose', icon: '🐳', desc: 'Local or on-premise deployment' },
    { id: 'kubernetes', name: 'Kubernetes', icon: '☸️', desc: 'Any K8s cluster (EKS, GKE, AKS, on-prem)' },
    { id: 'aws-lambda', name: 'AWS Lambda', icon: '⚡', desc: 'Serverless on AWS' },
    { id: 'aws-ecs', name: 'AWS ECS', icon: '📦', desc: 'Container service on AWS' },
    { id: 'gcp-run', name: 'Google Cloud Run', icon: '🏃', desc: 'Serverless containers on GCP' },
    { id: 'azure-container', name: 'Azure Container', icon: '☁️', desc: 'Container instances on Azure' }
  ];

  const handleDownloadPackage = async () => {
    setDownloading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/agents/${agent.agent_id}/deployment-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: selectedTarget })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${agent.name.replace(/\s+/g, '-').toLowerCase()}-${selectedTarget}-deployment.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate deployment package. This feature is coming soon!');
      }
    } catch (error) {
      console.error('Error downloading package:', error);
      alert('Failed to generate deployment package. This feature is coming soon!');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h5 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
        🚀 Deploy Anywhere
      </h5>
      <p style={{ color: '#6b7280', marginBottom: theme.spacing.xl }}>
        Generate deployment packages for any environment - cloud, on-premise, or local development.
      </p>

      {/* Deployment Checklist */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowChecklist(!showChecklist)}
          style={{ marginBottom: theme.spacing.md }}
        >
          {showChecklist ? '▼' : '▶'} Pre-Deployment Checklist
        </Button>
        
        {showChecklist && (
          <div style={{
            padding: theme.spacing.lg,
            backgroundColor: '#f0f9ff',
            borderRadius: theme.borderRadius.lg,
            border: '1px solid #0ea5e9',
            marginBottom: theme.spacing.lg
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span>
                <span>Agent configuration validated</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span>
                <span>Dependencies identified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span>
                <span>Resource requirements calculated</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span style={{ color: '#eab308', fontSize: '1.2rem' }}>⚠️</span>
                <span><strong>Secrets needed:</strong> AWS_ACCESS_KEY, BEDROCK_API_KEY</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span style={{ color: '#0ea5e9', fontSize: '1.2rem' }}>ℹ️</span>
                <span><strong>Estimated cost:</strong> $0.05/1K requests (varies by cloud provider)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Target Selection */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h6 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
          Select Deployment Target
        </h6>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: theme.spacing.md
        }}>
          {deploymentTargets.map(target => (
            <div
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              style={{
                padding: theme.spacing.lg,
                backgroundColor: selectedTarget === target.id ? '#dbeafe' : '#f9fafb',
                border: selectedTarget === target.id ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                borderRadius: theme.borderRadius.lg,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>{target.icon}</div>
              <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                {target.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                {target.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Contents Preview */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h6 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
          📦 Package Contents
        </h6>
        <div style={{
          padding: theme.spacing.lg,
          backgroundColor: '#f9fafb',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid #e5e7eb',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          <div style={{ marginBottom: theme.spacing.sm }}>📄 {selectedTarget}-deployment.yaml</div>
          <div style={{ marginBottom: theme.spacing.sm }}>📄 .env.example</div>
          <div style={{ marginBottom: theme.spacing.sm }}>📄 DEPLOY.md (step-by-step instructions)</div>
          <div style={{ marginBottom: theme.spacing.sm }}>📄 agent-config.json</div>
          <div style={{ marginBottom: theme.spacing.sm }}>📄 health-check.sh</div>
          <div>📄 rollback.sh</div>
        </div>
      </div>

      {/* Download Button */}
      <div style={{ textAlign: 'center' }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleDownloadPackage}
          disabled={downloading}
          style={{ minWidth: '250px' }}
        >
          {downloading ? (
            <>⏳ Generating Package...</>
          ) : (
            <>⬇️ Download {deploymentTargets.find(t => t.id === selectedTarget)?.name} Package</>
          )}
        </Button>
        <p style={{ 
          marginTop: theme.spacing.md, 
          fontSize: '0.9rem', 
          color: '#6b7280',
          fontStyle: 'italic'
        }}>
          Your DevOps team can deploy this package to any {deploymentTargets.find(t => t.id === selectedTarget)?.name} environment
        </p>
      </div>

      {/* Key Features */}
      <div style={{ 
        marginTop: theme.spacing.xl,
        padding: theme.spacing.lg,
        backgroundColor: '#f0fdf4',
        borderRadius: theme.borderRadius.lg,
        border: '1px solid #22c55e'
      }}>
        <h6 style={{ color: '#15803d', marginBottom: theme.spacing.md }}>
          ✨ What Makes This Different
        </h6>
        <ul style={{ color: '#166534', margin: 0, paddingLeft: theme.spacing.xl }}>
          <li>Environment-agnostic: Same agent, any infrastructure</li>
          <li>Production-ready: Includes health checks, monitoring, and rollback scripts</li>
          <li>Security-first: Secrets management templates included</li>
          <li>Cost-optimized: Resource limits and auto-scaling configurations</li>
          <li>Zero vendor lock-in: Deploy to AWS, GCP, Azure, or on-premise</li>
        </ul>
      </div>
    </div>
  );
};

const AgentMetricsTab: React.FC<{ agent: Agent & {
  testingStatus?: {
    lastTestRun?: string;
    passRate?: number;
    totalTests?: number;
    quality?: 'excellent' | 'good' | 'fair' | 'poor' | 'not-tested';
  };
}}> = ({ agent }) => {
  const [metricsData, setMetricsData] = React.useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = React.useState(false);
  const [modelNames, setModelNames] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchModelNames = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/v1/bedrock/models`);
        const data = await response.json();
        
        if (data.success && data.available_models) {
          const nameMap: Record<string, string> = {};
          data.available_models.forEach((model: any) => {
            nameMap[model.id] = model.name || model.id;
          });
          setModelNames(nameMap);
          console.log('✅ Model names loaded:', nameMap);
        }
      } catch (error) {
        console.error('❌ Error fetching model names:', error);
      }
    };

    fetchModelNames();
  }, []);

  React.useEffect(() => {
    const fetchMetricsData = async () => {
      if (!agent.testingStatus || agent.testingStatus.quality === 'not-tested') {
        return;
      }

      setLoadingMetrics(true);
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
        const response = await fetch(`${API_BASE_URL}/api/testing/runs`);
        const responseData = await response.json();
        
        // Handle both response formats: direct array or wrapped in {data: [...]}
        const allRuns = Array.isArray(responseData) ? responseData : (responseData.data || []);
        
        if (!Array.isArray(allRuns) || allRuns.length === 0) {
          return;
        }
        
        // Filter runs for this agent (check both agentId and agentIds)
        const agentRuns = allRuns.filter((run: any) => 
          ((run.agentId && run.agentId === agent.agent_id) ||
           (run.agentIds && run.agentIds.includes(agent.agent_id))) &&
          run.status === 'completed'
        );

        if (agentRuns.length === 0) {
          return;
        }

        // Sort by date
        agentRuns.sort((a: any, b: any) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

        // Calculate performance trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRuns = agentRuns.filter((run: any) => 
          new Date(run.startTime) >= thirtyDaysAgo
        );

        const trendData = recentRuns.map((run: any) => ({
          date: new Date(run.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: run.totalTests > 0 ? Math.round((run.passedTests / run.totalTests) * 100) : 0
        })).reverse();

        // Calculate model performance with detailed metrics
        const modelPerformance: Record<string, { 
          totalScore: number; 
          runs: number; 
          avgScore: number;
          totalQualityScore: number;
          totalCost: number;
          totalDuration: number;
        }> = {};
        
        agentRuns.forEach((run: any) => {
          // Extract model from results metadata
          let modelId = run.modelId || 'unknown-model';
          if (run.results && run.results.length > 0 && run.results[0].metadata && run.results[0].metadata.model) {
            modelId = run.results[0].metadata.model;
            console.log('✅ Extracted model from results:', modelId);
          } else {
            console.log('⚠️ No model found in results, using fallback:', modelId);
          }
          
          if (!modelPerformance[modelId]) {
            modelPerformance[modelId] = { 
              totalScore: 0, 
              runs: 0, 
              avgScore: 0,
              totalQualityScore: 0,
              totalCost: 0,
              totalDuration: 0
            };
          }
          
          const passRate = run.totalTests > 0 ? (run.passedTests / run.totalTests) * 100 : 0;
          const qualityScore = run.averageScore || 0;
          const cost = run.cost || 0;
          const duration = run.duration || 0;
          
          modelPerformance[modelId].totalScore += passRate;
          modelPerformance[modelId].totalQualityScore += qualityScore;
          modelPerformance[modelId].totalCost += cost;
          modelPerformance[modelId].totalDuration += duration;
          modelPerformance[modelId].runs++;
        });

        // Calculate averages and sort by multiple criteria
        const rankedModels = Object.entries(modelPerformance)
          .map(([modelId, data]) => ({
            modelId,
            avgPassRate: Math.round(data.totalScore / data.runs),
            avgQualityScore: Math.round(data.totalQualityScore / data.runs),
            avgCost: data.totalCost / data.runs,
            avgDuration: Math.round(data.totalDuration / data.runs),
            runs: data.runs
          }))
          .sort((a, b) => {
            // Primary: Pass rate
            if (b.avgPassRate !== a.avgPassRate) return b.avgPassRate - a.avgPassRate;
            // Secondary: Quality score (when pass rates are equal)
            if (b.avgQualityScore !== a.avgQualityScore) return b.avgQualityScore - a.avgQualityScore;
            // Tertiary: Speed (lower is better)
            return a.avgDuration - b.avgDuration;
          });

        // Get recent test runs (last 10)
        const recentTestRuns = agentRuns.slice(0, 10).map((run: any) => {
          // Extract model from results metadata
          let modelId = run.modelId || 'unknown-model';
          if (run.results && run.results.length > 0 && run.results[0].metadata && run.results[0].metadata.model) {
            modelId = run.results[0].metadata.model;
          }
          
          return {
            runId: run.id || run.runId,
            date: new Date(run.startTime).toLocaleDateString(),
            time: new Date(run.startTime).toLocaleTimeString(),
            score: run.totalTests > 0 ? Math.round((run.passedTests / run.totalTests) * 100) : 0,
            modelId: modelId,
            totalTests: run.totalTests,
            passedTests: run.passedTests
          };
        });

        setMetricsData({
          trendData,
          rankedModels,
          recentTestRuns
        });
      } catch (error) {
        console.error('Error fetching metrics data:', error);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetricsData();
  }, [agent.agent_id, agent.testingStatus]);

  const getModelDisplayName = (modelId: string) => {
    return modelNames[modelId] || modelId.replace('unknown-model', 'Unknown Model');
  };

  // Not tested state
  if (!agent.testingStatus || agent.testingStatus.quality === 'not-tested') {
    return (
      <div>
        <h5 style={{ color: '#374151', marginBottom: theme.spacing.lg }}>
          Performance Metrics
        </h5>
        <div style={{ 
          padding: theme.spacing.xl,
          backgroundColor: '#fef3c7',
          borderRadius: theme.borderRadius.lg,
          border: '2px dashed #eab308',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: theme.spacing.md }}>📊</div>
          <h6 style={{ color: '#92400e', marginBottom: theme.spacing.md }}>
            No Metrics Available
          </h6>
          <p style={{ color: '#78350f', marginBottom: theme.spacing.md }}>
            Run your first test to see:
          </p>
          <ul style={{ 
            color: '#78350f', 
            textAlign: 'left', 
            display: 'inline-block',
            marginBottom: theme.spacing.lg 
          }}>
            <li>Performance trends over time</li>
            <li>Model comparison and rankings</li>
            <li>Detailed test run history</li>
          </ul>
          <div>
            <Button
              variant="warning"
              onClick={() => window.location.href = `/agent-testing?agentId=${agent.agent_id}&action=new`}
            >
              Run Your First Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h5 style={{ color: '#374151', marginBottom: theme.spacing.lg }}>
        Performance Metrics
      </h5>

      {/* Performance Trends Chart */}
      {metricsData && metricsData.trendData.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h6 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
            📈 Performance Trends (Last 30 Days)
          </h6>
          <div style={{ 
            padding: theme.spacing.lg,
            backgroundColor: '#f9fafb',
            borderRadius: theme.borderRadius.lg,
            border: '1px solid #e5e7eb',
            overflowX: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: '12px',
              height: '220px',
              padding: theme.spacing.md,
              paddingBottom: '60px',
              minWidth: `${metricsData.trendData.length * 50}px`
            }}>
              {metricsData.trendData.map((point: any, idx: number) => (
                <div 
                  key={idx}
                  style={{ 
                    flex: '0 0 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {point.score}%
                  </div>
                  <div 
                    style={{ 
                      width: '100%',
                      height: `${Math.max(point.score * 1.3, 10)}px`,
                      backgroundColor: point.score >= 75 ? '#22c55e' : point.score >= 50 ? '#eab308' : '#ef4444',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      cursor: 'pointer'
                    }}
                    title={`${point.date}: ${point.score}%`}
                  />
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#6b7280',
                    position: 'absolute',
                    bottom: '-45px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(-45deg)',
                    transformOrigin: 'center',
                    whiteSpace: 'nowrap',
                    width: '80px',
                    textAlign: 'center'
                  }}>
                    {point.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Models Tested (Ranked) */}
      {metricsData && metricsData.rankedModels.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h6 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
            🎯 All Models Tested (Ranked by Performance)
          </h6>
          <div style={{ 
            padding: theme.spacing.lg,
            backgroundColor: '#f9fafb',
            borderRadius: theme.borderRadius.lg,
            border: '1px solid #e5e7eb'
          }}>
            {metricsData.rankedModels.map((model: any, idx: number) => (
              <div 
                key={model.modelId}
                style={{ 
                  padding: theme.spacing.md,
                  marginBottom: idx < metricsData.rankedModels.length - 1 ? theme.spacing.sm : 0,
                  backgroundColor: idx === 0 ? '#fef3c7' : '#fff',
                  borderRadius: theme.borderRadius.md,
                  border: idx === 0 ? '2px solid #eab308' : '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flex: 1 }}>
                    <div style={{ 
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: idx === 0 ? '#92400e' : '#6b7280',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {idx === 0 ? '🏆' : `#${idx + 1}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '1rem' }}>
                        {getModelDisplayName(model.modelId)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {model.runs} test run{model.runs > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: 'bold',
                    color: model.avgPassRate >= 75 ? '#22c55e' : model.avgPassRate >= 50 ? '#eab308' : '#ef4444',
                    minWidth: '80px',
                    textAlign: 'right'
                  }}>
                    {model.avgPassRate}%
                  </div>
                </div>
                
                {/* Detailed Metrics */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: theme.spacing.md,
                  paddingLeft: '56px',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#6b7280' }}>⭐ Quality:</span>
                    <span style={{ fontWeight: 'bold', color: '#374151' }}>
                      {model.avgQualityScore || 0}/100
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#6b7280' }}>💰 Avg Cost:</span>
                    <span style={{ fontWeight: 'bold', color: '#374151' }}>
                      ${(model.avgCost || 0).toFixed(4)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#6b7280' }}>⚡ Avg Speed:</span>
                    <span style={{ fontWeight: 'bold', color: '#374151' }}>
                      {((model.avgDuration || 0) / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
                
                {/* Ranking Explanation for tied scores */}
                {idx > 0 && model.avgPassRate === metricsData.rankedModels[0].avgPassRate && (
                  <div style={{ 
                    marginTop: theme.spacing.sm,
                    paddingLeft: '56px',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    {(model.avgQualityScore || 0) < (metricsData.rankedModels[0].avgQualityScore || 0)
                      ? `Ranked lower due to quality score (${model.avgQualityScore || 0} vs ${metricsData.rankedModels[0].avgQualityScore || 0})`
                      : (model.avgDuration || 0) > (metricsData.rankedModels[0].avgDuration || 0)
                      ? `Ranked lower due to slower speed (${((model.avgDuration || 0) / 1000).toFixed(1)}s vs ${((metricsData.rankedModels[0].avgDuration || 0) / 1000).toFixed(1)}s)`
                      : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Test Runs */}
      {metricsData && metricsData.recentTestRuns.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h6 style={{ color: '#374151', marginBottom: theme.spacing.md }}>
            📊 Recent Test Runs
          </h6>
          <div style={{ 
            padding: theme.spacing.lg,
            backgroundColor: '#f9fafb',
            borderRadius: theme.borderRadius.lg,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: theme.spacing.md, textAlign: 'left', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Date & Time
                    </th>
                    <th style={{ padding: theme.spacing.md, textAlign: 'left', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Model
                    </th>
                    <th style={{ padding: theme.spacing.md, textAlign: 'center', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Score
                    </th>
                    <th style={{ padding: theme.spacing.md, textAlign: 'center', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Tests Passed
                    </th>
                    <th style={{ padding: theme.spacing.md, textAlign: 'center', color: '#374151', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metricsData.recentTestRuns.map((run: any, idx: number) => (
                    <tr 
                      key={run.runId}
                      style={{ 
                        borderBottom: idx < metricsData.recentTestRuns.length - 1 ? '1px solid #e5e7eb' : 'none',
                        backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa'
                      }}
                    >
                      <td style={{ padding: theme.spacing.md, fontSize: '0.875rem', color: '#374151' }}>
                        <div style={{ fontWeight: '500' }}>{run.date}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{run.time}</div>
                      </td>
                      <td style={{ padding: theme.spacing.md, fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                        {getModelDisplayName(run.modelId)}
                      </td>
                      <td style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          color: run.score >= 75 ? '#22c55e' : run.score >= 50 ? '#eab308' : '#ef4444',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: run.score >= 75 ? '#f0fdf4' : run.score >= 50 ? '#fef3c7' : '#fef2f2'
                        }}>
                          {run.score}%
                        </span>
                      </td>
                      <td style={{ padding: theme.spacing.md, textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                        {run.passedTests}/{run.totalTests}
                      </td>
                      <td style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => window.location.href = `/agent-testing/analytics?runId=${run.runId}`}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: theme.spacing.lg, textAlign: 'center', paddingTop: theme.spacing.lg, borderTop: '1px solid #e5e7eb' }}>
              <Button
                variant="primary"
                onClick={() => window.location.href = `/agent-testing/analytics?agentId=${agent.agent_id}`}
              >
                View Complete Test History →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDetailsModal;