import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAgentContext } from '../context/AgentContext';
import { migrationHelper } from '../utils/migrationHelper';

const S3MigrationHelper: React.FC = () => {
  const { migrateToS3, isLoading, loadAgentsFromS3 } = useAgentContext();
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'checking' | 'migrating' | 'success' | 'error' | 'adding-samples'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [localAgentCount, setLocalAgentCount] = useState<number>(0);
  const [s3AgentCount, setS3AgentCount] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const checkLocalStorage = () => {
    try {
      const localAgents = migrationHelper.checkForLocalStorageAgents();
      setLocalAgentCount(localAgents.length);
      return localAgents.length;
    } catch {
      return 0;
    }
  };

  const checkTotalAgents = async () => {
    try {
      // Get all agents from S3 (most reliable source)
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/v1/agents/s3`);
      const data = await response.json();
      
      if (data.success) {
        // Filter out template agents (they're not real manageable agents)
        const realAgents = data.data.filter((agent: any) => agent.agent_type !== 'template' && agent.type !== 'template');
        const totalAgents = realAgents.length;
        setS3AgentCount(totalAgents);
        return totalAgents;
      }
      return 0;
    } catch (error) {
      console.error('Error checking total agents:', error);
      return 0;
    }
  };

  const handleMigrate = async () => {
    setMigrationStatus('migrating');
    setErrorMessage('');
    
    try {
      const result = await migrationHelper.migrateAgentsToS3();
      
      if (result.success) {
        setMigrationStatus('success');
        setLocalAgentCount(0);
        await checkTotalAgents();
        await loadAgentsFromS3(); // Refresh the agent list
      } else {
        setMigrationStatus('error');
        setErrorMessage(result.errors.join(', ') || 'Migration failed');
      }
    } catch (error) {
      setMigrationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Migration failed');
    }
  };

  const handleAddSamples = async () => {
    setMigrationStatus('adding-samples');
    setErrorMessage('');
    
    try {
      await migrationHelper.addSampleAgents();
      setMigrationStatus('success');
      await checkTotalAgents();
      await loadAgentsFromS3(); // Refresh the agent list
    } catch (error) {
      setMigrationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add sample agents');
    }
  };

  const handleCheck = async () => {
    setInitialLoading(true);
    setMigrationStatus('checking');
    checkLocalStorage();
    await checkTotalAgents();
    setInitialLoading(false);
    setMigrationStatus('idle');
  };

  // Check on component mount
  useEffect(() => {
    const initCheck = async () => {
      setInitialLoading(true);
      checkLocalStorage();
      await checkTotalAgents();
      setInitialLoading(false);
      setMigrationStatus('idle');
    };
    initCheck();
  }, []);

  return (
    <Card className="mb-4">
      <Card.Header className="bg-info text-white">
        <h6 className="mb-0">📊 System Status</h6>
      </Card.Header>
      <Card.Body>
        {initialLoading ? (
          <div className="text-center p-3">
            <Spinner animation="border" size="sm" />
            <div className="mt-2 small text-muted">Loading agent information...</div>
          </div>
        ) : migrationStatus === 'idle' && (
          <>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Browser Storage:</strong>
                    <Badge bg={localAgentCount > 0 ? 'warning' : 'success'} className="ms-2">
                      {localAgentCount}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Total Agents:</strong>
                    <Badge bg={s3AgentCount > 0 ? 'success' : 'secondary'} className="ms-2">
                      {s3AgentCount}
                    </Badge>
                  </div>

                </div>
              </div>
            </div>
            
            {localAgentCount > 0 ? (
              <>
                <Alert variant="warning">
                  <strong>Migration Available:</strong> You have {localAgentCount} agent{localAgentCount !== 1 ? 's' : ''} in browser storage that can be migrated to S3.
                </Alert>
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    onClick={handleMigrate}
                    disabled={isLoading}
                  >
                    🚀 Migrate {localAgentCount} Agent{localAgentCount !== 1 ? 's' : ''} to S3
                  </Button>
                </div>
              </>
            ) : s3AgentCount === 0 ? (
              <>
                <Alert variant="info">
                  <strong>No Agents Found:</strong> No agents found in browser storage or system. Would you like to add some sample agents to get started?
                </Alert>
                <div className="d-grid">
                  <Button 
                    variant="success" 
                    onClick={handleAddSamples}
                    disabled={isLoading}
                  >
                    ✨ Add Sample Agents
                  </Button>
                </div>
              </>
            ) : (
              <Alert variant="success">
                <strong>✅ System Ready:</strong> {s3AgentCount} agent{s3AgentCount !== 1 ? 's' : ''} available in the system.
              </Alert>
            )}
          </>
        )}

        {migrationStatus === 'checking' && (
          <div className="text-center">
            <Spinner animation="border" variant="info" className="mb-3" />
            <h6>Checking storage status...</h6>
          </div>
        )}

        {migrationStatus === 'migrating' && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h6>Migrating agents to S3...</h6>
            <p className="text-muted">This may take a few moments</p>
          </div>
        )}

        {migrationStatus === 'adding-samples' && (
          <div className="text-center">
            <Spinner animation="border" variant="success" className="mb-3" />
            <h6>Adding sample agents...</h6>
            <p className="text-muted">Creating demonstration agents</p>
          </div>
        )}

        {migrationStatus === 'success' && (
          <Alert variant="success">
            <strong>✅ Operation Complete!</strong> Agents have been successfully processed. The page will refresh automatically.
            <div className="mt-2">
              <Button variant="outline-success" size="sm" onClick={() => {
                // Reset sample data and refresh
                const { agentManagementService } = require('../services/agentManagementService');
                agentManagementService.resetSampleData();
                setTimeout(() => window.location.reload(), 500);
              }}>
                🔄 Refresh Page
              </Button>
            </div>
          </Alert>
        )}

        {migrationStatus === 'error' && (
          <Alert variant="danger">
            <strong>❌ Operation Failed:</strong> {errorMessage}
            <div className="mt-2">
              <Button variant="outline-primary" size="sm" onClick={localAgentCount > 0 ? handleMigrate : handleAddSamples}>
                Try Again
              </Button>
            </div>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default S3MigrationHelper;