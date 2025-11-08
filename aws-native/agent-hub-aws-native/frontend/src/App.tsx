import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
// import { Authenticator } from '@aws-amplify/ui-react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { awsConfig } from './aws-config';

// Import components
import AgentCatalog from './components/AgentCatalog';
import AgentBuilder from './components/AgentBuilder';
import Dashboard from './components/Dashboard.simple';
import Analytics from './components/Analytics';
import AgentExecutionInterface from './components/AgentExecutionInterface';

// Import styles
import 'bootstrap/dist/css/bootstrap.min.css';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// Configure Amplify
Amplify.configure(awsConfig);

function App() {
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="/">
            🤖 Agent Hub Platform - Enterprise AI Management
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">Dashboard</Nav.Link>
              <Nav.Link href="/agents">Agent Catalog</Nav.Link>
              <Nav.Link href="/builder">Agent Builder</Nav.Link>
              <Nav.Link href="/execute">Execute</Nav.Link>
              <Nav.Link href="/analytics">Analytics</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link>
                Demo Mode
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="mt-4">
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<AgentCatalog />} />
            <Route path="/builder" element={<AgentBuilder />} />
            <Route path="/execute" element={<AgentExecutionInterface />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Router>
      </Container>
    </div>
  );
}

export default App;