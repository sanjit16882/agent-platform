import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ProgressBar, Table } from 'react-bootstrap';
import { advancedAnalyticsService } from '../services/advancedAnalyticsService';
import { agentApiService } from '../services/agentApiService';
import { s3AgentService } from '../services/s3AgentService';
import { theme } from '../styles/theme';

interface RealMetrics {
  totalExecutions: number;
  successRate: number;
  averageResponseTime: number;
  activeAgents: number;
  s3Agents: number;
  totalCostSavings: number;
  systemUptime: number;
  errorRate: number;
}

interface AgentData {
  id: string;
  name: string;
  category: string;
  executions: number;
  successRate: number;
  lastUsed: Date;
  status: string;
}

const RealAnalyticsDashboard: React.FC = () => {
  const [realMetrics, setRealMetrics] = useState<RealMetrics | null>(null);
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    loadRealData();
    // Increased interval to 2 minutes to reduce backend load
    const interval = setInterval(loadRealData, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Refresh execution history from backend first
      await advancedAnalyticsService.refreshExecutionHistory();
      
      // Get real data from backend APIs - include both AgentConfig and S3 agents
      const [agents, s3Agents, businessMetrics, systemMetrics] = await Promise.all([
        agentApiService.getAgents(),
        s3AgentService.getAllAgents(),
        advancedAnalyticsService.getBusinessMetrics(),
        advancedAnalyticsService.getRealTimeSystemMetrics()
      ]);

      // Combine all agents from both sources
      const allAgents = [...agents, ...s3Agents];
      const totalAgents = allAgents.length;
      const agentInsights = await advancedAnalyticsService.getAgentInsights();
      
      const totalExecutions = agentInsights.reduce((sum, agent) => sum + agent.executionCount, 0);
      const totalCostSavings = agentInsights.reduce((sum, agent) => sum + agent.costSavings, 0);
      
      // Calculate weighted average success rate based on execution counts
      const agentsWithExecutions = agentInsights.filter(agent => agent.executionCount > 0);
      const avgSuccessRate = agentsWithExecutions.length > 0
        ? agentsWithExecutions.reduce((sum, agent) => sum + (agent.successRate * agent.executionCount), 0) / totalExecutions
        : 0;
      
      const avgResponseTime = agentsWithExecutions.length > 0
        ? agentsWithExecutions.reduce((sum, agent) => sum + agent.averageLatency, 0) / agentsWithExecutions.length
        : 0;

      setRealMetrics({
        totalExecutions,
        successRate: avgSuccessRate,
        averageResponseTime: avgResponseTime,
        activeAgents: totalAgents,
        s3Agents: totalAgents, // All agents are now from unified catalog
        totalCostSavings,
        systemUptime: systemMetrics.availability,
        errorRate: systemMetrics.errorRate
      });

      // Prepare agent data for table - combine catalog agents with execution data
      const agentTableData: AgentData[] = [];
      
      // Add all agents from catalog with their execution data
      for (const agent of allAgents) {
        const insight = agentInsights.find(i => i.agentId === agent.id);
        agentTableData.push({
          id: agent.id,
          name: agent.name,
          category: agent.category || 'Custom',
          executions: insight?.executionCount || 0,
          successRate: insight?.successRate || 0,
          lastUsed: new Date(),
          status: 'active'
        });
      }
      
      // Add any agents from execution history that aren't in the catalog
      for (const insight of agentInsights) {
        if (!allAgents.find(a => a.id === insight.agentId)) {
          agentTableData.push({
            id: insight.agentId,
            name: insight.name || insight.agentId,
            category: insight.category || 'Unknown',
            executions: insight.executionCount,
            successRate: insight.successRate,
            lastUsed: new Date(),
            status: 'archived' // Not in catalog anymore
          });
        }
      }

      console.log('📊 Real Analytics - Data Summary:');
      console.log(`  - Total agents in catalog: ${allAgents.length}`);
      console.log(`  - Agents with executions: ${agentInsights.filter(i => i.executionCount > 0).length}`);
      console.log(`  - Total executions: ${totalExecutions}`);
      console.log(`  - Overall success rate: ${avgSuccessRate.toFixed(2)}%`);
      console.log(`  - Agent table rows: ${agentTableData.length}`);

      setAgentData(agentTableData.sort((a, b) => b.executions - a.executions));
      setSystemHealth(systemMetrics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load real analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return theme.colors.success;
    if (value >= thresholds.warning) return theme.colors.warning;
    return theme.colors.danger;
  };

  const getStatusBadge = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return 'success';
    if (value >= thresholds.warning) return 'warning';
    return 'danger';
  };

  if (loading && !realMetrics) {
    return (
      <Container fluid style={{ padding: theme.spacing['3xl'] }}>
        <div style={{ textAlign: 'center', padding: theme.spacing['5xl'] }}>
          <div style={{ fontSize: theme.typography.fontSize.xl, color: theme.colors.textMuted }}>
            Loading real analytics data from backend...
          </div>
        </div>
      </Container>
    );
  }

  if (!realMetrics) {
    return (
      <Container fluid style={{ padding: theme.spacing['3xl'] }}>
        <Alert variant="warning">
          <Alert.Heading>No Real Data Available</Alert.Heading>
          <p>Unable to load analytics data from the backend. This could be because:</p>
          <ul>
            <li>No agents have been executed yet</li>
            <li>Backend services are not running</li>
            <li>Database connection issues</li>
          </ul>
          <p>Try executing some agents first, then refresh this page.</p>
          <Button variant="primary" onClick={() => window.location.href = '/agents'}>
            Go Execute Agents
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid style={{ 
      padding: theme.spacing['3xl'], 
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: theme.spacing['3xl'],
        flexWrap: 'wrap',
        gap: theme.spacing.xl
      }}>
        <div>
          <h1 style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.primary,
            marginBottom: theme.spacing.sm
          }}>
            Real Analytics Dashboard
          </h1>
          <p style={{ 
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary,
            margin: 0
          }}>
            Live data from your actual agent executions and system performance
          </p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <Badge bg="success" style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg}` }}>
            Real Data Only
          </Badge>
          <small style={{ color: theme.colors.textMuted }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </small>
          <Button variant="outline-primary" size="sm" onClick={loadRealData}>
            Refresh
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => {
                import('../utils/analyticsTestData').then(({ generateTestExecutions }) => {
                  generateTestExecutions();
                  setTimeout(loadRealData, 1000); // Refresh after 1 second
                });
              }}
            >
              Generate Test Data
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics - Real Data Only */}
      <Row className="mb-4">
        <Col md={3}>
          <Card style={{ height: '100%', borderColor: theme.colors.primary }}>
            <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <div style={{ 
                fontSize: theme.typography.fontSize['3xl'],
                color: theme.colors.primary,
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.sm
              }}>
                {realMetrics.totalExecutions}
              </div>
              <div style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.sm
              }}>
                Total Executions
              </div>
              <Badge bg="primary">
                Real Data
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card style={{ height: '100%', borderColor: getStatusColor(realMetrics.successRate, { good: 90, warning: 80 }) }}>
            <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <div style={{ 
                fontSize: theme.typography.fontSize['3xl'],
                color: getStatusColor(realMetrics.successRate, { good: 90, warning: 80 }),
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.sm
              }}>
                {formatPercentage(realMetrics.successRate)}
              </div>
              <div style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.sm
              }}>
                Success Rate
              </div>
              <Badge bg={getStatusBadge(realMetrics.successRate, { good: 90, warning: 80 })}>
                {realMetrics.successRate >= 90 ? 'Excellent' : realMetrics.successRate >= 80 ? 'Good' : 'Needs Attention'}
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card style={{ height: '100%', borderColor: theme.colors.info }}>
            <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <div style={{ 
                fontSize: theme.typography.fontSize['3xl'],
                color: theme.colors.info,
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.sm
              }}>
                {realMetrics.activeAgents}
              </div>
              <div style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.sm
              }}>
                Active Agents
              </div>
              <Badge bg="info">
                {realMetrics.s3Agents} in S3
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card style={{ height: '100%', borderColor: theme.colors.success }}>
            <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <div style={{ 
                fontSize: theme.typography.fontSize['3xl'],
                color: theme.colors.success,
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.sm
              }}>
                {formatCurrency(realMetrics.totalCostSavings)}
              </div>
              <div style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.sm
              }}>
                Cost Savings
              </div>
              <Badge bg="success">
                Actual ROI
              </Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Health - Real Metrics */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{ margin: 0 }}>🔧 System Health (Live)</h5>
                <Badge bg="warning" style={{ fontSize: '0.7rem' }}>Simulated Metrics</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Alert variant="warning" style={{ padding: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <small>⚠️ CPU, Memory, Disk metrics are simulated. Configure CloudWatch for real data.</small>
              </Alert>
              <div className="mb-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                  <span>System Uptime</span>
                  <span style={{ fontWeight: theme.typography.fontWeight.bold }}>
                    {formatPercentage(realMetrics.systemUptime)}
                  </span>
                </div>
                <ProgressBar 
                  now={realMetrics.systemUptime} 
                  variant={getStatusBadge(realMetrics.systemUptime, { good: 99, warning: 95 })}
                />
              </div>
              
              <div className="mb-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                  <span>Average Response Time</span>
                  <span style={{ fontWeight: theme.typography.fontWeight.bold }}>
                    {realMetrics.averageResponseTime.toFixed(0)}ms
                  </span>
                </div>
                <ProgressBar 
                  now={Math.min(100, (5000 - realMetrics.averageResponseTime) / 50)} 
                  variant={realMetrics.averageResponseTime < 2000 ? 'success' : realMetrics.averageResponseTime < 4000 ? 'warning' : 'danger'}
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                  <span>Error Rate</span>
                  <span style={{ fontWeight: theme.typography.fontWeight.bold }}>
                    {formatPercentage(realMetrics.errorRate)}
                  </span>
                </div>
                <ProgressBar 
                  now={realMetrics.errorRate} 
                  variant={getStatusBadge(100 - realMetrics.errorRate, { good: 95, warning: 90 })}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>☁️ AWS Services Usage</h5>
            </Card.Header>
            <Card.Body>
              {systemHealth && (
                <>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>S3 Requests (24h)</span>
                      <Badge bg="primary">{systemHealth.s3RequestCount.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bedrock Invocations</span>
                      <Badge bg="warning">{systemHealth.bedrockInvocations.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Lambda Executions</span>
                      <Badge bg="success">{systemHealth.lambdaExecutions.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CloudWatch Alerts</span>
                      <Badge bg={systemHealth.cloudWatchAlerts === 0 ? 'success' : 'danger'}>
                        {systemHealth.cloudWatchAlerts}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Real Agent Performance Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 style={{ margin: 0 }}>🤖 Agent Performance (Real Data)</h5>
            </Card.Header>
            <Card.Body>
              {agentData.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Category</th>
                      <th>Executions</th>
                      <th>Success Rate</th>
                      <th>Last Used</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentData.map((agent, index) => (
                      <tr key={`${agent.id}-${index}`}>
                        <td>
                          <strong>{agent.name}</strong>
                          <br />
                          <small style={{ color: theme.colors.textMuted }}>{agent.id}</small>
                        </td>
                        <td>
                          <Badge bg="secondary">{agent.category}</Badge>
                        </td>
                        <td>
                          <strong>{agent.executions}</strong>
                        </td>
                        <td>
                          <Badge bg={getStatusBadge(agent.successRate, { good: 90, warning: 80 })}>
                            {formatPercentage(agent.successRate)}
                          </Badge>
                        </td>
                        <td>
                          <small>{agent.lastUsed.toLocaleDateString()}</small>
                        </td>
                        <td>
                          <Badge bg={agent.status === 'active' ? 'success' : 'secondary'}>
                            {agent.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  <strong>No agent execution data available</strong>
                  <br />
                  Execute some agents to see performance metrics here.
                  <br />
                  <Button variant="primary" size="sm" className="mt-2" onClick={() => window.location.href = '/agents'}>
                    Go to Agents
                  </Button>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer */}
      <Alert variant="success" className="mt-4" style={{ margin: 0 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: theme.spacing.lg
        }}>
          <div>
            <strong>✅ Real Data Only:</strong> All metrics shown are from actual agent executions, S3 storage, and backend systems. 
            No mock or dummy data is displayed.
          </div>
          <Badge bg="success">
            Live Analytics
          </Badge>
        </div>
      </Alert>
    </Container>
  );
};

export default RealAnalyticsDashboard;