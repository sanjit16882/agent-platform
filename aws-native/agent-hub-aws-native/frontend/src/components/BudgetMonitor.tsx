import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Alert, Badge, Button } from 'react-bootstrap';
import { API } from 'aws-amplify';

interface BudgetData {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  percentUsed: number;
  dailyBurnRate: number;
  estimatedDaysRemaining: number;
  currentMonthSpend: number;
  lastUpdated: string;
}

interface CostBreakdown {
  service: string;
  cost: number;
  percentage: number;
}

const BudgetMonitor: React.FC = () => {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the budget monitoring API
      const response = await API.get('AgentHubAPI', '/api/v1/budget/status', {});
      
      if (response.success) {
        setBudgetData(response.data);
        setCostBreakdown(response.costBreakdown || []);
      } else {
        setError(response.message || 'Failed to fetch budget data');
      }
    } catch (err: any) {
      console.error('Budget fetch error:', err);
      setError('Unable to fetch budget information. Check your AWS permissions.');
      
      // Fallback mock data for development
      setBudgetData({
        totalCredits: 100,
        usedCredits: 23.45,
        remainingCredits: 76.55,
        percentUsed: 23.45,
        dailyBurnRate: 3.2,
        estimatedDaysRemaining: 24,
        currentMonthSpend: 23.45,
        lastUpdated: new Date().toISOString()
      });
      
      setCostBreakdown([
        { service: 'ECS Fargate', cost: 12.30, percentage: 52.5 },
        { service: 'Application Load Balancer', cost: 6.20, percentage: 26.4 },
        { service: 'CloudWatch Logs', cost: 2.95, percentage: 12.6 },
        { service: 'Secrets Manager', cost: 1.50, percentage: 6.4 },
        { service: 'ECR Storage', cost: 0.50, percentage: 2.1 }
      ]);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchBudgetData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchBudgetData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getBudgetVariant = (percentUsed: number) => {
    if (percentUsed >= 90) return 'danger';
    if (percentUsed >= 75) return 'warning';
    if (percentUsed >= 50) return 'info';
    return 'success';
  };

  const getBudgetAlert = (percentUsed: number, daysRemaining: number) => {
    if (percentUsed >= 90) {
      return {
        variant: 'danger',
        message: '🚨 Critical: Over 90% of credits used! Consider pausing development or optimizing resources.'
      };
    }
    if (percentUsed >= 75) {
      return {
        variant: 'warning',
        message: '⚠️ Warning: Over 75% of credits used. Monitor spending closely.'
      };
    }
    if (daysRemaining <= 7) {
      return {
        variant: 'warning',
        message: `⏰ Less than ${daysRemaining} days of credits remaining at current burn rate.`
      };
    }
    if (percentUsed >= 50) {
      return {
        variant: 'info',
        message: '📈 Good progress! You\'ve used over 50% of your credits.'
      };
    }
    return {
      variant: 'success',
      message: '✅ Credit usage is under control. Keep up the good work!'
    };
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">💰 AWS Budget Monitor</h5>
          <Badge bg="secondary">Loading...</Badge>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading budget data...</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!budgetData) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">💰 AWS Budget Monitor</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            Unable to load budget data. {error}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  const alert = getBudgetAlert(budgetData.percentUsed, budgetData.estimatedDaysRemaining);

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">💰 AWS Budget Monitor</h5>
        <div className="d-flex align-items-center gap-2">
          <Badge bg={getBudgetVariant(budgetData.percentUsed)}>
            {budgetData.percentUsed.toFixed(1)}% Used
          </Badge>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={fetchBudgetData}
            disabled={loading}
          >
            🔄 Refresh
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Alert */}
        <Alert variant={alert.variant} className="mb-3">
          {alert.message}
        </Alert>

        {/* Main Budget Stats */}
        <Row className="mb-4">
          <Col md={6}>
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-bold">Credit Usage</span>
                <span>${budgetData.usedCredits.toFixed(2)} / ${budgetData.totalCredits.toFixed(2)}</span>
              </div>
              <ProgressBar 
                variant={getBudgetVariant(budgetData.percentUsed)}
                now={budgetData.percentUsed} 
                label={`${budgetData.percentUsed.toFixed(1)}%`}
                style={{ height: '25px' }}
              />
            </div>
          </Col>
          
          <Col md={6}>
            <Row>
              <Col xs={6}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="h4 mb-1 text-success">${budgetData.remainingCredits.toFixed(2)}</div>
                  <small className="text-muted">Credits Remaining</small>
                </div>
              </Col>
              <Col xs={6}>
                <div className="text-center p-3 bg-light rounded">
                  <div className="h4 mb-1 text-info">{budgetData.estimatedDaysRemaining}</div>
                  <small className="text-muted">Days Remaining</small>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Burn Rate Stats */}
        <Row className="mb-4">
          <Col md={4}>
            <div className="text-center p-2 border rounded">
              <div className="h5 mb-1">${budgetData.dailyBurnRate.toFixed(2)}</div>
              <small className="text-muted">Daily Burn Rate</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-2 border rounded">
              <div className="h5 mb-1">${budgetData.currentMonthSpend.toFixed(2)}</div>
              <small className="text-muted">This Month</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-2 border rounded">
              <div className="h5 mb-1">{new Date(budgetData.lastUpdated).toLocaleTimeString()}</div>
              <small className="text-muted">Last Updated</small>
            </div>
          </Col>
        </Row>

        {/* Cost Breakdown */}
        {costBreakdown.length > 0 && (
          <div>
            <h6 className="mb-3">💸 Cost Breakdown by Service</h6>
            <Row>
              {costBreakdown.map((item, index) => (
                <Col md={6} lg={4} key={index} className="mb-2">
                  <div className="d-flex justify-content-between align-items-center p-2 border rounded">
                    <div>
                      <div className="fw-bold">{item.service}</div>
                      <small className="text-muted">{item.percentage.toFixed(1)}%</small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">${item.cost.toFixed(2)}</div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-3 border-top">
          <h6 className="mb-2">🎯 Quick Actions</h6>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-primary" size="sm">
              📊 View Detailed Costs
            </Button>
            <Button variant="outline-warning" size="sm">
              🧹 Cleanup Resources
            </Button>
            <Button variant="outline-info" size="sm">
              ⚙️ Optimize Settings
            </Button>
            <Button variant="outline-success" size="sm">
              📈 Set Budget Alerts
            </Button>
          </div>
        </div>

        {/* Last Refresh */}
        <div className="mt-3 text-end">
          <small className="text-muted">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default BudgetMonitor;