import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <Icon name="agentHub" size="large" color="primary" className="me-2" />
          AgentHub
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
              className="text-warning d-flex align-items-center"
            >
              <Icon name="upload" size="small" className="me-1" />
              Upload Agent
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/manage" 
              active={location.pathname === '/manage'}
              className="text-info d-flex align-items-center"
            >
              <Icon name="settings" size="small" className="me-1" />
              Manage Agents
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/integration" 
              active={location.pathname === '/integration'}
              className="text-success"
            >
              Integration Hub
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/enterprise" 
              active={location.pathname === '/enterprise'}
              className="text-primary d-flex align-items-center"
            >
              <Icon name="enterprise" size="small" className="me-1" />
              Enterprise API
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link disabled className="d-flex align-items-center">
              <Icon name="users" size="small" className="me-1" />
              Demo User
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;