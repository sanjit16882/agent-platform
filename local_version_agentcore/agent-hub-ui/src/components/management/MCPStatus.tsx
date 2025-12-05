/**
 * MCP Status Component
 * 
 * A compact component that shows the overall MCP system status.
 * Can be integrated into dashboards and navigation areas.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// Simple icons
const CheckCircle = () => <span className="text-green-500">✓</span>;
const XCircle = () => <span className="text-red-500">✗</span>;
const AlertTriangle = () => <span className="text-yellow-500">⚠</span>;
const Loader2 = ({ className }: { className?: string }) => (
  <span className={`inline-block animate-spin ${className}`}>⟳</span>
);
const Server = () => <span>🖥️</span>;
const Settings = () => <span>⚙️</span>;

interface MCPSystemStatus {
  mcpEnabled: boolean;
  serversConnected: number;
  serversTotal: number;
  fallbackAvailable: boolean;
  executionStats: {
    totalExecutions: number;
    mcpExecutions: number;
    standardExecutions: number;
    fallbackExecutions: number;
    mcpSuccessRate: number;
  };
}

interface MCPStatusProps {
  compact?: boolean;
  showDetails?: boolean;
  onManageClick?: () => void;
}

export const MCPStatus: React.FC<MCPStatusProps> = ({
  compact = false,
  showDetails = true,
  onManageClick
}) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MCPSystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/v1/mcp/status');
      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Failed to load MCP status');
      }
    } catch (error) {
      console.error('Failed to load MCP status:', error);
      setError('Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const getOverallStatus = () => {
    if (!status) return 'unknown';
    
    if (!status.mcpEnabled) return 'disabled';
    if (status.serversConnected === 0) return 'error';
    if (status.serversConnected < status.serversTotal) return 'degraded';
    return 'healthy';
  };

  const getStatusIcon = () => {
    const overallStatus = getOverallStatus();
    
    switch (overallStatus) {
      case 'healthy':
        return <CheckCircle />;
      case 'degraded':
        return <AlertTriangle />;
      case 'error':
        return <XCircle />;
      case 'disabled':
        return <span className="text-gray-400">○</span>;
      default:
        return <span className="text-gray-400">?</span>;
    }
  };

  const getStatusBadge = () => {
    const overallStatus = getOverallStatus();
    
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      disabled: 'bg-gray-100 text-gray-800',
      unknown: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      healthy: 'Healthy',
      degraded: 'Degraded',
      error: 'Error',
      disabled: 'Disabled',
      unknown: 'Unknown'
    };

    return (
      <Badge className={variants[overallStatus as keyof typeof variants]}>
        {labels[overallStatus as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusMessage = () => {
    if (!status) return 'Status unknown';
    
    const overallStatus = getOverallStatus();
    
    switch (overallStatus) {
      case 'healthy':
        return `All ${status.serversTotal} MCP servers connected`;
      case 'degraded':
        return `${status.serversConnected}/${status.serversTotal} MCP servers connected`;
      case 'error':
        return 'No MCP servers connected';
      case 'disabled':
        return 'MCP is disabled';
      default:
        return 'MCP status unknown';
    }
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-2' : ''}>
        <CardContent className={`flex items-center ${compact ? 'p-2' : 'p-4'}`}>
          <span className="mr-2"><Loader2 /></span>
          <span className="text-sm">Loading MCP status...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'p-2' : ''}>
        <CardContent className={`flex items-center ${compact ? 'p-2' : 'p-4'}`}>
          <XCircle />
          <span className="text-sm text-red-600 ml-2">MCP status error</span>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">MCP</span>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">MCP System</span>
                {getStatusBadge()}
              </div>
              <div className="text-sm text-gray-600">
                {getStatusMessage()}
              </div>
            </div>
          </div>
          
          {onManageClick && (
            <Button
              onClick={onManageClick}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-800 border border-gray-300"
            >
              <Settings />
              Manage
            </Button>
          )}
        </div>

        {showDetails && status && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Servers</div>
                <div className="font-medium">
                  {status.serversConnected}/{status.serversTotal} connected
                </div>
              </div>
              
              {status.executionStats.totalExecutions > 0 && (
                <div>
                  <div className="text-gray-600">MCP Usage</div>
                  <div className="font-medium">
                    {Math.round((status.executionStats.mcpExecutions / status.executionStats.totalExecutions) * 100)}%
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-gray-600">Fallback</div>
                <div className="font-medium">
                  {status.fallbackAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
              
              {status.executionStats.mcpExecutions > 0 && (
                <div>
                  <div className="text-gray-600">Success Rate</div>
                  <div className="font-medium">
                    {Math.round(status.executionStats.mcpSuccessRate)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCPStatus;