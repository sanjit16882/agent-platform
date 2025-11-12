/**
 * MCP Management Component - Per-Agent MCP Configuration
 * 
 * This component provides a UI for managing MCP (Model Context Protocol) settings
 * for individual agents. It allows users to enable/disable MCP and configure
 * which MCP servers each agent should use.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';

// Simple Switch component
const Switch: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}> = ({ checked, onCheckedChange }) => (
  <label className="inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="sr-only"
    />
    <div className={`relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full ${
      checked ? 'bg-blue-600' : 'bg-gray-300'
    }`}>
      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </div>
  </label>
);

// Simple Checkbox component
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

// Simple icons as text
const CheckCircle = () => <span className="text-green-500">✓</span>;
const XCircle = () => <span className="text-red-500">✗</span>;
const AlertTriangle = () => <span className="text-yellow-500">⚠</span>;
const Loader2 = ({ className }: { className?: string }) => (
  <span className={`inline-block animate-spin ${className}`}>⟳</span>
);
const Server = () => <span>🖥️</span>;

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

interface MCPManagementProps {
  agentId: string;
  agentName: string;
  onConfigUpdate?: (config: AgentMCPConfig) => void;
}

export const MCPManagement: React.FC<MCPManagementProps> = ({
  agentId,
  agentName,
  onConfigUpdate
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [availableServers, setAvailableServers] = useState<MCPServer[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentMCPConfig>({
    enabled: false,
    serverIds: [],
    timeout: 30000,
    autoApprove: []
  });
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMCPData();
  }, [agentId]);

  const loadMCPData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available MCP servers
      const serversResponse = await fetch('/api/v1/mcp/servers/available');
      const serversData = await serversResponse.json();

      if (serversData.success) {
        setAvailableServers(serversData.servers);
      }

      // Load agent's current MCP configuration
      const configResponse = await fetch(`/api/v1/mcp/agents/${agentId}/config`);
      const configData = await configResponse.json();

      if (configData.success) {
        setAgentConfig(configData.mcpConfig);
      }

    } catch (error) {
      console.error('Failed to load MCP data:', error);
      setError('Failed to load MCP configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (updates: Partial<AgentMCPConfig>) => {
    const newConfig = { ...agentConfig, ...updates };
    setAgentConfig(newConfig);
  };

  const handleServerToggle = (serverId: string, enabled: boolean) => {
    const newServerIds = enabled
      ? [...agentConfig.serverIds, serverId]
      : agentConfig.serverIds.filter(id => id !== serverId);
    
    handleConfigChange({ serverIds: newServerIds });
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/v1/mcp/agents/${agentId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentConfig),
      });

      const data = await response.json();

      if (data.success) {
        onConfigUpdate?.(agentConfig);
        setTestResults(null); // Clear old test results
      } else {
        setError(data.error || 'Failed to save configuration');
      }

    } catch (error) {
      console.error('Failed to save MCP configuration:', error);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async () => {
    try {
      setTesting(true);
      setError(null);

      const response = await fetch(`/api/v1/mcp/agents/${agentId}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      setTestResults(data);

    } catch (error) {
      console.error('Failed to test MCP configuration:', error);
      setError('Failed to test configuration');
    } finally {
      setTesting(false);
    }
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
          <span className="mr-2"><Loader2 /></span>
          Loading MCP configuration...
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
            MCP Configuration for {agentName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="critical" className="mb-4">
              <div className="flex items-center">
                <AlertTriangle />
                <span className="ml-2 text-red-800">{error}</span>
              </div>
            </Alert>
          )}

          {/* MCP Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Enable MCP</h3>
              <p className="text-sm text-gray-600">
                Allow this agent to use Model Context Protocol servers for enhanced capabilities
              </p>
            </div>
            <Switch
              checked={agentConfig.enabled}
              onCheckedChange={(enabled) => handleConfigChange({ enabled })}
            />
          </div>

          {/* Server Selection */}
          {agentConfig.enabled && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Available MCP Servers</h3>
              
              {availableServers.length === 0 ? (
                <Alert variant="warning">
                  <div className="flex items-center">
                    <AlertTriangle />
                    <span className="ml-2">
                      No MCP servers are currently available. Configure MCP servers first.
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
                          checked={agentConfig.serverIds.includes(server.id)}
                          onCheckedChange={(checked) => 
                            handleServerToggle(server.id, checked as boolean)
                          }
                          disabled={server.disabled}
                        />
                        <div className="flex items-center space-x-2">
                          {getServerStatusIcon(server.status)}
                          <div>
                            <div className="font-medium">{server.name}</div>
                            <div className="text-sm text-gray-600">
                              {server.toolsCount ? `${server.toolsCount} tools` : 'No tools info'}
                            </div>
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
          {agentConfig.enabled && agentConfig.serverIds.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Configuration Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>MCP Enabled: Yes</div>
                <div>Selected Servers: {agentConfig.serverIds.length}</div>
                <div>Timeout: {agentConfig.timeout}ms</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div className="space-y-3">
              <h4 className="font-medium">Test Results</h4>
              <Alert variant={testResults.success ? 'success' : 'critical'}>
                <span className={testResults.success ? 'text-green-800' : 'text-red-800'}>
                  {testResults.overallMessage}
                </span>
              </Alert>
              
              {testResults.serverTests && testResults.serverTests.length > 0 && (
                <div className="space-y-2">
                  {testResults.serverTests.map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{test.serverId}</span>
                      <div className="flex items-center space-x-2">
                        {test.success ? <CheckCircle /> : <XCircle />}
                        <span className="text-sm">{test.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              onClick={saveConfiguration}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving && <Loader2 />}
              <span>Save Configuration</span>
            </Button>
            
            {agentConfig.enabled && agentConfig.serverIds.length > 0 && (
              <Button
                onClick={testConfiguration}
                disabled={testing}
                className="flex items-center space-x-2 ml-2 bg-gray-100 text-gray-800 border border-gray-300"
              >
                {testing && <Loader2 />}
                <span>Test Configuration</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPManagement;