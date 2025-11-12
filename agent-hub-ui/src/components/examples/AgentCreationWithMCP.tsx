/**
 * Agent Creation with MCP Integration Example
 * 
 * This example shows how to integrate MCP configuration into your existing
 * agent creation workflow. Use this as a reference for updating your
 * AgentUpload, HybridAgentBuilder, or other agent creation components.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import MCPAgentCreationStep from '../management/MCPAgentCreationStep';

interface AgentFormData {
  name: string;
  description: string;
  category: string;
  processingLogic: string;
  mcpConfig: {
    enabled: boolean;
    serverIds: string[];
    timeout?: number;
    autoApprove?: string[];
  };
}

const AgentCreationWithMCP: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [agentData, setAgentData] = useState<AgentFormData>({
    name: '',
    description: '',
    category: 'productivity',
    processingLogic: '',
    mcpConfig: {
      enabled: false,
      serverIds: [],
      timeout: 30000,
      autoApprove: []
    }
  });
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);

  const handleBasicInfoChange = (field: keyof AgentFormData, value: string) => {
    setAgentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMCPConfigChange = (mcpConfig: AgentFormData['mcpConfig']) => {
    setAgentData(prev => ({
      ...prev,
      mcpConfig
    }));
  };

  const createAgent = async () => {
    try {
      setIsCreating(true);
      
      // Create the agent with MCP configuration
      const response = await fetch('/api/v1/agents/s3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sk-agenthub-system-internal-frontend-key'
        },
        body: JSON.stringify({
          name: agentData.name,
          description: agentData.description,
          category: agentData.category,
          processingLogic: agentData.processingLogic,
          // Include MCP configuration in the agent data
          mcpConfig: agentData.mcpConfig,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCreationResult({
          success: true,
          agent: result.agent,
          message: 'Agent created successfully with MCP configuration!'
        });
        setCurrentStep(4); // Move to success step
      } else {
        setCreationResult({
          success: false,
          error: result.error || 'Failed to create agent'
        });
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      setCreationResult({
        success: false,
        error: 'Failed to create agent'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Basic Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Name *
                </label>
                <Input
                  value={agentData.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  placeholder="Enter agent name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={agentData.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  placeholder="Describe what your agent does"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={agentData.category}
                  onChange={(e) => handleBasicInfoChange('category', e.target.value)}
                  className="form-control"
                >
                  <option value="productivity">Productivity</option>
                  <option value="development">Development</option>
                  <option value="analytics">Analytics</option>
                  <option value="security">Security</option>
                  <option value="testing">Testing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Logic
                </label>
                <textarea
                  value={agentData.processingLogic}
                  onChange={(e) => handleBasicInfoChange('processingLogic', e.target.value)}
                  placeholder="Describe how your agent should process inputs"
                  className="form-control"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!agentData.name.trim()}
                >
                  Next: Configure MCP
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <MCPAgentCreationStep
            agentData={agentData}
            mcpConfig={agentData.mcpConfig}
            onMCPConfigChange={handleMCPConfigChange}
            onNext={() => setCurrentStep(3)}
            onPrevious={() => setCurrentStep(1)}
          />
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review & Create Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium">Agent Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {agentData.name}
                  </div>
                  <div>
                    <strong>Category:</strong> {agentData.category}
                  </div>
                  <div className="col-span-2">
                    <strong>Description:</strong> {agentData.description || 'No description'}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-blue-900">MCP Configuration</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>
                    <strong>MCP Enabled:</strong> {agentData.mcpConfig.enabled ? 'Yes' : 'No'}
                  </div>
                  {agentData.mcpConfig.enabled && (
                    <>
                      <div>
                        <strong>Selected Servers:</strong> {agentData.mcpConfig.serverIds.length} servers
                      </div>
                      <div>
                        <strong>Timeout:</strong> {agentData.mcpConfig.timeout}ms
                      </div>
                      <div>
                        <strong>Fallback:</strong> Always available (zero risk)
                      </div>
                    </>
                  )}
                </div>
              </div>

              {creationResult && !creationResult.success && (
                <Alert variant="critical">
                  <span className="text-red-800">{creationResult.error}</span>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-100 text-gray-800 border border-gray-300"
                >
                  Previous
                </Button>
                <Button
                  onClick={createAgent}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating Agent...' : 'Create Agent'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Agent Created Successfully! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creationResult?.success && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Your agent "{agentData.name}" has been created!
                  </h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <div>✅ Agent ID: {creationResult.agent?.id}</div>
                    <div>✅ MCP Configuration: {agentData.mcpConfig.enabled ? 'Enabled' : 'Disabled'}</div>
                    <div>✅ Status: Ready for execution</div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">What's Next?</h4>
                <ul className="text-sm space-y-1">
                  <li>• Test your agent with sample inputs</li>
                  <li>• Configure additional MCP servers if needed</li>
                  <li>• Monitor agent performance in the dashboard</li>
                  <li>• Share your agent with your team</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button onClick={() => {
                  // Reset form for new agent
                  setCurrentStep(1);
                  setAgentData({
                    name: '',
                    description: '',
                    category: 'productivity',
                    processingLogic: '',
                    mcpConfig: {
                      enabled: false,
                      serverIds: [],
                      timeout: 30000,
                      autoApprove: []
                    }
                  });
                  setCreationResult(null);
                }}>
                  Create Another Agent
                </Button>
                <Button 
                  className="bg-gray-100 text-gray-800 border border-gray-300"
                  onClick={() => console.log('Navigate to agent dashboard')}
                >
                  View Agent Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Create New Agent</span>
          <span className="text-sm text-gray-500">Step {currentStep} of 4</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Integration Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">How to integrate MCP into your existing agent creation:</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Import the <code>MCPAgentCreationStep</code> component</li>
                <li>Add MCP config to your agent form state</li>
                <li>Include the MCP step in your creation workflow</li>
                <li>Save the MCP config with your agent data</li>
              </ol>
            </div>
            
            <div className="bg-gray-50 p-3 rounded text-sm">
              <strong>Code Example:</strong>
              <pre className="mt-2 text-xs overflow-x-auto">
{`// 1. Import the component
import MCPAgentCreationStep from './management/MCPAgentCreationStep';

// 2. Add to your state
const [mcpConfig, setMcpConfig] = useState({
  enabled: false,
  serverIds: [],
  timeout: 30000
});

// 3. Include in your workflow
<MCPAgentCreationStep
  agentData={agentData}
  mcpConfig={mcpConfig}
  onMCPConfigChange={setMcpConfig}
/>

// 4. Save with agent
const agentWithMCP = {
  ...agentData,
  mcpConfig
};`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentCreationWithMCP;