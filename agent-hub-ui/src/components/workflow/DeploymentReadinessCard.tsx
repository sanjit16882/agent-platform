/**
 * Deployment Readiness Card Component
 * Displays deployment readiness status and recommendations
 */

import React from 'react';
import { Card, Badge, Alert, ListGroup } from 'react-bootstrap';
import { DeploymentReadiness } from '../../types/workflow';

interface DeploymentReadinessCardProps {
  readiness: DeploymentReadiness;
}

export const DeploymentReadinessCard: React.FC<DeploymentReadinessCardProps> = ({ readiness }) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'READY': return 'success';
      case 'READY_WITH_MINOR_FIXES': return 'warning';
      case 'NEEDS_IMPROVEMENT': return 'info';
      case 'NOT_READY': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY': return '✅';
      case 'READY_WITH_MINOR_FIXES': return '⚠️';
      case 'NEEDS_IMPROVEMENT': return '📊';
      case 'NOT_READY': return '🚫';
      default: return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'READY': return 'Ready for Production';
      case 'READY_WITH_MINOR_FIXES': return 'Ready with Minor Fixes';
      case 'NEEDS_IMPROVEMENT': return 'Needs Improvement';
      case 'NOT_READY': return 'Not Ready';
      default: return status;
    }
  };

  return (
    <Card className="h-100">
      <Card.Header>
        <h6 className="mb-0">🚀 Deployment Readiness</h6>
      </Card.Header>
      <Card.Body>
        <div className="text-center mb-3">
          <div className="h1 mb-2">
            {getStatusIcon(readiness.status)}
          </div>
          <Badge 
            bg={getStatusVariant(readiness.status)} 
            className="fs-6 px-3 py-2"
          >
            {getStatusText(readiness.status)}
          </Badge>
        </div>

        <div className="row text-center mb-3">
          <div className="col-4">
            <div className="h5 text-primary">{readiness.passRate}%</div>
            <div className="text-muted small">Pass Rate</div>
          </div>
          <div className="col-4">
            <div className="h5 text-danger">{readiness.criticalIssues}</div>
            <div className="text-muted small">Critical</div>
          </div>
          <div className="col-4">
            <div className="h5 text-warning">{readiness.highIssues}</div>
            <div className="text-muted small">High</div>
          </div>
        </div>

        <Alert variant={getStatusVariant(readiness.status)} className="py-2 px-3 small">
          {readiness.summary}
        </Alert>

        {readiness.recommendations.length > 0 && (
          <div>
            <h6 className="text-primary mb-2">💡 Recommendations</h6>
            <ListGroup variant="flush">
              {readiness.recommendations.slice(0, 3).map((rec, index) => (
                <ListGroup.Item key={index} className="px-0 py-1 border-0 small">
                  • {rec}
                </ListGroup.Item>
              ))}
              {readiness.recommendations.length > 3 && (
                <ListGroup.Item className="px-0 py-1 border-0 small text-muted">
                  ... and {readiness.recommendations.length - 3} more
                </ListGroup.Item>
              )}
            </ListGroup>
          </div>
        )}

        {readiness.blockers.length > 0 && (
          <div className="mt-3">
            <h6 className="text-danger mb-2">🚫 Blockers</h6>
            <ListGroup variant="flush">
              {readiness.blockers.map((blocker, index) => (
                <ListGroup.Item key={index} className="px-0 py-1 border-0 small">
                  <Badge bg="danger" className="me-2">{blocker.severity}</Badge>
                  {blocker.title}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
