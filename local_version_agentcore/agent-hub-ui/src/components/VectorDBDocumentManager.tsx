/**
 * VectorDBDocumentManager
 * 
 * Component for managing documents in Vector DB
 */

import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Form, Table, Badge, Tabs, Tab, Alert, ProgressBar, Modal } from 'react-bootstrap';
import api from '../utils/apiClient';

interface Document {
  id: string;
  filename: string;
  title: string;
  category: string;
  providerId: string;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  chunkCount: number;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  indexedAt?: string;
  error?: string;
}

const VectorDBDocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [category, setCategory] = useState('product-docs');
  const [providerId, setProviderId] = useState('opensearch');
  const [providers, setProviders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [urlToImport, setUrlToImport] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    fetchProviders();
  }, []);
  
  useEffect(() => {
    if (providerId) {
      fetchDocuments();
      fetchStats();
    }
  }, [providerId]);
  
  const fetchProviders = async () => {
    try {
      const response = await api.get('/api/v1/vector-db/providers');
      const data = await response.json();
      
      if (data.success) {
        // Combine approved and marketplace providers
        const allProviders = [
          ...(data.data.approved || []),
          ...(data.data.marketplace || [])
        ];
        setProviders(allProviders);
        
        // Set first provider as default if not set
        if (allProviders.length > 0 && !providerId) {
          setProviderId(allProviders[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };
  
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/vector-db/documents?providerId=${providerId}`);
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await api.get(`/api/v1/vector-db/documents/stats?providerId=${providerId}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }
      formData.append('category', category);
      formData.append('providerId', providerId);
      
      const response = await fetch('http://localhost:3002/api/v1/vector-db/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully uploaded ${data.data.length} file(s)`);
        setSelectedFiles(null);
        fetchDocuments();
        fetchStats();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleTextImport = async () => {
    if (!textTitle || !textContent) {
      alert('Please provide both title and content');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3002/api/v1/vector-db/documents/import/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: textTitle,
          content: textContent,
          providerId,
          category
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Text imported successfully');
        setShowTextModal(false);
        setTextTitle('');
        setTextContent('');
        fetchDocuments();
        fetchStats();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleDeleteClick = (id: string) => {
    setDocumentToDelete(id);
    setShowDeleteModal(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/v1/vector-db/documents/${documentToDelete}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Document deleted successfully');
        fetchDocuments();
        fetchStats();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };
  
  const handleReindex = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/v1/vector-db/documents/${id}/reindex`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Document re-indexed successfully');
        fetchDocuments();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'secondary',
      processing: 'warning',
      indexed: 'success',
      failed: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2>📚 Document Management</h2>
        <p className="text-muted">Upload and manage documents for your Vector DB</p>
      </div>
      
      {/* Statistics */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{stats.totalDocuments}</h3>
                <p className="mb-0 text-muted">Total Documents</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{stats.totalChunks}</h3>
                <p className="mb-0 text-muted">Total Chunks</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3>{formatFileSize(stats.totalSize)}</h3>
                <p className="mb-0 text-muted">Total Size</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">{stats.byStatus.indexed}</h3>
                <p className="mb-0 text-muted">Indexed</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <Tabs defaultActiveKey="upload" className="mb-3">
        {/* Upload Tab */}
        <Tab eventKey="upload" title="Upload Documents">
          <Card>
            <Card.Body>
              <h5>Upload Files</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Vector DB Provider</Form.Label>
                <Form.Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                  {providers.length === 0 ? (
                    <option>Loading providers...</option>
                  ) : (
                    providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.icon} {provider.name} {provider.status === 'marketplace' ? '(Marketplace)' : ''}
                      </option>
                    ))
                  )}
                </Form.Select>
                <Form.Text className="text-muted">
                  {providers.find(p => p.id === providerId)?.description}
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="product-docs">Product Documentation</option>
                  <option value="support-faqs">Support FAQs</option>
                  <option value="training">Training Materials</option>
                  <option value="policies">Company Policies</option>
                  <option value="general">General</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Select Files</Form.Label>
                <Form.Control 
                  type="file" 
                  multiple 
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e: any) => setSelectedFiles(e.target.files)}
                />
                <Form.Text>
                  Supported: PDF, DOCX, TXT, MD (Max 10MB each, up to 10 files)
                </Form.Text>
              </Form.Group>
              
              {selectedFiles && selectedFiles.length > 0 && (
                <Alert variant="info">
                  {selectedFiles.length} file(s) selected
                </Alert>
              )}
              
              <Button 
                variant="primary" 
                onClick={handleFileUpload}
                disabled={uploading || !selectedFiles}
              >
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </Button>
              
              {uploading && (
                <ProgressBar animated now={100} className="mt-3" />
              )}
            </Card.Body>
          </Card>
          
          <Card className="mt-3">
            <Card.Body>
              <h5>Import from Other Sources</h5>
              
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h6>📝 Import Text Directly</h6>
                      <p className="text-muted small">Paste text content directly</p>
                      <Button size="sm" onClick={() => setShowTextModal(true)}>
                        Import Text
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h6>🌐 Import from URL</h6>
                      <Form.Control 
                        size="sm"
                        placeholder="https://docs.example.com"
                        value={urlToImport}
                        onChange={(e) => setUrlToImport(e.target.value)}
                        className="mb-2"
                      />
                      <Button size="sm" disabled>
                        Import (Coming Soon)
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
        
        {/* Manage Tab */}
        <Tab eventKey="manage" title={`Manage Documents (${documents.length})`}>
          <Card>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : documents.length === 0 ? (
                <Alert variant="info">
                  No documents found. Upload some documents to get started!
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Chunks</th>
                      <th>Size</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <strong>{doc.title}</strong>
                          <br />
                          <small className="text-muted">{doc.filename}</small>
                        </td>
                        <td>
                          <Badge bg="info">{doc.category}</Badge>
                        </td>
                        <td>{getStatusBadge(doc.status)}</td>
                        <td>{doc.chunkCount}</td>
                        <td>{formatFileSize(doc.fileSize)}</td>
                        <td>
                          <small>{formatDate(doc.uploadedAt)}</small>
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-warning"
                            className="me-1"
                            onClick={() => handleReindex(doc.id)}
                            disabled={doc.status === 'processing'}
                          >
                            Re-index
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleDeleteClick(doc.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        {/* Settings Tab */}
        <Tab eventKey="settings" title="Settings">
          <Card>
            <Card.Body>
              <h5>Processing Settings</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Chunk Size (tokens)</Form.Label>
                <Form.Range min={200} max={500} defaultValue={300} />
                <Form.Text>300 tokens (recommended)</Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Chunk Overlap (%)</Form.Label>
                <Form.Range min={0} max={30} defaultValue={20} />
                <Form.Text>20% overlap (recommended)</Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Embedding Model</Form.Label>
                <Form.Select>
                  <option>OpenAI text-embedding-3-small</option>
                  <option>AWS Titan Embeddings</option>
                  <option>Cohere Embed v3</option>
                </Form.Select>
              </Form.Group>
              
              <Button variant="primary">Save Settings</Button>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Text Import Modal */}
      <Modal show={showTextModal} onHide={() => setShowTextModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Import Text</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control 
              placeholder="e.g., Product FAQ"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control 
              as="textarea"
              rows={10}
              placeholder="Paste your text content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTextModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTextImport}>
            Import
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this document?</p>
          <p className="text-muted">This action cannot be undone. All chunks and embeddings will be removed from the vector database.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Document
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VectorDBDocumentManager;
