import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import { advancedAnalyticsService, BusinessMetrics, RealTimeSystemMetrics, AgentInsights, MarketIntelligence } from '../services/advancedAnalyticsService';
import { theme } from '../styles/theme';

const BusinessIntelligenceDashboard: React.FC = () => {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<RealTimeSystemMetrics | null>(null);
  const [agentInsights, setAgentInsights] = useState<AgentInsights[]>([]);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadAllMetrics();
    // Increased interval to 3 minutes to reduce backend load
    const interval = setInterval(loadAllMetrics, 180000); // Refresh every 3 minutes
    return () => clearInterval(interval);
  }, []);

  const loadAllMetrics = async () => {
    try {
      setLoading(true);
      const [business, system, insights, market] = await Promise.all([
        advancedAnalyticsService.getBusinessMetrics(),
        advancedAnalyticsService.getRealTimeSystemMetrics(),
        advancedAnalyticsService.getAgentInsights(),
        advancedAnalyticsService.getMarketIntelligence()
      ]);
      
      setBusinessMetrics(business);
      setSystemMetrics(system);
      setAgentInsights(insights);
      setMarketIntelligence(market);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
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

  if (loading && !businessMetrics) {
    return (
      <Container fluid style={{ padding: theme.spacing['3xl'] }}>
        <div style={{ textAlign: 'center', padding: theme.spacing['5xl'] }}>
          <div style={{ fontSize: theme.typography.fontSize.xl, color: theme.colors.textMuted }}>
            Loading Business Intelligence Dashboard...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid style={{ padding: theme.spacing['3xl'], backgroundColor: theme.colors.backgroundSecondary, minHeight: '100vh' }}>
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
            Business Intelligence Dashboard
          </h1>
          <p style={{ 
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary,
            margin: 0
          }}>
            Real-time insights, predictive analytics, and business intelligence
          </p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <Badge bg="success" style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg}` }}>
            Live Data
          </Badge>
          <small style={{ color: theme.colors.textMuted }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </small>
          <Button variant="outline-primary" size="sm" onClick={loadAllMetrics}>
            Refresh
          </Button>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')} className="mb-4">
        <Tab eventKey="overview" title="📊 Executive Overview">
          {/* Executive Summary Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card style={{ height: '100%', borderColor: theme.colors.success }}>
                <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                  <div style={{ 
                    fontSize: theme.typography.fontSize['3xl'],
                    color: theme.colors.success,
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatCurrency(businessMetrics?.totalRevenue || 0)}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.sm }}>
                    Revenue Impact
                  </div>
                  <Badge bg="success">
                    +{formatPercentage(businessMetrics?.revenueGrowth || 0)} Growth
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card style={{ height: '100%', borderColor: theme.colors.primary }}>
                <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                  <div style={{ 
                    fontSize: theme.typography.fontSize['3xl'],
                    color: theme.colors.primary,
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatPercentage(businessMetrics?.automationRate || 0)}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.sm }}>
                    Automation Rate
                  </div>
                  <Badge bg={getStatusBadge(businessMetrics?.automationRate || 0, { good: 70, warning: 50 })}>
                    {businessMetrics?.automationRate && businessMetrics.automationRate > 65 ? 'Above Industry' : 'Below Industry'}
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card style={{ height: '100%', borderColor: theme.colors.warning }}>
                <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                  <div style={{ 
                    fontSize: theme.typography.fontSize['3xl'],
                    color: theme.colors.warning,
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatCurrency(businessMetrics?.operationalSavings || 0)}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.sm }}>
                    Operational Savings
                  </div>
                  <Badge bg="warning">
                    Monthly
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
                    {businessMetrics?.timeToMarket.toFixed(0) || 0}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.sm }}>
                    Time to Market (Days)
                  </div>
                  <Badge bg="info">
                    {businessMetrics?.timeToMarket && businessMetrics.timeToMarket < 40 ? 'Fast' : 'Standard'}
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Key Performance Indicators */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 style={{ margin: 0 }}>🎯 Key Performance Indicators</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                      <span>Customer Satisfaction</span>
                      <span style={{ fontWeight: theme.typography.fontWeight.bold }}>
                        {formatPercentage(businessMetrics?.customerSatisfaction || 0)}
                      </span>
                    </div>
                    <ProgressBar 
                      now={businessMetrics?.customerSatisfaction || 0} 
                      variant={getStatusBadge(businessMetrics?.customerSatisfaction || 0, { good: 85, warning: 70 })}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                      <span>Defect Reduction</span>
                      <span style={{ fontWeight: theme.typography.fontWeight.bold }}>
                        {formatPercentage(businessMetrics?.defectReduction || 0)}
                      </span>
                    </div>
                    <ProgressBar 
                      now={businessMetrics?.defectReduction || 0} 
                      variant={getStatusBadge(businessMetrics?.defectReduction || 0, { good: 80, warning: 60 })}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                      <span>Resource Utilization</span>
                      <span style={{ fontWeight: theme.typography.fontWeight.bold }}>
                        {formatPercentage(businessMetrics?.resourceUtilization || 0)}
                      </span>
                    </div>
                    <ProgressBar 
                      now={businessMetrics?.resourceUtilization || 0} 
                      variant={getStatusBadge(businessMetrics?.resourceUtilization || 0, { good: 75, warning: 50 })}
                    />
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                      <span>User Adoption Rate</span>
                      <span style={{ fontWeight: theme.typography.fontWeight.bold }}>
                        {formatPercentage(businessMetrics?.adoptionRate || 0)}
                      </span>
                    </div>
                    <ProgressBar 
                      now={businessMetrics?.adoptionRate || 0} 
                      variant={getStatusBadge(businessMetrics?.adoptionRate || 0, { good: 70, warning: 50 })}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 style={{ margin: 0 }}>🏆 Market Position</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}>
                    <Badge 
                      bg={marketIntelligence?.competitivePosition === 'leading' ? 'success' : 
                          marketIntelligence?.competitivePosition === 'competitive' ? 'warning' : 'danger'}
                      style={{ fontSize: theme.typography.fontSize.lg, padding: theme.spacing.md }}
                    >
                      {marketIntelligence?.competitivePosition?.toUpperCase()} POSITION
                    </Badge>
                  </div>
                  
                  <h6>Industry Benchmarks vs Your Performance:</h6>
                  <div className="mb-2">
                    <small>Automation Rate: Industry {marketIntelligence?.industryBenchmarks.automationRate}% vs Your {formatPercentage(businessMetrics?.automationRate || 0)}</small>
                    <ProgressBar style={{ height: '8px' }}>
                      <ProgressBar 
                        variant="secondary" 
                        now={marketIntelligence?.industryBenchmarks.automationRate || 0} 
                        key={1} 
                      />
                      <ProgressBar 
                        variant="primary" 
                        now={(businessMetrics?.automationRate || 0) - (marketIntelligence?.industryBenchmarks.automationRate || 0)} 
                        key={2} 
                      />
                    </ProgressBar>
                  </div>
                  
                  <div className="mb-2">
                    <small>Time to Market: Industry {marketIntelligence?.industryBenchmarks.timeToMarket} days vs Your {businessMetrics?.timeToMarket.toFixed(0)} days</small>
                    <ProgressBar style={{ height: '8px' }}>
                      <ProgressBar 
                        variant="secondary" 
                        now={100 - (marketIntelligence?.industryBenchmarks.timeToMarket || 0)} 
                        key={1} 
                      />
                      <ProgressBar 
                        variant="success" 
                        now={100 - (businessMetrics?.timeToMarket || 0)} 
                        key={2} 
                      />
                    </ProgressBar>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="system" title="⚡ System Performance">
          <Row className="mb-4">
            <Col md={3}>
              <Card style={{ textAlign: 'center', borderColor: getStatusColor(100 - (systemMetrics?.cpuUtilization || 0), { good: 70, warning: 50 }) }}>
                <Card.Body>
                  <div style={{ 
                    fontSize: theme.typography.fontSize['2xl'],
                    color: getStatusColor(100 - (systemMetrics?.cpuUtilization || 0), { good: 70, warning: 50 }),
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatPercentage(systemMetrics?.cpuUtilization || 0)}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                    CPU Utilization
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card style={{ textAlign: 'center', borderColor: getStatusColor(100 - (systemMetrics?.memoryUsage || 0), { good: 60, warning: 40 }) }}>
                <Card.Body>
                  <div style={{ 
                    fontSize: theme.typography.fontSize['2xl'],
                    color: getStatusColor(100 - (systemMetrics?.memoryUsage || 0), { good: 60, warning: 40 }),
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatPercentage(systemMetrics?.memoryUsage || 0)}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                    Memory Usage
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card style={{ textAlign: 'center', borderColor: theme.colors.success }}>
                <Card.Body>
                  <div style={{ 
                    fontSize: theme.typography.fontSize['2xl'],
                    color: theme.colors.success,
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {formatPercentage(systemMetrics?.availability || 0)}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                    System Availability
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card style={{ textAlign: 'center', borderColor: theme.colors.info }}>
                <Card.Body>
                  <div style={{ 
                    fontSize: theme.typography.fontSize['2xl'],
                    color: theme.colors.info,
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: theme.spacing.sm
                  }}>
                    {(systemMetrics?.responseTime || 0).toFixed(0)}ms
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                    Avg Response Time
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* AWS Services Usage */}
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 style={{ margin: 0 }}>☁️ AWS Services Usage</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>S3 Requests</span>
                      <Badge bg="primary">{(systemMetrics?.s3RequestCount || 0).toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bedrock Invocations</span>
                      <Badge bg="warning">{(systemMetrics?.bedrockInvocations || 0).toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Lambda Executions</span>
                      <Badge bg="success">{(systemMetrics?.lambdaExecutions || 0).toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CloudWatch Alerts</span>
                      <Badge bg={systemMetrics?.cloudWatchAlerts === 0 ? 'success' : 'danger'}>
                        {systemMetrics?.cloudWatchAlerts || 0}
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 style={{ margin: 0 }}>📈 Performance Trends</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <span>Throughput: </span>
                    <strong>{(systemMetrics?.throughput || 0).toFixed(1)} executions/hour</strong>
                  </div>
                  <div className="mb-3">
                    <span>Error Rate: </span>
                    <Badge bg={getStatusBadge(100 - (systemMetrics?.errorRate || 0), { good: 95, warning: 90 })}>
                      {formatPercentage(systemMetrics?.errorRate || 0)}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <span>Network Latency: </span>
                    <strong>{(systemMetrics?.networkLatency || 0).toFixed(0)}ms</strong>
                  </div>
                  <div>
                    <span>Disk Usage: </span>
                    <strong>{formatPercentage(systemMetrics?.diskUsage || 0)}</strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="agents" title="🤖 Agent Intelligence">
          <Row>
            {agentInsights.slice(0, 6).map((agent, index) => (
              <Col md={6} lg={4} key={agent.agentId} className="mb-4">
                <Card style={{ height: '100%' }}>
                  <Card.Header>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h6 style={{ margin: 0 }}>{agent.name}</h6>
                      <Badge bg="secondary">{agent.category}</Badge>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <small>Executions: <strong>{agent.executionCount}</strong></small>
                    </div>
                    <div className="mb-2">
                      <small>Success Rate: </small>
                      <Badge bg={getStatusBadge(agent.successRate, { good: 90, warning: 80 })}>
                        {formatPercentage(agent.successRate)}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <small>Cost Savings: <strong>{formatCurrency(agent.costSavings)}</strong></small>
                    </div>
                    <div className="mb-2">
                      <small>Time Saved: <strong>{agent.timesSaved.toFixed(1)} hours</strong></small>
                    </div>
                    <div className="mb-3">
                      <small>Risk Score: </small>
                      <Badge bg={getStatusBadge(100 - agent.riskScore, { good: 80, warning: 60 })}>
                        {agent.riskScore.toFixed(0)}%
                      </Badge>
                    </div>
                    
                    {agent.optimizationOpportunities.length > 0 && (
                      <div>
                        <small><strong>Optimization Opportunities:</strong></small>
                        <ul style={{ fontSize: theme.typography.fontSize.xs, marginTop: theme.spacing.sm }}>
                          {agent.optimizationOpportunities.slice(0, 2).map((opp, i) => (
                            <li key={i}>{opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>

        <Tab eventKey="insights" title="💡 Strategic Insights">
          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 style={{ margin: 0 }}>🎯 Strategic Recommendations</h5>
                </Card.Header>
                <Card.Body>
                  {marketIntelligence?.recommendations.map((rec, index) => (
                    <Alert key={index} variant="info" className="mb-2">
                      <strong>Recommendation {index + 1}:</strong> {rec}
                    </Alert>
                  ))}
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h5 style={{ margin: 0 }}>📊 Market Trends</h5>
                </Card.Header>
                <Card.Body>
                  {marketIntelligence?.marketTrends.map((trend, index) => (
                    <div key={index} className="mb-2">
                      <Badge bg="outline-primary" style={{ marginRight: theme.spacing.sm }}>
                        Trend {index + 1}
                      </Badge>
                      {trend}
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 style={{ margin: 0 }}>🚀 Innovation Metrics</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>New Features</span>
                      <Badge bg="primary">{businessMetrics?.newFeatureVelocity || 0}/month</Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Experimentation Rate</span>
                      <Badge bg="warning">{formatPercentage(businessMetrics?.experimentationRate || 0)}</Badge>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Infrastructure Cost</span>
                      <Badge bg="danger">{formatCurrency(businessMetrics?.infrastructureCost || 0)}/month</Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h5 style={{ margin: 0 }}>⚡ Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="outline-primary" size="sm">
                      Export Business Report
                    </Button>
                    <Button variant="outline-success" size="sm">
                      Schedule Review Meeting
                    </Button>
                    <Button variant="outline-warning" size="sm">
                      Configure Alerts
                    </Button>
                    <Button variant="outline-info" size="sm" onClick={() => window.location.href = '/analytics'}>
                      View Real Analytics
                    </Button>
                    <Button variant="outline-warning" size="sm" onClick={() => window.location.href = '/finops'}>
                      View FinOps Dashboard
                    </Button>
                    {process.env.NODE_ENV === 'development' && (
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => {
                          import('../utils/analyticsTestData').then(({ generateTestExecutions }) => {
                            generateTestExecutions();
                            setTimeout(loadAllMetrics, 1000); // Refresh after 1 second
                          });
                        }}
                      >
                        Generate Test Data
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default BusinessIntelligenceDashboard;