import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, Modal, Form } from 'react-bootstrap';
import { MCPServer, AgentMCPConfig } from '../../types/mcp';
import { mcpService } from '../../services/mcpService';
import { realMCPService } from '../../services/realMCPService';
import { MCPSelectionStep } from './MCPSelectionStep';

interface MCPConfigurationPanelProps {
  agentId: string;
  agentName: string;
  agentType?: string;
  agentDescription?: string;
  onConfigurationChange?: (hasMCP: boolean) => void;
  className?: string;
}

export const MCPConfigurationPanel: React.FC<MCPConfigurationPanelProps> = ({
  agentId,
  agentName,
  agentType = 'custom',
  agentDescription = '',
  onConfigurationChange,
  className = ''
}) => {
  const [mcpConfig, setMcpConfig] = useState<AgentMCPConfig | null>(null);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [serverConfigs, setServerConfigs] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMCPConfiguration();
  }, [agentId]);

  const loadMCPConfiguration = async () => {
    try {
      setLoading(true);
      const [config, servers] = await Promise.all([
        mcpService.getAgentMCPConfig(agentId),
        realMCPService.getRealDockerServers() // Use real Docker servers
      ]);

      setMcpConfig(config);
      setMcpServers(servers);
      
      if (config) {
        setSelectedServers(config.mcpServers);
        // Load existing configurations if available
        setServerConfigs(config.configuration || {});
      }

      onConfigurationChange?.(config !== null);
    } catch (error) {
      console.error('Failed to load MCP configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      
      if (selectedServers.length === 0) {
        // Remove MCP configuration
        await mcpService.removeAgentMCPConfig(agentId);
        setMcpConfig(null);
      } else {
        // Update or create MCP configuration
        const config = await mcpService.configureAgentMCP(agentId, {
          enabled: true,
          selectedServers,
          autoConnect: true,
          fallbackToStandard: true
        });
        setMcpConfig(config);
      }

      onConfigurationChange?.(selectedServers.length > 0);
      setShowConfigModal(false);
    } catch (error) {
      console.error('Failed to save MCP configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const getServerInfo = (serverId: string) => {
    return mcpServers.find(server => server.id === serverId);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'development': 'primary',
      'project-management': 'purple',
      'data': 'success',
      'system': 'warning',
      'communication': 'info',
      'security': 'danger'
    };
    return colors[category as keyof typeof colors] || 'secondary';
  };

  if (loading) {
    return (
      <Card className={className}>
        <Card.Header>
          <h6 className="mb-0">🔌 MCP Integration</h6>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            Loading MCP configuration...
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">🔌 MCP Integration</h6>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowConfigModal(true)}
          >
            {mcpConfig ? 'Modify' : 'Add'} MCP
          </Button>
        </Card.Header>
        <Card.Body>
          {mcpConfig && mcpConfig.mcpServers.length > 0 ? (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-success fw-medium">
                  <i className="fas fa-check-circle me-1"></i>
                  MCP Enabled
                </span>
                <Badge bg="primary">{mcpConfig.mcpServers.length} server{mcpConfig.mcpServers.length !== 1 ? 's' : ''}</Badge>
              </div>

              <div className="mb-3">
                <h6 className="mb-2">Connected Servers:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {mcpConfig.mcpServers.map(serverId => {
                    const server = getServerInfo(serverId);
                    return server ? (
                      <Badge
                        key={serverId}
                        bg={getCategoryColor(server.category)}
                        className="d-flex align-items-center px-2 py-1"
                      >
                        <i className={`fas fa-${server.icon} me-1`}></i>
                        {server.name}
                      </Badge>
                    ) : (
                      <Badge key={serverId} bg="secondary">
                        Unknown Server
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="mb-3">
                <h6 className="mb-2">Available Tools:</h6>
                <div className="text-muted small">
                  {mcpConfig.requiredTools.length > 0 ? (
                    <div>
                      {mcpConfig.requiredTools.slice(0, 5).join(', ')}
                      {mcpConfig.requiredTools.length > 5 && ` +${mcpConfig.requiredTools.length - 5} more`}
                    </div>
                  ) : (
                    'No tools configured'
                  )}
                </div>
              </div>

              <Alert variant="info" className="mb-0">
                <div className="d-flex align-items-start">
                  <i className="fas fa-info-circle me-2 mt-1"></i>
                  <div className="small">
                    This agent can access external tools and data sources through MCP servers during execution.
                    The agent will automatically fall back to standard processing if MCP servers are unavailable.
                  </div>
                </div>
              </Alert>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-plug text-muted fa-2x mb-3"></i>
              <p className="text-muted mb-3">No MCP integration configured</p>
              <p className="small text-muted mb-0">
                Add MCP servers to enhance this agent with external tools and data sources.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Configuration Modal */}
      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Configure MCP Integration for "{agentName}"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <MCPSelectionStep
            agentType={agentType}
            agentDescription={agentDescription}
            selectedServers={selectedServers}
            onSelectionChange={setSelectedServers}
            onConfigurationChange={(serverId, config) => {
              setServerConfigs(prev => ({
                ...prev,
                [serverId]: config
              }));
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfigModal(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveConfiguration}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner-border spinner-border-sm me-2"></div>
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};