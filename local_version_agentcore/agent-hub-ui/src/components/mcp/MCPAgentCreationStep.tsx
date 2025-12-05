import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Alert, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { realMCPService } from '../../services/realMCPService';
import { MCPServer } from '../../types/mcp';

interface MCPAgentCreationStepProps {
  agentType?: string;
  agentDescription?: string;
  onMCPConfigChange: (config: MCPAgentConfig) => void;
  initialConfig?: MCPAgentConfig;
}

export interface MCPAgentConfig {
  enabled: boolean;
  selectedServers: string[];
  autoDetected: boolean;
  recommendedServers: string[];
}

export const MCPAgentCreationStep: React.FC<MCPAgentCreationStepProps> = ({
  agentType = '',
  agentDescription = '',
  onMCPConfigChange,
  initialConfig
}) => {
  const [mcpServers, setMcpServers] = useState<(MCPServer & { url?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [mcpConfig, setMcpConfig] = useState<MCPAgentConfig>(
    initialConfig || {
      enabled: false,
      selectedServers: [],
      autoDetected: false,
      recommendedServers: []
    }
  );
  const [serverStatus, setServerStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadMCPServers();
  }, []);

  const autoDetectMCPNeeds = useCallback(() => {
    const description = agentDescription.toLowerCase();
    const type = agentType.toLowerCase();
    const recommended: string[] = [];

    // Auto-detect based on keywords and agent type
    if (description.includes('file') || description.includes('code') || description.includes('read') || 
        description.includes('write') || type.includes('code') || type.includes('devops')) {
      recommended.push('filesystem');
    }

    if (description.includes('database') || description.includes('query') || description.includes('data') ||
        description.includes('sql') || type.includes('data')) {
      recommended.push('database');
    }

    if (description.includes('git') || description.includes('repository') || description.includes('commit') ||
        description.includes('version') || type.includes('code') || type.includes('devops')) {
      recommended.push('git');
    }

    if (description.includes('email') || description.includes('calendar') || description.includes('office') ||
        description.includes('document') || type.includes('business')) {
      recommended.push('office365');
    }

    // Remove duplicates
    const uniqueRecommended = Array.from(new Set(recommended));

    setMcpConfig(prev => ({
      ...prev,
      recommendedServers: uniqueRecommended,
      autoDetected: uniqueRecommended.length > 0,
      enabled: uniqueRecommended.length > 0,
      selectedServers: uniqueRecommended.length > 0 ? uniqueRecommended : prev.selectedServers
    }));
  }, [agentDescription, agentType]);

  useEffect(() => {
    if (agentDescription && mcpServers.length > 0) {
      autoDetectMCPNeeds();
    }
  }, [agentDescription, mcpServers, autoDetectMCPNeeds]);

  useEffect(() => {
    onMCPConfigChange(mcpConfig);
  }, [mcpConfig, onMCPConfigChange]);

  const loadMCPServers = async () => {
    try {
      setLoading(true);
      const servers = await realMCPService.getRealDockerServers();
      setMcpServers(servers);

      // Check server status (servers already have status from getRealDockerServers)
      const status: Record<string, boolean> = {};
      for (const server of servers) {
        // Use the status already determined by getRealDockerServers to avoid duplicate health checks
        status[server.id] = server.status === 'active';
      }
      setServerStatus(status);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerToggle = (serverId: string) => {
    setMcpConfig(prev => {
      const newSelected = prev.selectedServers.includes(serverId)
        ? prev.selectedServers.filter(id => id !== serverId)
        : [...prev.selectedServers, serverId];

      return {
        ...prev,
        selectedServers: newSelected,
        enabled: newSelected.length > 0,
        autoDetected: false // User manually changed selection
      };
    });
  };

  const handleEnableToggle = (enabled: boolean) => {
    setMcpConfig(prev => ({
      ...prev,
      enabled,
      selectedServers: enabled ? prev.selectedServers : [],
      autoDetected: false
    }));
  };

  const getServerIcon = (category: string) => {
    switch (category) {
      case 'system': return '🗂️';
      case 'data': return '🗄️';
      case 'development': return '🌿';
      case 'communication': return '📧';
      default: return '🔧';
    }
  };

  const getServerBadgeColor = (serverId: string) => {
    if (!serverStatus[serverId]) return 'danger';
    if (mcpConfig.selectedServers.includes(serverId)) return 'success';
    if (mcpConfig.recommendedServers.includes(serverId)) return 'warning';
    return 'secondary';
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading MCP servers...
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">🔌 MCP Integration (Optional)</h5>
          <Form.Check
            type="switch"
            id="mcp-enabled"
            label={mcpConfig.enabled ? 'Enabled' : 'Disabled'}
            checked={mcpConfig.enabled}
            onChange={(e) => handleEnableToggle(e.target.checked)}
          />
        </div>
      </Card.Header>
      <Card.Body>
        {mcpConfig.autoDetected && mcpConfig.recommendedServers.length > 0 && (
          <Alert variant="info" className="mb-3">
            <div className="d-flex align-items-start">
              <i className="fas fa-magic me-2 mt-1"></i>
              <div>
                <strong>Auto-detected MCP needs!</strong>
                <p className="mb-2 mt-1">
                  Based on your agent description, we recommend these MCP servers:
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {mcpConfig.recommendedServers.map(serverId => {
                    const server = mcpServers.find(s => s.id === serverId);
                    return server ? (
                      <Badge key={serverId} bg="warning" className="d-flex align-items-center">
                        {getServerIcon(server.category)} {server.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </Alert>
        )}

        {!mcpConfig.enabled ? (
          <div className="text-center py-4">
            <i className="fas fa-plug text-muted fa-2x mb-3"></i>
            <p className="text-muted mb-3">MCP integration is disabled</p>
            <p className="small text-muted">
              Enable MCP to give your agent access to external tools like file systems, databases, and git repositories.
            </p>
          </div>
        ) : (
          <>
            <p className="text-muted mb-3">
              Select which MCP servers your agent should have access to. These provide external tools and data sources.
            </p>

            <Row>
              {mcpServers.map(server => (
                <Col md={6} key={server.id} className="mb-3">
                  <Card 
                    className={`h-100 cursor-pointer ${mcpConfig.selectedServers.includes(server.id) ? 'border-success' : ''}`}
                    onClick={() => handleServerToggle(server.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          <span className="me-2">{getServerIcon(server.category)}</span>
                          <h6 className="mb-0">{server.name}</h6>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <Badge bg={getServerBadgeColor(server.id)} className="mb-1">
                            {!serverStatus[server.id] ? 'Offline' :
                             mcpConfig.selectedServers.includes(server.id) ? 'Selected' :
                             mcpConfig.recommendedServers.includes(server.id) ? 'Recommended' : 'Available'}
                          </Badge>
                          <Form.Check
                            type="checkbox"
                            checked={mcpConfig.selectedServers.includes(server.id)}
                            onChange={() => handleServerToggle(server.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      <p className="text-muted small mb-2">{server.description}</p>
                      
                      <div className="mb-2">
                        <strong className="small">Tools:</strong>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {server.tools.slice(0, 3).map(tool => (
                            <Badge key={tool} bg="light" text="dark" className="small">
                              {tool}
                            </Badge>
                          ))}
                          {server.tools.length > 3 && (
                            <Badge bg="light" text="dark" className="small">
                              +{server.tools.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!serverStatus[server.id] && (
                        <Alert variant="warning" className="small mb-0 py-2">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Server offline. Start Docker containers to use this server.
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {mcpConfig.selectedServers.length > 0 && (
              <Alert variant="success" className="mt-3">
                <div className="d-flex align-items-start">
                  <i className="fas fa-check-circle me-2 mt-1"></i>
                  <div>
                    <strong>MCP Integration Configured!</strong>
                    <p className="mb-2 mt-1">
                      Your agent will have access to {mcpConfig.selectedServers.length} MCP server{mcpConfig.selectedServers.length !== 1 ? 's' : ''} with the following capabilities:
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {mcpConfig.selectedServers.map(serverId => {
                        const server = mcpServers.find(s => s.id === serverId);
                        return server ? (
                          <Badge key={serverId} bg="success" className="d-flex align-items-center">
                            {getServerIcon(server.category)} {server.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </Alert>
            )}
          </>
        )}

        <div className="mt-3 pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => window.open('/real-mcp-dashboard', '_blank')}
            >
              🔧 Test MCP Servers
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={loadMCPServers}
            >
              🔄 Refresh Status
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};