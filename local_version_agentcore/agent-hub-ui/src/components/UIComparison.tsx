import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/aws-inspired-theme.css';

const UIComparison: React.FC = () => {
  const [activeView, setActiveView] = useState<'current' | 'aws'>('current');

  return (
    <div className="aws-layout">
      <Container fluid className="aws-main-content">
        <div className="text-center mb-5">
          <h1 className="h2 mb-3" style={{ color: 'var(--aws-blue)' }}>
            🎨 UI Enhancement Preview
          </h1>
          <p className="aws-text-muted mb-4">
            Compare current design with AWS Console-inspired improvements
          </p>
          
          <div className="d-flex justify-content-center gap-3 mb-4">
            <Button
              className={`aws-btn ${activeView === 'current' ? 'aws-btn-primary' : 'aws-btn-secondary'}`}
              onClick={() => setActiveView('current')}
            >
              Current Design
            </Button>
            <Button
              className={`aws-btn ${activeView === 'aws' ? 'aws-btn-primary' : 'aws-btn-secondary'}`}
              onClick={() => setActiveView('aws')}
            >
              AWS-Inspired Design
            </Button>
          </div>
        </div>

        {/* AWS-Style Improvements Showcase */}
        <div className="aws-card mb-4">
          <div className="aws-card-header">
            🚀 AWS Console-Inspired Improvements
          </div>
          <div className="aws-card-body">
            <Row>
              <Col md={6}>
                <h6 className="mb-3" style={{ color: 'var(--aws-blue)' }}>✨ Visual Enhancements</h6>
                <ul className="small aws-text-muted">
                  <li><strong>Professional Color Scheme:</strong> AWS orange, clean grays, subtle blues</li>
                  <li><strong>Improved Typography:</strong> Amazon Ember font family, better hierarchy</li>
                  <li><strong>Consistent Spacing:</strong> AWS-standard spacing system</li>
                  <li><strong>Clean Shadows:</strong> Subtle depth without clutter</li>
                  <li><strong>Status Indicators:</strong> Clear, color-coded badges</li>
                </ul>
              </Col>
              <Col md={6}>
                <h6 className="mb-3" style={{ color: 'var(--aws-blue)' }}>🎯 UX Improvements</h6>
                <ul className="small aws-text-muted">
                  <li><strong>Breadcrumb Navigation:</strong> Clear page hierarchy</li>
                  <li><strong>Data-Dense Tables:</strong> More information, better readability</li>
                  <li><strong>Action-Oriented Buttons:</strong> Clear CTAs with proper hierarchy</li>
                  <li><strong>Responsive Design:</strong> Mobile-first approach</li>
                  <li><strong>Loading States:</strong> Better user feedback</li>
                </ul>
              </Col>
            </Row>
          </div>
        </div>

        {/* Live Demo Links */}
        <Row className="mb-4">
          <Col md={6}>
            <div className="aws-card">
              <div className="aws-card-header">
                🎨 Current Dashboard
              </div>
              <div className="aws-card-body text-center">
                <p className="aws-text-muted mb-3">
                  Your existing dashboard design
                </p>
                <Link to="/" className="text-decoration-none">
                  <Button className="aws-btn aws-btn-secondary">
                    View Current Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="aws-card">
              <div className="aws-card-header">
                ☁️ AWS-Inspired Dashboard
              </div>
              <div className="aws-card-body text-center">
                <p className="aws-text-muted mb-3">
                  Enhanced with AWS Console design principles
                </p>
                <Link to="/aws-dashboard" className="text-decoration-none">
                  <Button className="aws-btn aws-btn-primary">
                    View AWS-Style Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </Col>
        </Row>

        {/* Feature Comparison */}
        <div className="aws-card mb-4">
          <div className="aws-card-header">
            📊 Feature Comparison
          </div>
          <div className="aws-card-body">
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Current</th>
                    <th>AWS-Inspired</th>
                    <th>Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Navigation</strong></td>
                    <td><span className="aws-status-badge aws-status-info">Basic</span></td>
                    <td><span className="aws-status-badge aws-status-success">Enhanced</span></td>
                    <td className="small aws-text-muted">Breadcrumbs, better hierarchy</td>
                  </tr>
                  <tr>
                    <td><strong>Color Scheme</strong></td>
                    <td><span className="aws-status-badge aws-status-info">Standard</span></td>
                    <td><span className="aws-status-badge aws-status-success">Professional</span></td>
                    <td className="small aws-text-muted">AWS orange, clean grays</td>
                  </tr>
                  <tr>
                    <td><strong>Data Tables</strong></td>
                    <td><span className="aws-status-badge aws-status-warning">Basic</span></td>
                    <td><span className="aws-status-badge aws-status-success">Enhanced</span></td>
                    <td className="small aws-text-muted">Better density, readability</td>
                  </tr>
                  <tr>
                    <td><strong>Status Indicators</strong></td>
                    <td><span className="aws-status-badge aws-status-info">Standard</span></td>
                    <td><span className="aws-status-badge aws-status-success">Improved</span></td>
                    <td className="small aws-text-muted">Color-coded, consistent</td>
                  </tr>
                  <tr>
                    <td><strong>Spacing & Layout</strong></td>
                    <td><span className="aws-status-badge aws-status-warning">Inconsistent</span></td>
                    <td><span className="aws-status-badge aws-status-success">Systematic</span></td>
                    <td className="small aws-text-muted">AWS spacing standards</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="aws-alert aws-alert-info">
          <div className="d-flex align-items-start">
            <div className="me-2">💡</div>
            <div>
              <strong>Implementation Ready:</strong> The AWS-inspired theme is fully implemented and ready to use. 
              All components maintain existing functionality while providing a more professional, enterprise-grade appearance.
              <br />
              <small className="aws-text-muted mt-2 d-block">
                Switch between designs using the buttons above to see the improvements in action.
              </small>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default UIComparison;