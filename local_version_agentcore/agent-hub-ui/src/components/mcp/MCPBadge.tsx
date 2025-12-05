import React, { useState, useEffect } from 'react';
import { MCPServer } from '../../types/mcp';
import { mcpService } from '../../services/mcpService';

interface MCPBadgeProps {
  agentId: string;
  variant?: 'compact' | 'detailed' | 'marketplace';
  className?: string;
}

export const MCPBadge: React.FC<MCPBadgeProps> = ({
  agentId,
  variant = 'compact',
  className = ''
}) => {
  const [mcpConfig, setMcpConfig] = useState<any>(null);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMCPInfo();
  }, [agentId]);

  const loadMCPInfo = async () => {
    try {
      const [config, servers] = await Promise.all([
        mcpService.getAgentMCPConfig(agentId),
        mcpService.getAvailableServers()
      ]);

      setMcpConfig(config);
      if (config) {
        const agentServers = servers.filter(server => 
          config.mcpServers.includes(server.id)
        );
        setMcpServers(agentServers);
      }
    } catch (error) {
      console.error('Failed to load MCP info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!mcpConfig || mcpServers.length === 0) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'development': 'bg-blue-100 text-blue-800',
      'project-management': 'bg-purple-100 text-purple-800',
      'data': 'bg-green-100 text-green-800',
      'system': 'bg-orange-100 text-orange-800',
      'communication': 'bg-pink-100 text-pink-800',
      'security': 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderCompactBadge = () => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
      <i className="fas fa-plug mr-1"></i>
      MCP
      {mcpServers.length > 1 && (
        <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-900 rounded-full text-xs">
          {mcpServers.length}
        </span>
      )}
    </div>
  );

  const renderDetailedBadge = () => (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <i className="fas fa-plug mr-1"></i>
          MCP Enabled
        </div>
        <span className="text-xs text-gray-500">
          {mcpServers.length} integration{mcpServers.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {mcpServers.slice(0, 3).map(server => (
          <span
            key={server.id}
            className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(server.category)}`}
          >
            <i className={`fas fa-${server.icon} mr-1`}></i>
            {server.name}
          </span>
        ))}
        {mcpServers.length > 3 && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
            +{mcpServers.length - 3} more
          </span>
        )}
      </div>
    </div>
  );

  const renderMarketplaceBadge = () => (
    <div className={`border border-blue-200 rounded-lg p-3 bg-blue-50 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <i className="fas fa-plug text-blue-600"></i>
          <span className="font-medium text-blue-900">MCP Enhanced</span>
        </div>
        <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
          {mcpServers.length} integration{mcpServers.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <p className="text-sm text-blue-800 mb-3">
        This agent uses Model Context Protocol for enhanced capabilities
      </p>

      <div className="space-y-2">
        <div>
          <h4 className="text-xs font-medium text-blue-900 mb-1">Integrations:</h4>
          <div className="flex flex-wrap gap-1">
            {mcpServers.map(server => (
              <span
                key={server.id}
                className="px-2 py-1 text-xs bg-white text-blue-800 rounded border border-blue-200"
              >
                {server.name}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-blue-900 mb-1">Capabilities:</h4>
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set(mcpServers.flatMap(s => s.capabilities)))
              .slice(0, 4)
              .map((capability, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                >
                  {capability}
                </span>
              ))}
          </div>
        </div>

        <div className="pt-2 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            <i className="fas fa-info-circle mr-1"></i>
            Requires MCP server configuration for full functionality
          </p>
        </div>
      </div>
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompactBadge();
    case 'detailed':
      return renderDetailedBadge();
    case 'marketplace':
      return renderMarketplaceBadge();
    default:
      return renderCompactBadge();
  }
};

// Hook for checking if agent has MCP
export const useMCPStatus = (agentId: string) => {
  const [hasMCP, setHasMCP] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMCPStatus = async () => {
      try {
        const status = await mcpService.hasAgentMCPConfig(agentId);
        setHasMCP(status);
      } catch (error) {
        console.error('Failed to check MCP status:', error);
        setHasMCP(false);
      } finally {
        setLoading(false);
      }
    };

    checkMCPStatus();
  }, [agentId]);

  return { hasMCP, loading };
};

// Component for MCP filter in agent catalog
export const MCPFilter: React.FC<{
  showMCPOnly: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}> = ({ showMCPOnly, onToggle, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        type="checkbox"
        id="mcp-filter"
        checked={showMCPOnly}
        onChange={(e) => onToggle(e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label htmlFor="mcp-filter" className="text-sm text-gray-700 flex items-center">
        <i className="fas fa-plug mr-1 text-blue-600"></i>
        MCP Enhanced Only
      </label>
    </div>
  );
};