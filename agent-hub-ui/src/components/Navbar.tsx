import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <>
      {/* Main Navigation */}
      <BootstrapNavbar bg="dark" variant="dark" expand="lg" sticky="top" className="main-navbar">
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
            <Icon name="agentHub" size="large" color="primary" className="me-2" />
            AgentHub
          </BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Core Features */}
              <Nav.Link 
                as={Link} 
                to="/" 
                active={location.pathname === '/'}
                className="d-flex align-items-center px-2"
              >
                <Icon name="dashboard" size="small" className="me-1" />
                Dashboard
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/agents" 
                active={location.pathname === '/agents'}
                className="d-flex align-items-center px-2"
              >
                <Icon name="grid" size="small" className="me-1" />
                Agents
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/upload" 
                active={location.pathname === '/upload'}
                className="d-flex align-items-center px-2 text-warning"
              >
                <Icon name="upload" size="small" className="me-1" />
                Upload
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/manage" 
                active={location.pathname === '/manage'}
                className="d-flex align-items-center px-2 text-info"
              >
                <Icon name="settings" size="small" className="me-1" />
                Manage
              </Nav.Link>

              <Nav.Link 
                as={Link} 
                to="/metrics" 
                active={location.pathname === '/metrics'}
                className="d-flex align-items-center px-2 text-danger"
              >
                <Icon name="activity" size="small" className="me-1" />
                Metrics
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link disabled className="text-light small">
                <Icon name="users" size="small" className="me-1" />
                Demo User
              </Nav.Link>
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
              className="d-flex align-items-center px-3 text-success small"
            >
              <Icon name="view" size="small" className="me-1" />
              Integration Guide
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/use-cases" 
              active={location.pathname === '/use-cases'}
              className="d-flex align-items-center px-3 small"
            >
              <Icon name="target" size="small" className="me-1" />
              Use Cases
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/integration" 
              active={location.pathname === '/integration'}
              className="d-flex align-items-center px-3 text-info small"
            >
              <Icon name="enterprise" size="small" className="me-1" />
              Platform Integration
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/enterprise" 
              active={location.pathname === '/enterprise'}
              className="d-flex align-items-center px-3 text-primary small"
            >
              <Icon name="enterprise" size="small" className="me-1" />
              Enterprise API
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/api-docs" 
              active={location.pathname === '/api-docs'}
              className="d-flex align-items-center px-3 text-success small"
            >
              <Icon name="view" size="small" className="me-1" />
              API Docs
            </Nav.Link>
          </Nav>
        </Container>
      </div>
    </>
  );
};

export default Navbar;