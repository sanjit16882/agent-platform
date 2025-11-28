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
      <BootstrapNavbar 
        expand="lg" 
        className="main-navbar" 
        fixed="top"
        variant="dark"
        style={{
          background: '#1e3a8a',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '0',
          minHeight: '56px'
        }}
      >
        <Container fluid style={{ padding: '0 2rem' }}>
          <BootstrapNavbar.Brand 
            as={Link} 
            to="/" 
            className="d-flex align-items-center"
            style={{
              padding: '0.75rem 0',
              marginRight: '3rem',
              textDecoration: 'none'
            }}
          >
            {/* AH Logo */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              padding: '0.4rem 0.6rem',
              borderRadius: '8px',
              marginRight: '0.75rem',
              boxShadow: '0 2px 8px rgba(96, 165, 250, 0.3)',
              letterSpacing: '-2px'
            }}>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: '#fff',
                lineHeight: '1'
              }}>A</span>
              <span style={{
                fontSize: '1rem',
                fontWeight: '800',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: '1'
              }}>H</span>
            </div>
            
            {/* Agent Hub Text */}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#fff',
                letterSpacing: '-0.3px'
              }}>Agent Hub</span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '500',
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>AI Platform</span>
            </div>
          </BootstrapNavbar.Brand>
          
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
          
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto" style={{ gap: '0.5rem' }}>
              {/* Core Features */}
              <Nav.Link 
                as={Link} 
                to="/" 
                className={location.pathname === '/' ? 'active' : ''}
                style={{
                  color: '#fff',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  padding: '0.5rem 1rem'
                }}
              >
                Dashboard
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/agents" 
                className={`px-4 ${location.pathname === '/agents' ? 'active' : ''}`}
                style={{
                  color: location.pathname === '/agents' ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: location.pathname === '/agents' ? '600' : '500',
                  borderBottom: location.pathname === '/agents' ? '2px solid #60a5fa' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                Agents
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/marketplace" 
                className={`px-4 ${location.pathname === '/marketplace' ? 'active' : ''}`}
                style={{
                  color: location.pathname === '/marketplace' ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: location.pathname === '/marketplace' ? '600' : '500',
                  borderBottom: location.pathname === '/marketplace' ? '2px solid #60a5fa' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                <StoreIcon className="me-1" style={{ fontSize: '0.9rem' }} />
                Marketplace
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/agent-builder" 
                className={`px-4 ${(location.pathname === '/agent-builder' || location.pathname === '/agent-builder-classic') ? 'active' : ''}`}
                style={{
                  color: (location.pathname === '/agent-builder' || location.pathname === '/agent-builder-classic') ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: (location.pathname === '/agent-builder' || location.pathname === '/agent-builder-classic') ? '600' : '500',
                  borderBottom: (location.pathname === '/agent-builder' || location.pathname === '/agent-builder-classic') ? '2px solid #60a5fa' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                Agent Builder
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/hybrid-builder" 
                active={location.pathname === '/hybrid-builder'}
                className="px-4"
                style={{
                  color: location.pathname === '/hybrid-builder' ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: location.pathname === '/hybrid-builder' ? '600' : '500',
                  borderBottom: location.pathname === '/hybrid-builder' ? '2px solid #60a5fa' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                Hybrid Builder
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/upload" 
                active={location.pathname === '/upload'}
                className="px-4"
                style={{
                  color: location.pathname === '/upload' ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: location.pathname === '/upload' ? '600' : '500',
                  borderBottom: location.pathname === '/upload' ? '2px solid #60a5fa' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                Upload
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/agent-testing" 
                className={`px-4 ${location.pathname.startsWith('/agent-testing') ? 'active' : ''}`}
                style={{
                  color: location.pathname.startsWith('/agent-testing') ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: location.pathname.startsWith('/agent-testing') ? '600' : '500',
                  borderBottom: location.pathname.startsWith('/agent-testing') ? '2px solid #60a5fa' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                <span style={{ fontSize: '1rem' }}>🧪</span> Agent Testing
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/manage" 
                className={`px-4 ${location.pathname === '/manage' ? 'active' : ''}`}
                style={{
                  color: location.pathname === '/manage' ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: location.pathname === '/manage' ? '600' : '500',
                  borderBottom: location.pathname === '/manage' ? '2px solid #60a5fa' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                Manage
              </Nav.Link>

              <NavDropdown 
                title={<span style={{ fontSize: '0.95rem' }}>Resources</span>} 
                id="resources-dropdown" 
                className="px-4"
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: '500'
                }}
              >
                <NavDropdown.Header>📚 Documentation</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/api-docs">
                  API Documentation
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/agent-testing/api-cli-docs">
                  💻 Agent Testing API & CLI
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/integration-guide">
                  Integration Guide
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header>🤖 Agent Resources</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/agent-templates">
                  📋 Agent Templates
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header>🗄️ Data & Knowledge</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/knowledge-bases">
                  📖 Knowledge Base Management
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/vector-db">
                  🎨 Vector DB Providers
                  <Badge bg="success" className="ms-1">NEW</Badge>
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/vector-db-admin">
                  🔐 Vector DB Admin
                  <Badge bg="warning" className="ms-1">ADMIN</Badge>
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header>🔌 MCP (Model Context Protocol)</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/mcp-management">
                  🔧 Manage MCP Servers
                  <Badge bg="primary" className="ms-1">NEW</Badge>
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/real-mcp-dashboard">
                  🐳 MCP Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/mcp-test">
                  🔌 MCP Test & Integration
                </NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header>🔗 Integration</NavDropdown.Header>
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
                <NavDropdown 
                  title={<span style={{ fontSize: '0.95rem' }}>Analytics</span>} 
                  id="analytics-dropdown" 
                  className="px-4"
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: '500'
                  }}
                >
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
            <Nav className="ms-auto">
              {isAuthenticated && user ? (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center" style={{ color: '#fff' }}>
                      <div 
                        className="me-2 d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        {user.name.split(' ')[0].charAt(0).toUpperCase()}
                      </div>
                      <span className="me-2" style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user.name.split(' ')[0]}</span>
                      <Badge 
                        className="small"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1e3a8a',
                          fontWeight: '700',
                          fontSize: '0.7rem',
                          padding: '0.35rem 0.65rem',
                          letterSpacing: '0.5px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        }}
                      >
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