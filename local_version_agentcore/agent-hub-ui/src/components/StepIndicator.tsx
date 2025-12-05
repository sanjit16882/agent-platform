import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { ExecutionStep } from '../services/progressService';

interface StepIndicatorProps {
  step: ExecutionStep;
  isActive: boolean;
  stepNumber: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step, isActive, stepNumber }) => {
  const getStepIcon = () => {
    switch (step.status) {
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

  const getStepVariant = () => {
    switch (step.status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'running':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getBorderClass = () => {
    if (isActive) return 'border-primary shadow-sm';
    switch (step.status) {
      case 'completed':
        return 'border-success';
      case 'failed':
        return 'border-danger';
      case 'running':
        return 'border-primary';
      default:
        return 'border-light';
    }
  };

  const getBackgroundClass = () => {
    if (isActive && step.status === 'running') return 'bg-primary bg-opacity-10';
    if (step.status === 'completed') return 'bg-success bg-opacity-10';
    if (step.status === 'failed') return 'bg-danger bg-opacity-10';
    return '';
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getActualDuration = (): string | null => {
    if (step.startTime && step.endTime) {
      const duration = Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000);
      return formatDuration(duration);
    }
    return null;
  };

  const getElapsedTime = (): string | null => {
    if (step.status === 'running' && step.startTime) {
      const elapsed = Math.round((Date.now() - step.startTime.getTime()) / 1000);
      return formatDuration(elapsed);
    }
    return null;
  };

  return (
    <Card className={`h-100 ${getBorderClass()} ${getBackgroundClass()}`}>
      <Card.Body className="p-3">
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <Badge 
              bg={getStepVariant()} 
              className="rounded-circle me-2"
              style={{ width: '24px', height: '24px', fontSize: '10px' }}
            >
              {stepNumber}
            </Badge>
            <div style={{ fontSize: '1.2rem' }}>{getStepIcon()}</div>
          </div>
          <Badge bg={getStepVariant()} className="text-capitalize">
            {step.status}
          </Badge>
        </div>

        <h6 className="card-title mb-2" style={{ fontSize: '0.9rem' }}>
          {step.name}
        </h6>
        
        <p className="card-text text-muted small mb-3">
          {step.description}
        </p>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Est: {formatDuration(step.estimatedDuration)}
            </small>
            {getActualDuration() && (
              <small className={`fw-bold ${step.status === 'completed' ? 'text-success' : 'text-danger'}`}>
                Actual: {getActualDuration()}
              </small>
            )}
            {getElapsedTime() && (
              <small className="text-primary fw-bold">
                {getElapsedTime()} elapsed
              </small>
            )}
          </div>

          {/* Progress bar for running step */}
          {step.status === 'running' && step.startTime && (
            <div className="mt-2">
              <div className="progress" style={{ height: '4px' }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  style={{ 
                    width: `${Math.min(100, (getElapsedTime() ? parseInt(getElapsedTime()!.replace(/[^\d]/g, '')) : 0) / step.estimatedDuration * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepIndicator;