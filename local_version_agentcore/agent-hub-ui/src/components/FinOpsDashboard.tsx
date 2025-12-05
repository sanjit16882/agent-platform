import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Breadcrumb, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import PermissionGuard from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import { theme } from '../styles/theme';

interface CostData {
  id: string;
  service: string;
  provider: string;
  currentCost: number;
  budgetLimit: number;
  trend: 'up' | 'down' | 'stable';
  lastMonth: number;
}

interface BudgetAlert {
  id: string;
  service: string;
  currentSpend: number;
  budgetLimit: number;
  percentage: number;
  severity: 'warning' | 'critical';
}

const FinOpsDashboard: React.FC = () => {
  const { hasPermission, user } = usePermissions();
  const [costData, setCostData] = useState<CostData[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching FinOps data
    setTimeout(() => {
      setCostData([
        {
          id: 'cost-1',
          service: 'Agent Execution',
          provider: 'AWS',
          currentCost: 1250.75,
          budgetLimit: 1500.00,
          trend: 'up',
          lastMonth: 1180.50
        },
        {
          id: 'cost-2',
          service: 'Data Storage',
          provider: 'Azure',
          currentCost: 890.25,
          budgetLimit: 1000.00,
          trend: 'stable',
          lastMonth: 885.00
        },
        {
          id: 'cost-3',
          service: 'AI Model Usage',
          provider: 'OpenAI',
          currentCost: 2150.00,
          budgetLimit: 2000.00,
          trend: 'up',
          lastMonth: 1950.75
        },
        {
          id: 'cost-4',
          service: 'Compute Resources',
          provider: 'GCP',
          currentCost: 675.50,
          budgetLimit: 800.00,
          trend: 'down',
          lastMonth: 720.25
        }
      ]);

      setBudgetAlerts([
        {
          id: 'alert-1',
          service: 'AI Model Usage',
          currentSpend: 2150.00,
          budgetLimit: 2000.00,
          percentage: 107.5,
          severity: 'critical'
        },
        {
          id: 'alert-2',
          service: 'Data Storage',
          currentSpend: 890.25,
          budgetLimit: 1000.00,
          percentage: 89.0,
          severity: 'warning'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <span style={{ color: theme.colors.danger }}>↗</span>;
      case 'down': return <span style={{ color: theme.colors.success }}>↘</span>;
      case 'stable': return <span style={{ color: theme.colors.info }}>→</span>;
      default: return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge bg="danger">Critical</Badge>;
      case 'warning': return <Badge bg="warning">Warning</Badge>;
      default: return <Badge bg="secondary">{severity}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalCurrentCost = costData.reduce((sum, item) => sum + item.currentCost, 0);
  const totalBudget = costData.reduce((sum, item) => sum + item.budgetLimit, 0);
  const budgetUtilization = (totalCurrentCost / totalBudget) * 100;

  if (loading) {
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
            Loading FinOps dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={['cost.view', 'cost.manage', 'finops.access']} requireAll={false}>
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
              FinOps Dashboard
            </h1>
            <p style={{ 
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary,
              margin: 0
            }}>
              Cost management and financial operations - Restricted to FinOps Team
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
              <Badge bg="info">
                Role: {user?.role}
              </Badge>
              <Button variant="primary">
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Access Control Notice */}
        <Alert variant="info" style={{ marginBottom: theme.spacing['3xl'] }}>
          <strong>Restricted Access:</strong> This dashboard is only available to FinOps Team and Finance roles. 
          You have access because your role ({user?.role}) includes cost management permissions.
        </Alert>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <Alert variant="warning" style={{ marginBottom: theme.spacing['3xl'] }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <strong>Budget Alerts:</strong>
            </div>
            <ul style={{ margin: 0, marginTop: theme.spacing.md, paddingLeft: theme.spacing.xl }}>
              {budgetAlerts.map((alert) => (
                <li key={alert.id}>
                  {alert.service}: {formatCurrency(alert.currentSpend)} / {formatCurrency(alert.budgetLimit)} 
                  ({alert.percentage.toFixed(1)}%) {getSeverityBadge(alert.severity)}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: theme.spacing.xl,
          marginBottom: theme.spacing['3xl']
        }}>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ color: theme.colors.primary, fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                {formatCurrency(totalCurrentCost)}
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Total Monthly Spend</small>
            </Card.Body>
          </Card>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ color: theme.colors.info, fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                {formatCurrency(totalBudget)}
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Total Budget</small>
            </Card.Body>
          </Card>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ 
                color: budgetUtilization > 90 ? theme.colors.danger : budgetUtilization > 75 ? theme.colors.warning : theme.colors.success,
                fontSize: theme.typography.fontSize['2xl'], 
                fontWeight: theme.typography.fontWeight.bold 
              }}>
                {budgetUtilization.toFixed(1)}%
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Budget Utilization</small>
            </Card.Body>
          </Card>
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Card.Body>
              <h4 style={{ color: theme.colors.warning, fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold }}>
                {budgetAlerts.length}
              </h4>
              <small style={{ color: theme.colors.textMuted }}>Active Alerts</small>
            </Card.Body>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultActiveKey="cost-overview" style={{ marginBottom: theme.spacing.xl }}>
          <Tab eventKey="cost-overview" title="Cost Overview">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Cost Breakdown by Service
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: 0 }}>
                <Table responsive hover style={{ margin: 0 }}>
                  <thead style={{ backgroundColor: theme.colors.backgroundSecondary }}>
                    <tr>
                      <th style={{ padding: theme.spacing.lg, fontWeight: theme.typography.fontWeight.semibold }}>Service</th>
                      <th style={{ padding: theme.spacing.lg, fontWeight: theme.typography.fontWeight.semibold }}>Provider</th>
                      <th style={{ padding: theme.spacing.lg, fontWeight: theme.typography.fontWeight.semibold }}>Current Cost</th>
                      <th style={{ padding: theme.spacing.lg, fontWeight: theme.typography.fontWeight.semibold }}>Budget Limit</th>
                      <th style={{ padding: theme.spacing.lg, fontWeight: theme.typography.fontWeight.semibold }}>Utilization</th>
                      <th style={{ padding: theme.spacing.lg, fontWeight: theme.typography.fontWeight.semibold }}>Trend</th>
                      <th style={{ padding: theme.spacing.lg, fontWeight: theme.typography.fontWeight.semibold }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costData.map((item) => {
                      const utilization = (item.currentCost / item.budgetLimit) * 100;
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: theme.spacing.lg }}>
                            <strong>{item.service}</strong>
                          </td>
                          <td style={{ padding: theme.spacing.lg }}>
                            <Badge bg="light" style={{ color: theme.colors.textSecondary }}>
                              {item.provider}
                            </Badge>
                          </td>
                          <td style={{ padding: theme.spacing.lg }}>{formatCurrency(item.currentCost)}</td>
                          <td style={{ padding: theme.spacing.lg }}>{formatCurrency(item.budgetLimit)}</td>
                          <td style={{ padding: theme.spacing.lg }}>
                            <div style={{ width: '100px' }}>
                              <ProgressBar 
                                now={utilization} 
                                variant={utilization > 90 ? 'danger' : utilization > 75 ? 'warning' : 'success'}
                                style={{ marginBottom: theme.spacing.xs }}
                              />
                              <small>{utilization.toFixed(1)}%</small>
                            </div>
                          </td>
                          <td style={{ padding: theme.spacing.lg }}>
                            {getTrendIcon(item.trend)}
                            <small style={{ marginLeft: theme.spacing.xs }}>
                              {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}
                              {Math.abs(((item.currentCost - item.lastMonth) / item.lastMonth) * 100).toFixed(1)}%
                            </small>
                          </td>
                          <td style={{ padding: theme.spacing.lg }}>
                            <Button variant="outline-primary" size="sm" style={{ marginRight: theme.spacing.sm }}>
                              Optimize
                            </Button>
                            <Button variant="outline-secondary" size="sm">
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="budget-management" title="Budget Management">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Budget Controls
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: theme.spacing.xl }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: theme.spacing.xl
                }}>
                  <Card style={{ height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ 
                        marginBottom: theme.spacing.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.textPrimary
                      }}>
                        Set Budget Limits
                      </h6>
                      <p style={{ 
                        color: theme.colors.textMuted,
                        fontSize: theme.typography.fontSize.sm,
                        marginBottom: theme.spacing.lg
                      }}>
                        Configure spending limits and alerts
                      </p>
                      <Button variant="primary" size="sm">
                        Manage Budgets
                      </Button>
                    </Card.Body>
                  </Card>
                  <Card style={{ height: '100%' }}>
                    <Card.Body style={{ padding: theme.spacing.xl }}>
                      <h6 style={{ 
                        marginBottom: theme.spacing.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.textPrimary
                      }}>
                        Cost Optimization
                      </h6>
                      <p style={{ 
                        color: theme.colors.textMuted,
                        fontSize: theme.typography.fontSize.sm,
                        marginBottom: theme.spacing.lg
                      }}>
                        Identify savings opportunities
                      </p>
                      <Button variant="success" size="sm">
                        View Recommendations
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="billing" title="Billing & Reports">
            <Card>
              <Card.Header style={{ 
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.xl
              }}>
                <h5 style={{ 
                  margin: 0, 
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.textPrimary
                }}>
                  Billing Management
                </h5>
              </Card.Header>
              <Card.Body style={{ padding: theme.spacing.xl }}>
                <Alert variant="info" style={{ marginBottom: theme.spacing.xl }}>
                  <strong>PermissionGuard Active:</strong> This section requires 'billing.manage' permission.
                </Alert>
                <PermissionGuard permission="billing.manage">
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: theme.spacing.xl
                  }}>
                    <Card style={{ height: '100%' }}>
                      <Card.Body style={{ padding: theme.spacing.xl }}>
                        <h6 style={{ 
                          marginBottom: theme.spacing.sm,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.textPrimary
                        }}>
                          Monthly Reports
                        </h6>
                        <p style={{ 
                          color: theme.colors.textMuted,
                          fontSize: theme.typography.fontSize.sm,
                          marginBottom: theme.spacing.lg
                        }}>
                          Generate detailed cost reports
                        </p>
                        <Button variant="outline-primary" size="sm">
                          Generate Report
                        </Button>
                      </Card.Body>
                    </Card>
                    <Card style={{ height: '100%' }}>
                      <Card.Body style={{ padding: theme.spacing.xl }}>
                        <h6 style={{ 
                          marginBottom: theme.spacing.sm,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.textPrimary
                        }}>
                          Invoice Management
                        </h6>
                        <p style={{ 
                          color: theme.colors.textMuted,
                          fontSize: theme.typography.fontSize.sm,
                          marginBottom: theme.spacing.lg
                        }}>
                          View and manage invoices
                        </p>
                        <Button variant="outline-secondary" size="sm">
                          View Invoices
                        </Button>
                      </Card.Body>
                    </Card>
                    <Card style={{ height: '100%' }}>
                      <Card.Body style={{ padding: theme.spacing.xl }}>
                        <h6 style={{ 
                          marginBottom: theme.spacing.sm,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.textPrimary
                        }}>
                          Payment Methods
                        </h6>
                        <p style={{ 
                          color: theme.colors.textMuted,
                          fontSize: theme.typography.fontSize.sm,
                          marginBottom: theme.spacing.lg
                        }}>
                          Manage payment settings
                        </p>
                        <Button variant="outline-info" size="sm">
                          Manage Payments
                        </Button>
                      </Card.Body>
                    </Card>
                  </div>
                </PermissionGuard>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </PermissionGuard>
  );
};

export default FinOpsDashboard;