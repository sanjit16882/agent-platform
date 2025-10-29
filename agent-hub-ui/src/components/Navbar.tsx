import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';

// Type assertion for React Icons compatibility
const UserIcon = FaUser as any;
const SignOutIcon = FaSignOutAlt as any;
const CogIcon = FaCog as any;

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { hasPermission, canAccessFeature } = usePermissions();



  const handleLogout = () => {
    logout();
    // Optionally redirect to login page
  };

  return (
    <>
      {/* Main Navigation */}
      <BootstrapNavbar expand="lg" className="main-navbar" style={{background: 'linear-gradient(135deg, #003d82 0%, #002a5c 100%)'}}>
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold">
            AgentHub
          </BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Core Features */}
              <Nav.Link 
                as={Link} 
                to="/" 
                className={`px-2 ${location.pathname === '/' ? 'active' : ''}`}
              >
                Dashboard
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/agents" 
                className={`px-2 ${location.pathname === '/agents' ? 'active' : ''}`}
              >
                Agents
              </Nav.Link>





              <Nav.Link 
                as={Link} 
                to="/agent-builder" 
                className={`px-2 ${(location.pathname === '/agent-builder' || location.pathname === '/agent-builder-classic') ? 'active' : ''}`}
              >
                Agent Builder
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/hybrid-builder" 
                active={location.pathname === '/hybrid-builder'}
                className="px-2"
              >
                Hybrid Builder
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/upload" 
                active={location.pathname === '/upload'}
                className="px-2"
              >
                Upload
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/manage" 
                className={`px-2 ${location.pathname === '/manage' ? 'active' : ''}`}
              >
                Manage
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/integration" 
                active={location.pathname === '/integration'}
                className="px-2"
              >
                Integration
              </Nav.Link>

              {canAccessFeature('cost-management') && (
                <Nav.Link 
                  as={Link} 
                  to="/finops" 
                  active={location.pathname === '/finops'}
                  className="px-2"
                >
                  FinOps
                </Nav.Link>
              )}

              {canAccessFeature('cost-management') && (
                <Nav.Link 
                  as={Link} 
                  to="/analytics" 
                  active={location.pathname === '/analytics'}
                  className="px-2"
                >
                  Analytics
                </Nav.Link>
              )}
            </Nav>
            <Nav>
              {isAuthenticated && user ? (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center">
                      <span className="me-2">{user.name.split(' ')[0]}</span>
                      <Badge bg="primary" className="small">
                        {user.role}
                      </Badge>
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                  className="navbar-user-dropdown"
                >
                  {canAccessFeature('user-management') && (
                    <NavDropdown.Item as={Link} to="/users">
                      <CogIcon className="me-2" />
                      User Management
                    </NavDropdown.Item>
                  )}
                  {canAccessFeature('role-management') && (
                    <NavDropdown.Item as={Link} to="/roles">
                      <CogIcon className="me-2" />
                      Role Management
                    </NavDropdown.Item>
                  )}
                  {hasPermission('system.admin') && (
                    <NavDropdown.Item as={Link} to="/security">
                      Security & Compliance
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className="small navbar-user-text"
                >
                  Login
                </Nav.Link>
              )}
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* Secondary Navigation - Resources & Documentation */}
      <div className="bg-light border-bottom secondary-navbar">
        <Container>
          <Nav className="justify-content-center py-2">
            <Nav.Link 
              as={Link} 
              to="/integration-guide" 
              active={location.pathname === '/integration-guide'}
              className="px-3 text-primary small"
            >
              Integration Guide
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/api-docs" 
              active={location.pathname === '/api-docs'}
              className="px-3 text-primary small"
            >
              API Documentation
            </Nav.Link>

            {hasPermission('agent.deploy') && (
              <Nav.Link 
                as={Link} 
                to="/deployment" 
                className={`px-3 text-warning small ${location.pathname === '/deployment' ? 'active' : ''}`}
              >
                Deployment
              </Nav.Link>
            )}

            {hasPermission('template.publish') && (
              <Nav.Link 
                as={Link} 
                to="/marketplace" 
                active={location.pathname === '/marketplace'}
                className="px-3 text-primary small"
              >
                Marketplace
              </Nav.Link>
            )}


          </Nav>
        </Container>
      </div>
    </>
  );
};

export default Navbar;