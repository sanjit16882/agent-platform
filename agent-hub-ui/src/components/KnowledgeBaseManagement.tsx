/**
 * KnowledgeBaseManagement Component
 * 
 * Main page for managing knowledge bases:
 * - List all knowledge bases
 * - Create new knowledge bases
 * - View statistics
 * - Upload documents
 * - Delete knowledge bases
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
  Dropdown,
  ProgressBar
} from 'react-bootstrap';
import SearchTestModal from './SearchTestModal';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  provider: string;
  indexName: string;
  documentCount: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

const KnowledgeBaseManagement: React.FC = () => {
  
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create KB form state
  const [newKBName, setNewKBName] = useState('');
  const [newKBDescription, setNewKBDescription] = useState('');
  const [newKBProvider, setNewKBProvider] = useState('mock');
  
  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    loadKnowledgeBases();
  }, []);
  
  const loadKnowledgeBases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would call the API
      // const response = await fetch('/api/v1/knowledge-bases');
      // const data = await response.json();
      
      // Mock data for now
      setKnowledgeBases([
        {
          id: 'kb-1',
          name: 'Product Documentation',
          description: 'Product docs and user guides',
          provider: 'mock',
          indexName: 'product-documentation',
          documentCount: 150,
          sizeBytes: 5242880, // 5MB
          createdAt: '2025-11-01T10:00:00Z',
          updatedAt: '2025-11-10T15:30:00Z'
        },
        {
          id: 'kb-2',
          name: 'Support Tickets',
          description: 'Historical support tickets and resolutions',
          provider: 'mock',
          indexName: 'support-tickets',
          documentCount: 500,
          sizeBytes: 15728640, // 15MB
          createdAt: '2025-10-15T09:00:00Z',
          updatedAt: '2025-11-11T12:00:00Z'
        },
        {
          id: 'kb-3',
          name: 'FAQ Database',
          description: 'Frequently asked questions',
          provider: 'mock',
          indexName: 'faq-database',
          documentCount: 75,
          sizeBytes: 2097152, // 2MB
          createdAt: '2025-11-05T14:00:00Z',
          updatedAt: '2025-11-09T10:00:00Z'
        }
      ]);
    } catch (err: any) {
      setError('Failed to load knowledge bases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateKB = async () => {
    if (!newKBName.trim()) {
      setError('Knowledge base name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would call the API
      // const response = await fetch('/api/v1/knowledge-bases', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: newKBName,
      //     description: newKBDescription,
      //     provider: newKBProvider
      //   })
      // });
      
      setSuccess(`Knowledge base "${newKBName}" created successfully!`);
      setShowCreateModal(false);
      setNewKBName('');
      setNewKBDescription('');
      setNewKBProvider('mock');
      
      // Reload list
      await loadKnowledgeBases();
    } catch (err: any) {
      setError('Failed to create knowledge base: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteKB = async (kb: KnowledgeBase) => {
    if (!window.confirm(`Are you sure you want to delete "${kb.name}"? This will delete all documents and cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would call the API
      // await fetch(`/api/v1/knowledge-bases/${kb.id}`, { method: 'DELETE' });
      
      setSuccess(`Knowledge base "${kb.name}" deleted successfully!`);
      await loadKnowledgeBases();
    } catch (err: any) {
      setError('Failed to delete knowledge base: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUploadDocuments = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }
    
    if (!selectedKB) {
      setError('No knowledge base selected');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // In production, this would call the API
      // const formData = new FormData();
      // for (let i = 0; i < selectedFiles.length; i++) {
      //   formData.append('files', selectedFiles[i]);
      // }
      // await fetch(`/api/v1/knowledge-bases/${selectedKB.id}/documents`, {
      //   method: 'POST',
      //   body: formData
      // });
      
      setSuccess(`${selectedFiles.length} document(s) uploaded successfully!`);
      setShowUploadModal(false);
      setSelectedFiles(null);
      await loadKnowledgeBases();
    } catch (err: any) {
      setError('Failed to upload documents: ' + err.message);
    } finally {
      setUploading(false);
    }
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getTotalStats = () => {
    return {
      totalKBs: knowledgeBases.length,
      totalDocuments: knowledgeBases.reduce((sum, kb) => sum + kb.documentCount, 0),
      totalSize: knowledgeBases.reduce((sum, kb) => sum + kb.sizeBytes, 0)
    };
  };
  
  const stats = getTotalStats();
  
  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Knowledge Base Management</h2>
          <p className="text-muted mb-0">
            Manage vector databases for your AI agents
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create Knowledge Base
        </Button>
      </div>
      
      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Summary Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="mb-0">{stats.totalKBs}</h3>
              <small className="text-muted">Knowledge Bases</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="mb-0">{stats.totalDocuments.toLocaleString()}</h3>
              <small className="text-muted">Total Documents</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="mb-0">{formatBytes(stats.totalSize)}</h3>
              <small className="text-muted">Total Storage</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Knowledge Bases Grid */}
      {loading && knowledgeBases.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading knowledge bases...</p>
        </div>
      ) : knowledgeBases.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '3rem' }} className="mb-3">📚</div>
            <h4>No Knowledge Bases Yet</h4>
            <p className="text-muted">
              Create your first knowledge base to enable RAG for your agents
            </p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Knowledge Base
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {knowledgeBases.map(kb => (
            <Col md={6} lg={4} key={kb.id}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <Card.Title className="mb-1">{kb.name}</Card.Title>
                      <Badge bg="secondary" className="mb-2">{kb.provider}</Badge>
                    </div>
                    <Dropdown>
                      <Dropdown.Toggle variant="link" size="sm" className="text-muted">
                        <i className="bi bi-three-dots-vertical"></i>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() => {
                            setSelectedKB(kb);
                            setShowUploadModal(true);
                          }}
                        >
                          <i className="bi bi-upload me-2"></i>
                          Upload Documents
                        </Dropdown.Item>
                        <Dropdown.Item href={`/knowledge-bases/${kb.id}/documents`}>
                          <i className="bi bi-file-text me-2"></i>
                          View Documents
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => {
                            setSelectedKB(kb);
                            setShowSearchModal(true);
                          }}
                        >
                          <i className="bi bi-search me-2"></i>
                          Test Search
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          className="text-danger"
                          onClick={() => handleDeleteKB(kb)}
                        >
                          <i className="bi bi-trash me-2"></i>
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                  
                  <Card.Text className="text-muted small mb-3">
                    {kb.description}
                  </Card.Text>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Documents:</span>
                      <strong>{kb.documentCount.toLocaleString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Size:</span>
                      <strong>{formatBytes(kb.sizeBytes)}</strong>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">Last Updated:</span>
                      <strong>{formatDate(kb.updatedAt)}</strong>
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        setSelectedKB(kb);
                        setShowUploadModal(true);
                      }}
                    >
                      Upload
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      href={`/knowledge-bases/${kb.id}/documents`}
                    >
                      View
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Create Knowledge Base Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Knowledge Base</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Product Documentation"
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe what this knowledge base contains..."
                value={newKBDescription}
                onChange={(e) => setNewKBDescription(e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Provider</Form.Label>
              <Form.Select
                value={newKBProvider}
                onChange={(e) => setNewKBProvider(e.target.value)}
              >
                <option value="mock">Mock (Development)</option>
                <option value="opensearch">AWS OpenSearch</option>
                <option value="pinecone">Pinecone</option>
                <option value="pgvector">PostgreSQL (Pgvector)</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateKB}
            disabled={loading || !newKBName.trim()}
          >
            {loading ? 'Creating...' : 'Create Knowledge Base'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Upload Documents Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Documents</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedKB && (
            <Alert variant="info">
              <small>
                <strong>Uploading to:</strong> {selectedKB.name}
              </small>
            </Alert>
          )}
          
          <Form>
            <Form.Group>
              <Form.Label>Select Files</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept=".txt,.md,.json,.pdf,.docx"
                onChange={(e: any) => setSelectedFiles(e.target.files)}
              />
              <Form.Text className="text-muted">
                Supported formats: TXT, MD, JSON, PDF, DOCX (Max 10MB per file)
              </Form.Text>
            </Form.Group>
            
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-3">
                <small className="text-muted">
                  {selectedFiles.length} file(s) selected
                </small>
              </div>
            )}
          </Form>
          
          {uploading && (
            <div className="mt-3">
              <ProgressBar animated now={100} label="Uploading..." />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUploadDocuments}
            disabled={uploading || !selectedFiles || selectedFiles.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Search Test Modal */}
      {selectedKB && (
        <SearchTestModal
          show={showSearchModal}
          onHide={() => setShowSearchModal(false)}
          knowledgeBaseId={selectedKB.id}
          knowledgeBaseName={selectedKB.name}
        />
      )}
    </Container>
  );
};

export default KnowledgeBaseManagement;
