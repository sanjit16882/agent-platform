/**
 * Insights Panel Component
 * Displays recommendations and failure patterns
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { testingApi } from '../../services/testingApi';
import { theme } from '../../styles/theme';

const InsightsPanel: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const data = await testingApi.getInsights();
      console.log('Insights data received:', data);
      setInsights(data);
      setError(null);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError('Failed to load insights from backend.');
      // Set empty state instead of demo data
      setInsights({
        recommendations: [],
        patterns: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (recId: string) => {
    // TODO: Implement apply recommendation
    alert(`Applying recommendation ${recId}...`);
  };

  const handleDismissRecommendation = (recId: string) => {
    if (insights) {
      setInsights({
        ...insights,
        recommendations: insights.recommendations.filter((r: any) => r.id !== recId)
      });
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading insights...</p>
        </Card.Body>
      </Card>
    );
  }

  const recommendations = insights?.recommendations || [];
  const patterns = insights?.patterns || [];

  return (
    <div>
      {error && (
        <Alert variant="warning" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}
      <Card className="mb-4 shadow-sm">
        <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
          💡 AI-Powered Recommendations
        </Card.Header>
        <Card.Body>
          {recommendations.length === 0 ? (
            <Alert variant="info">
              No recommendations available yet. Run some tests to receive AI-powered insights.
            </Alert>
          ) : (
            <ListGroup variant="flush">
              {recommendations.map((rec: any) => (
              <ListGroup.Item key={rec.id}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: theme.spacing.sm }}>
                      <Badge bg={rec.priority === 'high' ? 'danger' : 'warning'} className="me-2">
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <Badge bg="secondary">{rec.type}</Badge>
                    </div>
                    <h6 style={{ fontWeight: theme.typography.fontWeight.semibold }}>{rec.description}</h6>
                    <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                      {rec.improvement}
                    </p>
                    <div>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleApplyRecommendation(rec.id)}
                      >
                        Apply
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handleDismissRecommendation(rec.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header style={{ backgroundColor: theme.colors.backgroundSecondary, fontWeight: theme.typography.fontWeight.semibold }}>
          🔍 Failure Patterns
        </Card.Header>
        <Card.Body>
          {patterns.length === 0 ? (
            <Alert variant="success">
              No failure patterns detected. Your agents are performing well!
            </Alert>
          ) : (
            <ListGroup variant="flush">
              {patterns.map((pattern: any) => (
              <ListGroup.Item key={pattern.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Badge bg="info" className="me-2">{pattern.type}</Badge>
                    <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{pattern.description}</span>
                  </div>
                  <Badge bg="secondary">{pattern.occurrences} occurrences</Badge>
                </div>
              </ListGroup.Item>
            ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default InsightsPanel;
