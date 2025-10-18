import React from 'react';
import { ProgressBar, Card, Row, Col } from 'react-bootstrap';
import { ExecutionProgress } from '../services/progressService';
import StepIndicator from './StepIndicator';
import ExecutionTimer from './ExecutionTimer';

interface ProgressTrackerProps {
  execution: ExecutionProgress;
  showSteps?: boolean;
  compact?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  execution, 
  showSteps = true, 
  compact = false 
}) => {
  const getProgressVariant = () => {
    if (execution.status === 'completed') return 'success';
    if (execution.status === 'failed') return 'danger';
    return 'primary';
  };

  const getStatusIcon = () => {
    switch (execution.status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '⚡';
      default:
        return '⏳';
    }
  };

  const getStatusText = () => {
    switch (execution.status) {
      case 'completed':
        return 'Completed Successfully';
      case 'failed':
        return 'Execution Failed';
      case 'running':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col xs={2} className="text-center">
              <div style={{ fontSize: '1.5rem' }}>{getStatusIcon()}</div>
            </Col>
            <Col xs={6}>
              <div className="mb-1">
                <small className="text-muted">Progress</small>
              </div>
              <ProgressBar 
                now={execution.progress} 
                variant={getProgressVariant()}
                style={{ height: '8px' }}
              />
            </Col>
            <Col xs={4} className="text-end">
              <ExecutionTimer 
                execution={execution} 
                compact={true}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-light border-0">
        <Row className="align-items-center">
          <Col>
            <h6 className="mb-0">
              {getStatusIcon()} Execution Progress - {getStatusText()}
            </h6>
          </Col>
          <Col xs="auto">
            <ExecutionTimer execution={execution} />
          </Col>
        </Row>
      </Card.Header>
      
      <Card.Body>
        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted">Overall Progress</span>
            <span className="fw-bold">{execution.progress}%</span>
          </div>
          <ProgressBar 
            now={execution.progress} 
            variant={getProgressVariant()}
            style={{ height: '12px' }}
            className="rounded-pill"
          />
        </div>

        {/* Current Step Information */}
        {execution.status === 'running' && execution.currentStep < execution.steps.length && (
          <div className="mb-4 p-3 bg-light rounded">
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm text-primary me-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div>
                <div className="fw-bold text-primary">
                  {execution.steps[execution.currentStep]?.name}
                </div>
                <small className="text-muted">
                  {execution.steps[execution.currentStep]?.description}
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicators */}
        {showSteps && (
          <div className="mt-4">
            <h6 className="text-muted mb-3">Execution Steps</h6>
            <Row>
              {execution.steps.map((step, index) => (
                <Col key={step.id} xs={12} md={6} lg={4} className="mb-3">
                  <StepIndicator 
                    step={step} 
                    isActive={index === execution.currentStep}
                    stepNumber={index + 1}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Execution Summary */}
        <div className="mt-4 pt-3 border-top">
          <Row className="text-center">
            <Col xs={6} md={3}>
              <div className="text-muted small">Total Steps</div>
              <div className="fw-bold">{execution.steps.length}</div>
            </Col>
            <Col xs={6} md={3}>
              <div className="text-muted small">Completed</div>
              <div className="fw-bold text-success">
                {execution.steps.filter(s => s.status === 'completed').length}
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="text-muted small">Failed</div>
              <div className="fw-bold text-danger">
                {execution.steps.filter(s => s.status === 'failed').length}
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="text-muted small">Remaining</div>
              <div className="fw-bold text-warning">
                {execution.steps.filter(s => s.status === 'pending').length}
              </div>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProgressTracker;