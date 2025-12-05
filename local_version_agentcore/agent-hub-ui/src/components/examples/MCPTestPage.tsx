/**
 * MCP Test Page
 * 
 * Add this page to your UI to test MCP functionality.
 * You can access it at /mcp-test or integrate it into your existing pages.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import MCPStatus from '../management/MCPStatus';
import MCPServerManagement from '../management/MCPServerManagement';
import AgentCreationWithMCP from './AgentCreationWithMCP';

const MCPTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runMCPTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'MCP System Status',
        endpoint: '/api/v1/mcp/status',
        method: 'GET'
      },
      {
        name: 'MCP Servers List',
        endpoint: '/api/v1/mcp/servers',
        method: 'GET'
      },
      {
        name: 'Available MCP Servers',
        endpoint: '/api/v1/mcp/servers/available',
        method: 'GET'
      }
    ];

    for (const test of tests) {
      try {
        const response = await fetch(test.endpoint, {
          method: test.method,
          headers: {
            'X-API-Key': 'sk-agenthub-system-internal-frontend-key'
          }
        });
        
        const data = await response.json();
        
        setTestResults(prev => [...prev, {
          ...test,
          success: response.ok && data.success,
          status: response.status,
          data: data
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          ...test,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]);
      }
    }
    
    setIsRunningTests(false);
  };

  const tabs = [
    { id: 'overview', label: 'MCP Overview' },
    { id: 'test', label: 'API Tests' },
    { id: 'servers', label: 'Server Management' },
    { id: 'create', label: 'Create Agent with MCP' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>MCP System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <MCPStatus 
                  compact={false}
                  showDetails={true}
                  onManageClick={() => setActiveTab('servers')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What is MCP?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    Model Context Protocol (MCP) enhances your agents with additional tools and capabilities:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">🗄️ Database Access</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Query and analyze data in real-time
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">📁 File Operations</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Read, write, and analyze files and code
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900">🔧 Git Integration</h4>
                      <p className="text-sm text-purple-800 mt-1">
                        Access repository information and history
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900">🛡️ Zero Risk</h4>
                    <p className="text-sm text-yellow-800">
                      MCP is completely optional. Agents always fall back to standard execution if MCP fails.
                      Your existing agents continue to work exactly as before.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'test':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>MCP API Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={runMCPTests}
                    disabled={isRunningTests}
                  >
                    {isRunningTests ? 'Running Tests...' : 'Run MCP API Tests'}
                  </Button>

                  {testResults.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Test Results:</h4>
                      {testResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            result.success 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {result.success ? '✅' : '❌'} {result.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              {result.method} {result.endpoint}
                            </span>
                          </div>
                          
                          {result.success ? (
                            <div className="text-sm text-green-800 mt-1">
                              Status: {result.status} - {JSON.stringify(result.data, null, 2).substring(0, 100)}...
                            </div>
                          ) : (
                            <div className="text-sm text-red-800 mt-1">
                              Error: {result.error || 'Request failed'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'servers':
        return (
          <div className="space-y-6">
            <MCPServerManagement />
          </div>
        );

      case 'create':
        return (
          <div className="space-y-6">
            <AgentCreationWithMCP />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">MCP Integration Test Page</h1>
        <p className="text-gray-600">
          Test and explore MCP (Model Context Protocol) functionality
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Integration Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Add This to Your UI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">1. Add Route to Your App</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm mt-2">
{`// In your App.tsx or routing file
import MCPTestPage from './components/examples/MCPTestPage';

// Add route
<Route path="/mcp-test" element={<MCPTestPage />} />`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium">2. Add Navigation Link</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm mt-2">
{`// In your navigation component
<Link to="/mcp-test">MCP Test</Link>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium">3. Integrate Components into Existing Pages</h4>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Add <code>MCPStatus</code> to your dashboard</li>
                <li>• Add <code>MCPAgentCreationStep</code> to agent creation workflow</li>
                <li>• Add <code>MCPManagement</code> to agent detail pages</li>
                <li>• Add <code>MCPServerManagement</code> to admin settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPTestPage;