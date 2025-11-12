import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAgentContext } from '../context/AgentContext';
import { theme } from '../styles/theme';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getActiveAgentsCount } = useAgentContext();
  const deployedAgentCount = getActiveAgentsCount();
  
  // State for all dashboard stats
  const [stats, setStats] = useState({
    totalAgents: deployedAgentCount,
    categories: 2,
    frameworks: 8,
    avgResponseTime: 1.1,
    uptime: 99.98
  });
  const [loading, setLoading] = useState(true);

  console.log('Dashboard - deployed agent count:', deployedAgentCount);

  // Fetch all dashboard stats from API
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/v1/dashboard/stats`);
        
        if (response.data && response.data.success && response.data.data) {
          setStats({
            totalAgents: response.data.data.totalAgents,
            categories: response.data.data.categories,
            frameworks: response.data.data.frameworks,
            avgResponseTime: 1.1,
            uptime: response.data.data.uptime
          });
        }
      } catch (error) {
        console.error('❌ Dashboard: Error fetching stats:', error);
        // Fallback to context value
        setStats(prev => ({
          ...prev,
          totalAgents: deployedAgentCount || prev.totalAgents
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [deployedAgentCount]);



  const recentActivity = [
    { 
      id: 'exec-001', 
      agent: 'Code Review Agent', 
      action: 'Executed', 
      status: 'completed',
      user: 'You',
      timestamp: '2 minutes ago',
      result: 'JavaScript analysis completed - 3 issues found'
    },
    { 
      id: 'exec-002', 
      agent: 'Email Rephraser', 
      action: 'Executed', 
      status: 'completed',
      user: 'You',
      timestamp: '15 minutes ago',
      result: 'Professional email generated successfully'
    },
    { 
      id: 'pub-001', 
      agent: 'Document Summarizer', 
      action: 'Published to Marketplace', 
      status: 'published',
      user: 'You',
      timestamp: '1 hour ago',
      result: 'Published to Internal Marketplace'
    },
    { 
      id: 'exec-003', 
      agent: 'DevOps Monitor', 
      action: 'Executed', 
      status: 'completed',
      user: 'System',
      timestamp: '2 hours ago',
      result: 'Infrastructure health: 85% - 3 recommendations'
    },
    { 
      id: 'create-001', 
      agent: 'Custom Analytics Agent', 
      action: 'Created', 
      status: 'created',
      user: 'You',
      timestamp: '3 hours ago',
      result: 'New custom agent created successfully'
    }
  ];

  return (
    <div style={{ 
      padding: theme.spacing['3xl'], 
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh'
    }}>
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
            fontWeight: '900',
            color: theme.colors.primary,
            marginBottom: theme.spacing.sm
          }}>
            AgentHub Dashboard
          </h1>
          <p style={{ 
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary,
            margin: 0
          }}>
            Universal AI Agent Factory - Deploy any agent for any business function
          </p>
        </div>
      </div>

      {/* CLI & IDE Integration Banner */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <Card style={{ 
          background: 'linear-gradient(135deg, #003d82 0%, #002a5c 100%)',
          color: 'white',
          border: 'none'
        }}>
          <Card.Body style={{ padding: theme.spacing.xl }}>
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center mb-3">
                  <Badge bg="success" className="me-3 px-3 py-2">
                    ✨ NEW
                  </Badge>
                  <h4 className="mb-0 text-white">CLI & IDE Integration Available</h4>
                </div>
                <p className="mb-3 text-light">
                  Install the <strong>AgentHub VS Code Extension</strong> to access powerful command-line tools, 
                  integrated development features, and seamless agent deployment workflows.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Badge bg="light" text="dark" className="px-3 py-1">⌨️ CLI Commands</Badge>
                  <Badge bg="light" text="dark" className="px-3 py-1">🔧 IDE Integration</Badge>
                  <Badge bg="light" text="dark" className="px-3 py-1">🚀 One-Click Deploy</Badge>
                  <Badge bg="light" text="dark" className="px-3 py-1">📊 Real-time Monitoring</Badge>
                </div>
              </Col>
              <Col md={4} className="text-end">
                <Button 
                  variant="light" 
                  size="lg" 
                  onClick={() => navigate('/cli-guide')}
                  className="me-2 mb-2"
                >
                  📚 View CLI Guide
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg"
                  onClick={() => navigate('/api-docs')}
                  className="mb-2"
                >
                  🔗 API Docs
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: theme.spacing.xl,
        marginBottom: theme.spacing['3xl']
      }}>
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Card.Body>
            <h3 style={{ color: theme.colors.primary, fontSize: theme.typography.fontSize['2xl'], fontWeight: '900' }}>
              {loading ? '...' : stats.totalAgents}
            </h3>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>AI Agents</p>
          </Card.Body>
        </Card>
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Card.Body>
            <h3 style={{ color: theme.colors.primary, fontSize: theme.typography.fontSize['2xl'], fontWeight: '900' }}>
              {loading ? '...' : stats.categories}
            </h3>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>Business Domains</p>
          </Card.Body>
        </Card>
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Card.Body>
            <h3 style={{ color: theme.colors.primary, fontSize: theme.typography.fontSize['2xl'], fontWeight: '900' }}>
              {loading ? '...' : stats.frameworks}
            </h3>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>Frameworks Supported</p>
          </Card.Body>
        </Card>
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl, cursor: 'pointer' }} onClick={() => navigate('/manage')}>
          <Card.Body>
            <h3 style={{ color: theme.colors.primary, fontSize: theme.typography.fontSize['2xl'], fontWeight: '900' }}>
              {loading ? '...' : `${stats.uptime}%`}
            </h3>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>Platform Uptime</p>
          </Card.Body>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card style={{ marginBottom: theme.spacing['3xl'] }}>
        <Card.Header style={{ 
          backgroundColor: theme.colors.primary, 
          color: theme.colors.white,
          padding: theme.spacing.xl
        }}>
          <h5 style={{ margin: 0, fontWeight: theme.typography.fontWeight.semibold }}>Quick Actions</h5>
        </Card.Header>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.lg,
            marginBottom: theme.spacing.lg
          }}>
            <Button 
              variant="outline-primary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/agents')}
            >
              Browse Agents
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/agents')}
            >
              Quick Execute
            </Button>
            <Button 
              variant="outline-secondary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/manage')}
            >
              Management
            </Button>
            <Button 
              variant="outline-secondary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/upload')}
            >
              Upload Agent
            </Button>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <Button 
              variant="outline-secondary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/integration')}
            >
              Documentation
            </Button>
            <Button 
              variant="outline-secondary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/api-docs')}
            >
              API Docs
            </Button>
            <Button 
              variant="outline-primary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/analytics')}
            >
              Analytics
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              style={{ 
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
              onClick={() => navigate('/metrics')}
            >
              CloudWatch Metrics
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Platform Capabilities */}
      <Card style={{ marginBottom: theme.spacing['3xl'] }}>
        <Card.Header style={{ 
          backgroundColor: theme.colors.backgroundSecondary, 
          borderBottom: `1px solid ${theme.colors.border}`,
          padding: theme.spacing.xl
        }}>
          <h5 style={{ 
            margin: 0, 
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary
          }}>
            Platform Capabilities
          </h5>
        </Card.Header>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: theme.spacing.xl,
            marginBottom: theme.spacing.xl
          }}>
            <div style={{ textAlign: 'center', padding: theme.spacing.lg }}>
              <Badge 
                bg="primary" 
                style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  marginBottom: theme.spacing.lg,
                  display: 'inline-block'
                }}
              >
                QE & Testing
              </Badge>
              <h6 style={{ 
                marginBottom: theme.spacing.sm,
                color: theme.colors.textPrimary,
                fontWeight: theme.typography.fontWeight.semibold
              }}>
                Automated Testing
              </h6>
              <p style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm
              }}>
                Generate test suites for Selenium, Cypress, Playwright, and API testing frameworks
              </p>
              <Badge bg="light" style={{ color: theme.colors.textSecondary }}>5 Agents</Badge>
            </div>
            <div style={{ textAlign: 'center', padding: theme.spacing.lg }}>
              <Badge 
                bg="primary" 
                style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  marginBottom: theme.spacing.lg,
                  display: 'inline-block'
                }}
              >
                DevOps
              </Badge>
              <h6 style={{ 
                marginBottom: theme.spacing.sm,
                color: theme.colors.textPrimary,
                fontWeight: theme.typography.fontWeight.semibold
              }}>
                Infrastructure Management
              </h6>
              <p style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm
              }}>
                Cloud cost optimization, performance monitoring, and infrastructure analysis
              </p>
              <Badge bg="light" style={{ color: theme.colors.textSecondary }}>4 Agents</Badge>
            </div>
            <div style={{ textAlign: 'center', padding: theme.spacing.lg }}>
              <Badge 
                bg="primary" 
                style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  marginBottom: theme.spacing.lg,
                  display: 'inline-block'
                }}
              >
                Security
              </Badge>
              <h6 style={{ 
                marginBottom: theme.spacing.sm,
                color: theme.colors.textPrimary,
                fontWeight: theme.typography.fontWeight.semibold
              }}>
                Security & Compliance
              </h6>
              <p style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm
              }}>
                Vulnerability scanning, compliance auditing, and security best practices
              </p>
              <Badge bg="light" style={{ color: theme.colors.textSecondary }}>4 Agents</Badge>
            </div>
            <div style={{ textAlign: 'center', padding: theme.spacing.lg }}>
              <Badge 
                bg="primary" 
                style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  marginBottom: theme.spacing.lg,
                  display: 'inline-block'
                }}
              >
                Business
              </Badge>
              <h6 style={{ 
                marginBottom: theme.spacing.sm,
                color: theme.colors.textPrimary,
                fontWeight: theme.typography.fontWeight.semibold
              }}>
                Business Intelligence
              </h6>
              <p style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm
              }}>
                Data analysis, reporting automation, and business insights generation
              </p>
              <Badge bg="light" style={{ color: theme.colors.textSecondary }}>4 Agents</Badge>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: theme.spacing.xl }}>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/agents')}
              style={{
                marginRight: theme.spacing.lg,
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
            >
              Explore Agent Catalog
            </Button>
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={() => navigate('/integration-guide')}
              style={{
                padding: theme.spacing.lg,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium
              }}
            >
              View Integration Examples
            </Button>
          </div>
        </Card.Body>
      </Card>





      {/* Most Used Agents */}
      <Card style={{ marginBottom: theme.spacing['3xl'] }}>
        <Card.Header style={{ 
          backgroundColor: theme.colors.backgroundSecondary, 
          borderBottom: `1px solid ${theme.colors.border}`,
          padding: theme.spacing.xl
        }}>
          <h5 style={{ 
            margin: 0, 
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary
          }}>
            Most Used Agents
          </h5>
        </Card.Header>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: theme.spacing.lg
          }}>
            {[
              { name: 'Code Review Agent', uses: 12, category: 'Development', lastUsed: '2 min ago' },
              { name: 'Email Rephraser', uses: 8, category: 'Communication', lastUsed: '15 min ago' },
              { name: 'DevOps Monitor', uses: 6, category: 'Infrastructure', lastUsed: '2 hours ago' },
              { name: 'Security Scanner', uses: 4, category: 'Security', lastUsed: '1 day ago' }
            ].map((agent, index) => (
              <div 
                key={index}
                style={{
                  padding: theme.spacing.lg,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.lg,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => navigate('/agents')}
              >
                <div style={{ 
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  marginBottom: theme.spacing.sm
                }}>
                  {agent.name}
                </div>
                <div style={{ 
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: '900',
                  color: theme.colors.primary,
                  marginBottom: theme.spacing.sm
                }}>
                  {agent.uses} uses
                </div>
                <Badge bg="light" style={{ 
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xs
                }}>
                  {agent.category}
                </Badge>
                <div style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary
                }}>
                  Last used: {agent.lastUsed}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* MCP Testing Section */}


      {/* Recent Activity */}
      <Card>
        <Card.Header style={{ 
          backgroundColor: theme.colors.backgroundSecondary, 
          borderBottom: `1px solid ${theme.colors.border}`,
          padding: theme.spacing.xl
        }}>
          <h5 style={{ 
            margin: 0, 
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textPrimary
          }}>
            Recent Activity
          </h5>
        </Card.Header>
        <Card.Body style={{ padding: theme.spacing.xl }}>
          {recentActivity.map((activity, index) => (
            <div 
              key={index} 
              style={{
                marginBottom: theme.spacing.lg,
                padding: theme.spacing.lg,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: activity.status === 'completed' ? '#f8f9fa' : '#fff',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                    <div style={{ 
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textPrimary
                    }}>
                      {activity.agent}
                    </div>
                    <Badge 
                      bg="primary"
                      style={{ 
                        fontSize: theme.typography.fontSize.xs,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`
                      }}
                    >
                      {activity.status === 'completed' ? 'Completed' : 
                       activity.status === 'published' ? 'Published' : 
                       activity.status === 'created' ? 'Created' : activity.status}
                    </Badge>
                  </div>
                  <div style={{ 
                    marginBottom: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary
                  }}>
                    <strong>{activity.action}</strong> by {activity.user} • {activity.timestamp}
                  </div>
                  <div style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textPrimary,
                    fontStyle: 'italic'
                  }}>
                    {activity.result}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: theme.spacing.lg }}>
                  {activity.action === 'Executed' && activity.status === 'completed' && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/agents`)}
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        marginBottom: theme.spacing.xs
                      }}
                    >
                      Run Again
                    </Button>
                  )}
                  {activity.action === 'Published to Marketplace' && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/marketplace`)}
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium
                      }}
                    >
                      View in Marketplace
                    </Button>
                  )}
                  {activity.action === 'Created' && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/agents`)}
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium
                      }}
                    >
                      Execute
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div style={{ 
            marginTop: theme.spacing.xl, 
            paddingTop: theme.spacing.xl,
            borderTop: `1px solid ${theme.colors.border}`
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: theme.spacing.lg
            }}>
              <Button 
                variant="primary" 
                onClick={() => navigate('/agents')}
                style={{
                  padding: theme.spacing.lg,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                Browse All Agents
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/agent-builder')}
                style={{
                  padding: theme.spacing.lg,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                Create New Agent
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/marketplace')}
                style={{
                  padding: theme.spacing.lg,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                Visit Marketplace
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

    </div>
  );
};

export default Dashboard;