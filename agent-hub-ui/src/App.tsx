import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/enterprise-theme.css';
import './styles/aws-inspired-theme.css';
import './App.css';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AWSStyleNavbar from './components/AWSStyleNavbar';
import AWSStyleDashboard from './components/AWSStyleDashboard';
import UIComparison from './components/UIComparison';
import AgentPublishingWorkflow from './components/AgentPublishingWorkflow';
import PublishingGuide from './components/PublishingGuide';
import SecurityCompliance from './components/SecurityCompliance';
import HybridAgentBuilder from './components/HybridAgentBuilder';
import AgentCatalog from './components/AgentCatalog';
import AgentExecutor from './components/AgentExecutor';
import ResultsViewer from './components/ResultsViewer';
import AgentUpload from './components/AgentUpload';
import AgentManagement from './components/AgentManagement';
import PlatformIntegration from './components/PlatformIntegration';
import EnterpriseIntegration from './components/EnterpriseIntegration';
import IntegrationGuide from './components/IntegrationGuide';

import CloudWatchMetrics from './components/CloudWatchMetrics';
import APIDocumentation from './components/APIDocumentation';
import AnalyticsDashboard from './components/AnalyticsDashboard';


import NLPTester from './components/NLPTester';
import PurposeDrivenAgentBuilder from './components/PurposeDrivenAgentBuilder';

import NaturalLanguageAgentGenerator from './components/NaturalLanguageAgentGenerator';
import ButtonTest from './components/ButtonTest';
import UserManagement from './components/UserManagement';
import RoleManagement from './components/RoleManagement';

import FinOpsDashboard from './components/FinOpsDashboard';
import DeploymentControl from './components/DeploymentControl';
import MarketplacePublishing from './components/MarketplacePublishing';
import MultiCloudDashboard from './components/MultiCloudDashboard';
import ProviderConfiguration from './components/ProviderConfiguration';
import IntegrationHub from './components/IntegrationHub';
import SecretManagement from './components/SecretManagement';
import Login from './components/Login';
import UserSwitcher from './components/UserSwitcher';
import { AgentProvider } from './context/AgentContext';
import { ProgressProvider } from './context/ProgressContext';
import { AuthProvider } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';

function App() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <AgentProvider>
          <ProgressProvider>
          <Router>
        <div className="App">
          <Navbar />
          <UserSwitcher />
          <div className="container-fluid mt-3">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aws-dashboard" element={<AWSStyleDashboard />} />
            <Route path="/ui-comparison" element={<UIComparison />} />
            <Route path="/publish-agent" element={<AgentPublishingWorkflow />} />
            <Route path="/publishing-guide" element={<PublishingGuide />} />
            <Route path="/security" element={<SecurityCompliance />} />
            <Route path="/hybrid-builder" element={<HybridAgentBuilder />} />
            <Route path="/nl-agent-generator" element={<NaturalLanguageAgentGenerator />} />
            <Route path="/agents" element={<AgentCatalog />} />
            <Route path="/agents/:agentId/execute" element={<AgentExecutor />} />
            <Route path="/results/:executionId" element={<ResultsViewer />} />
            <Route path="/upload" element={<AgentUpload />} />
            <Route path="/manage" element={<AgentManagement />} />
            <Route path="/integration" element={<PlatformIntegration />} />
            <Route path="/enterprise" element={<EnterpriseIntegration />} />
            <Route path="/integration-guide" element={<IntegrationGuide />} />

            <Route path="/metrics" element={<CloudWatchMetrics />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/api-docs" element={<APIDocumentation />} />

            <Route path="/agent-builder" element={<PurposeDrivenAgentBuilder />} />
            <Route path="/agent-builder-old" element={<NLPTester />} />
            <Route path="/button-test" element={<ButtonTest />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/roles" element={<RoleManagement />} />

            <Route path="/finops" element={<FinOpsDashboard />} />
            <Route path="/deployment" element={<DeploymentControl />} />
            <Route path="/marketplace" element={<MarketplacePublishing />} />
            <Route path="/multicloud" element={<MultiCloudDashboard />} />
            <Route path="/providers" element={<ProviderConfiguration />} />
            <Route path="/integration" element={<IntegrationHub />} />
            <Route path="/secrets" element={<SecretManagement />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
          </ProgressProvider>
        </AgentProvider>
      </SecurityProvider>
    </AuthProvider>
  );
}

export default App;
