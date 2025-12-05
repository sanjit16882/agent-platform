/**
 * MCP Agent Creation Step Component
 * 
 * This component integrates MCP configuration into the agent creation workflow.
 * Add this as a step in your agent creation process.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';

// Simple components
const Switch: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onCheckedChange, disabled }) => (
  <label className="inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      className="sr-only"
    />
    <div className={`relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full ${
      checked ? 'bg-blue-600' : 'bg-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </div>
  </label>
);

const Checkbox: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onCheckedChange, disabled }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    disabled={disabled}
    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
  />
);

// Simple icons
const Server = () => <span>🖥️</span>;
const CheckCircle = () => <span className="text-green-500">✓</span>;
const XCircle = () => <span className="text-red-500">✗</span>;
const AlertTriangle = () => <span className="text-yellow-500">⚠</span>;

interface MCPServer {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  toolsCount?: number;
  capabilities?: string[];
  disabled?: boolean;
}

interface AgentMCPConfig {
  enabled: boolean;
  serverIds: string[];
  timeout?: number;
  autoApprove?: string[];
}

interface MCPAgentCreationStepProps {
  agentData: {
    name: string;
    category: string;
    description?: string;
  };
  mcpConfig: AgentMCPConfig;
  onMCPConfigChange: (config: AgentMCPConfig) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

export const MCPAgentCreationStep: React.FC<MCPAgentCreationStepProps> = ({
  agentData,
  mcpConfig,
  onMCPConfigChange,
  onNext,
  onPrevious,
  showNavigation = true
}) => {
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableServers();
  }, []);

  const loadAvailableServers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/mcp/servers/available', {
        headers: {
          'X-API-Key': 'sk-agenthub-system-internal-frontend-key'
        }
      });

      const data = await response.json();

      if (data.success) {
        setAvailableServers(data.servers);
      } else {
        setError(data.error || 'Failed to load MCP servers');
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
      setError('Failed to load MCP servers');
    } finally {
      setLoading(false);
    }
  };

  const handleMCPToggle = (enabled: boolean) => {
    onMCPConfigChange({
      ...mcpConfig,
      enabled,
      // If disabling, clear server selection
      serverIds: enabled ? mcpConfig.serverIds : []
    });
  };

  const handleServerToggle = (serverId: string, selected: boolean) => {
    const newServerIds = selected
      ? [...mcpConfig.serverIds, serverId]
      : mcpConfig.serverIds.filter(id => id !== serverId);
    
    onMCPConfigChange({
      ...mcpConfig,
      serverIds: newServerIds
    });
  };

  const getServerStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle />;
      case 'disconnected':
        return <span className="text-gray-400">○</span>;
      case 'error':
        return <XCircle />;
      default:
        return <AlertTriangle />;
    }
  };

  const getServerStatusBadge = (status: string) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      unknown: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.unknown}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <span className="mr-2">⟳</span>
          Loading MCP configuration options...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server />
            MCP Configuration for "{agentData.name}"
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure Model Context Protocol (MCP) to enhance your agent with additional tools and capabilities.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="critical">
              <div className="flex items-center">
                <AlertTriangle />
                <span className="ml-2 text-red-800">{error}</span>
              </div>
            </Alert>
          )}

          {/* MCP Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="text-lg font-medium">Enable MCP Enhancement</h3>
              <p className="text-sm text-gray-600">
                Allow this agent to use MCP servers for enhanced capabilities like database access, file operations, and more.
              </p>
            </div>
            <Switch
              checked={mcpConfig.enabled}
              onCheckedChange={handleMCPToggle}
            />
          </div>

          {/* MCP Benefits Info */}
          {!mcpConfig.enabled && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Why Enable MCP?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Database Access:</strong> Query and analyze data in real-time</li>
                <li>• <strong>File Operations:</strong> Read, write, and analyze files and code</li>
                <li>• <strong>Git Integration:</strong> Access repository information and history</li>
                <li>• <strong>Enhanced Capabilities:</strong> More powerful and context-aware responses</li>
                <li>• <strong>Zero Risk:</strong> Always falls back to standard execution if needed</li>
              </ul>
            </div>
          )}

          {/* Server Selection */}
          {mcpConfig.enabled && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select MCP Servers</h3>
              
              {availableServers.length === 0 ? (
                <Alert variant="warning">
                  <div className="flex items-center">
                    <AlertTriangle />
                    <span className="ml-2">
                      No MCP servers are currently available. The agent will use built-in capabilities.
                    </span>
                  </div>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {availableServers.map((server) => (
                    <div
                      key={server.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={mcpConfig.serverIds.includes(server.id)}
                          onCheckedChange={(checked) => 
                            handleServerToggle(server.id, checked)
                          }
                          disabled={server.disabled}
                        />
                        <div className="flex items-center space-x-2">
                          {getServerStatusIcon(server.status)}
                          <div>
                            <div className="font-medium">{server.name}</div>
                            <div className="text-sm text-gray-600">
                              {server.toolsCount ? `${server.toolsCount} tools available` : 'Tools info unavailable'}
                            </div>
                            {server.capabilities && server.capabilities.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Capabilities: {server.capabilities.slice(0, 3).join(', ')}
                                {server.capabilities.length > 3 && '...'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getServerStatusBadge(server.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configuration Summary */}
          {mcpConfig.enabled && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">MCP Configuration Summary</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div>✅ MCP Enhancement: Enabled</div>
                <div>✅ Selected Servers: {mcpConfig.serverIds.length}</div>
                <div>✅ Fallback Available: Always (zero risk)</div>
                {mcpConfig.serverIds.length > 0 && (
                  <div>✅ Enhanced Capabilities: Database, Files, Git, and more</div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {mcpConfig.enabled && mcpConfig.serverIds.length > 0 && (
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer font-medium">
                Advanced MCP Settings (Optional)
              </summary>
              <div className="p-4 border-t space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (milliseconds)
                  </label>
                  <Input
                    type="number"
                    value={mcpConfig.timeout || 30000}
                    onChange={(e) => onMCPConfigChange({
                      ...mcpConfig,
                      timeout: parseInt(e.target.value) || 30000
                    })}
                    placeholder="30000"
                    className="w-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum time to wait for MCP operations (default: 30 seconds)
                  </p>
                </div>
              </div>
            </details>
          )}

          {/* Navigation Buttons */}
          {showNavigation && (
            <div className="flex justify-between pt-4 border-t">
              {onPrevious && (
                <Button
                  onClick={onPrevious}
                  className="bg-gray-100 text-gray-800 border border-gray-300"
                >
                  Previous
                </Button>
              )}
              <div className="flex-1" />
              {onNext && (
                <Button onClick={onNext}>
                  Continue
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPAgentCreationStep;