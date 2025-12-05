import React, { useState, useEffect } from 'react';
import { MCPServer } from '../../types/mcp';
import { mcpService } from '../../services/mcpService';

interface MCPSelectionStepProps {
  agentType?: string;
  agentDescription?: string;
  selectedServers: string[];
  onSelectionChange: (selectedServers: string[]) => void;
  onConfigurationChange: (serverId: string, config: Record<string, any>) => void;
  className?: string;
}

export const MCPSelectionStep: React.FC<MCPSelectionStepProps> = ({
  agentType = '',
  agentDescription = '',
  selectedServers,
  onSelectionChange,
  onConfigurationChange,
  className = ''
}) => {
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);
  const [suggestedServers, setSuggestedServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfiguration, setShowConfiguration] = useState<string | null>(null);
  const [serverConfigs, setServerConfigs] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    loadMCPServers();
  }, []);

  useEffect(() => {
    if (agentType && agentDescription) {
      loadSuggestions();
    }
  }, [agentType, agentDescription]);

  const loadMCPServers = async () => {
    try {
      const servers = await mcpService.getFeaturedServers();
      setAvailableServers(servers);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const suggestions = await mcpService.getSuggestedServers(agentType, agentDescription);
      setSuggestedServers(suggestions);
    } catch (error) {
      console.error('Failed to load MCP suggestions:', error);
    }
  };

  const handleServerToggle = (serverId: string) => {
    const newSelection = selectedServers.includes(serverId)
      ? selectedServers.filter(id => id !== serverId)
      : [...selectedServers, serverId];
    
    onSelectionChange(newSelection);
  };

  const handleConfigurationUpdate = (serverId: string, field: string, value: any) => {
    const newConfig = {
      ...serverConfigs[serverId],
      [field]: value
    };
    
    setServerConfigs(prev => ({
      ...prev,
      [serverId]: newConfig
    }));
    
    onConfigurationChange(serverId, newConfig);
  };

  const renderServerCard = (server: MCPServer, isSuggested = false) => {
    const isSelected = selectedServers.includes(server.id);
    const isConfiguring = showConfiguration === server.id;

    return (
      <div
        key={server.id}
        className={`border rounded-lg p-3 cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        } ${isSuggested ? 'ring-2 ring-green-200' : ''}`}
        onClick={() => !isConfiguring && handleServerToggle(server.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              getCategoryColor(server.category)
            }`}>
              <i className={`fas fa-${server.icon} text-white`}></i>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h6 className="text-sm font-medium text-gray-900">{server.name}</h6>
                {isSuggested && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Suggested
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{server.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {server.useCases.slice(0, 3).map((useCase, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfiguration(isConfiguring ? null : server.id);
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {isConfiguring ? 'Done' : 'Configure'}
              </button>
            )}
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-gray-300'
            }`}>
              {isSelected && <i className="fas fa-check text-white text-xs"></i>}
            </div>
          </div>
        </div>

        {isSelected && isConfiguring && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h6 className="text-sm font-medium text-gray-900 mb-2">Configuration</h6>
            <div className="space-y-3">
              {Object.entries(server.configuration).map(([field, fieldConfig]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {fieldConfig.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={serverConfigs[server.id]?.[field] || fieldConfig.default || false}
                      onChange={(e) => handleConfigurationUpdate(server.id, field, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  ) : fieldConfig.type === 'array' ? (
                    <input
                      type="text"
                      placeholder="Comma-separated values"
                      value={serverConfigs[server.id]?.[field]?.join(', ') || fieldConfig.default?.join(', ') || ''}
                      onChange={(e) => handleConfigurationUpdate(server.id, field, e.target.value.split(',').map(v => v.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type={fieldConfig.sensitive ? 'password' : fieldConfig.type === 'number' ? 'number' : 'text'}
                      placeholder={fieldConfig.description || `Enter ${field}`}
                      value={serverConfigs[server.id]?.[field] || fieldConfig.default || ''}
                      onChange={(e) => handleConfigurationUpdate(server.id, field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  {fieldConfig.description && (
                    <p className="text-xs text-gray-500 mt-1">{fieldConfig.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'development': 'bg-blue-500',
      'project-management': 'bg-purple-500',
      'data': 'bg-green-500',
      'system': 'bg-orange-500',
      'communication': 'bg-pink-500',
      'security': 'bg-red-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h6 className="text-sm font-medium text-gray-900 mb-1">
          Model Context Protocol (MCP) Integration
        </h6>
        <p className="text-xs text-gray-600">
          Enhance your agent with external tools and data sources. MCP integration is optional but can significantly expand your agent's capabilities.
        </p>
      </div>

      {suggestedServers.length > 0 && (
        <div>
          <h6 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <i className="fas fa-lightbulb text-yellow-500 mr-1 text-xs"></i>
            Suggested for Your Agent
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedServers.map(server => renderServerCard(server, true))}
          </div>
        </div>
      )}

      <div>
        <h6 className="text-sm font-medium text-gray-900 mb-2">Available MCP Servers</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableServers
            .filter(server => !suggestedServers.some(s => s.id === server.id))
            .map(server => renderServerCard(server))}
        </div>
      </div>

      {selectedServers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="text-sm font-medium text-blue-900 mb-1">
            Selected MCP Servers ({selectedServers.length})
          </h6>
          <div className="flex flex-wrap gap-2">
            {selectedServers.map(serverId => {
              const server = availableServers.find(s => s.id === serverId);
              return server ? (
                <span
                  key={serverId}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                >
                  <i className={`fas fa-${server.icon} mr-2`}></i>
                  {server.name}
                </span>
              ) : null;
            })}
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Your agent will have access to tools from these MCP servers during execution.
          </p>
        </div>
      )}

      {selectedServers.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <i className="fas fa-plug text-gray-400 text-2xl mb-2"></i>
          <p className="text-gray-600">
            No MCP servers selected. Your agent will use standard capabilities only.
          </p>
        </div>
      )}
    </div>
  );
};