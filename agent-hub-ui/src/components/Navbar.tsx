import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { FaUser, FaSignOutAlt, FaCog, FaStore } from 'react-icons/fa';

// Type assertion for React Icons compatibility
const UserIcon = FaUser as any;
const SignOutIcon = FaSignOutAlt as any;
const CogIcon = FaCog as any;
const StoreIcon = FaStore as any;

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
                to="/marketplace" 
                className={`px-2 ${location.pathname === '/marketplace' ? 'active' : ''}`}
              >
                <StoreIcon className="me-1" />
                Marketplace
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

              <NavDropdown title="Developer Tools" id="developer-tools-dropdown" className="px-2">
                <NavDropdown.Header>📚 Documentation</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/api-docs">
                  API Documentation
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/integration-guide">
                  Integration Guide
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header>🔌 Integration & Testing</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/mcp-test">
                  🔌 MCP Test & Integration
                  <Badge bg="success" className="ms-1">NEW</Badge>
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/integration">
                  Platform Integration
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/enterprise">
                  Enterprise Integration
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header>🛠️ Development Tools</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/cli-guide">
                  CLI & IDE Integration
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/sdk-docs">
                  SDKs & Libraries
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/webhooks">
                  Webhooks & Events
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/api-keys">
                  API Key Management
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header>🚀 Extensions</NavDropdown.Header>
                <NavDropdown.Item href="#" onClick={(e) => {
                  e.preventDefault();
                  window.open('https://marketplace.visualstudio.com/search?term=agenthub&target=VSCode', '_blank');
                }}>
                  Get VS Code Extension
                </NavDropdown.Item>
              </NavDropdown>

              {canAccessFeature('cost-management') && (
                <NavDropdown title="Analytics" id="analytics-dropdown" className="px-2">
                  <NavDropdown.Item as={Link} to="/analytics">
                    📊 Real Analytics
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/business-intelligence">
                    💡 Business Intelligence
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/intelligence">
                    🧠 Intelligence Layer
                    <Badge bg="success" className="ms-1">NEW</Badge>
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/learning">
                    🎯 Continuous Learning
                    <Badge bg="primary" className="ms-1">LIVE</Badge>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/metrics">
                    ⚡ Real CloudWatch Metrics
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/finops">
                    💰 FinOps Dashboard
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/analytics-comparison">
                    🔄 Compare Analytics
                  </NavDropdown.Item>
                </NavDropdown>
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
    </>
  );
};

export default Navbar;