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
import IntegrationGuidePage from './IntegrationGuidePage';

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
        <Route path="/integrations" element={<IntegrationGuidePage />} />
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

        {/* Integration Guide */}
        <Card>
          <Card.Header>
            <Card.Title>🔌 Integration Guide</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary }}>
              Integrate DDTF with popular testing frameworks and test management tools.
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl }}>
              <li>Robot Framework, Selenium, Cypress</li>
              <li>JUnit, Pytest integration</li>
              <li>TestRail, Xray, qTest</li>
              <li>CI/CD pipeline examples</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/agent-testing/integrations')}
              style={{ width: '100%' }}
            >
              View Integration Guide →
            </Button>
          </Card.Body>
        </Card>

        {/* Coming Soon - Advanced Features */}
        <Card style={{ border: '2px solid #ffc107', backgroundColor: '#fffbf0' }}>
          <Card.Header style={{ backgroundColor: '#fff3cd', borderBottom: '2px solid #ffc107' }}>
            <Card.Title>🚀 Coming Soon - Advanced Testing</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ marginBottom: theme.spacing.lg, color: theme.colors.textSecondary, fontWeight: 600 }}>
              Next-generation testing capabilities for production-grade AI agents
            </p>
            <ul style={{ marginBottom: theme.spacing.lg, paddingLeft: theme.spacing.xl, fontSize: '14px' }}>
              <li><strong>Agent Hallucination Firewall</strong> - Real-time protection</li>
              <li><strong>Load Testing & Chaos Engineering</strong> - Stress testing</li>
              <li><strong>Audit & Compliance Recorder</strong> - HIPAA/GDPR/SOX</li>
              <li><strong>Behavior Drift Detector</strong> - Continuous monitoring</li>
              <li><strong>Multi-Agent Orchestrator</strong> - Kubernetes for agents</li>
              <li><strong>Telemetry & Observability</strong> - Deep insights</li>
              <li><strong>Identity & Permission Brain</strong> - Dynamic IAM</li>
              <li><strong>Benchmark Marketplace</strong> - Community tests</li>
            </ul>
            <Button
              variant="warning"
              onClick={() => {
                // Scroll to details section
                const detailsSection = document.getElementById('coming-soon-details');
                if (detailsSection) {
                  detailsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{ width: '100%' }}
            >
              Learn More →
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

      {/* Coming Soon - Detailed Section */}
      <div id="coming-soon-details" style={{ marginTop: theme.spacing['3xl'], padding: theme.spacing.xl, backgroundColor: '#fffbf0', borderRadius: '8px', border: '2px solid #ffc107' }}>
        <h2 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.md,
          color: '#856404'
        }}>
          🚀 Coming Soon: Advanced Agent Testing Capabilities
        </h2>
        <p style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.xl, color: theme.colors.textSecondary }}>
          Next-generation testing features for production-grade AI agents. These capabilities are in active development.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: theme.spacing.lg
        }}>
          {/* Feature 1 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                🛡️ Agent Hallucination Firewall (AHF)
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                Real-Time Protection
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> Agents hallucinate while calling tools, APIs, or executing code. No realtime firewall exists.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> Runtime service between Agent ↔ Tools/APIs that:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Scores every action for hallucination risk</li>
                <li>Blocks suspicious tool calls</li>
                <li>Auto-retries with self-correction</li>
                <li>Logs hallucination metrics</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Feature 2 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                ⚡ Load Testing & Reliability Simulator
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#ffc107', color: '#000', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                Chaos Engineering
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> No one knows how agents behave under stress, concurrency, or tool failures.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> "Chaos Monkey for Agents" with:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Random tool outages & latency injection</li>
                <li>Long-session memory fatigue</li>
                <li>Multi-agent concurrency battles</li>
                <li>Reliability scores & drift graphs</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Feature 3 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                📋 Agent Audit & Compliance Recorder
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                Enterprise Compliance
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> Enterprises need proof of agent actions for HIPAA/GDPR/SOX compliance.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> Compliance layer that:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Records every agent step</li>
                <li>Hashes actions for immutability</li>
                <li>Provides "agent replay" capability</li>
                <li>Generates compliance-ready reports</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Feature 4 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                📊 Agent Behavior Drift Detector
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                Continuous Monitoring
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> LLMs drift over time. Agents silently become worse or unpredictable.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> Continuous monitoring that:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Runs baseline tests daily</li>
                <li>Detects behavioral drift</li>
                <li>Notifies if model updates break agents</li>
                <li>Auto-retrains guardrails</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Feature 5 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                🎯 Multi-Agent Task Orchestrator (MATO)
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#343a40', color: 'white', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                Kubernetes for Agents
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> No universal orchestrator for multiple collaborating agents.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> Orchestration framework with:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Auto-routing tasks between agents</li>
                <li>Resource allocation & conflict resolution</li>
                <li>Cross-agent memory management</li>
                <li>Performance scoring</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Feature 6 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                📈 Agent Telemetry & Observability
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#17a2b8', color: 'white', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                Datadog for Agents
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> No deep observability, behavior visualization, or intent-path graphs.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> Advanced dashboard with:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Agent reasoning timeline</li>
                <li>Tool call heatmap</li>
                <li>Token cost optimizer</li>
                <li>Error clustering & insights</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Feature 7 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                🔐 Real-Time Identity & Permission Brain
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                Dynamic IAM
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> Cloud IAM isn't built for autonomous agents needing dynamic permissions.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> Permission Brain that:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Creates temporary agent identities</li>
                <li>Issues scoped permissions dynamically</li>
                <li>Auto-expires permissions</li>
                <li>Prevents privilege escalation</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Feature 8 */}
          <Card style={{ border: '1px solid #ffc107' }}>
            <Card.Body>
              <h3 style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.sm, color: '#0066cc' }}>
                🏪 Agent Benchmark Marketplace
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', fontSize: '11px', marginBottom: theme.spacing.sm }}>
                MLPerf for Agents
              </div>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Problem:</strong> Every company tests agents manually. No standardized benchmarks.
              </p>
              <p style={{ fontSize: '13px', marginBottom: theme.spacing.sm }}>
                <strong>Solution:</strong> Marketplace where:
              </p>
              <ul style={{ fontSize: '12px', paddingLeft: theme.spacing.lg }}>
                <li>Anyone can publish test suites</li>
                <li>Teams run them against any agent</li>
                <li>Results shareable as scores</li>
                <li>Community-driven test library</li>
              </ul>
            </Card.Body>
          </Card>
        </div>

        {/* Call to Action */}
        <Card style={{ marginTop: theme.spacing.xl, backgroundColor: '#fff3cd', border: '2px solid #ffc107' }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.lg }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ fontSize: theme.typography.fontSize.xl, marginBottom: theme.spacing.sm, color: '#856404' }}>
                  🎯 Want Early Access to These Features?
                </h3>
                <p style={{ fontSize: '14px', marginBottom: 0, color: theme.colors.textSecondary }}>
                  Join our early access program to influence the roadmap and get priority access when features launch. 
                  Perfect for enterprises deploying production AI agents.
                </p>
              </div>
              <div>
                <Button
                  variant="warning"
                  onClick={() => alert('Early access program coming soon! Contact us at support@agenthub.com')}
                  style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 600 }}
                >
                  📝 Request Early Access
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default AgentTestingMain;
