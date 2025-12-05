import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import '../styles/aws-inspired-theme.css';

const AWSStyleNavbar: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { hasPermission, canAccessFeature } = usePermissions();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'danger';
      case 'Developer': return 'primary';
      case 'Business User': return 'success';
      case 'Testing Team': return 'warning';
      case 'FinOps Team': return 'info';
      default: return 'secondary';
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* AWS-Style Main Navigation */}
      <BootstrapNavbar expand="lg" className="aws-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/">
            🏭 Agent Factory
          </BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Core Services */}
              <Nav.Link 
                as={Link} 
                to="/" 
                className={location.pathname === '/' ? 'active' : ''}
              >
                Dashboard
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/agents" 
                className={location.pathname === '/agents' ? 'active' : ''}
              >
                Agents
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/templates" 
                className={location.pathname === '/templates' ? 'active' : ''}
              >
                Templates
              </Nav.Link>

              <NavDropdown title="Agent Builder" id="agent-builder-dropdown">
                <NavDropdown.Item as={Link} to="/hybrid-builder">
                  Hybrid Agent Builder
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/nl-agent-generator">
                  Natural Language Generator
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/agent-builder">
                  Legacy Builder
                </NavDropdown.Item>
              </NavDropdown>

              <Nav.Link 
                as={Link} 
                to="/integration" 
                className={location.pathname === '/integration' ? 'active' : ''}
              >
                Integration
              </Nav.Link>

              {/* Advanced Features */}
              {canAccessFeature('agent-testing') && (
                <Nav.Link 
                  as={Link} 
                  to="/testing" 
                  className={location.pathname === '/testing' ? 'active' : ''}
                >
                  Testing
                </Nav.Link>
              )}

              {canAccessFeature('cost-management') && (
                <Nav.Link 
                  as={Link} 
                  to="/finops" 
                  className={location.pathname === '/finops' ? 'active' : ''}
                >
                  FinOps
                </Nav.Link>
              )}

              {canAccessFeature('cost-management') && (
                <Nav.Link 
                  as={Link} 
                  to="/analytics" 
                  className={location.pathname === '/analytics' ? 'active' : ''}
                >
                  Analytics
                </Nav.Link>
              )}
            </Nav>

            {/* User Menu */}
            <Nav>
              {isAuthenticated && user ? (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center">
                      <span className="me-2">👤 {user.name.split(' ')[0]}</span>
                      <Badge bg={getRoleBadgeColor(user.role)} className="small">
                        {user.role}
                      </Badge>
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  {canAccessFeature('user-management') && (
                    <NavDropdown.Item as={Link} to="/users">
                      👥 User Management
                    </NavDropdown.Item>
                  )}
                  {canAccessFeature('role-management') && (
                    <NavDropdown.Item as={Link} to="/roles">
                      🔐 Role Management
                    </NavDropdown.Item>
                  )}
                  {hasPermission('system.admin') && (
                    <NavDropdown.Item as={Link} to="/security">
                      🛡️ Security & Compliance
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    🚪 Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
              )}
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* AWS-Style Secondary Navigation */}
      <div className="aws-secondary-nav">
        <Container fluid>
          <Nav className="justify-content-center">
            <Nav.Link 
              as={Link} 
              to="/integration-guide"
              className={location.pathname === '/integration-guide' ? 'active' : ''}
            >
              📖 Integration Guide
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/api-docs"
              className={location.pathname === '/api-docs' ? 'active' : ''}
            >
              📚 API Documentation
            </Nav.Link>

            {hasPermission('agent.deploy') && (
              <Nav.Link 
                as={Link} 
                to="/deployment"
                className={location.pathname === '/deployment' ? 'active' : ''}
              >
                🚀 Deployment
              </Nav.Link>
            )}

            {hasPermission('template.publish') && (
              <Nav.Link 
                as={Link} 
                to="/marketplace"
                className={location.pathname === '/marketplace' ? 'active' : ''}
              >
                🏪 Marketplace
              </Nav.Link>
            )}
          </Nav>
        </Container>
      </div>
    </>
  );
};

export default AWSStyleNavbar;