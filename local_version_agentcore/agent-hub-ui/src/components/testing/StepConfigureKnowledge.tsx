/**
 * StepConfigureKnowledge Component
 * Feature: Agent Testing Knowledge Integration
 * 
 * Allows users to configure Vector DB and MCP for testing
 * Auto-populates from agent's existing configuration
 */

import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import { KnowledgeConfig, AgentConfigWithKnowledge } from '../../types/testing';
import KnowledgeSourcePreview from './KnowledgeSourcePreview';

interface StepConfigureKnowledgeProps {
  agentConfig: AgentConfigWithKnowledge | null;
  knowledgeConfig: KnowledgeConfig;
  onUpdateConfig: (config: KnowledgeConfig) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface KnowledgeBase {
  id: string;
  name: string;
  documentCount: number;
  provider: string;
}

interface MCPServer {
  id: string;
  name: string;
  category: string;
  capabilities: string[];
}

const StepConfigureKnowledge: React.FC<StepConfigureKnowledgeProps> = ({
  agentConfig,
  knowledgeConfig,
  onUpdateConfig,
  onNext,
  onBack,
  onSkip
}) => {
  const [config, setConfig] = useState<KnowledgeConfig>(knowledgeConfig);
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [availableMCPServers, setAvailableMCPServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModified, setIsModified] = useState(false);

  // Load available knowledge bases and MCP servers
  useEffect(() => {
    loadAvailableResources();
  }, []);

  // Auto-populate from agent config
  useEffect(() => {
    if (agentConfig && !isModified) {
      autoPopulateFromAgent();
    }
  }, [agentConfig, availableKnowledgeBases, availableMCPServers]);

  const loadAvailableResources = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

      // Load knowledge bases
      const kbResponse = await fetch(`${API_BASE_URL}/api/knowledge-bases`);
      if (kbResponse.ok) {
        const kbData = await kbResponse.json();
        setAvailableKnowledgeBases(kbData.data || []);
      }

      // Load MCP servers
      const mcpResponse = await fetch(`${API_BASE_URL}/api/mcp/servers`);
      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json();
        setAvailableMCPServers(mcpData.data || []);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
      // Set fallback data
      setAvailableKnowledgeBases([
        { id: 'kb-1', name: 'Product Documentation', documentCount: 150, provider: 'OpenSearch' },
        { id: 'kb-2', name: 'Support Tickets', documentCount: 500, provider: 'OpenSearch' },
        { id: 'kb-3', name: 'FAQ Database', documentCount: 75, provider: 'Pinecone' }
      ]);
      setAvailableMCPServers([
        { id: 'mcp-fs', name: 'Filesystem', category: 'system', capabilities: ['read', 'write', 'list'] },
        { id: 'mcp-git', name: 'Git', category: 'development', capabilities: ['commit', 'branch', 'log'] },
        { id: 'mcp-db', name: 'Database', category: 'data', capabilities: ['query', 'insert', 'update'] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateFromAgent = () => {
    if (!agentConfig) return;

    const newConfig = { ...config };
    let hasChanges = false;

    // Auto-populate Vector DB config
    if (agentConfig.vectorDB && agentConfig.vectorDB.enabled) {
      newConfig.vectorDB = {
        enabled: true,
        provider: agentConfig.vectorDB.provider,
        knowledgeBases: agentConfig.vectorDB.knowledgeBases,
        retrievalConfig: {
          topK: agentConfig.vectorDB.retrievalConfig.topK,
          minSimilarity: agentConfig.vectorDB.retrievalConfig.minSimilarity
        }
      };
      hasChanges = true;
    }

    // Auto-populate MCP config
    if (agentConfig.mcp && agentConfig.mcp.enabled) {
      newConfig.mcp = {
        enabled: true,
        selectedServers: agentConfig.mcp.servers
      };
      hasChanges = true;
    }

    if (hasChanges) {
      setConfig(newConfig);
      onUpdateConfig(newConfig);
    }
  };

  const handleVectorDBToggle = () => {
    const newConfig = {
      ...config,
      vectorDB: {
        ...config.vectorDB,
        enabled: !config.vectorDB.enabled
      }
    };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
    setIsModified(true);
  };

  const handleMCPToggle = () => {
    const newConfig = {
      ...config,
      mcp: {
        ...config.mcp,
        enabled: !config.mcp.enabled
      }
    };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
    setIsModified(true);
  };

  const handleKnowledgeBaseToggle = (kbId: string) => {
    const newKBs = config.vectorDB.knowledgeBases.includes(kbId)
      ? config.vectorDB.knowledgeBases.filter(id => id !== kbId)
      : [...config.vectorDB.knowledgeBases, kbId];

    const newConfig = {
      ...config,
      vectorDB: {
        ...config.vectorDB,
        knowledgeBases: newKBs
      }
    };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
    setIsModified(true);
  };

  const handleMCPServerToggle = (serverId: string) => {
    const newServers = config.mcp.selectedServers.includes(serverId)
      ? config.mcp.selectedServers.filter(id => id !== serverId)
      : [...config.mcp.selectedServers, serverId];

    const newConfig = {
      ...config,
      mcp: {
        ...config.mcp,
        selectedServers: newServers
      }
    };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
    setIsModified(true);
  };

  const handleTopKChange = (value: number) => {
    const newConfig = {
      ...config,
      vectorDB: {
        ...config.vectorDB,
        retrievalConfig: {
          ...config.vectorDB.retrievalConfig,
          topK: value
        }
      }
    };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
    setIsModified(true);
  };

  const handleMinSimilarityChange = (value: number) => {
    const newConfig = {
      ...config,
      vectorDB: {
        ...config.vectorDB,
        retrievalConfig: {
          ...config.vectorDB.retrievalConfig,
          minSimilarity: value
        }
      }
    };
    setConfig(newConfig);
    onUpdateConfig(newConfig);
    setIsModified(true);
  };

  // Calculate estimated impact
  const calculateEstimatedLatency = (): number => {
    let latency = 0;
    if (config.vectorDB.enabled) latency += 250; // Vector DB search
    if (config.mcp.enabled) latency += 300; // MCP execution
    return latency;
  };

  const calculateEstimatedCost = (): number => {
    let cost = 0;
    if (config.vectorDB.enabled) cost += 0.10; // Vector DB cost per 1K queries
    if (config.mcp.enabled) cost += 0.20; // MCP cost per 1K queries
    return cost;
  };

  const hasAgentConfig = agentConfig && (agentConfig.vectorDB?.enabled || agentConfig.mcp?.enabled);

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            Loading knowledge sources...
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>Configure Knowledge Sources (Optional)</Card.Title>
          <Card.Text>
            Enhance test responses with Vector DB and MCP integration. 
            {hasAgentConfig && (
              <span style={{
                marginLeft: theme.spacing.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                backgroundColor: theme.colors.successLight,
                color: theme.colors.success,
                borderRadius: theme.borderRadius.full,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.semibold
              }}>
                ✓ Agent has knowledge sources configured
              </span>
            )}
          </Card.Text>
        </Card.Header>

        <Card.Body>
          {/* Vector DB Section */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.md
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <span style={{ fontSize: theme.typography.fontSize.xl }}>📚</span>
                <div>
                  <div style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textPrimary
                  }}>
                    Vector DB (RAG)
                    <span 
                      title="Retrieval-Augmented Generation: Searches your knowledge bases to find relevant documents and provides them as context to the LLM."
                      style={{ 
                        marginLeft: theme.spacing.xs, 
                        cursor: 'help',
                        color: theme.colors.info,
                        fontSize: theme.typography.fontSize.sm
                      }}
                    >
                      ℹ️
                    </span>
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    Search knowledge bases for relevant context
                  </div>
                </div>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.vectorDB.enabled}
                  onChange={handleVectorDBToggle}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <span style={{ fontSize: theme.typography.fontSize.sm }}>
                  {config.vectorDB.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {config.vectorDB.enabled && (
              <div style={{
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.gray100,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.gray300}`
              }}>
                {/* Knowledge Base Selection */}
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textPrimary,
                    marginBottom: theme.spacing.md
                  }}>
                    Select Knowledge Bases
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {availableKnowledgeBases.map(kb => (
                      <label
                        key={kb.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.white,
                          borderRadius: theme.borderRadius.md,
                          border: `1px solid ${
                            config.vectorDB.knowledgeBases.includes(kb.id)
                              ? theme.colors.primary
                              : theme.colors.gray300
                          }`,
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={config.vectorDB.knowledgeBases.includes(kb.id)}
                          onChange={() => handleKnowledgeBaseToggle(kb.id)}
                          style={{ marginRight: theme.spacing.md }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.textPrimary
                          }}>
                            {kb.name}
                          </div>
                          <div style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.textSecondary
                          }}>
                            {kb.documentCount} documents • {kb.provider}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Retrieval Configuration */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: theme.spacing.lg
                }}>
                  {/* Top-K Slider */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textPrimary,
                      marginBottom: theme.spacing.sm
                    }}>
                      Top-K: {config.vectorDB.retrievalConfig.topK} documents
                      <span 
                        title="Number of most relevant documents to retrieve from the knowledge base. Higher values provide more context but increase latency."
                        style={{ 
                          marginLeft: theme.spacing.xs, 
                          cursor: 'help',
                          color: theme.colors.info
                        }}
                      >
                        ℹ️
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={config.vectorDB.retrievalConfig.topK}
                      onChange={(e) => handleTopKChange(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                      aria-label="Top-K documents slider"
                    />
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginTop: theme.spacing.xs
                    }}>
                      Number of documents to retrieve (1-10)
                    </div>
                  </div>

                  {/* Min Similarity Slider */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textPrimary,
                      marginBottom: theme.spacing.sm
                    }}>
                      Min Similarity: {config.vectorDB.retrievalConfig.minSimilarity.toFixed(2)}
                      <span 
                        title="Minimum similarity score (0.0-1.0) for documents to be considered relevant. Higher values return only highly relevant documents."
                        style={{ 
                          marginLeft: theme.spacing.xs, 
                          cursor: 'help',
                          color: theme.colors.info
                        }}
                      >
                        ℹ️
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.vectorDB.retrievalConfig.minSimilarity}
                      onChange={(e) => handleMinSimilarityChange(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                      aria-label="Minimum similarity threshold slider"
                    />
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginTop: theme.spacing.xs
                    }}>
                      Minimum similarity threshold (0.0 - 1.0). Recommended: 0.7
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MCP Section */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.md
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <span style={{ fontSize: theme.typography.fontSize.xl }}>🔌</span>
                <div>
                  <div style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.textPrimary
                  }}>
                    MCP Integration
                    <span 
                      title="Model Context Protocol: Allows the agent to execute external tools like filesystem operations, git commands, database queries, etc."
                      style={{ 
                        marginLeft: theme.spacing.xs, 
                        cursor: 'help',
                        color: theme.colors.info,
                        fontSize: theme.typography.fontSize.sm
                      }}
                    >
                      ℹ️
                    </span>
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    Execute external tools and services
                  </div>
                </div>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.mcp.enabled}
                  onChange={handleMCPToggle}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <span style={{ fontSize: theme.typography.fontSize.sm }}>
                  {config.mcp.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {config.mcp.enabled && (
              <div style={{
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.gray100,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.gray300}`
              }}>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary,
                  marginBottom: theme.spacing.md
                }}>
                  Select MCP Servers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                  {availableMCPServers.map(server => (
                    <label
                      key={server.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: theme.spacing.md,
                        backgroundColor: theme.colors.white,
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${
                          config.mcp.selectedServers.includes(server.id)
                            ? theme.colors.primary
                            : theme.colors.gray300
                        }`,
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={config.mcp.selectedServers.includes(server.id)}
                        onChange={() => handleMCPServerToggle(server.id)}
                        style={{ marginRight: theme.spacing.md }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.textPrimary
                        }}>
                          {server.name}
                        </div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary
                        }}>
                          {server.capabilities.join(', ')}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Preview */}
      <KnowledgeSourcePreview
        config={config}
        estimatedLatency={calculateEstimatedLatency()}
        estimatedCost={calculateEstimatedCost()}
      />

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xl
      }}>
        <Button variant="outline-secondary" onClick={onBack}>
          ← Back
        </Button>
        
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          <Button 
            variant="outline-secondary" 
            onClick={onSkip}
            title="Skip knowledge source configuration and test with LLM only"
            aria-label="Skip knowledge configuration"
          >
            Skip (LLM Only)
          </Button>
          <Button 
            variant="primary" 
            onClick={onNext}
            aria-label="Continue to next step"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StepConfigureKnowledge;
