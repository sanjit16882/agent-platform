import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AgentCatalog from './components/AgentCatalog';
import AgentExecutor from './components/AgentExecutor';
import ResultsViewer from './components/ResultsViewer';
import AgentUpload from './components/AgentUpload';
import AgentManagement from './components/AgentManagement';
import PlatformIntegration from './components/PlatformIntegration';
import EnterpriseIntegration from './components/EnterpriseIntegration';
import IntegrationGuide from './components/IntegrationGuide';
import UseCases from './components/UseCases';
import CloudWatchMetrics from './components/CloudWatchMetrics';
import APIDocumentation from './components/APIDocumentation';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { AgentProvider } from './context/AgentContext';
import { ProgressProvider } from './context/ProgressContext';

function App() {
  return (
    <AgentProvider>
      <ProgressProvider>
        <Router>
        <div className="App">
          <Navbar />
          <div className="container-fluid mt-3">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<AgentCatalog />} />
            <Route path="/agents/:agentId/execute" element={<AgentExecutor />} />
            <Route path="/results/:executionId" element={<ResultsViewer />} />
            <Route path="/upload" element={<AgentUpload />} />
            <Route path="/manage" element={<AgentManagement />} />
            <Route path="/integration" element={<PlatformIntegration />} />
            <Route path="/enterprise" element={<EnterpriseIntegration />} />
            <Route path="/integration-guide" element={<IntegrationGuide />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/metrics" element={<CloudWatchMetrics />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/api-docs" element={<APIDocumentation />} />
          </Routes>
        </div>
      </div>
    </Router>
      </ProgressProvider>
    </AgentProvider>
  );
}

export default App;
