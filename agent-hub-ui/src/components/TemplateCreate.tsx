import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { templateService, AgentTemplate, TemplateParameter } from '../services/templateService';

const TemplateCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'Business' as 'QE' | 'DevOps' | 'Security' | 'Business',
    complexity: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    estimatedSetupTime: 15,
    tags: '',
    technologies: '',
    codeTemplate: '',
    documentation: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const template: Partial<AgentTemplate> = {
        ...templateData,
        tags: templateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        technologies: templateData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
        parameters: [], // Will be added in advanced editor
        dependencies: [],
        sampleOutputs: []
      };

      const createdTemplate = await templateService.createTemplate(template);
      setSuccess(`Template "${createdTemplate.name}" created successfully!`);
      
      // Navigate to template details after a short delay
      setTimeout(() => {
        navigate(`/templates/${createdTemplate.id}`);
      }, 2000);
      
    } catch (err) {
      setError('Failed to create template. Please try again.');
      console.error('Error creating template:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 text-dark">
                Create New Template
              </h1>
              <p className="text-muted">
                Build reusable agent templates for your organization
              </p>
            </div>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/templates')}
            >
              Back to Library
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Template Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Template Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={templateData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Web UI Test Automation"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        value={templateData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        required
                      >
                        <option value="QE">QE & Testing</option>
                        <option value="DevOps">DevOps & Infrastructure</option>
                        <option value="Security">Security & Compliance</option>
                        <option value="Business">Business & Analytics</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={templateData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this template does and its key features..."
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Complexity Level</Form.Label>
                      <Form.Select
                        value={templateData.complexity}
                        onChange={(e) => handleInputChange('complexity', e.target.value)}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estimated Setup Time (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        value={templateData.estimatedSetupTime}
                        onChange={(e) => handleInputChange('estimatedSetupTime', parseInt(e.target.value))}
                        min="1"
                        max="120"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags</Form.Label>
                      <Form.Control
                        type="text"
                        value={templateData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="testing, automation, web (comma-separated)"
                      />
                      <Form.Text className="text-muted">
                        Comma-separated tags for better discoverability
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Technologies</Form.Label>
                      <Form.Control
                        type="text"
                        value={templateData.technologies}
                        onChange={(e) => handleInputChange('technologies', e.target.value)}
                        placeholder="Playwright, TypeScript, Docker (comma-separated)"
                      />
                      <Form.Text className="text-muted">
                        Technologies and frameworks used
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Code Template</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    value={templateData.codeTemplate}
                    onChange={(e) => handleInputChange('codeTemplate', e.target.value)}
                    placeholder="# Template code structure
# Use {{parameterName}} for dynamic values
def main():
    print('Hello from {{agentName}}')"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <Form.Text className="text-muted">
                    Use double curly braces for parameter substitution: {`{{parameterName}}`}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Documentation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={templateData.documentation}
                    onChange={(e) => handleInputChange('documentation', e.target.value)}
                    placeholder="Provide detailed documentation about how to use this template..."
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    type="submit" 
                    variant="success" 
                    disabled={loading || !templateData.name || !templateData.description}
                  >
                    {loading ? 'Creating...' : 'Create Template'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline-secondary"
                    onClick={() => navigate('/templates')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Best Practices</h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Badge bg="secondary" className="me-2">1</Badge>
                  Use descriptive names and clear descriptions
                </li>
                <li className="mb-2">
                  <Badge bg="secondary" className="me-2">2</Badge>
                  Add relevant tags for better discoverability
                </li>
                <li className="mb-2">
                  <Badge bg="secondary" className="me-2">3</Badge>
                  Keep setup time realistic and achievable
                </li>
                <li className="mb-2">
                  <Badge bg="secondary" className="me-2">4</Badge>
                  Include comprehensive documentation
                </li>
              </ul>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Next Steps</h6>
            </Card.Header>
            <Card.Body>
              <p className="small text-muted">
                After creating your template, you can:
              </p>
              <ul className="small">
                <li>Add configurable parameters</li>
                <li>Define dependencies and requirements</li>
                <li>Submit for governance approval</li>
                <li>Test with sample data</li>
                <li>Publish to marketplace</li>
              </ul>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h6 className="mb-0">Template Categories</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-1">
                <Badge bg="outline-secondary">QE & Testing</Badge>
                <Badge bg="outline-secondary">DevOps</Badge>
                <Badge bg="outline-secondary">Security</Badge>
                <Badge bg="outline-secondary">Business</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TemplateCreate;