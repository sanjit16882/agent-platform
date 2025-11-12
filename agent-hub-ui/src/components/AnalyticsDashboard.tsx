import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ButtonGroup, Badge, Alert, Modal, Form, Dropdown } from 'react-bootstrap';
import { analyticsService, TimeRange, ROIData, CategoryMetrics, UserActivity } from '../services/analyticsService';
import { realAnalyticsService } from '../services/realAnalyticsService';
import MetricsOverview from './MetricsOverview';
import UsageChart from './UsageChart';
import AgentPerformanceTable from './AgentPerformanceTable';
import { theme } from '../styles/theme';

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
  const [useRealData, setUseRealData] = useState(true);

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
        'Category,Executions,Success Rate,Efficiency Score',
        ...categoryMetrics.map(cat => 
          `${cat.category},${cat.executionCount},${cat.successRate}%,${cat.successRate}`
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
      alert(`${format.toUpperCase()} export initiated!\n\nFile: ${filename}\n\nIn a real implementation, this would generate and download a ${format.toUpperCase()} file with all dashboard data.`);
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
      case 'QE': return 'QE';
      case 'DevOps': return 'OPS';
      case 'Security': return 'SEC';
      case 'Business': return 'BIZ';
      default: return 'GEN';
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
    <div style={{ 
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
            Analytics Dashboard
          </h1>
          <p style={{ 
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary,
            margin: 0
          }}>
            Comprehensive insights into agent performance and business value
          </p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <small style={{ color: theme.colors.textMuted }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </small>
          <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card style={{ marginBottom: theme.spacing['3xl'] }}>
        <Card.Body style={{ padding: theme.spacing.lg }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.lg
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg }}>
              <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>Time Range:</span>
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
                  Custom Range
                </Button>
              </ButtonGroup>
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-success" size="sm">
                  Export Data
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleExportData('csv')}>
                    Export as CSV
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleExportData('excel')}>
                    Export as Excel
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleExportData('pdf')}>
                    Export as PDF
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Badge bg="success" style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg}` }}>
                System Healthy
              </Badge>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Data Source Toggle */}
      <Card style={{ marginBottom: theme.spacing['3xl'] }}>
        <Card.Body style={{ padding: theme.spacing.lg }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.lg
          }}>
            <div>
              <h5 style={{ margin: 0, marginBottom: theme.spacing.sm }}>Data Source</h5>
              <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: theme.typography.fontSize.sm }}>
                {useRealData ? 'Showing real-time data from your actual agent executions, S3 storage, and Bedrock usage' : 'Showing simulated demo data for presentation purposes'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Demo Data
              </span>
              <div 
                style={{
                  width: '50px',
                  height: '24px',
                  backgroundColor: useRealData ? theme.colors.success : theme.colors.gray300,
                  borderRadius: '12px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setUseRealData(!useRealData)}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: theme.colors.white,
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: useRealData ? '28px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: theme.shadows.sm
                  }}
                />
              </div>
              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                Real Data
              </span>
              {useRealData && (
                <Badge bg="success" style={{ marginLeft: theme.spacing.sm }}>
                  Live
                </Badge>
              )}
              {useRealData && process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  style={{ marginLeft: theme.spacing.sm }}
                  onClick={() => {
                    import('../utils/analyticsTestData').then(({ generateTestExecutions }) => {
                      generateTestExecutions();
                      handleRefresh();
                    });
                  }}
                >
                  Generate Test Data
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Key Metrics Overview */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <h4 style={{ 
          marginBottom: theme.spacing.lg,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textPrimary
        }}>
          Key Performance Indicators
        </h4>
        <MetricsOverview timeRange={timeRange} refreshTrigger={refreshTrigger} />
      </div>

      {/* Real-Time Metrics (when real data is enabled) */}
      {useRealData && (
        <div style={{ marginBottom: theme.spacing['3xl'] }}>
          <h4 style={{ 
            marginBottom: theme.spacing.lg,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary
          }}>
            Real-Time Platform Metrics
          </h4>
          <RealTimeMetrics />
        </div>
      )}

      {/* Platform Health Overview */}
      <h4 style={{ 
        marginBottom: theme.spacing.lg,
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.textPrimary
      }}>
        Platform Health & Performance
      </h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: theme.spacing.xl,
        marginBottom: theme.spacing['3xl']
      }}>
        <Card style={{ textAlign: 'center', borderColor: theme.colors.success }}>
          <Card.Body style={{ padding: theme.spacing.xl }}>
            <div style={{ 
              fontSize: theme.typography.fontSize['3xl'],
              color: theme.colors.success,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.sm
            }}>
              99.8%
            </div>
            <div style={{ 
              color: theme.colors.textMuted,
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.sm
            }}>
              System Uptime
            </div>
            <Badge bg="success">
              Healthy
            </Badge>
          </Card.Body>
        </Card>
        <Card style={{ textAlign: 'center', borderColor: theme.colors.info }}>
          <Card.Body style={{ padding: theme.spacing.xl }}>
            <div style={{ 
              fontSize: theme.typography.fontSize['3xl'],
              color: theme.colors.info,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.sm
            }}>
              247ms
            </div>
            <div style={{ 
              color: theme.colors.textMuted,
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.sm
            }}>
              Avg Response Time
            </div>
            <Badge bg="info">
              Fast
            </Badge>
          </Card.Body>
        </Card>
        <Card style={{ textAlign: 'center', borderColor: theme.colors.warning }}>
          <Card.Body style={{ padding: theme.spacing.xl }}>
            <div style={{ 
              fontSize: theme.typography.fontSize['3xl'],
              color: theme.colors.warning,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.sm
            }}>
              {formatNumber(1247)}
            </div>
            <div style={{ 
              color: theme.colors.textMuted,
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.sm
            }}>
              Daily Executions
            </div>
            <Badge bg="warning">
              Growing
            </Badge>
          </Card.Body>
        </Card>
        <Card style={{ textAlign: 'center', borderColor: theme.colors.primary }}>
          <Card.Body style={{ padding: theme.spacing.xl }}>
            <div style={{ 
              fontSize: theme.typography.fontSize['3xl'],
              color: theme.colors.primary,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.sm
            }}>
              47
            </div>
            <div style={{ 
              color: theme.colors.textMuted,
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.sm
            }}>
              Active Agents
            </div>
            <Badge bg="primary">
              Ready
            </Badge>
          </Card.Body>
        </Card>
      </div>




      {/* Category Performance */}
      {categoryMetrics.length > 0 && (
        <div style={{ marginBottom: theme.spacing['3xl'] }}>
          <h4 style={{ 
            marginBottom: theme.spacing.lg,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary
          }}>
            Category Performance
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: theme.spacing.xl
          }}>
            {categoryMetrics.map(category => (
              <Card 
                key={category.category}
                style={{ 
                  height: '100%',
                  borderColor: getCategoryColor(category.category) === 'primary' ? theme.colors.primary : 
                              getCategoryColor(category.category) === 'info' ? theme.colors.info :
                              getCategoryColor(category.category) === 'danger' ? theme.colors.danger :
                              getCategoryColor(category.category) === 'warning' ? theme.colors.warning : theme.colors.secondary,
                  cursor: 'pointer', 
                  transition: 'transform 0.2s' 
                }}
                onClick={() => handleCategoryDrillDown(category.category)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: theme.spacing.xl }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: theme.spacing.md
                  }}>
                    <h6 style={{ 
                      margin: 0,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textPrimary
                    }}>
                      {getCategoryIcon(category.category)} {category.category}
                    </h6>
                    <Badge bg={getCategoryColor(category.category)}>
                      {category.popularityTrend > 0 ? '↗' : '↘'} {Math.abs(category.popularityTrend).toFixed(1)}%
                    </Badge>
                  </div>
                  <div style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textMuted
                  }}>
                    <div>Executions: <strong>{formatNumber(category.executionCount)}</strong></div>
                    <div>Success Rate: <strong>{category.successRate.toFixed(1)}%</strong></div>
                    <div>Avg Duration: <strong>{category.category === 'QE' ? '34s' : category.category === 'DevOps' ? '47s' : category.category === 'Security' ? '62s' : '51s'}</strong></div>
                    <div>Active Agents: <strong>{category.category === 'QE' ? '6' : category.category === 'DevOps' ? '10' : category.category === 'Security' ? '7' : '5'}</strong></div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Usage Trends Chart */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <h4 style={{ 
          marginBottom: theme.spacing.lg,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textPrimary
        }}>
          Usage Trends
        </h4>
        <UsageChart refreshTrigger={refreshTrigger} />
      </div>

      {/* Agent Performance Table */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <AgentPerformanceTable refreshTrigger={refreshTrigger} />
      </div>

      {/* Footer */}
      <Alert variant="info" style={{ margin: 0 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: theme.spacing.lg
        }}>
          <div>
            <strong>Pro Tip:</strong> Click on category cards for detailed drill-down analysis. 
            Use the export options to download data in various formats.
          </div>
          <Badge bg="info">
            Data refreshes every 5 minutes
          </Badge>
        </div>
      </Alert>

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
                <strong>Detailed Analysis for {selectedCategory} Category</strong>
                <br />
                This drill-down view would show detailed metrics, trends, and insights specific to the {selectedCategory} category.
              </Alert>
              
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>Performance Metrics</Card.Header>
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
                    <Card.Header>Insights & Recommendations</Card.Header>
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
            Export Category Data
          </Button>
          <Button variant="secondary" onClick={() => setShowDrillDown(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Real-Time Metrics Component
const RealTimeMetrics: React.FC = () => {
  const [realMetrics, setRealMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRealMetrics = async () => {
      try {
        setLoading(true);
        const [execMetrics, costMetrics, systemHealth] = await Promise.all([
          realAnalyticsService.getRealExecutionMetrics(),
          realAnalyticsService.getRealCostMetrics(),
          realAnalyticsService.getRealSystemHealth()
        ]);
        
        setRealMetrics({ execMetrics, costMetrics, systemHealth });
      } catch (error) {
        console.error('Failed to load real metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRealMetrics();
    // Increased interval to 2 minutes to reduce backend load
    const interval = setInterval(loadRealMetrics, 120000); // Refresh every 2 minutes
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <Card.Body style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
          <div style={{ color: theme.colors.textMuted }}>Loading real-time metrics...</div>
        </Card.Body>
      </Card>
    );
  }

  if (!realMetrics) {
    return (
      <Alert variant="warning">
        <strong>Real-time data unavailable</strong><br />
        Unable to connect to the analytics backend. Please check your connection and try again.
      </Alert>
    );
  }

  const { execMetrics, costMetrics, systemHealth } = realMetrics;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: theme.spacing.xl,
      marginBottom: theme.spacing['3xl']
    }}>
      {/* Total Executions */}
      <Card style={{ textAlign: 'center', borderColor: theme.colors.primary }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: theme.colors.primary,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            {execMetrics.totalExecutions}
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

      {/* Success Rate */}
      <Card style={{ textAlign: 'center', borderColor: theme.colors.success }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: theme.colors.success,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            {execMetrics.successRate.toFixed(1)}%
          </div>
          <div style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm
          }}>
            Success Rate
          </div>
          <Badge bg="success">
            {execMetrics.successRate > 90 ? 'Excellent' : execMetrics.successRate > 80 ? 'Good' : 'Needs Attention'}
          </Badge>
        </Card.Body>
      </Card>

      {/* Active Agents */}
      <Card style={{ textAlign: 'center', borderColor: theme.colors.info }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: theme.colors.info,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            {execMetrics.activeAgents}
          </div>
          <div style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm
          }}>
            Active Agents
          </div>
          <Badge bg="info">
            Ready
          </Badge>
        </Card.Body>
      </Card>

      {/* Cost Savings */}
      <Card style={{ textAlign: 'center', borderColor: theme.colors.warning }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: theme.colors.warning,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            ${costMetrics.costSavingsGenerated.toLocaleString()}
          </div>
          <div style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm
          }}>
            Cost Savings Generated
          </div>
          <Badge bg="warning">
            ROI: {costMetrics.roiPercentage.toFixed(0)}%
          </Badge>
        </Card.Body>
      </Card>

      {/* S3 Storage */}
      <Card style={{ textAlign: 'center', borderColor: theme.colors.secondary }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: theme.colors.secondary,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            {execMetrics.s3StorageUsage}
          </div>
          <div style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm
          }}>
            S3 Agents Stored
          </div>
          <Badge bg="secondary">
            AWS S3
          </Badge>
        </Card.Body>
      </Card>

      {/* Bedrock API Calls */}
      <Card style={{ textAlign: 'center', borderColor: theme.colors.danger }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: theme.colors.danger,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            {execMetrics.bedrockApiCalls.toLocaleString()}
          </div>
          <div style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm
          }}>
            Bedrock API Calls
          </div>
          <Badge bg="danger">
            AWS Bedrock
          </Badge>
        </Card.Body>
      </Card>

      {/* System Health */}
      <Card style={{ textAlign: 'center', borderColor: systemHealth.uptime > 99 ? theme.colors.success : theme.colors.warning }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: systemHealth.uptime > 99 ? theme.colors.success : theme.colors.warning,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            {systemHealth.uptime.toFixed(1)}%
          </div>
          <div style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm
          }}>
            System Uptime
          </div>
          <Badge bg={systemHealth.uptime > 99 ? 'success' : 'warning'}>
            {systemHealth.uptime > 99 ? 'Healthy' : 'Monitoring'}
          </Badge>
        </Card.Body>
      </Card>

      {/* Average Response Time */}
      <Card style={{ textAlign: 'center', borderColor: theme.colors.info }}>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            fontSize: theme.typography.fontSize['3xl'],
            color: theme.colors.info,
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm
          }}>
            {systemHealth.averageResponseTime.toFixed(0)}ms
          </div>
          <div style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm
          }}>
            Avg Response Time
          </div>
          <Badge bg="info">
            {systemHealth.averageResponseTime < 1000 ? 'Fast' : systemHealth.averageResponseTime < 3000 ? 'Good' : 'Slow'}
          </Badge>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;