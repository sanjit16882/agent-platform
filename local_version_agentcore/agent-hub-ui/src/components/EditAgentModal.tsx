import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import BedrockModelSelector from './BedrockModelSelector';
import TestRecommendationSection from './TestRecommendationSection';
import { mcpConfigService } from '../services/mcpConfigService';
import { realMCPService } from '../services/realMCPService';

interface EditAgentModalProps {
  show: boolean;
  onHide: () => void;
  agent: any;
  onSave: (updatedAgent: any) => Promise<void>;
}

export const EditAgentModal: React.FC<EditAgentModalProps> = ({
  show,
  onHide,
  agent,
  onSave
}) => {
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedModelName, setSelectedModelName] = useState('');
  const [selectedMCPServer, setSelectedMCPServer] = useState('');
  const [mcpServers, setMcpServers] = useState<Array<any>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingServers, setLoadingServers] = useState(false);
  
  // Test Recommendation state
  const [agentCategory, setAgentCategory] = useState<string | null>(null);
  const [agentSubType, setAgentSubType] = useState<string | null>(null);

  useEffect(() => {
    if (agent && show) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('📝 EDIT AGENT MODAL - Loading Data');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📝 Full Agent Object:', JSON.stringify(agent, null, 2));
      console.log('📝 Agent Category from object:', agent.category);
      console.log('📝 Agent Sub-Type from object:', agent.agentSubType);
      
      // Load agent data
      setAgentName(agent.name || '');
      setAgentDescription(agent.description || '');
      setSelectedModel(agent.selectedModel || agent.bedrockConfig?.defaultModel || '');
      setSelectedModelName(agent.selectedModelName || agent.bedrockConfig?.modelName || '');
      
      // Load Test Recommendation data
      const loadedCategory = agent.category || null;
      const loadedSubType = agent.agentSubType || null;
      
      console.log('📝 Setting Category to:', loadedCategory);
      console.log('📝 Setting Sub-Type to:', loadedSubType);
      
      setAgentCategory(loadedCategory);
      setAgentSubType(loadedSubType);
      
      // Load MCP association from agent's mcpIntegration
      const mcpServerId = agent.mcpIntegration?.selectedServers?.[0] || '';
      console.log('📝 Agent MCP Server ID:', mcpServerId);
      setSelectedMCPServer(mcpServerId);
      
      // Load available MCP servers from realMCPService (same as Hybrid Agent Builder)
      loadMCPServers();
      
      console.log('═══════════════════════════════════════════════════════');
    }
  }, [agent, show]);

  const loadMCPServers = async () => {
    try {
      setLoadingServers(true);
      console.log('📝 Loading real MCP servers from realMCPService...');
      const servers = await realMCPService.getRealDockerServers();
      console.log('📝 Available MCP Servers:', servers.length);
      console.log('📝 MCP Servers:', servers);
      setMcpServers(servers);
    } catch (error) {
      console.error('📝 Error loading MCP servers:', error);
      setMcpServers([]);
    } finally {
      setLoadingServers(false);
    }
  };

  const handleMCPServerChange = (serverId: string) => {
    setSelectedMCPServer(serverId);
    
    // Note: Model selection is handled separately
    // MCP servers don't have pre-configured models in this flow
    // Users select the model independently
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!agentName.trim()) {
        setError('Agent name is required');
        return;
      }

      console.log('═══════════════════════════════════════════════════════');
      console.log('💾 SAVING AGENT - Current State');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Agent Name:', agentName);
      console.log('Agent Category:', agentCategory);
      console.log('Agent Sub-Type:', agentSubType);
      console.log('Selected Model:', selectedModel);
      console.log('Selected MCP Server:', selectedMCPServer);

      const updatedAgent = {
        ...agent,
        name: agentName,
        description: agentDescription,
        category: agentCategory,
        agentSubType: agentSubType,
        selectedModel: selectedModel,
        selectedModelName: selectedModelName,
        bedrockConfig: selectedModel ? {
          defaultModel: selectedModel,
          modelName: selectedModelName,
          provider: 'aws-bedrock',
          region: 'us-east-1'
        } : undefined,
        mcpIntegration: selectedMCPServer ? {
          enabled: true,
          selectedServers: [selectedMCPServer],
          autoDetected: false
        } : undefined
      };

      console.log('💾 Updated Agent Object:', JSON.stringify(updatedAgent, null, 2));
      console.log('═══════════════════════════════════════════════════════');

      // MCP association is saved in the agent's mcpIntegration field
      // No need for separate localStorage tracking
      
      await onSave(updatedAgent);
      onHide();
    } catch (err) {
      console.error('❌ Error saving agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      dialogClassName="modal-dialog-centered"
    >
      <Modal.Header 
        closeButton
        style={{ 
          backgroundColor: '#f0f9ff',
          borderBottom: '2px solid #0ea5e9'
        }}
      >
        <Modal.Title style={{ color: '#0369a1' }}>Edit Agent</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Agent Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Enter agent name"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  placeholder="Describe what this agent does"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>MCP Server (Optional)</Form.Label>
                {loadingServers ? (
                  <div className="text-center py-2">
                    <span>Loading MCP servers...</span>
                  </div>
                ) : (
                  <>
                    <Form.Select
                      value={selectedMCPServer}
                      onChange={(e) => handleMCPServerChange(e.target.value)}
                    >
                      <option value="">None - No MCP integration</option>
                      {mcpServers.map(server => (
                        <option key={server.id} value={server.id}>
                          {server.name} - {server.description}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Select an MCP server to give your agent access to external tools and data sources.
                      {mcpServers.length === 0 && (
                        <span className="text-warning">
                          {' '}No MCP servers available. Make sure Docker MCP servers are running.
                        </span>
                      )}
                    </Form.Text>
                  </>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <BedrockModelSelector
                selectedModel={selectedModel}
                onModelChange={(modelId, modelName) => {
                  setSelectedModel(modelId);
                  setSelectedModelName(modelName);
                }}
                agentType={agent.category || 'hybrid'}
                label="AI Model"
                required={false}
                disabled={false}
              />
              {selectedMCPServer && (
                <Alert variant="info" className="mt-2">
                  <small>
                    <strong>ℹ️ MCP Server Selected</strong><br />
                    Your agent will have access to the tools provided by the {mcpServers.find(s => s.id === selectedMCPServer)?.name || 'selected'} MCP server.
                  </small>
                </Alert>
              )}
            </Col>
          </Row>

          {/* Test Recommendation Section */}
          <Row>
            <Col md={12}>
              <div className="mt-3">
                <TestRecommendationSection
                  category={agentCategory}
                  agentSubType={agentSubType}
                  onCategoryChange={setAgentCategory}
                  onAgentSubTypeChange={setAgentSubType}
                  disabled={saving}
                />
              </div>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
