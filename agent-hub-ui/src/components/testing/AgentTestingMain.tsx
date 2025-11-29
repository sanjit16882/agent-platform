import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';
import DDTFWorkflow from './DDTFWorkflow';
import TestResultsViewer from './TestResultsViewer';
import VersionComparison from './VersionComparison';
import AnalyticsDashboard from './AnalyticsDashboard';
import MultimodalTestingPanel from './MultimodalTestingPanel';
import ApiCliDocumentationPage from './ApiCliDocumentationPage';
import BatchTestExecution from './BatchTestExecution';

/**
 * AgentTestingMain Component
 * 
 * Main entry point for the AI Agent Testing Framework.
 * Provides navigation between different testing features.
 */
const AgentTestingMain: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on a sub-route
  const isSubRoute = location.pathname !== '/agent-testing' && location.pathname !== '/agent-testing/';

  if (isSubRoute) {
    return (
      <Routes>
        <Route path="/workflow" element={<DDTFWorkflow />} />
        <Route path="/results/:runId" element={<TestResultsViewer />} />
        <Route path="/comparison" element={<VersionComparison />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/multimodal" element={<MultimodalTestingPanel agentId="" testId="" />} />
        <Route path="/api-cli-docs" element={<ApiCliDocumentationPage />} />
        <Route path="/batch" element={<BatchTestExecution />} />
      </Routes>
    );
  }

  return (
    <div style={{ padding: theme.spacing.xl }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing['3xl'] }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm
        }}>
          AI Agent Testing Framework
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.textSecondary
        }}>
          Comprehensive testing, insights, and analytics for your AI agents
        </p>
      </div>

      {/* Feature Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: theme.spacing.xl,
        marginBottom: theme.spacing['3xl']
      }}>
        {/* DDTF Workflow */}
        <Card>
          <Card.Header>
            <Card.Title>🧪 Run Tests</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Execute comprehensive tests against your agents with our 8-step workflow wizard.
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl }}>
              <li>Select agent and AI models</li>
              <li>Choose tests to run</li>
              <li>Configure test inputs</li>
              <li>Compare model performance</li>
              <li>Get AI-powered insights</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/agent-testing/workflow')}
              style={{ width: '100%' }}
            >
              Start Testing →
            </Button>
          </Card.Body>
        </Card>

        {/* Version Comparison */}
        <Card>
          <Card.Header>
            <Card.Title>📊 Compare Versions</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Compare test results across different runs to track improvements and regressions.
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl }}>
              <li>Side-by-side comparison</li>
              <li>Diff highlighting</li>
              <li>Score deltas</li>
              <li>Export reports</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/agent-testing/comparison')}
              style={{ width: '100%' }}
            >
              Compare Results →
            </Button>
          </Card.Body>
        </Card>

        {/* Analytics Dashboard */}
        <Card>
          <Card.Header>
            <Card.Title>📈 Analytics</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Visualize testing trends, performance metrics, and insights over time.
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl }}>
              <li>Pass rate trends</li>
              <li>Category performance</li>
              <li>Cost analysis</li>
              <li>Historical data</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/agent-testing/analytics')}
              style={{ width: '100%' }}
            >
              View Analytics →
            </Button>
          </Card.Body>
        </Card>

        {/* Multimodal Testing */}
        <Card>
          <Card.Header>
            <Card.Title>🎭 Multimodal Testing</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Test your agents with images, audio, video, and text inputs.
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl }}>
              <li>Image analysis testing</li>
              <li>Audio transcription</li>
              <li>Video processing</li>
              <li>Multi-input validation</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/agent-testing/multimodal')}
              style={{ width: '100%' }}
            >
              Test Multimodal →
            </Button>
          </Card.Body>
        </Card>

        {/* API & CLI Documentation */}
        <Card>
          <Card.Header>
            <Card.Title>💻 API & CLI</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Programmatic access to agent testing via REST API, CLI tool, and SDK.
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl }}>
              <li>REST API endpoints</li>
              <li>CLI commands & examples</li>
              <li>SDK/Client library</li>
              <li>CI/CD integration</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/agent-testing/api-cli-docs')}
              style={{ width: '100%' }}
            >
              View Documentation →
            </Button>
          </Card.Body>
        </Card>

        {/* Batch Test Execution */}
        <Card>
          <Card.Header>
            <Card.Title>⚡ Batch Execution</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Run tests across multiple agents simultaneously for efficient testing.
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl }}>
              <li>Multi-agent testing</li>
              <li>Parallel execution</li>
              <li>Progress tracking</li>
              <li>Bulk result analysis</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/agent-testing/batch')}
              style={{ width: '100%' }}
            >
              Start Batch Testing →
            </Button>
          </Card.Body>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Start Guide</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: theme.spacing.xl
          }}>
            <div>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.md
              }}>
                1. Run Your First Test
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                Click "Start Testing" to launch the workflow wizard. Select an agent, choose tests, and execute.
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.md
              }}>
                2. Review Results
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                View detailed test results with pass/fail status, scores, and AI-generated insights.
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.md
              }}>
                3. Track Progress
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                Use analytics and comparison tools to track improvements over time.
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Features Overview */}
      <div style={{ marginTop: theme.spacing['3xl'] }}>
        <h2 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.xl
        }}>
          Features
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.lg
        }}>
          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>✅</div>
            <strong>5 Evaluation Methods</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Hallucination, Functional, Tool Usage, Emotional, Safety
            </p>
          </div>

          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>🤖</div>
            <strong>AI-Powered Insights</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Get intelligent recommendations from Claude 3.5
            </p>
          </div>

          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>📊</div>
            <strong>Rich Visualizations</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Charts, trends, and performance metrics
            </p>
          </div>

          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>📤</div>
            <strong>Export Data</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Export results to JSON and CSV formats
            </p>
          </div>

          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>🔄</div>
            <strong>Version Tracking</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Compare results across test runs
            </p>
          </div>

          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>⚡</div>
            <strong>Real-time Updates</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Live progress tracking during execution
            </p>
          </div>

          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>🔬</div>
            <strong>Multi-Model Testing</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Compare performance across AI models
            </p>
          </div>

          <div>
            <div style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm }}>🎭</div>
            <strong>Multimodal Testing</strong>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Test with images, audio, and video
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTestingMain;
