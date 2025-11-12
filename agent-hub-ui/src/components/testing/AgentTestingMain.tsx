/**
 * Agent Testing Main Component
 * 
 * Main container for the Agent Testing Framework with sub-routing
 * Implements Task 10.1: Create AgentTestingMain component
 */

import React, { useState, useEffect } from 'react';
import { Container, Nav, Tab, Badge, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import TestingOverview from './TestingOverview';
import TestSuitesList from './TestSuitesList';
import TestRunList from './TestRunList';
import MetricsDashboard from './MetricsDashboard';
import InsightsPanel from './InsightsPanel';
import { theme } from '../../styles/theme';

const AgentTestingMain: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [featureEnabled, setFeatureEnabled] = useState(true);

  useEffect(() => {
    // Check feature flag (Task 10.4)
    checkFeatureFlag();

    // Set active tab based on URL
    const path = location.pathname;
    if (path.includes('/suites')) setActiveTab('suites');
    else if (path.includes('/results')) setActiveTab('results');
    else if (path.includes('/metrics')) setActiveTab('metrics');
    else if (path.includes('/insights')) setActiveTab('insights');
    else setActiveTab('overview');
  }, [location]);

  useEffect(() => {
    console.log('🎯 Active tab changed to:', activeTab);
  }, [activeTab]);

  const checkFeatureFlag = async () => {
    try {
      // Check if testing feature is enabled
      const enabled = localStorage.getItem('testing_feature_enabled') !== 'false';
      setFeatureEnabled(enabled);
    } catch (error) {
      console.error('Failed to check feature flag:', error);
      setFeatureEnabled(true); // Default to enabled
    }
  };

  const handleTabSelect = (key: string | null) => {
    if (key) {
      console.log('🔄 Tab selected:', key);
      setActiveTab(key);
      // Update URL without full navigation
      const basePath = '/agent-testing';
      const newPath = key === 'overview' ? basePath : `${basePath}/${key}`;
      window.history.pushState({}, '', newPath);
      console.log('✅ Active tab set to:', key);
    }
  };

  if (!featureEnabled) {
    return (
      <Container className="mt-5">
        <Alert variant="info">
          <Alert.Heading>Feature Not Available</Alert.Heading>
          <p>
            The Agent Testing Framework is currently not enabled for your account.
            Please contact your administrator to enable this enterprise feature.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{ 
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '100vh',
      paddingTop: theme.spacing.xl
    }}>
      <Container fluid>
        {/* Header */}
        <div style={{ 
          marginBottom: theme.spacing['2xl'],
          paddingBottom: theme.spacing.lg,
          borderBottom: `2px solid ${theme.colors.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                fontSize: theme.typography.fontSize['3xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.primary,
                marginBottom: theme.spacing.sm,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md
              }}>
                🧪 Agent Testing
                <Badge bg="warning" text="dark" style={{ fontSize: theme.typography.fontSize.sm }}>
                  ENTERPRISE
                </Badge>
              </h1>
              <p style={{ 
                fontSize: theme.typography.fontSize.lg,
                color: theme.colors.textSecondary,
                margin: 0
              }}>
                Comprehensive testing framework for AI agents with automated evaluation and continuous improvement
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={handleTabSelect}>
          <Nav variant="tabs" className="mb-4" style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
            <Nav.Item>
              <Nav.Link eventKey="overview" style={{ fontWeight: 500 }}>
                📊 Overview
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="suites" style={{ fontWeight: 500 }}>
                📋 Test Suites
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="results" style={{ fontWeight: 500 }}>
                📝 Test Results
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="metrics" style={{ fontWeight: 500 }}>
                📈 Metrics
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="insights" style={{ fontWeight: 500 }}>
                💡 Insights
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Tab Content */}
          <Tab.Content>
            <Tab.Pane eventKey="overview">
              {activeTab === 'overview' && <TestingOverview />}
            </Tab.Pane>
            <Tab.Pane eventKey="suites">
              {activeTab === 'suites' && <TestSuitesList />}
            </Tab.Pane>
            <Tab.Pane eventKey="results">
              {activeTab === 'results' && <TestRunList />}
            </Tab.Pane>
            <Tab.Pane eventKey="metrics">
              {activeTab === 'metrics' && <MetricsDashboard />}
            </Tab.Pane>
            <Tab.Pane eventKey="insights">
              {activeTab === 'insights' && <InsightsPanel />}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </div>
  );
};

export default AgentTestingMain;
