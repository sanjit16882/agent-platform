import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { templateService, AgentTemplate, TemplateFilters } from '../services/templateService';
import { governanceService } from '../services/governanceService';
import { complianceService } from '../services/complianceService';
import TemplateCard from './TemplateCard';
import TemplateFiltersComponent from './TemplateFilters';
import TemplateSearch from './TemplateSearch';

const TemplateLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<AgentTemplate[]>([]); // Store all templates for category stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [activeFilters, setActiveFilters] = useState<TemplateFilters>({}); // Store active filters separately
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'recent' | 'name'>('popularity');

  // Initial load effect
  useEffect(() => {
    loadTemplates();
  }, []); // Only run once on mount

  // Filter change effect
  useEffect(() => {
    if (Object.keys(filters).length > 0 || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== undefined)) {
      loadTemplates();
    }
  }, [filters, sortBy]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always get all templates first (for category stats)
      const allTemplatesData = await templateService.getTemplates({});
      setAllTemplates(allTemplatesData);
      
      // Then get filtered templates
      let filteredTemplates = await templateService.getTemplates(filters);
      
      // Apply search filter
      if (searchTerm) {
        const searchResults = await templateService.searchTemplates(searchTerm);
        filteredTemplates = filteredTemplates.filter(template => 
          searchResults.some(result => result.id === template.id)
        );
      }
      
      // Apply sorting
      filteredTemplates = sortTemplates(filteredTemplates, sortBy);
      
      setTemplates(filteredTemplates);
    } catch (err) {
      setError('Failed to load templates. Please try again.');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortTemplates = (templates: AgentTemplate[], sortBy: string): AgentTemplate[] => {
    return [...templates].sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = useCallback((newFilters: TemplateFilters) => {
    setActiveFilters(newFilters); // Store the active filters
    setFilters(newFilters); // Also update the filters for template loading
  }, []);

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      // Check if template requires approval
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      if (template.approvalStatus !== 'Approved') {
        // Submit for approval first
        await governanceService.submitForApproval(templateId, 'Creation');
        alert('Template requires approval. Your request has been submitted for review.');
        return;
      }

      // Navigate to template wizard
      navigate(`/templates/${templateId}/create`);
    } catch (error) {
      console.error('Error creating from template:', error);
      alert('Failed to create agent from template. Please try again.');
    }
  };

  const getCategoryStats = () => {
    // Use allTemplates to show all categories, not just filtered ones
    const allStats = allTemplates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Also calculate filtered stats to show current vs total
    const filteredStats = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(allStats).map(([category, totalCount]) => ({ 
      category, 
      count: totalCount,
      filteredCount: filteredStats[category] || 0
    }));
  };

  const getGovernanceStats = () => {
    // Use allTemplates for governance stats to show overall metrics
    const approved = allTemplates.filter(t => t.approvalStatus === 'Approved').length;
    const compliant = allTemplates.filter(t => t.complianceStatus === 'Compliant').length;
    const total = allTemplates.length;
    
    return {
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
      totalTemplates: total
    };
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading template library...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Templates</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadTemplates}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  const categoryStats = getCategoryStats();
  const governanceStats = getGovernanceStats();

  return (
    <Container fluid className="mt-4 template-library-container">
      {/* Header */}
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="h2 text-dark">
            Template Library
          </h1>
          <p className="text-muted">
            Create production-ready agents in minutes with enterprise-grade templates
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
            onClick={() => navigate('/templates/marketplace')}
            className="mb-2"
          >
            Marketplace
          </Button>
          <br />
          <small className="text-muted">Build your own templates or browse the marketplace</small>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <h3 className="text-primary">{governanceStats.totalTemplates}</h3>
              <Card.Text>Professional Templates</Card.Text>
              <Badge bg="primary">Enterprise-Grade</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <h3 className="text-success">{governanceStats.approvalRate}%</h3>
              <Card.Text>Approval Rate</Card.Text>
              <Badge bg="success">Governance Ready</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-info">
            <Card.Body>
              <h3 className="text-info">{governanceStats.complianceRate}%</h3>
              <Card.Text>Compliance Rate</Card.Text>
              <Badge bg="info">Security Validated</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <h3 className="text-warning">{categoryStats.length}</h3>
              <Card.Text>Categories</Card.Text>
              <Badge bg="warning">Multi-Domain</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <TemplateSearch 
            onSearch={handleSearch}
            placeholder="Search templates by name, description, or technology..."
          />
        </Col>
        <Col md={6}>
          <div className="d-flex gap-2 align-items-center">
            <Form.Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ maxWidth: '200px' }}
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="recent">Recently Updated</option>
              <option value="name">Name (A-Z)</option>
            </Form.Select>
            
            <div className="btn-group" role="group">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Filters Sidebar */}
        <Col md={3}>
          <div className="template-filters-sidebar">
            <TemplateFiltersComponent 
              onFilterChange={handleFilterChange}
              categoryStats={categoryStats}
              currentFilters={activeFilters}
            />
            
            {/* Governance Summary */}
            <Card className="mt-3 border-secondary template-sidebar-card governance-overview-card">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Governance Overview</h6>
              </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <small className="text-muted">Approval Status</small>
                <div className="progress mb-1" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${governanceStats.approvalRate}%` }}
                  ></div>
                </div>
                <small>{governanceStats.approvalRate}% Approved</small>
              </div>
              
              <div className="mb-2">
                <small className="text-muted">Compliance Status</small>
                <div className="progress mb-1" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{ width: `${governanceStats.complianceRate}%` }}
                  ></div>
                </div>
                <small>{governanceStats.complianceRate}% Compliant</small>
              </div>
              
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="w-100 mt-2"
                onClick={() => navigate('/analytics')}
              >
                View Governance Dashboard
              </Button>
            </Card.Body>
          </Card>

            {/* Quick Actions */}
            <Card className="mt-3 template-sidebar-card">
              <Card.Header>
                <h6 className="mb-0">Quick Actions</h6>
              </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    const popularTemplate = templates.find(t => t.approvalStatus === 'Approved');
                    if (popularTemplate) {
                      handleCreateFromTemplate(popularTemplate.id);
                    }
                  }}
                >
                  Quick Start
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => navigate('/analytics')}
                >
                  Compliance Report
                </Button>
              </div>
            </Card.Body>
            </Card>
          </div>
        </Col>

        {/* Templates Grid/List */}
        <Col md={9}>
          {templates.length === 0 ? (
            <Card className="text-center">
              <Card.Body>
                <h5>No Templates Found</h5>
                <p className="text-muted">
                  Try adjusting your search criteria or filters.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({});
                  }}
                >
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              {/* Results Summary */}
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="text-muted">
                  Showing {templates.length} template{templates.length !== 1 ? 's' : ''}
                  {searchTerm && ` for "${searchTerm}"`}
                </span>
                <Badge bg="light" text="dark">
                  {viewMode} view
                </Badge>
              </div>

              {/* Templates Display */}
              {viewMode === 'grid' ? (
                <Row>
                  {templates.map((template) => (
                    <Col key={template.id} md={6} lg={4} className="mb-4">
                      <TemplateCard 
                        template={template}
                        onCreateFromTemplate={handleCreateFromTemplate}
                        onViewDetails={(id) => navigate(`/templates/${id}`)}
                      />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div>
                  {templates.map((template) => (
                    <TemplateCard 
                      key={template.id}
                      template={template}
                      onCreateFromTemplate={handleCreateFromTemplate}
                      onViewDetails={(id) => navigate(`/templates/${id}`)}
                      listView={true}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </Col>
      </Row>

      {/* Enterprise Impact Summary */}
      <Row className="mt-5">
        <Col>
          <Card className="bg-light border-0">
            <Card.Body className="text-center">
              <h4 className="text-dark">Enterprise Agent Factory</h4>
              <p className="mb-3 text-muted">
                Transform your development process with professional templates, governance workflows, 
                and compliance automation. Create production-ready agents in minutes instead of hours.
              </p>
              <div className="row">
                <div className="col-md-3">
                  <h5 className="text-dark">$1.25M</h5>
                  <small className="text-muted">Annual Cost Savings</small>
                </div>
                <div className="col-md-3">
                  <h5 className="text-dark">594%</h5>
                  <small className="text-muted">Return on Investment</small>
                </div>
                <div className="col-md-3">
                  <h5 className="text-dark">30 sec</h5>
                  <small className="text-muted">Agent Creation Time</small>
                </div>
                <div className="col-md-3">
                  <h5 className="text-dark">99.8%</h5>
                  <small className="text-muted">Compliance Rate</small>
                </div>
              </div>
              <Button 
                variant="outline-primary" 
                size="lg" 
                className="mt-3"
                onClick={() => navigate('/analytics')}
              >
                View Executive Dashboard
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TemplateLibrary;