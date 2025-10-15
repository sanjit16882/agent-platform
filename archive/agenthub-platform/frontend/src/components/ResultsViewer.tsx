import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const ResultsViewer: React.FC = () => {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();

  return (
    <Container>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5>📊 Execution Results</h5>
            </Card.Header>
            <Card.Body>
              <p>Results for execution: {executionId}</p>
              <p className="text-muted">This component will display detailed execution results.</p>
              <Button variant="primary" onClick={() => navigate('/agents')}>
                Back to Catalog
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResultsViewer;