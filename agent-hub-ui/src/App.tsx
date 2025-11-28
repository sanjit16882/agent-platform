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
import DynamicAgentExecutor from './components/DynamicAgentExecutor';
import ResultsViewer from './components/ResultsViewer';
import AgentUpload from './components/AgentUpload';
import AgentManagementSimple from './components/AgentManagementSimple';
import PlatformIntegration from './components/PlatformIntegration';
import EnterpriseIntegration from './components/EnterpriseIntegration';
import IntegrationGuide from './components/IntegrationGuide';
import SDKDocumentation from './components/SDKDocumentation';
import WebhooksDocumentation from './components/WebhooksDocumentation';

import RealCloudWatchMetrics from './components/RealCloudWatchMetrics';
import RealAPIDocumentation from './components/RealAPIDocumentation';
import APIKeyManagement from './components/APIKeyManagement';
import RealAnalyticsDashboard from './components/RealAnalyticsDashboard';
import BusinessIntelligenceDashboard from './components/BusinessIntelligenceDashboard';
import AnalyticsComparison from './components/AnalyticsComparison';
import ContinuousLearningDashboard from './components/ContinuousLearningDashboard';


import NLPTester from './components/NLPTester';
import PurposeDrivenAgentBuilder from './components/PurposeDrivenAgentBuilder';
import NLPAgentBuilder from './components/NLPAgentBuilder';

import NaturalLanguageAgentGenerator from './components/NaturalLanguageAgentGenerator';
import ButtonTest from './components/ButtonTest';
import UserManagement from './components/UserManagement';
import RoleManagement from './components/RoleManagement';

import RealFinOpsDashboard from './components/RealFinOpsDashboard';
import DeploymentControl from './components/DeploymentControl';
import Marketplace from './components/Marketplace';
import MarketplacePublishing from './components/MarketplacePublishing';
import MultiCloudDashboard from './components/MultiCloudDashboard';
import ProviderConfiguration from './components/ProviderConfiguration';
import IntegrationHub from './components/IntegrationHub';
import SecretManagement from './components/SecretManagement';
import Login from './components/Login';
import UserSwitcher from './components/UserSwitcher';
import CLIGuide from './components/CLIGuide';
import { SimpleIntelligenceDemo } from './components/SimpleIntelligenceDemo';
import MCPTestPage from './components/MCPTestPage';
import { RealMCPDemo } from './components/RealMCPDemo';
import { RealMCPDashboard } from './components/RealMCPDashboard';
import { MCPManagementPage } from './components/mcp/MCPManagementPage';
import GitHubIntegrationDemo from './components/GitHubIntegrationDemo';
import AgentTestingMain from './components/testing/AgentTestingMain';
import KnowledgeBaseManagement from './components/KnowledgeBaseManagement';
import AgentTemplatesPage from './components/AgentTemplatesPage';
import VectorDBPage from './pages/VectorDBPage';
import VectorDBAdminPage from './pages/VectorDBAdminPage';
import ApiCliDocumentationPage from './pages/ApiCliDocumentationPage';
import { AgentProvider } from './context/AgentContext';
import { ProgressProvider } from './context/ProgressContext';
import { AuthProvider } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';

// Import test data generator for development
import './utils/analyticsTestData';

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
            <Route path="/agents/:agentId/execute" element={<DynamicAgentExecutor />} />
            <Route path="/agents/:agentId/execute-legacy" element={<AgentExecutor />} />
            <Route path="/results/:executionId" element={<ResultsViewer />} />
            <Route path="/upload" element={<AgentUpload />} />
            <Route path="/manage" element={<AgentManagementSimple />} />
            <Route path="/integration" element={<PlatformIntegration />} />
            <Route path="/enterprise" element={<EnterpriseIntegration />} />
            <Route path="/integration-guide" element={<IntegrationGuide />} />
            <Route path="/sdk-docs" element={<SDKDocumentation />} />
            <Route path="/webhooks" element={<WebhooksDocumentation />} />

            <Route path="/metrics" element={<RealCloudWatchMetrics />} />
            <Route path="/analytics" element={<RealAnalyticsDashboard />} />
            <Route path="/business-intelligence" element={<BusinessIntelligenceDashboard />} />
            <Route path="/analytics-comparison" element={<AnalyticsComparison />} />
            <Route path="/learning" element={<ContinuousLearningDashboard />} />
            <Route path="/api-docs" element={<RealAPIDocumentation />} />
            <Route path="/api-keys" element={<APIKeyManagement />} />
            <Route path="/cli-guide" element={<CLIGuide />} />

            <Route path="/agent-builder" element={<NLPAgentBuilder />} />
            <Route path="/agent-builder-classic" element={<PurposeDrivenAgentBuilder />} />
            <Route path="/agent-builder-old" element={<NLPTester />} />
            <Route path="/button-test" element={<ButtonTest />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/roles" element={<RoleManagement />} />

            <Route path="/finops" element={<RealFinOpsDashboard />} />
            <Route path="/deployment" element={<DeploymentControl />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace-publishing" element={<MarketplacePublishing />} />
            <Route path="/multicloud" element={<MultiCloudDashboard />} />
            <Route path="/providers" element={<ProviderConfiguration />} />
            <Route path="/integration" element={<IntegrationHub />} />
            <Route path="/secrets" element={<SecretManagement />} />
            <Route path="/intelligence" element={<SimpleIntelligenceDemo />} />
            <Route path="/mcp-test" element={<MCPTestPage />} />
            <Route path="/mcp-management" element={<MCPManagementPage />} />
            <Route path="/real-mcp-demo" element={<RealMCPDemo />} />
            <Route path="/real-mcp-dashboard" element={<RealMCPDashboard />} />
            <Route path="/github-demo" element={<GitHubIntegrationDemo />} />
            <Route path="/agent-testing/*" element={<AgentTestingMain />} />
            <Route path="/api-cli-docs" element={<ApiCliDocumentationPage />} />
            <Route path="/knowledge-bases" element={<KnowledgeBaseManagement />} />
            <Route path="/agent-templates" element={<AgentTemplatesPage />} />
            <Route path="/vector-db" element={<VectorDBPage />} />
            <Route path="/vector-db-admin" element={<VectorDBAdminPage />} />
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
