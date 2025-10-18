import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ButtonGroup, Badge, Alert, Modal, Form, Dropdown } from 'react-bootstrap';
import { analyticsService, TimeRange, ROIData, CategoryMetrics, UserActivity } from '../services/analyticsService';
import MetricsOverview from './MetricsOverview';
import UsageChart from './UsageChart';
import AgentPerformanceTable from './AgentPerformanceTable';

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    period: 'day'
  });
  const [roiData, setROIData] = useState<ROIData | null>(null);
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetrics[]>([]);
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Interactive features state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [roi, categories, users] = await Promise.all([
        analyticsService.getROIMetrics(),
        analyticsService.getCategoryMetrics(),
        analyticsService.getTopUsers(5)
      ]);
      
      setROIData(roi);
      setCategoryMetrics(categories);
      setTopUsers(users);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleTimeRangeChange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    
    setTimeRange({
      start,
      end,
      period: days <= 7 ? 'hour' : days <= 30 ? 'day' : 'week'
    });
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    loadDashboardData();
  };

  const handleCustomDateRange = () => {
    if (customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      
      setTimeRange({
        start,
        end,
        period: 'day'
      });
      setShowCustomDatePicker(false);
    }
  };

  const handleCategoryDrillDown = (category: string) => {
    setSelectedCategory(category);
    setShowDrillDown(true);
  };

  const handleExportData = (format: 'csv' | 'excel' | 'pdf') => {
    // Simulate export functionality
    const data = {
      timeRange,
      roiData,
      categoryMetrics,
      topUsers,
      exportedAt: new Date().toISOString()
    };
    
    const filename = `analytics-dashboard-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      // Create CSV content
      const csvContent = [
        'Category,Executions,Success Rate,Cost Savings',
        ...categoryMetrics.map(cat => 
          `${cat.category},${cat.executionCount},${cat.successRate}%,${cat.costSavings}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // For Excel and PDF, show a simulation message
      alert(`📊 ${format.toUpperCase()} export initiated!\n\nFile: ${filename}\n\nIn a real implementation, this would generate and download a ${format.toUpperCase()} file with all dashboard data.`);
    }
    
    setShowExportModal(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'QE': return '🧪';
      case 'DevOps': return '⚙️';
      case 'Security': return '🔒';
      case 'Business': return '📊';
      default: return '🤖';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'QE': return 'primary';
      case 'DevOps': return 'info';
      case 'Security': return 'danger';
      case 'Business': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>📊 Analytics Dashboard</h1>
              <p className="text-muted mb-0">
                Comprehensive insights into agent performance and business value
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <small className="text-muted">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </small>
              <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
                🔄 Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Time Range Selector */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <span className="me-3 fw-bold">📅 Time Range:</span>
                  <ButtonGroup size="sm">
                    <Button
                      variant={timeRange.start.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 ? 'primary' : 'outline-primary'}
                      onClick={() => handleTimeRangeChange(7)}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant={timeRange.start.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 && timeRange.start.getTime() <= Date.now() - 7 * 24 * 60 * 60 * 1000 ? 'primary' : 'outline-primary'}
                      onClick={() => handleTimeRangeChange(30)}
                    >
                      Last 30 Days
                    </Button>
                    <Button
                      variant={timeRange.start.getTime() <= Date.now() - 30 * 24 * 60 * 60 * 1000 ? 'primary' : 'outline-primary'}
                      onClick={() => handleTimeRangeChange(90)}
                    >
                      Last 90 Days
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowCustomDatePicker(true)}
                    >
                      📅 Custom Range
                    </Button>
                  </ButtonGroup>
                </div>
                <div className="d-flex gap-2">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-success" size="sm">
                      📊 Export Data
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleExportData('csv')}>
                        📄 Export as CSV
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleExportData('excel')}>
                        📊 Export as Excel
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleExportData('pdf')}>
                        📋 Export as PDF
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <Badge bg="success" className="px-3 py-2">
                    🟢 System Healthy
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Key Metrics Overview */}
      <div className="mb-4">
        <h4 className="mb-3">📈 Key Performance Indicators</h4>
        <MetricsOverview timeRange={timeRange} refreshTrigger={refreshTrigger} />
      </div>

      {/* ROI and Business Value */}
      {roiData && (
        <Row className="mb-4">
          <Col>
            <h4 className="mb-3">💰 Return on Investment</h4>
          </Col>
        </Row>
      )}
      
      {roiData && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100 border-success">
              <Card.Body className="text-center">
                <div className="display-5 text-success fw-bold">
                  {formatCurrency(roiData.netROI)}
                </div>
                <div className="text-muted">Net ROI</div>
                <Badge bg="success" className="mt-2">
                  {roiData.roiPercentage.toFixed(0)}% Return
                </Badge>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-warning">
              <Card.Body className="text-center">
                <div className="display-5 text-warning fw-bold">
                  {formatCurrency(roiData.totalCostSavings)}
                </div>
                <div className="text-muted">Total Savings</div>
                <Badge bg="warning" className="mt-2">
                  💰 Value Generated
                </Badge>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-info">
              <Card.Body className="text-center">
                <div className="display-5 text-info fw-bold">
                  {roiData.productivityGain.toFixed(0)}%
                </div>
                <div className="text-muted">Productivity Gain</div>
                <Badge bg="info" className="mt-2">
                  📈 Efficiency
                </Badge>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-primary">
              <Card.Body className="text-center">
                <div className="display-5 text-primary fw-bold">
                  {formatNumber(roiData.automationHours)}
                </div>
                <div className="text-muted">Hours Automated</div>
                <Badge bg="primary" className="mt-2">
                  ⚡ Time Saved
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Category Performance */}
      {categoryMetrics.length > 0 && (
        <Row className="mb-4">
          <Col>
            <h4 className="mb-3">🏷️ Category Performance</h4>
            <Row>
              {categoryMetrics.map(category => (
                <Col key={category.category} md={6} lg={3} className="mb-3">
                  <Card 
                    className={`h-100 border-${getCategoryColor(category.category)} category-card`}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => handleCategoryDrillDown(category.category)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">
                          {getCategoryIcon(category.category)} {category.category}
                        </h6>
                        <Badge bg={getCategoryColor(category.category)}>
                          {category.popularityTrend > 0 ? '📈' : '📉'} {Math.abs(category.popularityTrend).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="small text-muted mb-2">
                        <div>Executions: <strong>{formatNumber(category.executionCount)}</strong></div>
                        <div>Success Rate: <strong>{category.successRate.toFixed(1)}%</strong></div>
                        <div>Rating: <strong>⭐ {category.averageRating.toFixed(1)}</strong></div>
                        <div>Savings: <strong>{formatCurrency(category.costSavings)}</strong></div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}

      {/* Usage Trends Chart */}
      <Row className="mb-4">
        <Col>
          <h4 className="mb-3">📊 Usage Trends</h4>
          <UsageChart refreshTrigger={refreshTrigger} />
        </Col>
      </Row>

      {/* Agent Performance Table */}
      <Row className="mb-4">
        <Col>
          <h4 className="mb-3">🏆 Agent Performance Details</h4>
          <AgentPerformanceTable refreshTrigger={refreshTrigger} />
        </Col>
      </Row>

      {/* Top Users */}
      {topUsers.length > 0 && (
        <Row className="mb-4">
          <Col>
            <h4 className="mb-3">👥 Top Performing Users</h4>
            <Row>
              {topUsers.map((user, index) => (
                <Col key={user.userId} md={6} lg={4} xl={2} className="mb-3">
                  <Card className="h-100 text-center">
                    <Card.Body>
                      <div className="mb-2">
                        <Badge bg="primary" className="position-absolute top-0 start-50 translate-middle">
                          #{index + 1}
                        </Badge>
                      </div>
                      <h6 className="mt-3">{user.userName}</h6>
                      <div className="small text-muted mb-2">
                        <div><strong>{formatNumber(user.totalExecutions)}</strong> executions</div>
                        <div><strong>{formatCurrency(user.costSavingsGenerated)}</strong> saved</div>
                        <div>Score: <strong>{user.productivityScore}</strong></div>
                      </div>
                      <Badge bg={getCategoryColor(user.favoriteCategory)}>
                        {getCategoryIcon(user.favoriteCategory)} {user.favoriteCategory}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}

      {/* Footer */}
      <Row>
        <Col>
          <Alert variant="info" className="mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>💡 Pro Tip:</strong> Click on category cards for detailed drill-down analysis. 
                Use the export options to download data in various formats.
              </div>
              <Badge bg="info">
                Data refreshes every 5 minutes
              </Badge>
            </div>
          </Alert>
        </Col>
      </Row>

      {/* Custom Date Range Modal */}
      <Modal show={showCustomDatePicker} onHide={() => setShowCustomDatePicker(false)}>
        <Modal.Header closeButton>
          <Modal.Title>📅 Select Custom Date Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCustomDatePicker(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCustomDateRange}>
            Apply Date Range
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Category Drill-Down Modal */}
      <Modal show={showDrillDown} onHide={() => setShowDrillDown(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCategory && getCategoryIcon(selectedCategory)} {selectedCategory} Category Deep Dive
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCategory && (
            <div>
              <Alert variant="info">
                <strong>🔍 Detailed Analysis for {selectedCategory} Category</strong>
                <br />
                This drill-down view would show detailed metrics, trends, and insights specific to the {selectedCategory} category.
              </Alert>
              
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>📊 Performance Metrics</Card.Header>
                    <Card.Body>
                      <ul className="list-unstyled">
                        <li>• Average execution time trends</li>
                        <li>• Success rate over time</li>
                        <li>• User adoption patterns</li>
                        <li>• Cost efficiency analysis</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>🎯 Insights & Recommendations</Card.Header>
                    <Card.Body>
                      <ul className="list-unstyled">
                        <li>• Peak usage hours</li>
                        <li>• Optimization opportunities</li>
                        <li>• Resource allocation suggestions</li>
                        <li>• Future growth projections</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => handleExportData('csv')}>
            📊 Export Category Data
          </Button>
          <Button variant="secondary" onClick={() => setShowDrillDown(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AnalyticsDashboard;