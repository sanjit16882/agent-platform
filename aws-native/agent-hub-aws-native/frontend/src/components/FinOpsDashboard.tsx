import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, ProgressBar, Table } from 'react-bootstrap';

interface CostData {
  service: string;
  currentMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

interface BudgetAlert {
  id: string;
  service: string;
  threshold: number;
  current: number;
  severity: 'warning' | 'critical';
  message: string;
}

const FinOpsDashboard: React.FC = () => {
  const [totalCost, setTotalCost] = useState(0);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [monthOverMonthChange, setMonthOverMonthChange] = useState(0);
  const [isRealData, setIsRealData] = useState(false);
  const [projectedCost, setProjectedCost] = useState(0);

  const fetchRealCostData = async () => {
    try {
      console.log('📊 Fetching real AWS cost data...');
      
      // Try to fetch from our backend API
      const response = await fetch('http://localhost:3002/api/v1/costs/dashboard');
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Set totals
        setTotalCost(data.summary.totalCurrentMonth);
        setLastMonthTotal(data.summary.totalLastMonth);
        setMonthOverMonthChange(data.summary.monthOverMonthChange);
        setProjectedCost(data.summary.projectedMonthEnd || data.summary.totalCurrentMonth * 1.1);
        
        // Convert service comparison to our format
        const formattedCostData = data.serviceComparison.map((service: any) => ({
          service: service.service,
          currentMonth: service.currentMonth,
          lastMonth: service.lastMonth,
          trend: service.trend,
          percentage: service.percentage
        }));
        setCostData(formattedCostData);
        
        // Set budget alerts
        setBudgetAlerts(data.budgetAlerts || []);
        
        // Calculate budget usage (assuming $500 default budget if no budgets configured)
        const monthlyBudget = data.budgets.length > 0 
          ? data.budgets[0].limit 
          : 500;
        setBudgetUsed((data.summary.totalCurrentMonth / monthlyBudget) * 100);
        
        setIsRealData(!result.fallback);
        
        console.log('✅ Real cost data loaded:', {
          total: data.summary.totalCurrentMonth,
          services: formattedCostData.length,
          isReal: !result.fallback
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch real cost data, using mock data:', error);
      
      // Fallback to mock data
      const mockCostData = [
        { service: 'Bedrock AI', currentMonth: 89.34, lastMonth: 67.89, trend: 'up' as const, percentage: 31.6 },
        { service: 'Lambda Functions', currentMonth: 45.67, lastMonth: 38.23, trend: 'up' as const, percentage: 19.5 },
        { service: 'API Gateway', currentMonth: 23.45, lastMonth: 25.12, trend: 'down' as const, percentage: -6.6 },
        { service: 'CloudWatch', currentMonth: 15.67, lastMonth: 14.23, trend: 'up' as const, percentage: 10.1 },
        { service: 'DynamoDB', currentMonth: 12.34, lastMonth: 11.89, trend: 'up' as const, percentage: 3.8 },
        { service: 'S3 Storage', currentMonth: 8.90, lastMonth: 9.45, trend: 'down' as const, percentage: -5.8 }
      ];
      
      const mockBudgetAlerts = [
        {
          id: '1',
          service: 'Bedrock AI',
          threshold: 100,
          current: 89.34,
          severity: 'warning' as const,
          message: 'Approaching 90% of monthly budget'
        },
        {
          id: '2',
          service: 'Lambda Functions',
          threshold: 50,
          current: 45.67,
          severity: 'warning' as const,
          message: 'High execution volume detected'
        }
      ];
      
      setCostData(mockCostData);
      setBudgetAlerts(mockBudgetAlerts);
      
      const total = mockCostData.reduce((sum, item) => sum + item.currentMonth, 0);
      setTotalCost(total);
      setLastMonthTotal(167.23);
      setMonthOverMonthChange(16.8);
      setProjectedCost(total * 1.15);
      setBudgetUsed((total / 500) * 100);
      setIsRealData(false);
    }
  };

  useEffect(() => {
    fetchRealCostData().finally(() => {
      setLoading(false);
    });
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'danger';
      case 'down': return 'success';
      case 'stable': return 'secondary';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} />
          <h4 className="text-primary mb-2">💰 FinOps Dashboard</h4>
          <p className="text-muted">Loading cost analytics...</p>
        </div>
      </Container>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-primary mb-1" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
            💰 FinOps Dashboard
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            AWS Cost Management & Financial Operations for Agent Hub Platform
          </p>
        </div>

        {/* Data Source Indicator */}
        <Alert variant={isRealData ? "success" : "info"} className="mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <span className="me-2">{isRealData ? "📊" : "🧪"}</span>
              <div>
                <strong>
                  {isRealData ? "Real AWS Cost Data" : "Demo Data"}
                </strong>
                <div className="small">
                  {isRealData 
                    ? "Connected to AWS Cost Explorer API - Live data from your account"
                    : "Using sample data - Connect to AWS for real cost tracking"
                  }
                </div>
              </div>
            </div>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setLoading(true);
                fetchRealCostData().finally(() => setLoading(false));
              }}
            >
              🔄 Refresh
            </Button>
          </div>
        </Alert>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <div className="d-flex align-items-center mb-2">
              <span className="me-2">⚠️</span>
              <strong>Budget Alerts ({budgetAlerts.length})</strong>
            </div>
            {budgetAlerts.map(alert => (
              <div key={alert.id} className="mb-1">
                <strong>{alert.service}:</strong> {alert.message} (${alert.current.toFixed(2)}/${alert.threshold})
              </div>
            ))}
          </Alert>
        )}

