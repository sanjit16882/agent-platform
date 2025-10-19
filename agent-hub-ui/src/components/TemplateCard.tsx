import React from 'react';
import { Card, Button, Badge, ProgressBar, Row, Col } from 'react-bootstrap';
import { AgentTemplate } from '../services/templateService';

interface TemplateCardProps {
  template: AgentTemplate;
  onCreateFromTemplate: (templateId: string) => void;
  onViewDetails: (templateId: string) => void;
  listView?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onCreateFromTemplate,
  onViewDetails,
  listView = false
}) => {
  const getCategoryIcon = (category: string) => {
    const icons = {
      'QE': '🧪',
      'DevOps': '⚙️',
      'Security': '🔒',
      'Business': '📊'
    };
    return icons[category as keyof typeof icons] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'QE': 'primary',
      'DevOps': 'success',
      'Security': 'danger',
      'Business': 'warning'
    };
    return colors[category as keyof typeof colors] || 'secondary';
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      'Beginner': 'success',
      'Intermediate': 'warning',
      'Advanced': 'danger'
    };
    return colors[complexity as keyof typeof colors] || 'secondary';
  };

  const getApprovalStatusColor = (status: string) => {
    const colors = {
      'Approved': 'success',
      'Pending': 'warning',
      'Rejected': 'danger',
      'Draft': 'secondary'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const getComplianceStatusColor = (status: string) => {
    const colors = {
      'Compliant': 'success',
      'Non-Compliant': 'danger',
      'Under-Review': 'warning'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const formatUsageCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-warning">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-warning">☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-muted">☆</span>);
    }
    
    return stars;
  };

  if (listView) {
    return (
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={1} className="text-center">
              <div style={{ fontSize: '2rem' }}>
                {getCategoryIcon(template.category)}
              </div>
            </Col>
            
            <Col md={5}>
              <div className="d-flex align-items-center mb-2">
                <h5 className="mb-0 me-2">{template.name}</h5>
                <Badge bg={getApprovalStatusColor(template.approvalStatus)} className="me-1">
                  {template.approvalStatus}
                </Badge>
                <Badge bg={getComplianceStatusColor(template.complianceStatus)}>
                  {template.complianceStatus}
                </Badge>
              </div>
              
              <p className="text-muted mb-2 small">
                {template.description.length > 120 
                  ? `${template.description.substring(0, 120)}...` 
                  : template.description
                }
              </p>
              
              <div className="d-flex flex-wrap gap-1">
                {template.technologies.slice(0, 3).map((tech, index) => (
                  <Badge key={index} bg="light" text="dark" className="small">
                    {tech}
                  </Badge>
                ))}
                {template.technologies.length > 3 && (
                  <Badge bg="light" text="dark" className="small">
                    +{template.technologies.length - 3} more
                  </Badge>
                )}
              </div>
            </Col>
            
            <Col md={2}>
              <div className="text-center">
                <Badge bg={getCategoryColor(template.category)} className="mb-2 d-block">
                  {template.category}
                </Badge>
                <Badge bg={getComplexityColor(template.complexity)} className="d-block">
                  {template.complexity}
                </Badge>
              </div>
            </Col>
            
            <Col md={2}>
              <div className="text-center">
                <div className="mb-1">
                  {renderStars(template.rating)}
                </div>
                <small className="text-muted d-block">
                  {formatUsageCount(template.usageCount)} uses
                </small>
                <small className="text-muted d-block">
                  ~{template.estimatedSetupTime}min setup
                </small>
              </div>
            </Col>
            
            <Col md={2} className="text-end">
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onCreateFromTemplate(template.id)}
                  disabled={template.approvalStatus !== 'Approved'}
                >
                  Create Agent
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => onViewDetails(template.id)}
                >
                  Details
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="h-100 border-0 shadow-sm template-card">
      <Card.Header className="bg-light border-0">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>
              {getCategoryIcon(template.category)}
            </span>
            <Badge bg={getCategoryColor(template.category)}>
              {template.category}
            </Badge>
          </div>
          <div className="d-flex gap-1">
            <Badge bg={getApprovalStatusColor(template.approvalStatus)} className="small">
              {template.approvalStatus}
            </Badge>
          </div>
        </div>
      </Card.Header>
      
      <Card.Body className="d-flex flex-column">
        <div className="mb-3">
          <h5 className="card-title mb-2">{template.name}</h5>
          <p className="card-text text-muted small">
            {template.description.length > 100 
              ? `${template.description.substring(0, 100)}...` 
              : template.description
            }
          </p>
        </div>

        {/* Rating and Usage */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              {renderStars(template.rating)}
              <span className="ms-2 small text-muted">({template.rating})</span>
            </div>
            <small className="text-muted">
              {formatUsageCount(template.usageCount)} uses
            </small>
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <Badge bg={getComplexityColor(template.complexity)} className="small">
              {template.complexity}
            </Badge>
            <small className="text-muted">
              ~{template.estimatedSetupTime}min setup
            </small>
          </div>
        </div>

        {/* Technologies */}
        <div className="mb-3">
          <div className="d-flex flex-wrap gap-1">
            {template.technologies.slice(0, 3).map((tech, index) => (
              <Badge key={index} bg="light" text="dark" className="small">
                {tech}
              </Badge>
            ))}
            {template.technologies.length > 3 && (
              <Badge bg="light" text="dark" className="small">
                +{template.technologies.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Governance Status */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="text-muted">Compliance</small>
            <Badge bg={getComplianceStatusColor(template.complianceStatus)} className="small">
              {template.complianceStatus === 'Under-Review' ? 'Under Review' : template.complianceStatus}
            </Badge>
          </div>
          
          {template.complianceStatus === 'Compliant' && (
            <ProgressBar 
              variant="success" 
              now={95} 
              style={{ height: '4px' }}
              className="mb-1"
            />
          )}
          
          <small className="text-muted">
            Updated {new Date(template.updatedAt).toLocaleDateString()}
          </small>
        </div>

        {/* Actions */}
        <div className="mt-auto">
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              onClick={() => onCreateFromTemplate(template.id)}
              disabled={template.approvalStatus !== 'Approved'}
              className="d-flex align-items-center justify-content-center"
            >
              {template.approvalStatus === 'Approved' ? (
                <>Create Agent</>
              ) : template.approvalStatus === 'Pending' ? (
                <>Pending Approval</>
              ) : template.approvalStatus === 'Rejected' ? (
                <>Rejected</>
              ) : (
                <>Draft</>
              )}
            </Button>
            
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onViewDetails(template.id)}
              className="d-flex align-items-center justify-content-center"
            >
              View Details
            </Button>
          </div>
        </div>
      </Card.Body>
      
      {/* Footer with additional info */}
      <Card.Footer className="bg-transparent border-0 pt-0">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            v{template.version}
          </small>
          <small className="text-muted">
            by {template.author}
          </small>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default TemplateCard;