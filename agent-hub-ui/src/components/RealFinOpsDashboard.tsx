import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import { advancedAnalyticsService } from '../services/advancedAnalyticsService';
import { agentApiService } from '../services/agentApiService';
import { s3AgentService } from '../services/s3AgentService';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { useDashboardRefresh } from '../hooks/useDashboardRefresh';
import { theme } from '../styles/theme';

interface RealCostData {
  service: string;
  provider: string;
  currentCost: number;
  projectedMonthlyCost: number;
  costSavings: number;
  trend: 'up' | 'down' | 'stable';
  usage: number;
  unit: string;
  description: string;
}

interface RealBudgetAlert {
  service: string;
  currentSpend: number;
  budgetLimit: number;
  percentage: number;
  severity: 'info' | 'warning' | 'critical';
  recommendation: string;
}

interface ROIMetrics {
  totalInvestment: number;
  totalSavings: number;
  netROI: number;
  roiPercentage: number;
  paybackPeriod: number;
  automationHours: number;
}

const RealFinOpsDashboard: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [costData, setCostData] = useState<RealCostData[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<RealBudgetAlert[]>([]);
  const [roiMetrics, setROIMetrics] = useState<ROIMetrics | null>(null);
  const [modelBreakdown, setModelBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadRealFinOpsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use centralized data service to prevent excessive requests
      const { dashboardDataService, dataFetchers, CACHE_DURATIONS } = await import('../services/dashboardDataService');
      
      // Get real AWS cost data with caching and throttling
      let finOpsData = null;
      try {
        finOpsData = await dashboardDataService.getData(
          'finops-dashboard',
          dataFetchers.finOpsData,
          CACHE_DURATIONS.FINOPS_DATA
        );
        
        if (!finOpsData.success) {
          throw new Error(finOpsData.error || 'Failed to fetch FinOps data');
        }
      } catch (fetchError) {
        console.warn('Failed to fetch real AWS costs, using fallback data:', fetchError);
        // Use fallback data when backend is not available
        finOpsData = {
          success: true,
          data: {
            message: 'Backend not available - showing zero costs',
            totalCost: 0,
            budgetUtilization: 0,
            activeAlerts: 0,
            serviceBreakdown: {
              bedrock: 0,
              s3: 0,
              lambda: 0,
              compute: 0
            },
            dailyCosts: [],
            projectedMonthlyCost: 0,
            lastUpdated: new Date().toISOString()
          }
        };
      }
      
      // Get additional data from services
      const [agents, s3Agents, businessMetrics, systemMetrics, agentInsights] = await Promise.all([
        agentApiService.getAgents(),
        s3AgentService.getAllAgents(),
        advancedAnalyticsService.getBusinessMetrics(),
        advancedAnalyticsService.getRealTimeSystemMetrics(),
        advancedAnalyticsService.getAgentInsights()
      ]);

      // Use real AWS cost data from backend
      const realAWSCosts = finOpsData.data;
      console.log('🔍 FinOps Dashboard - Real AWS Costs:', realAWSCosts);
      const totalExecutions = agentInsights.reduce((sum, agent) => sum + agent.executionCount, 0);
      const totalCostSavings = agentInsights.reduce((sum, agent) => sum + agent.costSavings, 0);

      // Real cost breakdown from actual AWS usage
      const services = realAWSCosts.services || [];
      console.log('🔍 FinOps Dashboard - Services:', services);
      const realCosts: RealCostData[] = services.map((service: any) => ({
        service: service.name,
        provider: service.provider,
        currentCost: service.monthlyCost || 0,
        projectedMonthlyCost: service.monthlyProjection || 0,
        costSavings: service.costSavings || 0,
        trend: service.trend || 'stable',
        usage: service.usage || 0,
        unit: service.usage?.includes('API') ? 'API Calls' : 
              service.usage?.includes('Agents') ? 'Active Agents' :
              service.usage?.includes('Executions') ? 'Executions' :
              service.usage?.includes('CPU') ? '% CPU' : 'Units',
        description: service.description || `Real ${service.name} costs from AWS`
      }));

      // Calculate budget alerts based on real AWS usage
      const budgetLimits = {
        'AWS Bedrock (AI)': 500, // $500 monthly budget
        'AWS S3 Storage': 50,    // $50 monthly budget
        'AWS Lambda': 100,       // $100 monthly budget
        'Compute Resources': 300  // $300 monthly budget
      };

      // Use real budget utilization from AWS
      const realBudgetUtilization = realAWSCosts.budgetUtilization || 0;

      const alerts: RealBudgetAlert[] = realCosts
        .map(cost => {
          const budgetLimit = budgetLimits[cost.service as keyof typeof budgetLimits] || 100;
          const percentage = (cost.projectedMonthlyCost / budgetLimit) * 100;
          
          let severity: 'info' | 'warning' | 'critical' = 'info';
          let recommendation = 'Usage is within normal limits';
          
          if (percentage > 100) {
            severity = 'critical';
            recommendation = 'Immediate action required - budget exceeded';
          } else if (percentage > 80) {
            severity = 'warning';
            recommendation = 'Monitor closely - approaching budget limit';
          } else if (percentage > 60) {
            severity = 'info';
            recommendation = 'Consider optimization opportunities';
          }

          return {
            service: cost.service,
            currentSpend: cost.projectedMonthlyCost,
            budgetLimit,
            percentage,
            severity,
            recommendation
          };
        })
        .filter(alert => alert.percentage > 50); // Only show alerts above 50% usage

      // Calculate real ROI metrics using actual AWS costs
      const totalRealCost = realAWSCosts.totalCost || 0;
      const projectedMonthlyCost = realAWSCosts.projectedMonthlyCost || 0;
      
      // Calculate monthly savings rate (total savings / 12 months)
      const monthlySavings = totalCostSavings / 12;
      
      const roi: ROIMetrics = {
        totalInvestment: projectedMonthlyCost,
        totalSavings: totalCostSavings,
        netROI: totalCostSavings - projectedMonthlyCost,
        roiPercentage: projectedMonthlyCost > 0 ? 
          ((totalCostSavings - projectedMonthlyCost) / projectedMonthlyCost) * 100 : 0,
        paybackPeriod: monthlySavings > 0 ? 
          (projectedMonthlyCost / monthlySavings) : 0, // months - only calculate if there are savings
        automationHours: totalExecutions * 2.5 // Estimate 2.5 hours saved per execution
      };

      console.log('💰 FinOps Dashboard - Setting cost data:', realCosts);
      console.log('💰 FinOps Dashboard - Cost data length:', realCosts.length);
      setCostData(realCosts);
      setBudgetAlerts(alerts);
      setROIMetrics(roi);
      setModelBreakdown(realAWSCosts.modelBreakdown || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load real FinOps data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use the dashboard refresh hook with 5-minute intervals
  const { manualRefresh } = useDashboardRefresh({
    refreshInterval: 300000, // 5 minutes
    enabled: true,
    onRefresh: loadRealFinOpsData
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <span style={{ color: theme.colors.danger }}>📈</span>;
      case 'down': return <span style={{ color: theme.colors.success }}>📉</span>;
      case 'stable': return <span style={{ color: theme.colors.info }}>➡️</span>;
      default: return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge bg="danger">Critical</Badge>;
      case 'warning': return <Badge bg="warning">Warning</Badge>;
      case 'info': return <Badge bg="info">Info</Badge>;
      default: return <Badge bg="secondary">{severity}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalCurrentCost = costData.reduce((sum, item) => sum + item.currentCost, 0);
  const totalProjectedCost = costData.reduce((sum, item) => sum + item.projectedMonthlyCost, 0);
  const totalSavings = costData.reduce((sum, item) => sum + item.costSavings, 0);

  if (loading && !costData.length) {
    return (
      <div style={{ 
        padding: theme.spacing['3xl'], 
        backgroundColor: theme.colors.backgroundSecondary,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ 
            marginTop: theme.spacing.lg,
            color: theme.colors.textSecondary
          }}>
            Loading real FinOps data from AWS services...
          </p>
        </div>
      </div>
    );
  }

  if (!costData.length) {
    return (
      <Container fluid style={{ padding: theme.spacing['3xl'] }}>
        <Alert variant="warning">
          <Alert.Heading>No Financial Data Available</Alert.Heading>
          <p>Unable to load FinOps data. This could be because:</p>
          <ul>
            <li>No agents have been executed yet (no AWS usage to track)</li>
            <li>Backend services are not running</li>
            <li>AWS cost tracking is not configured</li>
          </ul>
          <p>Execute some agents to generate real AWS usage and cost data.</p>
          <Button variant="primary" onClick={() => window.location.href = '/agents'}>
            Go Execute Agents
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <PermissionGuard permission={['cost.view', 'cost.manage', 'finops.access']} requireAll={false}>
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
              Real FinOps Dashboard
            </h1>
            <p style={{ 
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary,
              margin: 0
            }}>
              Live financial operations data from actual AWS usage and cost optimization
            </p>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
            <Badge bg="success" style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg}` }}>
              Real AWS Costs
            </Badge>
            <small style={{ color: theme.colors.textMuted }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </small>
            <Button variant="outline-primary" size="sm" onClick={manualRefresh}>
              Refresh
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  import('../utils/analyticsTestData').then(({ generateTestExecutions }) => {
                    generateTestExecutions();
                    setTimeout(loadRealFinOpsData, 1000); // Refresh after 1 second
                  });
                }}
              >
                Generate Test Data
              </Button>
            )}
          </div>
        </div>

        {/* Data Source Information Alert */}
        <Alert variant="info" style={{ marginBottom: theme.spacing.xl }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
            <div>
              <strong>Data Source: AWS Cost Explorer API</strong>
              <br />
              <small>
                Cost data is fetched directly from AWS Cost Explorer. Please note that Cost Explorer data typically has a 24-48 hour delay 
                compared to the AWS Billing Console. Recent charges may not appear immediately.
              </small>
            </div>
          </div>
        </Alert>

        <Tabs defaultActiveKey="overview" className="mb-4">
          <Tab eventKey="overview" title="💰 Cost Overview">
            {/* Cost Summary Cards */}
            <Row className="mb-4">
              <Col md={3}>
                <Card style={{ height: '100%', borderColor: theme.colors.primary }}>
                  <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize['2xl'],
                      color: theme.colors.primary,
                      fontWeight: theme.typography.fontWeight.bold,
                      marginBottom: theme.spacing.sm
                    }}>
                      {formatCurrency(totalCurrentCost)}
                    </div>
                    <div style={{ 
                      color: theme.colors.textMuted,
                      fontSize: theme.typography.fontSize.sm,
                      marginBottom: theme.spacing.sm
                    }}>
                      Daily AWS Costs
                    </div>
                    <Badge bg="primary">
                      Real Usage
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={3}>
                <Card style={{ height: '100%', borderColor: theme.colors.warning }}>
                  <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize['2xl'],
                      color: theme.colors.warning,
                      fontWeight: theme.typography.fontWeight.bold,
                      marginBottom: theme.spacing.sm
                    }}>
                      {formatCurrency(totalProjectedCost)}
                    </div>
                    <div style={{ 
                      color: theme.colors.textMuted,
                      fontSize: theme.typography.fontSize.sm,
                      marginBottom: theme.spacing.sm
                    }}>
                      Projected Monthly
                    </div>
                    <Badge bg="warning">
                      Forecast
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={3}>
                <Card style={{ height: '100%', borderColor: theme.colors.success }}>
                  <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize['2xl'],
                      color: theme.colors.success,
                      fontWeight: theme.typography.fontWeight.bold,
                      marginBottom: theme.spacing.sm
                    }}>
                      {formatCurrency(totalSavings)}
                    </div>
                    <div style={{ 
                      color: theme.colors.textMuted,
                      fontSize: theme.typography.fontSize.sm,
                      marginBottom: theme.spacing.sm
                    }}>
                      Cost Savings Generated
                    </div>
                    <Badge bg="success">
                      Actual ROI
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={3}>
                <Card style={{ height: '100%', borderColor: theme.colors.info }}>
                  <Card.Body style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize['2xl'],
                      color: theme.colors.info,
                      fontWeight: theme.typography.fontWeight.bold,
                      marginBottom: theme.spacing.sm
                    }}>
                      {roiMetrics ? `${roiMetrics.roiPercentage.toFixed(0)}%` : '0%'}
                    </div>
                    <div style={{ 
                      color: theme.colors.textMuted,
                      fontSize: theme.typography.fontSize.sm,
                      marginBottom: theme.spacing.sm
                    }}>
                      ROI Percentage
                    </div>
                    <Badge bg="info">
                      {roiMetrics && roiMetrics.roiPercentage > 100 ? 'Profitable' : 'Growing'}
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Detailed Cost Breakdown */}
            <Row>
              <Col>
                <Card>
                  <Card.Header>
                    <h5 style={{ margin: 0 }}>💳 AWS Service Costs (Real Data)</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Provider</th>
                          <th>Daily Cost</th>
                          <th>Monthly Projection</th>
                          <th>Cost Savings</th>
                          <th>Usage</th>
                          <th>Trend</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costData.map((cost, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{cost.service}</strong>
                            </td>
                            <td>
                              <Badge bg="primary">{cost.provider}</Badge>
                            </td>
                            <td>
                              <strong style={{ color: theme.colors.primary }}>
                                {formatCurrency(cost.currentCost)}
                              </strong>
                            </td>
                            <td>
                              <strong style={{ color: theme.colors.warning }}>
                                {formatCurrency(cost.projectedMonthlyCost)}
                              </strong>
                            </td>
                            <td>
                              <strong style={{ color: theme.colors.success }}>
                                {formatCurrency(cost.costSavings)}
                              </strong>
                            </td>
                            <td>
                              <Badge bg="secondary">
                                {cost.usage.toLocaleString()} {cost.unit}
                              </Badge>
                            </td>
                            <td>
                              {getTrendIcon(cost.trend)}
                            </td>
                            <td>
                              <small style={{ color: theme.colors.textMuted }}>
                                {cost.description}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="budgets" title="📊 Budget Alerts">
            <Row>
              <Col>
                <Card>
                  <Card.Header>
                    <h5 style={{ margin: 0 }}>🚨 Budget Monitoring (Real Usage)</h5>
                  </Card.Header>
                  <Card.Body>
                    {budgetAlerts.length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Current Spend</th>
                            <th>Budget Limit</th>
                            <th>Usage %</th>
                            <th>Status</th>
                            <th>Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgetAlerts.map((alert, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{alert.service}</strong>
                              </td>
                              <td>
                                {formatCurrency(alert.currentSpend)}
                              </td>
                              <td>
                                {formatCurrency(alert.budgetLimit)}
                              </td>
                              <td>
                                <div style={{ width: '100px' }}>
                                  <ProgressBar 
                                    now={Math.min(100, alert.percentage)} 
                                    variant={alert.severity === 'critical' ? 'danger' : 
                                            alert.severity === 'warning' ? 'warning' : 'info'}
                                    label={`${alert.percentage.toFixed(0)}%`}
                                  />
                                </div>
                              </td>
                              <td>
                                {getSeverityBadge(alert.severity)}
                              </td>
                              <td>
                                <small style={{ color: theme.colors.textMuted }}>
                                  {alert.recommendation}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Alert variant="success">
                        <strong>✅ All budgets are within limits</strong>
                        <br />
                        No budget alerts at this time. All AWS services are operating within their allocated budgets.
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="roi" title="📈 ROI Analysis">
            {roiMetrics && (
              <Row>
                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 style={{ margin: 0 }}>💰 Return on Investment</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Investment:</span>
                          <strong>{formatCurrency(roiMetrics.totalInvestment)}</strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Savings:</span>
                          <strong style={{ color: theme.colors.success }}>
                            {formatCurrency(roiMetrics.totalSavings)}
                          </strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Net ROI:</span>
                          <strong style={{ color: roiMetrics.netROI > 0 ? theme.colors.success : theme.colors.danger }}>
                            {formatCurrency(roiMetrics.netROI)}
                          </strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ROI Percentage:</span>
                          <strong style={{ color: roiMetrics.roiPercentage > 0 ? theme.colors.success : theme.colors.danger }}>
                            {roiMetrics.roiPercentage.toFixed(1)}%
                          </strong>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Payback Period:</span>
                          <strong>
                            {roiMetrics.paybackPeriod > 0 && isFinite(roiMetrics.paybackPeriod)
                              ? `${roiMetrics.paybackPeriod.toFixed(1)} months`
                              : 'N/A (no savings yet)'}
                          </strong>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 style={{ margin: 0 }}>⏱️ Automation Impact</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Hours Automated:</span>
                          <strong>{roiMetrics.automationHours.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Cost per Hour Saved:</span>
                          <strong>
                            {roiMetrics.automationHours > 0 ? 
                              formatCurrency(roiMetrics.totalSavings / roiMetrics.automationHours) : 
                              '$0.00'
                            }
                          </strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Monthly Savings Rate:</span>
                          <strong style={{ color: theme.colors.success }}>
                            {formatCurrency(roiMetrics.totalSavings / 12)}
                          </strong>
                        </div>
                      </div>
                      <Alert variant="info" className="mt-3">
                        <small>
                          <strong>Calculation:</strong> Based on actual agent executions and estimated 
                          time savings of 2.5 hours per execution.
                        </small>
                      </Alert>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>

          <Tab eventKey="models" title="🤖 Model Breakdown">
            <Row>
              <Col>
                <Card>
                  <Card.Header>
                    <h5 style={{ margin: 0 }}>🤖 AI Model Usage & Costs</h5>
                  </Card.Header>
                  <Card.Body>
                    {modelBreakdown && modelBreakdown.length > 0 ? (
                      <>
                        {modelBreakdown.map((model: any, index: number) => (
                          <div key={index} className="mb-4">
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: theme.spacing.md,
                              padding: theme.spacing.md,
                              backgroundColor: '#f8fafc',
                              borderRadius: theme.borderRadius.md,
                              border: '1px solid #e2e8f0'
                            }}>
                              <div>
                                <h6 style={{ margin: 0, color: theme.colors.primary }}>
                                  {model.modelName}
                                </h6>
                                <small style={{ color: theme.colors.textMuted }}>
                                  {model.modelId}
                                </small>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ 
                                  fontSize: theme.typography.fontSize.lg,
                                  fontWeight: theme.typography.fontWeight.bold,
                                  color: theme.colors.success
                                }}>
                                  {formatCurrency(model.cost)}
                                </div>
                                <small style={{ color: theme.colors.textMuted }}>
                                  {model.executionCount} executions
                                </small>
                              </div>
                            </div>

                            <Row className="mb-3">
                              <Col md={3}>
                                <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                                  <div style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                    {model.totalTokens.toLocaleString()}
                                  </div>
                                  <small style={{ color: theme.colors.textMuted }}>Total Tokens</small>
                                </div>
                              </Col>
                              <Col md={3}>
                                <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                                  <div style={{ fontWeight: 'bold', color: theme.colors.info }}>
                                    {model.inputTokens.toLocaleString()}
                                  </div>
                                  <small style={{ color: theme.colors.textMuted }}>Input Tokens</small>
                                </div>
                              </Col>
                              <Col md={3}>
                                <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                                  <div style={{ fontWeight: 'bold', color: theme.colors.warning }}>
                                    {model.outputTokens.toLocaleString()}
                                  </div>
                                  <small style={{ color: theme.colors.textMuted }}>Output Tokens</small>
                                </div>
                              </Col>
                              <Col md={3}>
                                <div style={{ textAlign: 'center', padding: theme.spacing.sm }}>
                                  <div style={{ fontWeight: 'bold', color: theme.colors.success }}>
                                    {formatCurrency(model.avgCostPerExecution)}
                                  </div>
                                  <small style={{ color: theme.colors.textMuted }}>Avg Cost/Exec</small>
                                </div>
                              </Col>
                            </Row>

                            {model.agents && model.agents.length > 0 && (
                              <div>
                                <h6 style={{ marginBottom: theme.spacing.sm }}>Agents Using This Model:</h6>
                                <Table size="sm" responsive>
                                  <thead>
                                    <tr>
                                      <th>Agent</th>
                                      <th>Executions</th>
                                      <th>Cost</th>
                                      <th>Tokens</th>
                                      <th>Avg Cost/Exec</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {model.agents.map((agent: any, agentIndex: number) => (
                                      <tr key={agentIndex}>
                                        <td>
                                          <strong>{agent.agentName}</strong>
                                          <br />
                                          <small style={{ color: theme.colors.textMuted }}>
                                            {agent.agentId}
                                          </small>
                                        </td>
                                        <td>
                                          <Badge bg="secondary">
                                            {agent.executionCount}
                                          </Badge>
                                        </td>
                                        <td>
                                          <strong style={{ color: theme.colors.success }}>
                                            {formatCurrency(agent.cost)}
                                          </strong>
                                        </td>
                                        <td>
                                          {agent.tokens.toLocaleString()}
                                        </td>
                                        <td>
                                          {formatCurrency(agent.executionCount > 0 ? agent.cost / agent.executionCount : 0)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <Alert variant="info">
                        <strong>📊 No Model Usage Data</strong>
                        <br />
                        No AI model usage detected yet. Execute some agents to see model-specific cost breakdown.
                        <br />
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.location.href = '/agents'}
                        >
                          Execute Agents
                        </Button>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>

        {/* Footer */}
        <Alert variant={totalCurrentCost > 0 ? "success" : "info"} className="mt-4" style={{ margin: 0 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.lg
          }}>
            <div>
              {totalCurrentCost > 0 ? (
                <>
                  <strong>✅ Real Financial Data:</strong> All costs and savings are calculated from actual AWS usage, 
                  agent executions, and system performance. No simulated or dummy financial data is displayed.
                </>
              ) : (
                <>
                  <strong>ℹ️ AWS Not Configured:</strong> To show real AWS costs, configure your AWS credentials. 
                  Run <code>npm run setup:aws:costs</code> to get started with real cost tracking.
                </>
              )}
            </div>
            <Badge bg={totalCurrentCost > 0 ? "success" : "secondary"}>
              {totalCurrentCost > 0 ? "Live FinOps" : "Zero Costs"}
            </Badge>
          </div>
        </Alert>
      </Container>
    </PermissionGuard>
  );
};

export default RealFinOpsDashboard;