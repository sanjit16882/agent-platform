/**
 * Example: Agent Management with MCP Integration
 * 
 * This example shows how to integrate MCP management into an existing
 * agent management interface.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import MCPManagement from '../management/MCPManagement';
import MCPStatus from '../management/MCPStatus';

interface Agent {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  mcpEnabled?: boolean;
}

const AgentWithMCPExample: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showMCPConfig, setShowMCPConfig] = useState(false);

  // Sample agents data
  const agents: Agent[] = [
    {
      id: 'agent_1',
      name: 'Email Rephraser',
      category: 'productivity',
      status: 'active',
      mcpEnabled: false
    },
    {
      id: 'agent_2', 
      name: 'Code Analyzer',
      category: 'development',
      status: 'active',
      mcpEnabled: true
    },
    {
      id: 'agent_3',
      name: 'Data Processor',
      category: 'analytics',
      status: 'active',
      mcpEnabled: true
    }
  ];

  const handleMCPConfigUpdate = (config: any) => {
    console.log('MCP config updated:', config);
    // Update agent's MCP status in your state management
    if (selectedAgent) {
      // Update the agent's MCP enabled status
      setSelectedAgent({
        ...selectedAgent,
        mcpEnabled: config.enabled
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with MCP Status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agent Management</h1>
        <MCPStatus 
          compact={true}
          showDetails={false}
          onManageClick={() => console.log('Navigate to MCP server management')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAgent?.id === agent.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-600">{agent.category}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          agent.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }>
                          {agent.status}
                        </Badge>
                        {agent.mcpEnabled && (
                          <Badge className="bg-blue-100 text-blue-800">
                            MCP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Details & Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Agent Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedAgent ? (
                <>
                  <div>
                    <h3 className="font-medium">{selectedAgent.name}</h3>
                    <p className="text-sm text-gray-600">
                      Category: {selectedAgent.category}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button className="w-full">
                      Execute Agent
                    </Button>
                    
                    <Button 
                      className="w-full bg-gray-100 text-gray-800 border border-gray-300"
                      onClick={() => setShowMCPConfig(!showMCPConfig)}
                    >
                      {showMCPConfig ? 'Hide' : 'Configure'} MCP
                    </Button>
                    
                    <Button className="w-full bg-gray-100 text-gray-800 border border-gray-300">
                      View Analytics
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Select an agent to view actions
                </p>
              )}
            </CardContent>
          </Card>

          {/* MCP System Status */}
          <div className="mt-4">
            <MCPStatus 
              compact={false}
              showDetails={true}
              onManageClick={() => console.log('Navigate to MCP server management')}
            />
          </div>
        </div>
      </div>

      {/* MCP Configuration Panel */}
      {showMCPConfig && selectedAgent && (
        <MCPManagement
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          onConfigUpdate={handleMCPConfigUpdate}
        />
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>MCP Integration Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">What this example demonstrates:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Integration of MCP status in the page header</li>
                <li>MCP badges on agents that have MCP enabled</li>
                <li>Per-agent MCP configuration panel</li>
                <li>MCP system status in the sidebar</li>
                <li>Seamless integration with existing agent management</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Key integration points:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li><code>MCPStatus</code> - Shows overall MCP system health</li>
                <li><code>MCPManagement</code> - Per-agent MCP configuration</li>
                <li>MCP badges - Visual indicators for MCP-enabled agents</li>
                <li>Configuration callbacks - Handle MCP config updates</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a demonstration component. In your actual implementation,
                you would integrate these components into your existing agent management pages
                and connect them to your state management system.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentWithMCPExample;