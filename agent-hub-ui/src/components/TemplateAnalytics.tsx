import React, { useState, useEffect } from 'react';
import { Card, Badge, ProgressBar, Button, Row, Col } from 'react-bootstrap';
import { templateAnalyticsService, TemplateUsageMetrics } from '../services/templateAnalyticsService';

interface TemplateAnalyticsProps {
  templateId: string;
  analytics: TemplateUsageMetrics;
}

const TemplateAnalytics: React.FC<TemplateAnalyticsProps> = ({ templateId, analytics }) => {
  const [roiData, setRoiData] = useState<any>(null);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [templateId]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [roiMetrics, healthData] = await Promise.all([
        templateAnalyticsService.getTemplateROIMetrics(),
        templateAnalyticsService.getTemplateHealthMetrics()
      ]);
      
      // Find data for this specific template
      const templateROI = roiMetrics.find(r => r.templateId === templateId);
      const templateHealth = healthData.find(h => h.templateId === templateId);
      
      setRoiData(templateROI);
      setHealthMetrics(templateHealth);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    const icons = {
      'up': '📈',
      'down': '📉',
      'stable': '➡️'
    };
    return icons[trend as keyof typeof icons] || '➡️';
  };

  const getTrendColor = (trend: string) => {
    const colors = {
      'up': 'success',
      'down': 'danger',
      'stable': 'secondary'
    };
    return colors[trend as keyof typeof colors] || 'secondary';
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading analytics...</span>
          </div>
          <p className="mt-2 small text-muted">Loading analytics...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Usage Statistics */}
      <Card className="mb-3">
        <Card.Header>
          <h6 className="mb-0">📊 Usage Statistics</h6>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">Total Executions</small>
              <strong>{formatNumber(analytics.totalExecutions)}</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">Unique Users</small>
              <strong>{analytics.uniqueUsers}</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">Success Rate</small>
              <strong>{analytics.successRate.toFixed(1)}%</strong>
            </div>
            <ProgressBar 
              variant="success" 
              now={analytics.successRate} 
              style={{ height: '6px' }}
            />
          </div>
          
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">Avg Setup Time</small>
              <strong>{analytics.averageSetupTime.toFixed(1)} min</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">User Rating</small>
              <div>
                <strong>{analytics.averageRating.toFixed(1)}</strong>
                <span className="text-warning ms-1">★</span>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">Trend</small>
            <Badge bg={getTrendColor(analytics.usageTrend)}>
              {getTrendIcon(analytics.usageTrend)} {analytics.trendPercentage.toFixed(1)}%
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {/* ROI Metrics */}
      {roiData && (
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">💰 ROI Impact</h6>
          </Card.Header>
          <Card.Body>
            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Total Cost Savings</small>
                <strong className="text-success">
                  {formatCurrency(roiData.totalCostSavings)}
                </strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Time Saved</small>
                <strong>{roiData.totalTimeSaved.toFixed(0)} hours</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">ROI</small>
                <strong className="text-success">{roiData.roi.toFixed(0)}%</strong>
              </div>
            </div>
            
            <div className="bg-light p-2 rounded">
              <small className="text-muted d-block">Per Use Impact</small>
              <div className="d-flex justify-content-between">
                <span className="small">
                  💰 {formatCurrency(roiData.costSavingsPerUse)}
                </span>
                <span className="small">
                  ⏱️ {roiData.timeSavedPerUse.toFixed(0)}min
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Health Metrics */}
      {healthMetrics && (
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">🏥 Template Health</h6>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">Health Score</small>
                <strong>{healthMetrics.healthScore.toFixed(0)}/100</strong>
              </div>
              <ProgressBar 
                variant={
                  healthMetrics.healthScore >= 90 ? 'success' :
                  healthMetrics.healthScore >= 70 ? 'warning' : 'danger'
                }
                now={healthMetrics.healthScore} 
                style={{ height: '8px' }}
              />
            </div>
            
            <Row className="text-center">
              <Col xs={6}>
                <div className="border-end">
                  <div className="h6 mb-0 text-success">
                    {healthMetrics.reliability.toFixed(1)}%
                  </div>
                  <small className="text-muted">Reliability</small>
                </div>
              </Col>
              <Col xs={6}>
                <div className="h6 mb-0 text-info">
                  {healthMetrics.userSatisfaction.toFixed(1)}/10
                </div>
                <small className="text-muted">Satisfaction</small>
              </Col>
            </Row>
            
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Support Tickets</small>
                <Badge bg={healthMetrics.supportTickets === 0 ? 'success' : 'warning'}>
                  {healthMetrics.supportTickets}
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">Error Rate</small>
                <span className="small">{healthMetrics.errorRate.toFixed(2)}%</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Popularity Ranking */}
      <Card className="mb-3">
        <Card.Header>
          <h6 className="mb-0">🏆 Popularity</h6>
        </Card.Header>
        <Card.Body>
          <div className="text-center">
            <div className="display-6 text-primary mb-2">
              #{analytics.popularityRank}
            </div>
            <small className="text-muted">
              Ranked #{analytics.popularityRank} in {analytics.category} category
            </small>
          </div>
          
          <div className="mt-3">
            <small className="text-muted d-block mb-1">Last Used</small>
            <span className="small">
              {new Date(analytics.lastUsed).toLocaleDateString()}
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <h6 className="mb-0">⚡ Quick Actions</h6>
        </Card.Header>
        <Card.Body>
          <div className="d-grid gap-2">
            <Button variant="outline-primary" size="sm">
              📊 Detailed Analytics
            </Button>
            <Button variant="outline-success" size="sm">
              📈 Performance Report
            </Button>
            <Button variant="outline-info" size="sm">
              👥 User Feedback
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TemplateAnalytics;