        {/* Cost Overview Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-6 text-primary mb-1" style={{ fontSize: '2rem', fontWeight: '700' }}>
                  ${totalCost.toFixed(2)}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Current Month Cost
                </p>
                <small className={monthOverMonthChange > 0 ? "text-danger" : "text-success"}>
                  {monthOverMonthChange > 0 ? "📈" : "📉"} {Math.abs(monthOverMonthChange).toFixed(1)}% vs last month
                </small>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-6 text-warning mb-1" style={{ fontSize: '2rem', fontWeight: '700' }}>
                  {budgetUsed.toFixed(1)}%
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Budget Utilized
                </p>
                <div className="mt-2">
                  <ProgressBar 
                    now={budgetUsed} 
                    variant={budgetUsed > 80 ? 'danger' : budgetUsed > 60 ? 'warning' : 'success'}
                    size="sm"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-6 text-info mb-1" style={{ fontSize: '2rem', fontWeight: '700' }}>
                  $0.08
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Avg Cost/Execution
                </p>
                <small className="text-success">
                  📉 15% optimization
                </small>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body className="py-4">
                <h2 className="display-6 text-success mb-1" style={{ fontSize: '2rem', fontWeight: '700' }}>
                  ${(500 - totalCost).toFixed(2)}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Remaining Budget
                </p>
                <small className="text-muted">
                  {Math.ceil((500 - totalCost) / (totalCost / 30))} days left
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Service Breakdown */}
        <Row>
          <Col md={8}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">📊 Service Cost Breakdown</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Current Month</th>
                      <th>Last Month</th>
                      <th>Trend</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.service}</strong>
                        </td>
                        <td>${item.currentMonth.toFixed(2)}</td>
                        <td>${item.lastMonth.toFixed(2)}</td>
                        <td>
                          <Badge bg={getTrendColor(item.trend)}>
                            {getTrendIcon(item.trend)} {item.trend}
                          </Badge>
                        </td>
                        <td>
                          <span className={item.percentage > 0 ? 'text-danger' : 'text-success'}>
                            {item.percentage > 0 ? '+' : ''}{item.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">💡 Cost Optimization</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <h6 className="text-success">🎯 Recommendations</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <small className="text-muted">• Optimize Lambda memory allocation</small>
                      <div className="text-success small">Potential savings: $8-12/month</div>
                    </li>
                    <li className="mb-2">
                      <small className="text-muted">• Enable S3 Intelligent Tiering</small>
                      <div className="text-success small">Potential savings: $2-4/month</div>
                    </li>
                    <li className="mb-2">
                      <small className="text-muted">• Review Bedrock model usage</small>
                      <div className="text-success small">Potential savings: $15-25/month</div>
                    </li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h6 className="text-warning">⚠️ Alerts</h6>
                  <div className="small">
                    <div className="mb-1">• Bedrock costs trending up 31.6%</div>
                    <div className="mb-1">• Lambda executions increased 19.5%</div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Button variant="primary" size="sm">
                    📈 View Detailed Analytics
                  </Button>
                  <Button variant="outline-secondary" size="sm">
                    ⚙️ Configure Budgets
                  </Button>
                  <Button variant="outline-info" size="sm">
                    📊 Export Cost Report
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Cost Forecasting */}
        <Row className="mt-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">🔮 Cost Forecasting & Trends</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center p-3">
                      <h4 className="text-primary">${projectedCost.toFixed(2)}</h4>
                      <p className="text-muted mb-0">Projected Month End</p>
                      <small className="text-warning">
                        {isRealData ? "AWS Cost Explorer forecast" : "Based on current trends"}
                      </small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3">
                      <h4 className="text-info">${(totalCost * 12 * 1.1).toFixed(0)}</h4>
                      <p className="text-muted mb-0">Annual Projection</p>
                      <small className="text-muted">10% growth assumed</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3">
                      <h4 className="text-success">${(totalCost * 0.15).toFixed(2)}</h4>
                      <p className="text-muted mb-0">Potential Monthly Savings</p>
                      <small className="text-success">With optimizations</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FinOpsDashboard;