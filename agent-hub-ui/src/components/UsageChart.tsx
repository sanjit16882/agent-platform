import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { analyticsService, UsageTrend } from '../services/analyticsService';

interface UsageChartProps {
  refreshTrigger?: number;
}

const UsageChart: React.FC<UsageChartProps> = ({ refreshTrigger = 0 }) => {
  const [trends, setTrends] = useState<UsageTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedMetric, setSelectedMetric] = useState<'executions' | 'users' | 'savings'>('executions');

  useEffect(() => {
    loadTrends();
  }, [selectedPeriod, refreshTrigger]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getUsageTrends(selectedPeriod);
      setTrends(data);
    } catch (error) {
      console.error('Failed to load trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (trend: UsageTrend): number => {
    switch (selectedMetric) {
      case 'executions':
        return trend.executions;
      case 'users':
        return trend.uniqueUsers;
      case 'savings':
        return trend.costSavings;
      default:
        return trend.executions;
    }
  };

  const getMetricLabel = (): string => {
    switch (selectedMetric) {
      case 'executions':
        return 'Executions';
      case 'users':
        return 'Active Users';
      case 'savings':
        return 'Cost Savings ($)';
      default:
        return 'Executions';
    }
  };

  const getMetricColor = (): string => {
    switch (selectedMetric) {
      case 'executions':
        return '#0d6efd';
      case 'users':
        return '#198754';
      case 'savings':
        return '#ffc107';
      default:
        return '#0d6efd';
    }
  };

  const formatValue = (value: number): string => {
    if (selectedMetric === 'savings') {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSimpleChart = () => {
    if (trends.length === 0) return null;

    const maxValue = Math.max(...trends.map(getMetricValue));
    const minValue = Math.min(...trends.map(getMetricValue));
    const range = maxValue - minValue || 1;

    const chartWidth = 800;
    const chartHeight = 200;
    const padding = 40;

    const points = trends.map((trend, index) => {
      const x = padding + (index / (trends.length - 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((getMetricValue(trend) - minValue) / range) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`;

    return (
      <div className="position-relative" style={{ height: '250px', overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight} className="w-100">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1={padding}
                y1={padding + ratio * (chartHeight - 2 * padding)}
                x2={chartWidth - padding}
                y2={padding + ratio * (chartHeight - 2 * padding)}
                stroke="#e9ecef"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={padding + ratio * (chartHeight - 2 * padding) + 5}
                fontSize="12"
                fill="#6c757d"
                textAnchor="end"
              >
                {formatValue(maxValue - ratio * range)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <polygon
            points={areaPoints}
            fill={getMetricColor()}
            fillOpacity="0.1"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={getMetricColor()}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {trends.map((trend, index) => {
            const x = padding + (index / (trends.length - 1)) * (chartWidth - 2 * padding);
            const y = chartHeight - padding - ((getMetricValue(trend) - minValue) / range) * (chartHeight - 2 * padding);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={getMetricColor()}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Date labels */}
                {index % Math.ceil(trends.length / 8) === 0 && (
                  <text
                    x={x}
                    y={chartHeight - 10}
                    fontSize="10"
                    fill="#6c757d"
                    textAnchor="middle"
                  >
                    {formatDate(trend.timestamp)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const calculateTrend = (): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
    if (trends.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = trends.slice(-7); // Last 7 data points
    const older = trends.slice(-14, -7); // Previous 7 data points
    
    const recentAvg = recent.reduce((sum, t) => sum + getMetricValue(t), 0) / recent.length;
    const olderAvg = older.reduce((sum, t) => sum + getMetricValue(t), 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
      percentage: Math.abs(change)
    };
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h5>Usage Trends</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading usage trends...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Usage Trends - {getMetricLabel()}</h5>
        <div className="d-flex gap-2">
          <ButtonGroup size="sm">
            <Button
              variant={selectedMetric === 'executions' ? 'primary' : 'outline-primary'}
              onClick={() => setSelectedMetric('executions')}
            >
              Executions
            </Button>
            <Button
              variant={selectedMetric === 'users' ? 'success' : 'outline-success'}
              onClick={() => setSelectedMetric('users')}
            >
              Users
            </Button>
            <Button
              variant={selectedMetric === 'savings' ? 'warning' : 'outline-warning'}
              onClick={() => setSelectedMetric('savings')}
            >
              Savings
            </Button>
          </ButtonGroup>
          
          <ButtonGroup size="sm">
            <Button
              variant={selectedPeriod === 'week' ? 'secondary' : 'outline-secondary'}
              onClick={() => setSelectedPeriod('week')}
            >
              7D
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'secondary' : 'outline-secondary'}
              onClick={() => setSelectedPeriod('month')}
            >
              30D
            </Button>
            <Button
              variant={selectedPeriod === 'quarter' ? 'secondary' : 'outline-secondary'}
              onClick={() => setSelectedPeriod('quarter')}
            >
              90D
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Trend Summary */}
        <Row className="mb-3">
          <Col md={8}>
            <div className="d-flex align-items-center">
              <span className="me-2">Trend:</span>
              <Badge 
                bg={trend.direction === 'up' ? 'success' : trend.direction === 'down' ? 'danger' : 'secondary'}
                className="me-2"
              >
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
                {trend.direction === 'up' ? 'Increasing' : trend.direction === 'down' ? 'Decreasing' : 'Stable'}
              </Badge>
              {trend.percentage > 0 && (
                <span className="text-muted small">
                  {trend.percentage.toFixed(1)}% vs previous period
                </span>
              )}
            </div>
          </Col>
          <Col md={4} className="text-end">
            <div className="text-muted small">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </Col>
        </Row>

        {/* Chart */}
        {renderSimpleChart()}

        {/* Summary Stats */}
        <Row className="mt-3 pt-3 border-top">
          <Col xs={6} md={3} className="text-center">
            <div className="h6 text-primary">
              {formatValue(Math.max(...trends.map(getMetricValue)))}
            </div>
            <small className="text-muted">Peak</small>
          </Col>
          <Col xs={6} md={3} className="text-center">
            <div className="h6 text-info">
              {formatValue(trends.reduce((sum, t) => sum + getMetricValue(t), 0) / trends.length)}
            </div>
            <small className="text-muted">Average</small>
          </Col>
          <Col xs={6} md={3} className="text-center">
            <div className="h6 text-success">
              {formatValue(trends.reduce((sum, t) => sum + getMetricValue(t), 0))}
            </div>
            <small className="text-muted">Total</small>
          </Col>
          <Col xs={6} md={3} className="text-center">
            <div className="h6 text-warning">
              {trends.length}
            </div>
            <small className="text-muted">Data Points</small>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default UsageChart;