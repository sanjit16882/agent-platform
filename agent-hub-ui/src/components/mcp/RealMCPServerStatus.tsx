import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { realMCPService } from '../../services/realMCPService';

interface ServerStatus {
  id: string;
  name: string;
  url: string;
  status: 'running' | 'error' | 'stopped';
  message?: string;
}

export const RealMCPServerStatus: React.FC = () => {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const loadServerStatus = useCallback(async () => {
    try {
      const dockerServers = await realMCPService.getRealDockerServers();
      const serverStatus: ServerStatus[] = [];

      for (const server of dockerServers) {
        // Use the status already determined by getRealDockerServers
        const status = server.status === 'active' ? 'running' : 
                      server.status === 'inactive' ? 'stopped' : 'error';
        serverStatus.push({
          id: server.id,
          name: server.name,
          url: (server as any).url || '',
          status: status as 'running' | 'error' | 'stopped',
          message: server.status === 'inactive' ? 'Docker MCP server not running' : undefined
        });
      }

      setServers(serverStatus);
    } catch (error) {
      console.error('Failed to load server status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServerStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(loadServerStatus, 30000);
    return () => clearInterval(interval);
  }, [loadServerStatus]);

  const startDockerServers = async () => {
    setStarting(true);
    try {
      const result = await realMCPService.startDockerMCPServers();
      if (result.success) {
        // Wait a moment then refresh status
        setTimeout(loadServerStatus, 3000);
      }
    } catch (error) {
      console.error('Failed to start Docker servers:', error);
    } finally {
      setStarting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge bg="success">Running</Badge>;
      case 'error':
        return <Badge bg="danger">Error</Badge>;
      case 'stopped':
        return <Badge bg="secondary">Stopped</Badge>;
      default:
        return <Badge bg="warning">Unknown</Badge>;
    }
  };

  const allRunning = servers.every(s => s.status === 'running');
  const anyError = servers.some(s => s.status === 'error');

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Checking MCP server status...
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">🐳 Real MCP Server Status</h5>
        <div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={loadServerStatus}
            className="me-2"
          >
            🔄 Refresh
          </Button>
          {!allRunning && (
            <Button 
              variant="success" 
              size="sm" 
              onClick={startDockerServers}
              disabled={starting}
            >
              {starting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Starting...
                </>
              ) : (
                '▶️ Start Servers'
              )}
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {allRunning && (
          <Alert variant="success" className="mb-3">
            ✅ All MCP servers are running! Real functionality is available.
          </Alert>
        )}
        
        {anyError && (
          <Alert variant="warning" className="mb-3">
            ⚠️ Some MCP servers have issues. Check Docker containers are running.
            <br />
            <small>Run: <code>cd local_version && ./docker-mcp-servers/start-mcp-servers.bat</code></small>
          </Alert>
        )}

        <Row>
          {servers.map(server => (
            <Col md={6} key={server.id} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0">{server.name}</h6>
                    {getStatusBadge(server.status)}
                  </div>
                  <p className="text-muted small mb-2">
                    <code>{server.url}</code>
                  </p>
                  {server.message && (
                    <p className="text-danger small mb-0">
                      {server.message}
                    </p>
                  )}
                  {server.status === 'running' && (
                    <p className="text-success small mb-0">
                      ✅ Ready for real MCP operations
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Alert variant="info" className="mt-3">
          <strong>🔧 Real MCP Implementation:</strong>
          <ul className="mb-0 mt-2">
            <li><strong>Filesystem Server:</strong> Real file read/write operations</li>
            <li><strong>Database Server:</strong> Actual SQLite queries with persistence</li>
            <li><strong>Git Server:</strong> Real repository analysis and operations</li>
            <li><strong>Office365 Server:</strong> Ready for real API integration</li>
          </ul>
        </Alert>
      </Card.Body>
    </Card>
  );
};