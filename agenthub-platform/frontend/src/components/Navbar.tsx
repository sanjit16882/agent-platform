import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          🤖 AgentHub
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              active={location.pathname === '/'}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/agents" 
              active={location.pathname === '/agents'}
            >
              Agent Catalog
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/upload" 
              active={location.pathname === '/upload'}
              className="text-warning"
            >
              🚀 Upload Agent
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/manage" 
              active={location.pathname === '/manage'}
              className="text-info"
            >
              🔧 Manage Agents
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/enterprise" 
              active={location.pathname === '/enterprise'}
              className="text-primary"
            >
              🔌 Enterprise API
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link disabled>
              💰 Cost Today: $2.47
            </Nav.Link>
            <Nav.Link disabled>
              👤 Demo User
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;