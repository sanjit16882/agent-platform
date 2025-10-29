import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { agentManagementService, ManagedAgent, PlatformMetrics } from '../services/agentManagementService';
import S3MigrationHelper from './S3MigrationHelper';

const AgentManagementSimple: React.FC = () => {
  const [managedAgents, setManagedAgents] = useState<ManagedAgent[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading agents from S3...');
      
      const [agents, metrics] = await Promise.all([
        agentManagementService.getAllManagedAgents(),
        agentManagementService.getPlatformMetrics()
      ]);
      
      console.log('✅ Loaded agents:', agents);
      console.log('✅ Platform metrics:', metrics);
      
      setManagedAgents(agents);
      setPlatformMetrics(metrics);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError('Failed to load agent data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter agents
  const filteredAgents = managedAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || agent.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'deploying': return 'warning';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'danger';
      case 'unknown': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Container style={{ maxWidth: '1400px', padding: '20px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Agent Management</h2>
          <p className="text-muted mb-0">Real-time agent monitoring</p>
        </div>
        <Button variant="outline-primary" onClick={loadData} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" className="me-2" /> : '🔄'} Refresh
        </Button>
      </div>

      {/* S3 Migration Helper */}
      <S3MigrationHelper />

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="Development">Development</option>
            <option value="Security">Security</option>
            <option value="QA">QA</option>
            <option value="FinOps">FinOps</option>
            <option value="Documentation">Documentation</option>
            <option value="Database">Database</option>
            <option value="Monitoring">Monitoring</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Platform Metrics */}
      {platformMetrics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{platformMetrics.totalAgents}</h3>
                <small>TOTAL AGENTS</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">{platformMetrics.deployedAgents}</h3>
                <small>DEPLOYED AGENTS</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info">{platformMetrics.healthyAgents}</h3>
                <small>HEALTHY AGENTS</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning">{platformMetrics.activeAlerts}</h3>
                <small>ACTIVE ALERTS</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Agent List */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Agents ({filteredAgents.length})</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="m-3">
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" />
              <div className="mt-2">Loading agents...</div>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center p-4">
              <div className="text-muted">No agents found</div>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Executions</th>
                  <th>Success Rate</th>
                  <th>Last Executed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.id}>
                    <td>
                      <div>
                        <strong>{agent.name}</strong>
                        <div className="small text-muted">{agent.description}</div>
                        <div className="small text-muted">ID: {agent.id}</div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="secondary">{agent.category}</Badge>
                    </td>
                    <td>
                      <Badge bg={getStatusColor(agent.status)}>
                        {agent.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div>
                        <Badge bg={getHealthColor(agent.health.status)} className="mb-1">
                          {agent.health.status.toUpperCase()}
                        </Badge>
                        <div className="small text-muted">
                          {agent.health.availability.toFixed(1)}% uptime
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{agent.metrics.totalExecutions.toLocaleString()}</strong>
                        <div className="small text-muted">total runs</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong className={agent.metrics.successRate >= 95 ? 'text-success' : agent.metrics.successRate >= 80 ? 'text-warning' : 'text-danger'}>
                          {agent.metrics.successRate.toFixed(1)}%
                        </strong>
                        <div className="small text-muted">
                          {agent.metrics.errorCount} errors
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        {agent.metrics.lastExecuted ? (
                          <>
                            <div>{new Date(agent.metrics.lastExecuted).toLocaleDateString()}</div>
                            <div className="text-muted">{new Date(agent.metrics.lastExecuted).toLocaleTimeString()}</div>
                          </>
                        ) : (
                          <span className="text-muted">Never</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => window.open(`/agents/${agent.id}/execute`, '_blank')}
                      >
                        Execute
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AgentManagementSimple;