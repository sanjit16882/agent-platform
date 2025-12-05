/**
 * DocumentList Component
 * 
 * Displays and manages documents within a knowledge base:
 * - List documents with metadata
 * - Pagination support
 * - Delete documents
 * - Preview documents
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  Button,
  Badge,
  Modal,
  Alert,
  Pagination,
  Form,
  InputGroup,
  Card,
  Spinner
} from 'react-bootstrap';

interface Document {
  id: string;
  title: string;
  filename: string;
  content: string;
  sizeBytes: number;
  uploadedAt: string;
  metadata?: {
    source?: string;
    type?: string;
    chunkCount?: number;
  };
}

interface DocumentListProps {
  knowledgeBaseId: string;
  knowledgeBaseName?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  knowledgeBaseId, 
  knowledgeBaseName 
}) => {
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const itemsPerPage = 10;
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  useEffect(() => {
    loadDocuments();
  }, [knowledgeBaseId, currentPage, searchQuery]);
  
  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would call the API
      // const response = await fetch(
      //   `/api/v1/knowledge-bases/${knowledgeBaseId}/documents?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
      // );
      // const data = await response.json();
      
      // Mock data for now
      const mockDocuments: Document[] = [
        {
          id: 'doc-1',
          title: 'Getting Started Guide',
          filename: 'getting-started.md',
          content: 'This is a comprehensive guide to getting started with our product...',
          sizeBytes: 15360,
          uploadedAt: '2025-11-01T10:00:00Z',
          metadata: {
            source: 'documentation',
            type: 'markdown',
            chunkCount: 5
          }
        },
        {
          id: 'doc-2',
          title: 'API Reference',
          filename: 'api-reference.pdf',
          content: 'Complete API documentation with examples...',
          sizeBytes: 524288,
          uploadedAt: '2025-11-02T14:30:00Z',
          metadata: {
            source: 'documentation',
            type: 'pdf',
            chunkCount: 25
          }
        },
        {
          id: 'doc-3',
          title: 'Troubleshooting Common Issues',
          filename: 'troubleshooting.txt',
          content: 'Solutions to common problems users encounter...',
          sizeBytes: 8192,
          uploadedAt: '2025-11-03T09:15:00Z',
          metadata: {
            source: 'support',
            type: 'text',
            chunkCount: 3
          }
        },
        {
          id: 'doc-4',
          title: 'Release Notes v2.0',
          filename: 'release-notes-v2.md',
          content: 'New features and improvements in version 2.0...',
          sizeBytes: 12288,
          uploadedAt: '2025-11-05T16:45:00Z',
          metadata: {
            source: 'documentation',
            type: 'markdown',
            chunkCount: 4
          }
        },
        {
          id: 'doc-5',
          title: 'Security Best Practices',
          filename: 'security.docx',
          content: 'Guidelines for securing your application...',
          sizeBytes: 32768,
          uploadedAt: '2025-11-07T11:20:00Z',
          metadata: {
            source: 'documentation',
            type: 'docx',
            chunkCount: 8
          }
        }
      ];
      
      setDocuments(mockDocuments);
      setTotalDocuments(mockDocuments.length);
      setTotalPages(Math.ceil(mockDocuments.length / itemsPerPage));
    } catch (err: any) {
      setError('Failed to load documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would call the API
      // await fetch(
      //   `/api/v1/knowledge-bases/${knowledgeBaseId}/documents/${selectedDocument.id}`,
      //   { method: 'DELETE' }
      // );
      
      setSuccess(`Document "${selectedDocument.title}" deleted successfully!`);
      setShowDeleteModal(false);
      setSelectedDocument(null);
      
      // Reload documents
      await loadDocuments();
    } catch (err: any) {
      setError('Failed to delete document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getFileTypeColor = (type?: string): string => {
    switch (type?.toLowerCase()) {
      case 'pdf': return 'danger';
      case 'markdown':
      case 'md': return 'info';
      case 'text':
      case 'txt': return 'secondary';
      case 'docx': return 'primary';
      default: return 'secondary';
    }
  };
  
  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Documents</h2>
          {knowledgeBaseName && (
            <p className="text-muted mb-0">
              Knowledge Base: <strong>{knowledgeBaseName}</strong>
            </p>
          )}
        </div>
        <Button variant="outline-secondary" href={`/knowledge-bases/${knowledgeBaseId}`}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Knowledge Base
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
      
      {/* Search and Stats */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">{totalDocuments} Documents</h5>
              <small className="text-muted">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalDocuments)} - {Math.min(currentPage * itemsPerPage, totalDocuments)}
              </small>
            </div>
            <InputGroup style={{ maxWidth: '300px' }}>
              <Form.Control
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-secondary">
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </div>
        </Card.Body>
      </Card>
      
      {/* Documents Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2 text-muted">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '3rem', opacity: 0.3 }}>📄</div>
            <h4 className="mt-3">No Documents</h4>
            <p className="text-muted">
              {searchQuery 
                ? 'No documents match your search query'
                : 'Upload documents to this knowledge base to get started'
              }
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Size</th>
                <th>Chunks</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div>
                      <strong>{doc.title}</strong>
                      <br />
                      <small className="text-muted">{doc.filename}</small>
                    </div>
                  </td>
                  <td>
                    <Badge bg={getFileTypeColor(doc.metadata?.type)}>
                      {doc.metadata?.type?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </td>
                  <td>{formatBytes(doc.sizeBytes)}</td>
                  <td>
                    <Badge bg="secondary">{doc.metadata?.chunkCount || 0}</Badge>
                  </td>
                  <td>
                    <small>{formatDate(doc.uploadedAt)}</small>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowPreviewModal(true);
                        }}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDeleteModal(true);
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <Pagination.Ellipsis key={page} disabled />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This action cannot be undone.
          </Alert>
          <p>
            Are you sure you want to delete <strong>"{selectedDocument?.title}"</strong>?
          </p>
          <p className="text-muted small">
            This will permanently remove:
          </p>
          <ul className="text-muted small">
            <li>The document file</li>
            <li>All vector embeddings ({selectedDocument?.metadata?.chunkCount || 0} chunks)</li>
            <li>Document metadata</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteDocument} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Document'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Document Preview Modal */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Document Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocument && (
            <>
              <h5>{selectedDocument.title}</h5>
              <div className="mb-3">
                <Badge bg={getFileTypeColor(selectedDocument.metadata?.type)} className="me-2">
                  {selectedDocument.metadata?.type?.toUpperCase()}
                </Badge>
                <Badge bg="secondary" className="me-2">
                  {formatBytes(selectedDocument.sizeBytes)}
                </Badge>
                <Badge bg="info">
                  {selectedDocument.metadata?.chunkCount} chunks
                </Badge>
              </div>
              
              <hr />
              
              <div className="mb-3">
                <strong>Filename:</strong> {selectedDocument.filename}<br />
                <strong>Uploaded:</strong> {formatDate(selectedDocument.uploadedAt)}<br />
                {selectedDocument.metadata?.source && (
                  <>
                    <strong>Source:</strong> {selectedDocument.metadata.source}<br />
                  </>
                )}
              </div>
              
              <hr />
              
              <div>
                <strong>Content Preview:</strong>
                <Card className="mt-2" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <Card.Body>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                      {selectedDocument.content}
                    </pre>
                  </Card.Body>
                </Card>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DocumentList;
