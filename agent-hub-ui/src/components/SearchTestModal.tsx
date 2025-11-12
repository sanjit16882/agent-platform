/**
 * SearchTestModal Component
 * 
 * Test search functionality in a knowledge base:
 * - Input test query
 * - Configure search parameters (topK, minSimilarity)
 * - Display search results with similarity scores
 * - Show search latency
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  Card,
  Badge,
  ProgressBar,
  Spinner,
  Table
} from 'react-bootstrap';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  metadata?: {
    source?: string;
    type?: string;
    chunkIndex?: number;
  };
}

interface SearchTestModalProps {
  show: boolean;
  onHide: () => void;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
}

const SearchTestModal: React.FC<SearchTestModalProps> = ({
  show,
  onHide,
  knowledgeBaseId,
  knowledgeBaseName
}) => {
  
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [minSimilarity, setMinSimilarity] = useState(0.7);
  
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLatency, setSearchLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    setSearching(true);
    setError(null);
    setHasSearched(true);
    
    const startTime = Date.now();
    
    try {
      // In production, this would call the API
      // const response = await fetch(
      //   `/api/v1/knowledge-bases/${knowledgeBaseId}/search`,
      //   {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ query, topK, minSimilarity })
      //   }
      // );
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: 'result-1',
          title: 'Getting Started Guide',
          content: 'This comprehensive guide helps you get started with our product. It covers installation, basic configuration, and your first steps...',
          similarity: 0.92,
          metadata: {
            source: 'documentation',
            type: 'markdown',
            chunkIndex: 1
          }
        },
        {
          id: 'result-2',
          title: 'API Reference - Authentication',
          content: 'Learn how to authenticate your API requests using API keys or OAuth tokens. This section covers all authentication methods...',
          similarity: 0.85,
          metadata: {
            source: 'documentation',
            type: 'pdf',
            chunkIndex: 3
          }
        },
        {
          id: 'result-3',
          title: 'Troubleshooting Common Issues',
          content: 'If you encounter problems during setup, check this troubleshooting guide. Common issues include connection errors and configuration mistakes...',
          similarity: 0.78,
          metadata: {
            source: 'support',
            type: 'text',
            chunkIndex: 0
          }
        },
        {
          id: 'result-4',
          title: 'Release Notes v2.0',
          content: 'Version 2.0 introduces several new features including improved performance, better error handling, and enhanced documentation...',
          similarity: 0.73,
          metadata: {
            source: 'documentation',
            type: 'markdown',
            chunkIndex: 2
          }
        }
      ].filter(result => result.similarity >= minSimilarity).slice(0, topK);
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      setSearchResults(mockResults);
      setSearchLatency(latency);
    } catch (err: any) {
      setError('Search failed: ' + err.message);
    } finally {
      setSearching(false);
    }
  };
  
  const handleReset = () => {
    setQuery('');
    setTopK(5);
    setMinSimilarity(0.7);
    setSearchResults([]);
    setSearchLatency(null);
    setError(null);
    setHasSearched(false);
  };
  
  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.9) return 'success';
    if (similarity >= 0.8) return 'info';
    if (similarity >= 0.7) return 'warning';
    return 'secondary';
  };
  
  const highlightQuery = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    // Simple highlighting - in production, this would be more sophisticated
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };
  
  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Test Search</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Knowledge Base:</strong> {knowledgeBaseName}
        </Alert>
        
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {/* Search Configuration */}
        <Card className="mb-4">
          <Card.Header>
            <strong>Search Configuration</strong>
          </Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Search Query *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your search query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                <Form.Text className="text-muted">
                  Enter a natural language query to search the knowledge base
                </Form.Text>
              </Form.Group>
              
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Top K Results: <Badge bg="secondary">{topK}</Badge>
                    </Form.Label>
                    <Form.Range
                      min={1}
                      max={20}
                      value={topK}
                      onChange={(e) => setTopK(parseInt(e.target.value))}
                    />
                    <Form.Text className="text-muted">
                      Number of results to return (1-20)
                    </Form.Text>
                  </Form.Group>
                </div>
                
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Minimum Similarity: <Badge bg="secondary">{minSimilarity.toFixed(2)}</Badge>
                    </Form.Label>
                    <Form.Range
                      min={0}
                      max={1}
                      step={0.05}
                      value={minSimilarity}
                      onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                    />
                    <Form.Text className="text-muted">
                      Minimum similarity threshold (0.0-1.0)
                    </Form.Text>
                  </Form.Group>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={searching || !query.trim()}
                >
                  {searching ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-2"></i>
                      Search
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleReset}
                  disabled={searching}
                >
                  Reset
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
        
        {/* Search Results */}
        {hasSearched && (
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Search Results</strong>
              {searchLatency !== null && (
                <Badge bg="info">
                  <i className="bi bi-clock me-1"></i>
                  {searchLatency}ms
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              {searching ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Searching...</span>
                  </Spinner>
                  <p className="mt-2 text-muted">Searching knowledge base...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-4">
                  <div style={{ fontSize: '2rem', opacity: 0.3 }}>🔍</div>
                  <h5 className="mt-3">No Results Found</h5>
                  <p className="text-muted">
                    No documents match your query with similarity ≥ {minSimilarity.toFixed(2)}
                  </p>
                  <p className="text-muted small">
                    Try lowering the minimum similarity threshold or using different search terms
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <strong>{searchResults.length}</strong> result{searchResults.length !== 1 ? 's' : ''} found
                  </div>
                  
                  <div className="d-flex flex-column gap-3">
                    {searchResults.map((result, index) => (
                      <Card key={result.id} className="border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">
                                <Badge bg="secondary" className="me-2">
                                  #{index + 1}
                                </Badge>
                                {result.title}
                              </h6>
                              {result.metadata && (
                                <div className="mb-2">
                                  <Badge bg="secondary" className="me-1">
                                    {result.metadata.type?.toUpperCase()}
                                  </Badge>
                                  {result.metadata.source && (
                                    <Badge bg="info" className="me-1">
                                      {result.metadata.source}
                                    </Badge>
                                  )}
                                  {result.metadata.chunkIndex !== undefined && (
                                    <Badge bg="secondary">
                                      Chunk {result.metadata.chunkIndex}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-end">
                              <Badge bg={getSimilarityColor(result.similarity)} className="fs-6">
                                {(result.similarity * 100).toFixed(1)}%
                              </Badge>
                              <div className="mt-1">
                                <small className="text-muted">Similarity</small>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <ProgressBar
                              now={result.similarity * 100}
                              variant={getSimilarityColor(result.similarity)}
                              style={{ height: '4px' }}
                            />
                          </div>
                          
                          <p 
                            className="mb-0 small"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightQuery(result.content, query) 
                            }}
                          />
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        )}
        
        {/* Performance Metrics */}
        {searchLatency !== null && searchResults.length > 0 && (
          <Card className="mt-3">
            <Card.Header>
              <strong>Performance Metrics</strong>
            </Card.Header>
            <Card.Body>
              <Table size="sm" borderless>
                <tbody>
                  <tr>
                    <td><strong>Search Latency:</strong></td>
                    <td className="text-end">{searchLatency}ms</td>
                  </tr>
                  <tr>
                    <td><strong>Results Returned:</strong></td>
                    <td className="text-end">{searchResults.length} / {topK}</td>
                  </tr>
                  <tr>
                    <td><strong>Average Similarity:</strong></td>
                    <td className="text-end">
                      {(searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Min Similarity Threshold:</strong></td>
                    <td className="text-end">{(minSimilarity * 100).toFixed(0)}%</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SearchTestModal;
