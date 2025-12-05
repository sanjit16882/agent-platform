/**
 * MCP Server Management Component
 * 
 * This component provides system-level management of MCP servers.
 * It allows administrators to add, configure, and monitor MCP servers.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input, Textarea } from '../ui/Input';
import { Alert } from '../ui/Alert';

// Simple components
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

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
  </label>
);

// Simple icons
const CheckCircle = () => <span className="text-green-500">✓</span>;
const XCircle = () => <span className="text-red-500">✗</span>;
const AlertTriangle = () => <span className="text-yellow-500">⚠</span>;
const Loader2 = ({ className }: { className?: string }) => (
  <span className={`inline-block animate-spin ${className}`}>⟳</span>
);
const Server = () => <span>🖥️</span>;
const Plus = () => <span>➕</span>;
const Edit = () => <span>✏️</span>;
const Trash2 = () => <span>🗑️</span>;
const TestTube = () => <span>🧪</span>;
const Settings = () => <span>⚙️</span>;

interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  toolsCount?: number;
  capabilities?: string[];
  lastConnected?: string;
  errorMessage?: string;
}

interface MCPServerForm {
  id: string;
  name: string;
  command: string;
  args: string;
  env: string;
  disabled: boolean;
  timeout: number;
  retryAttempts: number;
  autoApprove: string;
}

export const MCPServerManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<MCPServerForm>({
    id: '',
    name: '',
    command: 'uvx',
    args: '',
    env: '',
    disabled: false,
    timeout: 30000,
    retryAttempts: 3,
    autoApprove: ''
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/mcp/servers');
      const data = await response.json();

      if (data.success) {
        setServers(data.servers);
      } else {
        setError(data.error || 'Failed to load servers');
      }
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
      setError('Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      command: 'uvx',
      args: '',
      env: '',
      disabled: false,
      timeout: 30000,
      retryAttempts: 3,
      autoApprove: ''
    });
    setShowAddForm(false);
    setEditingServer(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serverConfig = {
        id: formData.id,
        name: formData.name,
        command: formData.command,
        args: formData.args.split(' ').filter(arg => arg.trim()),
        env: formData.env ? JSON.parse(formData.env) : {},
        disabled: formData.disabled,
        timeout: formData.timeout,
        retryAttempts: formData.retryAttempts,
        autoApprove: formData.autoApprove.split(',').map(s => s.trim()).filter(s => s)
      };

      const url = editingServer 
        ? `/api/v1/mcp/servers/${editingServer}`
        : '/api/v1/mcp/servers';
      
      const method = editingServer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverConfig),
      });

      const data = await response.json();

      if (data.success) {
        await loadServers();
        resetForm();
      } else {
        setError(data.error || 'Failed to save server');
      }
    } catch (error) {
      console.error('Failed to save server:', error);
      setError('Failed to save server configuration');
    }
  };

  const handleEdit = (server: MCPServer) => {
    setFormData({
      id: server.id,
      name: server.name,
      command: server.command,
      args: server.args.join(' '),
      env: server.env ? JSON.stringify(server.env, null, 2) : '',
      disabled: server.disabled || false,
      timeout: 30000,
      retryAttempts: 3,
      autoApprove: ''
    });
    setEditingServer(server.id);
    setShowAddForm(true);
  };

  const handleDelete = async (serverId: string) => {
    try {
      const response = await fetch(`/api/v1/mcp/servers/${serverId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadServers();
        setDeleteConfirm(null);
      } else {
        setError(data.error || 'Failed to delete server');
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
      setError('Failed to delete server');
    }
  };

  const handleTest = async (serverId: string) => {
    try {
      setTestingServer(serverId);
      
      const response = await fetch(`/api/v1/mcp/servers/${serverId}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      
      // Update server status in the list
      setServers(prev => prev.map(server => 
        server.id === serverId 
          ? { ...server, status: data.success ? 'connected' : 'error' }
          : server
      ));

      if (!data.success) {
        setError(`Test failed for ${serverId}: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to test server:', error);
      setError('Failed to test server connection');
    } finally {
      setTestingServer(null);
    }
  };

  const getStatusIcon = (status: string) => {
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

  const getStatusBadge = (status: string) => {
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
          Loading MCP servers...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server />
              MCP Server Management
            </CardTitle>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus />
              Add Server
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="critical" className="mb-4">
              <div className="flex items-center">
                <AlertTriangle />
                <span className="ml-2 text-red-800">{error}</span>
              </div>
            </Alert>
          )}

          {/* Server List */}
          <div className="space-y-4">
            {servers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No MCP servers configured. Add your first server to get started.
              </div>
            ) : (
              servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(server.status)}
                    <div>
                      <div className="font-medium">{server.name}</div>
                      <div className="text-sm text-gray-600">
                        {server.command} {server.args.join(' ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {server.toolsCount ? `${server.toolsCount} tools` : 'No tools info'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(server.status)}
                    
                    <Button
                      onClick={() => handleTest(server.id)}
                      disabled={testingServer === server.id}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-800 border border-gray-300 mr-2"
                    >
                      {testingServer === server.id ? <Loader2 /> : <TestTube />}
                      Test
                    </Button>
                    
                    <Button
                      onClick={() => handleEdit(server)}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-800 border border-gray-300 mr-2"
                    >
                      <Edit />
                      Edit
                    </Button>
                    
                    <Button
                      onClick={() => setDeleteConfirm(server.id)}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-600 border border-red-300"
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Server Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings />
              {editingServer ? 'Edit MCP Server' : 'Add MCP Server'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">Server ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g., filesystem, database, git"
                    required
                    disabled={!!editingServer}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., File System Server"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="command">Command</Label>
                  <Input
                    id="command"
                    value={formData.command}
                    onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                    placeholder="e.g., uvx, node, python"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="args">Arguments</Label>
                  <Input
                    id="args"
                    value={formData.args}
                    onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
                    placeholder="e.g., mcp-server-filesystem ."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="env">Environment Variables (JSON)</Label>
                <Textarea
                  id="env"
                  value={formData.env}
                  onChange={(e) => setFormData(prev => ({ ...prev, env: e.target.value }))}
                  placeholder='{"FILESYSTEM_ROOT": "/path/to/root"}'
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="autoApprove">Auto-Approve Tools (comma-separated)</Label>
                <Input
                  id="autoApprove"
                  value={formData.autoApprove}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoApprove: e.target.value }))}
                  placeholder="read_file, list_directory, execute_query"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.disabled}
                  onCheckedChange={(disabled) => setFormData(prev => ({ ...prev, disabled }))}
                />
                <Label>Disabled (server will not be started)</Label>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button type="submit" className="flex items-center gap-2">
                  {editingServer ? 'Update Server' : 'Add Server'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the MCP server "{deleteConfirm}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete Server
              </Button>
              <Button
                onClick={() => setDeleteConfirm(null)}
                className="bg-gray-100 text-gray-800 border border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPServerManagement;