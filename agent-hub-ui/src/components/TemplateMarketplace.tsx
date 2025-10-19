import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { templateService, AgentTemplate } from '../services/templateService';

const TemplateMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'recent'>('popularity');

  useEffect(() => {
    loadMarketplaceTemplates();
  }, []);

  const loadMarketplaceTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all approved templates for marketplace
      const allTemplates = await templateService.getTemplates({
        approvalStatus: ['Approved'],
        complianceStatus: ['Compliant']
      });
      
      setTemplates(allTemplates);
    } catch (err) {
      setError('Failed to load marketplace templates. Please try again.');
      console.error('Error loading marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return b.usageCount - a.usageCount;
      case 'rating':
        return b.rating - a.rating;
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  const categories = ['All', 'QE', 'DevOps', 'Security', 'Business'];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'QE': 'primary',
      'DevOps': 'success',
      'Security': 'danger',
      'Business': 'warning'
    };
    return colors[category] || 'secondary';
  };

  const getComplexityColor = (complexity: string) => {
    const colors: { [key: string]: string } = {
      'Beginner': 'success',
      'Intermediate': 'warning',
      'Advanced': 'danger'
    };
    return colors[complexity] || 'secondary';
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Navigate to template creation wizard
      navigate(`/templates/${templateId}/create`);
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to use template. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading marketplace...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Marketplace</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadMarketplaceTemplates}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="h2 text-dark">
            Template Marketplace
          </h1>
          <p className="text-muted">
            Discover and use professional agent templates from the community
          </p>
        </Col>
        <Col md={4} className="text-end">
          <Button 
            variant="success" 
            size="lg"
            onClick={() => navigate('/templates/create')}
            className="mb-2 me-2"
          >
            Create Template
          </Button>
          <Button 
            variant="outline-primary" 
            size="lg"
            onClick={() => navigate('/templates')}
            className="mb-2"
          >
            My Library
          </Button>
          <br />
          <small className="text-muted">Build your own or browse existing templates</small>
        </Col>
      </Row>

      {/* Stats Banner */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-gradient-primary text-white border-0">
            <Card.Body>
              <Row className="text-center">
                <Col md={3}>
                  <h3>{templates.length}</h3>
                  <small>Professional Templates</small>
                </Col>
                <Col md={3}>
                  <h3>{templates.filter(t => t.approvalStatus === 'Approved').length}</h3>
                  <small>Approved & Ready</small>
                </Col>
                <Col md={3}>
                  <h3>{templates.reduce((sum, t) => sum + t.usageCount, 0).toLocaleString()}</h3>
                  <small>Total Downloads</small>
                </Col>
                <Col md={3}>
                  <h3>{(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1)}</h3>
                  <small>Average Rating</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>Search</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'All' 
                  ? `All Categories (${templates.length})` 
                  : `${category} (${templates.filter(t => t.category === category).length})`
                }
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Recently Updated</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <p className="text-muted">
            Showing {filteredTemplates.length} of {templates.length} templates
            {selectedCategory !== 'All' && ` in ${selectedCategory} category`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </Col>
      </Row>

      {/* Templates Grid */}
      <Row>
        {filteredTemplates.length === 0 ? (
          <Col>
            <Card className="text-center">
              <Card.Body>
                <h5>No Templates Found</h5>
                <p className="text-muted">
                  Try adjusting your search criteria or browse all categories.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredTemplates.map((template) => (
            <Col key={template.id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Badge bg={getCategoryColor(template.category)} className="me-2">
                        {template.category}
                      </Badge>
                      <Badge bg={getComplexityColor(template.complexity)}>
                        {template.complexity}
                      </Badge>
                    </div>
                    <div className="text-end">
                      <small className="text-muted">Rating: {template.rating.toFixed(1)}</small>
                    </div>
                  </div>
                </Card.Header>
                
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h5">{template.name}</Card.Title>
                  <Card.Text className="flex-grow-1 text-muted">
                    {template.description}
                  </Card.Text>
                  
                  {/* Template Stats */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between text-muted small">
                      <span>{template.usageCount.toLocaleString()} uses</span>
                      <span>~{template.estimatedSetupTime}min setup</span>
                    </div>
                  </div>
                  
                  {/* Technologies */}
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-1">
                      {template.technologies.slice(0, 3).map((tech, index) => (
                        <Badge key={index} bg="outline-secondary" className="small">
                          {tech}
                        </Badge>
                      ))}
                      {template.technologies.length > 3 && (
                        <Badge bg="outline-secondary" className="small">
                          +{template.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-1">
                      {template.tags.slice(0, 4).map((tag, index) => (
                        <Badge key={index} bg="light" text="dark" className="small">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-auto">
                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleUseTemplate(template.id)}
                      >
                        Use Template
                      </Button>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate(`/templates/${template.id}`)}
                          className="flex-fill"
                        >
                          Preview
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/templates/${template.id}`);
                            alert('Template link copied to clipboard!');
                          }}
                          className="flex-fill"
                        >
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
                
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      by {template.author}
                    </small>
                    <small className="text-muted">
                      v{template.version}
                    </small>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Featured Templates Section */}
      {filteredTemplates.length > 0 && (
        <Row className="mt-5">
          <Col>
            <Card className="bg-light">
              <Card.Header>
                <h5 className="mb-0">Featured Templates</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {templates
                    .filter(t => t.rating >= 4.5 && t.usageCount > 500)
                    .slice(0, 3)
                    .map((template) => (
                      <Col key={template.id} md={4}>
                        <div className="text-center p-3">
                          <Badge bg={getCategoryColor(template.category)} className="mb-2">
                            {template.category}
                          </Badge>
                          <h6>{template.name}</h6>
                          <p className="small text-muted">{template.description.substring(0, 100)}...</p>
                          <div className="d-flex justify-content-center gap-2">
                            <Badge bg="secondary">{template.rating} rating</Badge>
                            <Badge bg="secondary">{template.usageCount} uses</Badge>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleUseTemplate(template.id)}
                          >
                            Use Template
                          </Button>
                        </div>
                      </Col>
                    ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default TemplateMarketplace;