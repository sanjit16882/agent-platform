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

function App() {
  return (
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
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
