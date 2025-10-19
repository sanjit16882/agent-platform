import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal, ProgressBar, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { templateService, AgentTemplate } from '../services/templateService';
import { governanceService } from '../services/governanceService';
import { complianceService } from '../services/complianceService';
import WizardStep from './WizardStep';
import ProgressIndicator from './ProgressIndicator';
import WizardNavigation from './WizardNavigation';

interface WizardState {
  templateId: string;
  currentStep: number;
  steps: WizardStepData[];
  values: Record<string, any>;
  errors: Record<string, string[]>;
  isValid: boolean;
  preview: any;
  complianceStatus: any;
}

interface WizardStepData {
  id: string;
  title: string;
  description: string;
  parameters: any[];
  validation: any[];
  dependencies?: string[];
  governanceCheckpoint?: boolean;
}

const WizardContainer: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [wizardState, setWizardState] = useState<WizardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (templateId) {
      initializeWizard(templateId);
    }
  }, [templateId]);

  const initializeWizard = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const templateData = await templateService.getTemplate(id);
      if (!templateData) {
        setError('Template not found');
        return;
      }
      
      // Check governance requirements
      if (templateData.approvalStatus !== 'Approved') {
        setError('This template requires approval before use. Please contact your administrator.');
        return;
      }
      
      setTemplate(templateData);
      
      // Initialize wizard steps based on template parameters
      const steps = generateWizardSteps(templateData);
      const initialValues = getInitialValues(templateData);
      
      setWizardState({
        templateId: id,
        currentStep: 0,
        steps,
        values: initialValues,
        errors: {},
        isValid: false,
        preview: null,
        complianceStatus: null
      });
      
    } catch (err) {
      setError('Failed to initialize wizard');
      console.error('Wizard initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateWizardSteps = (template: AgentTemplate): WizardStepData[] => {
    const steps: WizardStepData[] = [];
    
    // Step 1: Basic Configuration
    const basicParams = template.parameters.filter(p => 
      p.required || ['name', 'description', 'url', 'endpoint'].some(key => p.name.toLowerCase().includes(key))
    );
    
    if (basicParams.length > 0) {
      steps.push({
        id: 'basic-config',
        title: 'Basic Configuration',
        description: 'Configure the essential parameters for your agent',
        parameters: basicParams,
        validation: basicParams.map(p => ({ field: p.name, required: p.required }))
      });
    }
    
    // Step 2: Advanced Settings
    const advancedParams = template.parameters.filter(p => 
      !basicParams.includes(p) && !p.name.toLowerCase().includes('secret')
    );
    
    if (advancedParams.length > 0) {
      steps.push({
        id: 'advanced-settings',
        title: 'Advanced Settings',
        description: 'Fine-tune your agent configuration',
        parameters: advancedParams,
        validation: advancedParams.map(p => ({ field: p.name, required: p.required }))
      });
    }
    
    // Step 3: Security & Secrets (if any)
    const secretParams = template.parameters.filter(p => 
      p.type === 'secret' || p.name.toLowerCase().includes('secret') || 
      p.name.toLowerCase().includes('key') || p.name.toLowerCase().includes('token')
    );
    
    if (secretParams.length > 0) {
      steps.push({
        id: 'security-config',
        title: 'Security Configuration',
        description: 'Configure secure credentials and API keys',
        parameters: secretParams,
        validation: secretParams.map(p => ({ field: p.name, required: p.required })),
        governanceCheckpoint: true
      });
    }
    
    // Step 4: Governance Review (always included)
    steps.push({
      id: 'governance-review',
      title: 'Governance Review',
      description: 'Review compliance and approval requirements',
      parameters: [],
      validation: [],
      governanceCheckpoint: true
    });
    
    // Step 5: Preview & Deploy
    steps.push({
      id: 'preview-deploy',
      title: 'Preview & Deploy',
      description: 'Review your configuration and deploy the agent',
      parameters: [],
      validation: []
    });
    
    return steps;
  };

  const getInitialValues = (template: AgentTemplate): Record<string, any> => {
    const values: Record<string, any> = {};
    
    // Set default values from template parameters
    template.parameters.forEach(param => {
      if (param.defaultValue !== undefined) {
        values[param.name] = param.defaultValue;
      }
    });
    
    // Add agent metadata
    values.agentName = `${template.name} Agent`;
    values.agentDescription = `Generated from ${template.name} template`;
    
    return values;
  };

  const handleStepChange = async (newStep: number) => {
    if (!wizardState) return;
    
    // Validate current step before moving
    const currentStepData = wizardState.steps[wizardState.currentStep];
    const isValid = await validateStep(currentStepData, wizardState.values);
    
    if (!isValid && newStep > wizardState.currentStep) {
      return; // Don't allow forward navigation if current step is invalid
    }
    
    // Run governance checkpoint if needed
    if (currentStepData.governanceCheckpoint && newStep > wizardState.currentStep) {
      await runGovernanceCheck();
    }
    
    setWizardState(prev => prev ? {
      ...prev,
      currentStep: newStep
    } : null);
  };

  const handleValueChange = (field: string, value: any) => {
    if (!wizardState) return;
    
    setWizardState(prev => prev ? {
      ...prev,
      values: {
        ...prev.values,
        [field]: value
      },
      errors: {
        ...prev.errors,
        [field]: [] // Clear errors for this field
      }
    } : null);
  };

  const validateStep = async (step: WizardStepData, values: Record<string, any>): Promise<boolean> => {
    const errors: Record<string, string[]> = {};
    let isValid = true;
    
    // Validate required fields
    step.parameters.forEach(param => {
      if (param.required && (!values[param.name] || values[param.name] === '')) {
        errors[param.name] = [`${param.name} is required`];
        isValid = false;
      }
      
      // Run parameter-specific validation
      if (param.validation && values[param.name]) {
        param.validation.forEach((rule: any) => {
          if (rule.type === 'url' && !isValidUrl(values[param.name])) {
            errors[param.name] = errors[param.name] || [];
            errors[param.name].push('Must be a valid URL');
            isValid = false;
          }
          
          if (rule.type === 'email' && !isValidEmail(values[param.name])) {
            errors[param.name] = errors[param.name] || [];
            errors[param.name].push('Must be a valid email address');
            isValid = false;
          }
          
          if (rule.type === 'minLength' && values[param.name].length < rule.value) {
            errors[param.name] = errors[param.name] || [];
            errors[param.name].push(`Must be at least ${rule.value} characters`);
            isValid = false;
          }
        });
      }
    });
    
    // Update wizard state with validation results
    setWizardState(prev => prev ? {
      ...prev,
      errors,
      isValid
    } : null);
    
    return isValid;
  };

  const runGovernanceCheck = async () => {
    if (!wizardState || !template) return;
    
    try {
      // Run compliance check
      const complianceResult = await complianceService.scanAgent(
        wizardState.templateId, 
        wizardState.templateId
      );
      
      setWizardState(prev => prev ? {
        ...prev,
        complianceStatus: complianceResult
      } : null);
      
      // Check if compliance issues block deployment
      if (complianceResult.overallStatus === 'Non-Compliant') {
        const criticalViolations = complianceResult.violations.filter(v => v.severity === 'Critical');
        if (criticalViolations.length > 0) {
          throw new Error('Critical compliance violations must be resolved before deployment');
        }
      }
      
    } catch (error) {
      console.error('Governance check failed:', error);
      setError('Governance validation failed. Please review compliance requirements.');
    }
  };

  const handleFinish = async () => {
    if (!wizardState || !template) return;
    
    try {
      setIsGenerating(true);
      
      // Final validation
      const allStepsValid = await Promise.all(
        wizardState.steps.map(step => validateStep(step, wizardState.values))
      );
      
      if (!allStepsValid.every(valid => valid)) {
        setError('Please resolve all validation errors before deploying');
        return;
      }
      
      // Generate agent code
      const generatedCode = await templateService.generateCode(template, wizardState.values);
      
      // Create deployment request if governance requires it
      if (template.approvalStatus === 'Approved' && wizardState.complianceStatus?.overallStatus !== 'Non-Compliant') {
        // Direct deployment
        navigate('/agents', { 
          state: { 
            message: 'Agent created successfully!',
            agentData: generatedCode 
          }
        });
      } else {
        // Submit for approval
        await governanceService.submitForApproval(template.id, 'Deployment');
        navigate('/templates', { 
          state: { 
            message: 'Agent submitted for approval. You will be notified when it\'s ready for deployment.' 
          }
        });
      }
      
    } catch (error) {
      console.error('Agent creation failed:', error);
      setError('Failed to create agent. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    navigate('/templates');
  };

  // Utility functions
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Initializing wizard...</span>
          </div>
          <p className="mt-2">Setting up your agent creation wizard...</p>
        </div>
      </Container>
    );
  }

  if (error || !template || !wizardState) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Wizard Error</Alert.Heading>
          <p>{error || 'Failed to initialize wizard'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/templates')}>
            Back to Templates
          </Button>
        </Alert>
      </Container>
    );
  }

  const currentStepData = wizardState.steps[wizardState.currentStep];
  const progress = ((wizardState.currentStep + 1) / wizardState.steps.length) * 100;

  return (
    <Container fluid className="mt-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-1">Create Agent from Template</h2>
              <p className="text-muted mb-0">
                {template.name} → {wizardState.values.agentName || 'New Agent'}
              </p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Badge bg="primary">
                Step {wizardState.currentStep + 1} of {wizardState.steps.length}
              </Badge>
              <Button variant="outline-secondary" onClick={handleExit}>
                ✕ Exit
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Progress Indicator */}
      <Row className="mb-4">
        <Col>
          <ProgressIndicator 
            steps={wizardState.steps}
            currentStep={wizardState.currentStep}
            completedSteps={wizardState.currentStep}
          />
          <ProgressBar 
            now={progress} 
            variant="primary" 
            className="mt-2"
            style={{ height: '8px' }}
          />
        </Col>
      </Row>

      {/* Main Content */}
      <Row>
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">{currentStepData.title}</h4>
              <p className="mb-0 small opacity-75">{currentStepData.description}</p>
            </Card.Header>
            <Card.Body>
              {currentStepData.governanceCheckpoint && (
                <Alert variant="info" className="mb-4">
                  <strong>Governance Checkpoint</strong><br />
                  This step includes governance and compliance validation.
                </Alert>
              )}
              
              <WizardStep
                step={currentStepData}
                values={wizardState.values}
                errors={wizardState.errors}
                onValueChange={handleValueChange}
                template={template}
                complianceStatus={wizardState.complianceStatus}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Template Info</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>Template:</strong> {template.name}
              </div>
              <div className="mb-2">
                <strong>Category:</strong> 
                <Badge bg="primary" className="ms-2">{template.category}</Badge>
              </div>
              <div className="mb-2">
                <strong>Complexity:</strong>
                <Badge 
                  bg={template.complexity === 'Beginner' ? 'success' : 
                      template.complexity === 'Intermediate' ? 'warning' : 'danger'} 
                  className="ms-2"
                >
                  {template.complexity}
                </Badge>
              </div>
              <div className="mb-2">
                <strong>Est. Setup:</strong> ~{template.estimatedSetupTime} min
              </div>
            </Card.Body>
          </Card>

          {wizardState.complianceStatus && (
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Compliance Status</h6>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <Badge 
                    bg={wizardState.complianceStatus.overallStatus === 'Compliant' ? 'success' : 
                        wizardState.complianceStatus.overallStatus === 'Warning' ? 'warning' : 'danger'}
                    className="px-3 py-2"
                  >
                    {wizardState.complianceStatus.overallStatus}
                  </Badge>
                </div>
                <ProgressBar 
                  variant={wizardState.complianceStatus.score >= 90 ? 'success' : 
                           wizardState.complianceStatus.score >= 70 ? 'warning' : 'danger'}
                  now={wizardState.complianceStatus.score}
                  label={`${wizardState.complianceStatus.score}%`}
                />
                {wizardState.complianceStatus.violations.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">
                      {wizardState.complianceStatus.violations.length} policy violations
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Navigation */}
      <Row className="mt-4">
        <Col>
          <WizardNavigation
            currentStep={wizardState.currentStep}
            totalSteps={wizardState.steps.length}
            isValid={wizardState.isValid}
            isGenerating={isGenerating}
            onPrevious={() => handleStepChange(wizardState.currentStep - 1)}
            onNext={() => handleStepChange(wizardState.currentStep + 1)}
            onFinish={handleFinish}
          />
        </Col>
      </Row>

      {/* Exit Confirmation Modal */}
      <Modal show={showExitModal} onHide={() => setShowExitModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Exit Wizard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to exit the wizard? Your progress will be lost.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExitModal(false)}>
            Continue Wizard
          </Button>
          <Button variant="danger" onClick={confirmExit}>
            Exit Without Saving
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WizardContainer;