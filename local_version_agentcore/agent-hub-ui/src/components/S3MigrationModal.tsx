import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useAgentContext } from '../context/AgentContext';

interface S3MigrationModalProps {
  show: boolean;
  onHide: () => void;
}

const S3MigrationModal: React.FC<S3MigrationModalProps> = ({ show, onHide }) => {
  const { migrateToS3, isLoading } = useAgentContext();
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleMigrate = async () => {
    setMigrationStatus('migrating');
    setErrorMessage('');
    
    try {
      await migrateToS3();
      setMigrationStatus('success');
      setTimeout(() => {
        onHide();
        setMigrationStatus('idle');
      }, 2000);
    } catch (error) {
      setMigrationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Migration failed');
    }
  };

  const getLocalStorageAgentCount = () => {
    try {
      const saved = localStorage.getItem('deployedAgents');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  };

  const localAgentCount = getLocalStorageAgentCount();

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>🚀 Migrate Agents to S3</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {migrationStatus === 'idle' && (
          <>
            <Alert variant="info">
              <Alert.Heading>Why migrate to S3?</Alert.Heading>
              <ul className="mb-0">
                <li><strong>Persistent storage:</strong> Your agents won't disappear when you clear browser data</li>
                <li><strong>Cross-device access:</strong> Access your agents from any browser or device</li>
                <li><strong>Backup & versioning:</strong> Built-in durability and version control</li>
                <li><strong>Better performance:</strong> No localStorage size limitations</li>
              </ul>
            </Alert>
            
            {localAgentCount > 0 ? (
              <Alert variant="warning">
                <strong>Found {localAgentCount} agent{localAgentCount !== 1 ? 's' : ''} in browser storage</strong>
                <br />
                These will be migrated to S3 and removed from browser storage.
              </Alert>
            ) : (
              <Alert variant="success">
                <strong>No agents found in browser storage</strong>
                <br />
                Your agents are already stored in S3 or you haven't created any yet.
              </Alert>
            )}
          </>
        )}

        {migrationStatus === 'migrating' && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5>Migrating agents to S3...</h5>
            <p className="text-muted">This may take a few moments</p>
            <ProgressBar animated now={100} />
          </div>
        )}

        {migrationStatus === 'success' && (
          <Alert variant="success">
            <Alert.Heading>✅ Migration Complete!</Alert.Heading>
            <p className="mb-0">
              Your agents have been successfully migrated to S3. 
              They are now safely stored in the cloud and will persist across browser sessions.
            </p>
          </Alert>
        )}

        {migrationStatus === 'error' && (
          <Alert variant="danger">
            <Alert.Heading>❌ Migration Failed</Alert.Heading>
            <p className="mb-0">
              <strong>Error:</strong> {errorMessage}
              <br />
              <small>Your agents are still safe in browser storage. Please try again or contact support.</small>
            </p>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        {migrationStatus === 'idle' && (
          <>
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleMigrate}
              disabled={localAgentCount === 0 || isLoading}
            >
              {localAgentCount > 0 ? `Migrate ${localAgentCount} Agent${localAgentCount !== 1 ? 's' : ''}` : 'No Agents to Migrate'}
            </Button>
          </>
        )}
        
        {migrationStatus === 'migrating' && (
          <Button variant="primary" disabled>
            <Spinner animation="border" size="sm" className="me-2" />
            Migrating...
          </Button>
        )}
        
        {migrationStatus === 'error' && (
          <>
            <Button variant="secondary" onClick={onHide}>
              Close
            </Button>
            <Button variant="primary" onClick={handleMigrate}>
              Try Again
            </Button>
          </>
        )}
        
        {migrationStatus === 'success' && (
          <Button variant="success" onClick={onHide}>
            Done
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default S3MigrationModal;