import React, { useState, useCallback, useRef } from 'react';
import { Card, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { AgentCanvas } from './AgentCanvas';
import { AgentLibrary } from './AgentLibrary';
import { WorkflowValidator } from './WorkflowValidator';
import { HybridAgentPreview } from './HybridAgentPreview';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  inputs: string[];
  outputs: string[];
  category: string;
}

interface WorkflowNode {
  id: string;
  agentId: string;
  position: { x: number; y: number };
  inputs: Record<string, string>; // input_name -> source_node_id:output_name
  outputs: string[];
}

interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourceOutput: string;
  targetNodeId: string;
  targetInput: string;
}

interface HybridAgentDefinition {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  inputMappings: Record<string, string>; // workflow_input -> node_id:input_name
  outputMappings: Record<string, string>; // workflow_output -> node_id:output_name
}

export const HybridAgentBuilder: React.FC = () => {
  const [hybridAgent, setHybridAgent] = useState<HybridAgentDefinition>({
    name: '',
    description: '',
    nodes: [],
    connections: [],
    inputMappings: {},
    outputMappings: {}
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<any>(null);

  const handleAgentDrop = useCallback((agent: Agent, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      agentId: agent.id,
      position,
      inputs: {},
      outputs: agent.outputs
    };

    setHybridAgent(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, []);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setHybridAgent(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, position } : node
      )
    }));
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setHybridAgent(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(
        conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      )
    }));
  }, []);

  const handleConnectionCreate = useCallback((connection: Omit<WorkflowConnection, 'id'>) => {
    const newConnection: WorkflowConnection = {
      ...connection,
      id: `conn_${Date.now()}`
    };

    setHybridAgent(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      nodes: prev.nodes.map(node => {
        if (node.id === connection.targetNodeId) {
          return {
            ...node,
            inputs: {
              ...node.inputs,
              [connection.targetInput]: `${connection.sourceNodeId}:${connection.sourceOutput}`
            }
          };
        }
        return node;
      })
    }));
  }, []);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    const connection = hybridAgent.connections.find(c => c.id === connectionId);
    if (!connection) return;

    setHybridAgent(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionId),
      nodes: prev.nodes.map(node => {
        if (node.id === connection.targetNodeId) {
          const newInputs = { ...node.inputs };
          delete newInputs[connection.targetInput];
          return { ...node, inputs: newInputs };
        }
        return node;
      })
    }));
  }, [hybridAgent.connections]);

  const validateWorkflow = useCallback(async () => {
    try {
      // Simulate validation API call
      const results = {
        isValid: hybridAgent.nodes.length > 0,
        errors: [],
        warnings: [],
        suggestions: []
      };

      if (hybridAgent.nodes.length === 0) {
        results.errors.push('Workflow must contain at least one agent');
      }

      // Check for disconnected nodes
      const connectedNodes = new Set();
      hybridAgent.connections.forEach(conn => {
        connectedNodes.add(conn.sourceNodeId);
        connectedNodes.add(conn.targetNodeId);
      });

      const disconnectedNodes = hybridAgent.nodes.filter(node => 
        !connectedNodes.has(node.id) && hybridAgent.nodes.length > 1
      );

      if (disconnectedNodes.length > 0) {
        results.warnings.push(`${disconnectedNodes.length} disconnected nodes found`);
      }

      // Check for circular dependencies
      const hasCircularDependency = checkCircularDependencies(hybridAgent.nodes, hybridAgent.connections);
      if (hasCircularDependency) {
        results.errors.push('Circular dependency detected in workflow');
      }

      setValidationResults(results);
      return results;
    } catch (error) {
      console.error('Validation failed:', error);
      return { isValid: false, errors: ['Validation failed'], warnings: [], suggestions: [] };
    }
  }, [hybridAgent]);

  const checkCircularDependencies = (nodes: WorkflowNode[], connections: WorkflowConnection[]): boolean => {
    // Simple cycle detection using DFS
    const graph: Record<string, string[]> = {};
    nodes.forEach(node => {
      graph[node.id] = [];
    });

    connections.forEach(conn => {
      graph[conn.sourceNodeId].push(conn.targetNodeId);
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      for (const neighbor of graph[nodeId] || []) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    return nodes.some(node => hasCycle(node.id));
  };

  const saveHybridAgent = useCallback(async () => {
    if (!hybridAgent.name.trim()) {
      alert('Please enter a name for the hybrid agent');
      return;
    }

    const validation = await validateWorkflow();
    if (!validation.isValid) {
      alert('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call to save hybrid agent
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Hybrid agent saved successfully!');
      
      // Reset form
      setHybridAgent({
        name: '',
        description: '',
        nodes: [],
        connections: [],
        inputMappings: {},
        outputMappings: {}
      });
      setValidationResults(null);
    } catch (error) {
      alert('Failed to save hybrid agent');
    } finally {
      setIsSaving(false);
    }
  }, [hybridAgent, validateWorkflow]);

  return (
    <div className="hybrid-agent-builder">
      <Card className="mb-4">
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0">Hybrid Agent Builder</h4>
              <small className="text-muted">
                Combine multiple agents into powerful workflows
              </small>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={validateWorkflow}
                  disabled={hybridAgent.nodes.length === 0}
                >
                  <i className="fas fa-check-circle me-2"></i>
                  Validate
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPreview(true)}
                  disabled={hybridAgent.nodes.length === 0}
                >
                  <i className="fas fa-eye me-2"></i>
                  Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={saveHybridAgent}
                  disabled={isSaving || hybridAgent.nodes.length === 0}
                >
                  {isSaving ? (
                    <i className="fas fa-spinner fa-spin me-2"></i>
                  ) : (
                    <i className="fas fa-save me-2"></i>
                  )}
                  Save
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Hybrid Agent Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter hybrid agent name"
                  value={hybridAgent.name}
                  onChange={(e) => setHybridAgent(prev => ({ ...prev, name: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Describe the hybrid agent's purpose"
                  value={hybridAgent.description}
                  onChange={(e) => setHybridAgent(prev => ({ ...prev, description: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>

          {validationResults && (
            <WorkflowValidator results={validationResults} />
          )}
        </Card.Body>
      </Card>

      <Row>
        <Col md={3}>
          <AgentLibrary onAgentSelect={(agent) => console.log('Selected:', agent)} />
        </Col>
        <Col md={9}>
          <AgentCanvas
            ref={canvasRef}
            nodes={hybridAgent.nodes}
            connections={hybridAgent.connections}
            selectedNode={selectedNode}
            onAgentDrop={handleAgentDrop}
            onNodeMove={handleNodeMove}
            onNodeSelect={setSelectedNode}
            onNodeDelete={handleNodeDelete}
            onConnectionCreate={handleConnectionCreate}
            onConnectionDelete={handleConnectionDelete}
          />
        </Col>
      </Row>

      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Hybrid Agent Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <HybridAgentPreview hybridAgent={hybridAgent} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HybridAgentBuilder;