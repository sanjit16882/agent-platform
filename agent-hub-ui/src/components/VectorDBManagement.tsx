/**
 * VectorDBManagement
 * 
 * Main page for Vector DB provider management
 * Integrates provider selection, configuration, and access requests
 */

import React, { useState } from 'react';
import { Container, Alert } from 'react-bootstrap';
import VectorDBProviderSelection from './VectorDBProviderSelection';
import VectorDBConfigModal from './VectorDBConfigModal';
import VectorDBRequestAccessModal from './VectorDBRequestAccessModal';
import { VectorDBProvider } from '../types/vectorDB';
import api from '../utils/apiClient';

const VectorDBManagement: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<VectorDBProvider | null>(null);
  const [requestProvider, setRequestProvider] = useState<VectorDBProvider | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectProvider = (provider: VectorDBProvider) => {
    setSelectedProvider(provider);
    setShowConfigModal(true);
  };

  const handleRequestAccess = (provider: VectorDBProvider) => {
    setRequestProvider(provider);
    setShowRequestModal(true);
  };

  const handleSaveConfig = async (providerId: string, config: Record<string, any>) => {
    try {
      console.log('Saving configuration:', { providerId, config });
      
      const response = await api.post('/api/v1/vector-db/configs', {
        providerId,
        providerName: selectedProvider?.name,
        config
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(
          `✅ ${selectedProvider?.name} configured successfully! Configuration saved and will persist across restarts.`
        );
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      setSuccessMessage(`❌ Failed to save configuration: ${error.message}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleSubmitRequest = async (request: any) => {
    try {
      const response = await api.post('/api/v1/vector-db/access-requests', request);
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(
          `✅ Access request for ${requestProvider?.name} submitted! Request ID: ${data.data.id}. You'll receive an email when it's approved.`
        );
      } else {
        throw new Error(data.error || 'Failed to submit request');
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Vector Database Management</h2>

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage(null)}
          className="mb-4"
        >
          {successMessage}
        </Alert>
      )}

      <VectorDBProviderSelection
        onSelectProvider={handleSelectProvider}
        onRequestAccess={handleRequestAccess}
      />

      <VectorDBConfigModal
        show={showConfigModal}
        provider={selectedProvider}
        onHide={() => {
          setShowConfigModal(false);
          setSelectedProvider(null);
        }}
        onSave={handleSaveConfig}
      />

      <VectorDBRequestAccessModal
        show={showRequestModal}
        provider={requestProvider}
        onHide={() => {
          setShowRequestModal(false);
          setRequestProvider(null);
        }}
        onSubmit={handleSubmitRequest}
      />
    </Container>
  );
};

export default VectorDBManagement;
