import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';

const ButtonTest: React.FC = () => {
  return (
    <Container className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>Button Text Visibility Test</h3>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col>
                  <h5>Bootstrap Buttons</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="success">Success Button</Button>
                    <Button variant="warning">Warning Button</Button>
                    <Button variant="danger">Danger Button</Button>
                    <Button variant="info">Info Button</Button>
                    <Button variant="light">Light Button</Button>
                    <Button variant="dark">Dark Button</Button>
                  </div>
                  
                  <h5>Outline Buttons</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Button variant="outline-primary">Outline Primary</Button>
                    <Button variant="outline-secondary">Outline Secondary</Button>
                    <Button variant="outline-success">Outline Success</Button>
                    <Button variant="outline-warning">Outline Warning</Button>
                    <Button variant="outline-danger">Outline Danger</Button>
                    <Button variant="outline-info">Outline Info</Button>
                  </div>
                  
                  <h5>Button Sizes</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                    <Button variant="primary" size="sm">Small Button</Button>
                    <Button variant="primary">Regular Button</Button>
                    <Button variant="primary" size="lg">Large Button</Button>
                  </div>
                  
                  <h5>Badges</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Badge bg="primary">Primary Badge</Badge>
                    <Badge bg="secondary">Secondary Badge</Badge>
                    <Badge bg="success">Success Badge</Badge>
                    <Badge bg="warning">Warning Badge</Badge>
                    <Badge bg="danger">Danger Badge</Badge>
                    <Badge bg="info">Info Badge</Badge>
                    <Badge bg="light" text="dark">Light Badge</Badge>
                    <Badge bg="dark">Dark Badge</Badge>
                  </div>
                  
                  <h5>Enterprise Theme Buttons</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button className="af-btn af-btn-primary">AF Primary</button>
                    <button className="af-btn af-btn-secondary">AF Secondary</button>
                    <button className="af-btn af-btn-success">AF Success</button>
                    <button className="af-btn af-btn-warning">AF Warning</button>
                    <button className="af-btn af-btn-critical">AF Critical</button>
                    <button className="af-btn af-btn-outline">AF Outline</button>
                  </div>
                  
                  <h5>Enterprise Theme Badges</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="af-badge af-badge-primary">AF Primary</span>
                    <span className="af-badge af-badge-secondary">AF Secondary</span>
                    <span className="af-badge af-badge-success">AF Success</span>
                    <span className="af-badge af-badge-warning">AF Warning</span>
                    <span className="af-badge af-badge-critical">AF Critical</span>
                    <span className="af-badge af-badge-info">AF Info</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ButtonTest;