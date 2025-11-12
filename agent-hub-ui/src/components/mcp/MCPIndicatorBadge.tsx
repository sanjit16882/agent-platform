import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

interface MCPIndicatorBadgeProps {
  mcpConfig?: {
    enabled: boolean;
    selectedServers: string[];
    serverNames?: string[];
  };
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const MCPIndicatorBadge: React.FC<MCPIndicatorBadgeProps> = ({
  mcpConfig,
  size = 'sm',
  showDetails = true
}) => {
  if (!mcpConfig || !mcpConfig.enabled || mcpConfig.selectedServers.length === 0) {
    return null;
  }

  const serverCount = mcpConfig.selectedServers.length;
  const badgeText = serverCount === 1 ? 'MCP' : `MCP (${serverCount})`;
  
  const getServerIcon = (serverId: string) => {
    switch (serverId) {
      case 'filesystem': return '🗂️';
      case 'database': return '🗄️';
      case 'git': return '🌿';
      case 'office365': return '📧';
      default: return '🔧';
    }
  };

  const tooltipContent = (
    <div>
      <strong>MCP Integration Enabled</strong>
      <br />
      <small>This agent has access to:</small>
      <ul className="mb-0 mt-1" style={{ paddingLeft: '1rem' }}>
        {mcpConfig.selectedServers.map((serverId, index) => {
          const serverName = mcpConfig.serverNames?.[index] || serverId;
          return (
            <li key={serverId}>
              {getServerIcon(serverId)} {serverName}
            </li>
          );
        })}
      </ul>
    </div>
  );

  const badge = (
    <Badge 
      bg="primary" 
      className={`d-inline-flex align-items-center ${size === 'lg' ? 'fs-6' : size === 'md' ? 'fs-7' : 'fs-8'}`}
      style={{ 
        fontSize: size === 'lg' ? '0.875rem' : size === 'md' ? '0.75rem' : '0.65rem',
        gap: '0.25rem'
      }}
    >
      <span>🔌</span>
      <span>{badgeText}</span>
    </Badge>
  );

  if (!showDetails) {
    return badge;
  }

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={`mcp-tooltip-${Math.random()}`}>{tooltipContent}</Tooltip>}
    >
      {badge}
    </OverlayTrigger>
  );
};

// Helper function to extract MCP config from agent metadata
export const extractMCPConfig = (agent: any) => {
  // Check multiple possible locations for MCP config
  const mcpConfig = agent.mcpIntegration || agent.metadata?.mcpConfig || agent.mcpConfig;
  
  if (!mcpConfig || !mcpConfig.enabled) {
    return null;
  }

  // Map server IDs to friendly names
  const serverNameMap: Record<string, string> = {
    filesystem: 'File System',
    database: 'Database',
    git: 'Git Repository',
    office365: 'Office 365'
  };

  return {
    enabled: mcpConfig.enabled,
    selectedServers: mcpConfig.selectedServers || [],
    serverNames: (mcpConfig.selectedServers || []).map((id: string) => serverNameMap[id] || id)
  };
};