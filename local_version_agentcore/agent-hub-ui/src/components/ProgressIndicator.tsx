import React from 'react';
import { Badge } from 'react-bootstrap';

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
    governanceCheckpoint?: boolean;
  }>;
  currentStep: number;
  completedSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: any, status: string) => {
    if (status === 'completed') return '✅';
    if (status === 'current') return '🔄';
    if (step.governanceCheckpoint) return '🏛️';
    return '⭕';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'current': return 'primary';
      default: return 'light';
    }
  };

  return (
    <div className="progress-indicator">
      <div className="d-flex justify-content-between align-items-center">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="d-flex align-items-center flex-grow-1">
              {/* Step Circle */}
              <div className="d-flex flex-column align-items-center">
                <div
                  className={`step-circle d-flex align-items-center justify-content-center ${
                    status === 'current' ? 'pulse' : ''
                  }`}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: status === 'completed' ? '#28a745' : 
                                   status === 'current' ? '#007bff' : '#e9ecef',
                    color: status === 'pending' ? '#6c757d' : 'white',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    border: status === 'current' ? '3px solid #007bff' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {getStepIcon(step, status)}
                </div>
                
                {/* Step Info */}
                <div className="text-center mt-2" style={{ maxWidth: '120px' }}>
                  <div className={`small fw-bold ${
                    status === 'current' ? 'text-primary' : 
                    status === 'completed' ? 'text-success' : 'text-muted'
                  }`}>
                    {step.title}
                  </div>
                  
                  {step.governanceCheckpoint && (
                    <Badge bg="warning" className="mt-1 small">
                      Governance
                    </Badge>
                  )}
                  
                  {status === 'current' && (
                    <div className="small text-muted mt-1">
                      In Progress
                    </div>
                  )}
                </div>
              </div>
              
              {/* Connector Line */}
              {!isLast && (
                <div
                  className="flex-grow-1 mx-3"
                  style={{
                    height: '3px',
                    backgroundColor: index < currentStep ? '#28a745' : '#e9ecef',
                    transition: 'background-color 0.3s ease',
                    marginTop: '-25px'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current Step Description */}
      <div className="text-center mt-3">
        <div className="text-muted small">
          {steps[currentStep]?.description}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
            }
          }
          
          .step-circle:hover {
            transform: scale(1.05);
          }
        `
      }} />
    </div>
  );
};

export default ProgressIndicator;