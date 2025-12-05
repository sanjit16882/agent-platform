import React, { useState } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import VectorDBAdminDashboard from '../components/VectorDBAdminDashboard';
import VectorDBDocumentManager from '../components/VectorDBDocumentManager';
import VectorDBIntegrationsManager from '../components/VectorDBIntegrationsManager';

const VectorDBAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('documents');
  
  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">🔐 Vector DB Administration</h1>
      
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'documents')} className="mb-3">
        <Tab eventKey="documents" title="📚 Document Management">
          <VectorDBDocumentManager />
        </Tab>
        
        <Tab eventKey="integrations" title="🔗 Integrations">
          <VectorDBIntegrationsManager />
        </Tab>
        
        <Tab eventKey="access" title="🔑 Access Requests">
          <VectorDBAdminDashboard />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default VectorDBAdminPage;
