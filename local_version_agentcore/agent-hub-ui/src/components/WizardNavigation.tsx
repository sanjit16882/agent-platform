import React from 'react';
import { Button, Card, Row, Col, Spinner } from 'react-bootstrap';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  isValid: boolean;
  isGenerating: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  currentStep,
  totalSteps,
  isValid,
  isGenerating,
  onPrevious,
  onNext,
  onFinish
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const canGoNext = isValid || currentStep === totalSteps - 1; // Allow navigation to final step even if current step has warnings

  const getNextButtonText = () => {
    if (isLastStep) {
      return isGenerating ? 'Creating Agent...' : 'Create Agent';
    }
    
    // Special text for governance steps
    if (currentStep === totalSteps - 2) {
      return 'Review & Deploy →';
    }
    
    return 'Next →';
  };

  const getNextButtonVariant = () => {
    if (isLastStep) {
      return 'success';
    }
    return 'primary';
  };

  return (
    <Card className="border-0 bg-light">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={4}>
            {!isFirstStep && (
              <Button
                variant="outline-secondary"
                onClick={onPrevious}
                disabled={isGenerating}
                className="d-flex align-items-center"
              >
                ← Previous
              </Button>
            )}
          </Col>
          
          <Col md={4} className="text-center">
            <div className="d-flex align-items-center justify-content-center gap-3">
              <span className="text-muted small">
                Step {currentStep + 1} of {totalSteps}
              </span>
              
              {!isValid && currentStep < totalSteps - 1 && (
                <span className="text-warning small">
                  Please complete required fields
                </span>
              )}
              
              {isGenerating && (
                <div className="d-flex align-items-center text-primary">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span className="small">Processing...</span>
                </div>
              )}
            </div>
          </Col>
          
          <Col md={4} className="text-end">
            {isLastStep ? (
              <Button
                variant={getNextButtonVariant()}
                onClick={onFinish}
                disabled={!canGoNext || isGenerating}
                size="lg"
                className="d-flex align-items-center ms-auto"
              >
                {isGenerating ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating Agent...
                  </>
                ) : (
                  <>Create Agent</>
                )}
              </Button>
            ) : (
              <Button
                variant={getNextButtonVariant()}
                onClick={onNext}
                disabled={!canGoNext || isGenerating}
                className="d-flex align-items-center ms-auto"
              >
                {getNextButtonText()}
              </Button>
            )}
          </Col>
        </Row>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="progress" style={{ height: '4px' }}>
            <div
              className="progress-bar bg-primary"
              style={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
        
        {/* Step-specific help text */}
        <div className="mt-3 text-center">
          {currentStep === 0 && (
            <small className="text-muted">
              Configure the basic settings for your agent
            </small>
          )}
          
          {currentStep === 1 && (
            <small className="text-muted">
              Fine-tune advanced configuration options
            </small>
          )}
          
          {currentStep === totalSteps - 2 && (
            <small className="text-muted">
              Governance review ensures compliance and security
            </small>
          )}
          
          {currentStep === totalSteps - 1 && (
            <small className="text-muted">
              Review your configuration and deploy your agent
            </small>
          )}
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-2 text-center">
          <small className="text-muted">
            Use Tab to navigate fields, Enter to continue
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WizardNavigation;