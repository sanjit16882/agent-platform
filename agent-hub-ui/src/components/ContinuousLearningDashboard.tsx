import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Modal, Table, ProgressBar } from 'react-bootstrap';
import { API_CONFIG } from '../config/api';
// React Icons compatibility fix - using createElement
const { createElement } = React;
const icons = require('react-icons/fa');

const FaBrain = (props: any) => createElement(icons.FaBrain, props);
const FaChartLine = (props: any) => createElement(icons.FaChartLine, props);
const FaUsers = (props: any) => createElement(icons.FaUsers, props);
const FaLightbulb = (props: any) => createElement(icons.FaLightbulb, props);
const FaCog = (props: any) => createElement(icons.FaCog, props);
const FaFlask = (props: any) => createElement(icons.FaFlask, props);
const FaDownload = (props: any) => createElement(icons.FaDownload, props);

interface LearningAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalInteractions: number;
  totalFeedback: number;
  avgAcceptanceRate: number;
  avgExplorationLevel: number;
  feedbackRate: number;
  learningVelocity: number;
  topIntents: Array<{ intent: string; count: number }>;
  topSuggestionTypes: Array<{ type: string; score: number; positive: number; negative: number }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
}

interface UserProfile {
  userId: string;
  interactionCount: number;
  learningProgress: number;
  acceptanceRate: number;
  explorationLevel: number;
  confidenceThreshold: number;
  recommendations: string[];
  lastActive: string;
}

const ContinuousLearningDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [abTestResults, setAbTestResults] = useState<any>(null);

  const currentUserId = 'user_demo_001'; // In production, get from auth context

  useEffect(() => {
    fetchLearningData();
  }, []);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      
      // Use mock data for now (backend endpoints not yet implemented)
      console.log('📊 Loading mock learning data...');
      
      // Mock analytics data matching LearningAnalytics interface
      const mockAnalytics: LearningAnalytics = {
        totalUsers: 156,
        activeUsers: 89,
        totalInteractions: 1247,
        totalFeedback: 423,
        avgAcceptanceRate: 0.85,
        avgExplorationLevel: 0.72,
        feedbackRate: 0.34,
        learningVelocity: 0.92,
        topIntents: [
          { intent: 'code-analysis', count: 342 },
          { intent: 'testing', count: 289 },
          { intent: 'documentation', count: 187 },
          { intent: 'deployment', count: 145 }
        ],
        topSuggestionTypes: [
          { type: 'agent-recommendation', score: 0.88, positive: 245, negative: 32 },
          { type: 'workflow-optimization', score: 0.82, positive: 198, negative: 45 },
          { type: 'parameter-tuning', score: 0.79, positive: 167, negative: 38 }
        ],
        insights: [
          {
            type: 'trend',
            title: 'Increasing Agent Usage',
            description: 'Code analysis agent usage increased by 23% this week',
            recommendation: 'Consider adding more code analysis capabilities'
          },
          {
            type: 'optimization',
            title: 'High Acceptance Rate',
            description: 'Users accept 85% of AI suggestions',
            recommendation: 'Current suggestion algorithm is performing well'
          }
        ]
      };
      
      setAnalytics(mockAnalytics);

      // Mock user profile matching UserProfile interface
      const mockProfile: UserProfile = {
        userId: currentUserId,
        interactionCount: 47,
        learningProgress: 0.68,
        acceptanceRate: 0.82,
        explorationLevel: 0.75,
        confidenceThreshold: 0.7,
        recommendations: [
          'Try using the testing agent for better code coverage',
          'Explore multi-agent workflows for complex tasks',
          'Consider enabling continuous learning features'
        ],
        lastActive: new Date().toISOString()
      };
      
      setUserProfile(mockProfile);

      // Mock A/B test results
      const mockAbTestResults = {
        success: true,
        testName: 'suggestion_algorithm_v2',
        controlGroup: {
          users: 500,
          conversions: 350,
          conversionRate: 0.70
        },
        treatmentGroup: {
          users: 500,
          conversions: 425,
          conversionRate: 0.85
        },
        improvement: 21.4,
        confidence: 0.95,
        status: 'significant'
      };
      
      setAbTestResults(mockAbTestResults);
      
      console.log('✅ Mock learning data loaded successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch learning data');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeProfile = async (optimizationType: string) => {
    try {
      setOptimizing(true);
      const baseUrl = API_CONFIG.BACKEND_URL;
      
      const response = await fetch(`${baseUrl}/api/intelligence/learning/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          optimizationType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh user profile
        await fetchLearningData();
        setShowOptimizeModal(false);
      } else {
        setError(data.error || 'Optimization failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const baseUrl = API_CONFIG.BACKEND_URL;
      const response = await fetch(`${baseUrl}/api/intelligence/learning/export`);
      const data = await response.json();
      
      if (data.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setShowExportModal(false);
      } else {
        setError(data.error || 'Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading learning analytics...</span>
          </div>
          <p className="mt-2">Loading continuous learning analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Learning Data</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchLearningData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Demo Mode Notice */}
      <div className="alert alert-info mb-3" role="alert">
        <h4 className="alert-heading">📊 Demo Mode</h4>
        <p className="mb-0">
          This dashboard is currently displaying mock data for demonstration purposes. 
          The continuous learning backend endpoints are not yet implemented.
        </p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><FaBrain className="me-2 text-primary" />Continuous Learning Dashboard</h2>
          <p className="text-muted">Monitor and optimize AI learning performance across the platform</p>
        </div>
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={() => setShowOptimizeModal(true)}
          >
            <FaCog className="me-1" />Optimize
          </Button>
          <Button 
            variant="outline-secondary"
            onClick={() => setShowExportModal(true)}
          >
            <FaDownload className="me-1" />Export Data
          </Button>
        </div>
      </div>

      {/* Platform Learning Overview */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaUsers className="text-primary mb-2" size={32} />
              <h4>{analytics?.totalUsers || 0}</h4>
              <p className="text-muted mb-0">Total Users</p>
              <small className="text-success">
                {analytics?.activeUsers || 0} active
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaChartLine className="text-success mb-2" size={32} />
              <h4>{analytics?.avgAcceptanceRate || 0}%</h4>
              <p className="text-muted mb-0">Avg Acceptance Rate</p>
              <small className="text-info">
                {analytics?.totalInteractions || 0} interactions
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaLightbulb className="text-warning mb-2" size={32} />
              <h4>{analytics?.learningVelocity || 0}</h4>
              <p className="text-muted mb-0">Learning Velocity</p>
              <small className="text-info">
                interactions/user/week
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaFlask className="text-info mb-2" size={32} />
              <h4>{analytics?.avgExplorationLevel || 0}%</h4>
              <p className="text-muted mb-0">Exploration Level</p>
              <small className="text-muted">
                {analytics?.feedbackRate || 0}% feedback rate
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Learning Profile */}
      {userProfile && (
        <Row className="mb-4">
          <Col md={8}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Your Learning Profile</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label">Learning Progress</label>
                      <ProgressBar 
                        now={userProfile.learningProgress} 
                        label={`${userProfile.learningProgress}%`}
                        variant={userProfile.learningProgress > 70 ? 'success' : 'primary'}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Acceptance Rate</label>
                      <ProgressBar 
                        now={userProfile.acceptanceRate} 
                        label={`${userProfile.acceptanceRate}%`}
                        variant={userProfile.acceptanceRate > 60 ? 'success' : 'warning'}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Exploration Level</label>
                      <ProgressBar 
                        now={userProfile.explorationLevel} 
                        label={`${userProfile.explorationLevel}%`}
                        variant="info"
                      />
                    </div>
                  </Col>
                  <Col md={6}>
                    <p><strong>Interactions:</strong> {userProfile.interactionCount}</p>
                    <p><strong>Confidence Threshold:</strong> {(userProfile.confidenceThreshold * 100).toFixed(0)}%</p>
                    <p><strong>Last Active:</strong> {new Date(userProfile.lastActive).toLocaleDateString()}</p>
                    
                    {userProfile.recommendations.length > 0 && (
                      <div className="mt-3">
                        <strong>Recommendations:</strong>
                        <ul className="mt-2">
                          {userProfile.recommendations.map((rec, index) => (
                            <li key={index} className="small text-muted">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Learning Insights</h5>
              </Card.Header>
              <Card.Body>
                {analytics?.insights && analytics.insights.length > 0 ? (
                  analytics.insights.map((insight, index) => (
                    <div key={index} className={`alert alert-${getInsightBadgeVariant(insight.type)} p-2 mb-2`} role="alert">
                      <div className="small">
                        <strong>{insight.title}</strong><br />
                        {insight.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No insights available yet. Keep using the platform to generate insights!</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Popular Intents and Suggestion Types */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Top User Intents</h5>
            </Card.Header>
            <Card.Body>
              {analytics?.topIntents && analytics.topIntents.length > 0 ? (
                <Table size="sm">
                  <thead>
                    <tr>
                      <th>Intent</th>
                      <th>Usage Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topIntents.map((intent, index) => (
                      <tr key={index}>
                        <td>{intent.intent}</td>
                        <td>
                          <Badge bg="primary">{intent.count}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No intent data available yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Suggestion Performance</h5>
            </Card.Header>
            <Card.Body>
              {analytics?.topSuggestionTypes && analytics.topSuggestionTypes.length > 0 ? (
                <Table size="sm">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Score</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topSuggestionTypes.map((type, index) => (
                      <tr key={index}>
                        <td>{type.type}</td>
                        <td>
                          <Badge bg={type.score > 0 ? 'success' : 'danger'}>
                            {type.score > 0 ? '+' : ''}{type.score}
                          </Badge>
                        </td>
                        <td className="small">
                          <span className="text-success">{type.positive}↑</span>
                          {' '}
                          <span className="text-danger">{type.negative}↓</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No suggestion performance data available yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* A/B Testing Results */}
      {abTestResults && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">A/B Testing Results: {abTestResults.testName}</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center p-3 border rounded">
                      <h6>Variant A</h6>
                      <h4>{(abTestResults.results.A.conversionRate * 100).toFixed(1)}%</h4>
                      <small className="text-muted">
                        {abTestResults.results.A.conversions}/{abTestResults.results.A.interactions} conversions
                      </small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 border rounded">
                      <h6>Variant B</h6>
                      <h4>{(abTestResults.results.B.conversionRate * 100).toFixed(1)}%</h4>
                      <small className="text-muted">
                        {abTestResults.results.B.conversions}/{abTestResults.results.B.interactions} conversions
                      </small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 border rounded">
                      <h6>Analysis</h6>
                      <Badge bg={
                        abTestResults.analysis.significance === 'significant' ? 'success' :
                        abTestResults.analysis.significance === 'trending' ? 'warning' : 'secondary'
                      }>
                        {abTestResults.analysis.significance.replace('_', ' ')}
                      </Badge>
                      <div className="mt-2 small text-muted">
                        {abTestResults.analysis.conversionDifference}% difference
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Optimization Modal */}
      <Modal show={showOptimizeModal} onHide={() => setShowOptimizeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Optimize Learning Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Choose an optimization type to improve your learning experience:</p>
          <div className="d-grid gap-2">
            <Button 
              variant="outline-primary"
              onClick={() => handleOptimizeProfile('confidence_threshold')}
              disabled={optimizing}
            >
              Optimize Confidence Threshold
            </Button>
            <Button 
              variant="outline-primary"
              onClick={() => handleOptimizeProfile('exploration_level')}
              disabled={optimizing}
            >
              Optimize Exploration Level
            </Button>
            <Button 
              variant="outline-primary"
              onClick={() => handleOptimizeProfile('full_optimization')}
              disabled={optimizing}
            >
              Full Profile Optimization
            </Button>
          </div>
          {optimizing && (
            <div className="text-center mt-3">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Optimizing...</span>
              </div>
              <span className="ms-2">Optimizing profile...</span>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Learning Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Export comprehensive learning data for analysis:</p>
          <ul>
            <li>User interactions and preferences</li>
            <li>Feedback patterns and ratings</li>
            <li>Suggestion performance metrics</li>
            <li>A/B testing results</li>
          </ul>
          <div className="alert alert-info small" role="alert">
            Data will be exported as JSON format with anonymized user identifiers.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExportData}>
            <FaDownload className="me-1" />Export Data
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ContinuousLearningDashboard;