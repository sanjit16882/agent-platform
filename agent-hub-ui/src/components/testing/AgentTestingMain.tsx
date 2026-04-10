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

      </div>

      {/* Coming Soon - Advanced Features */}
      <Card style={{ marginTop: theme.spacing['2xl'], backgroundColor: '#FFF9E6', border: '1px solid #FFE4A3' }}>
        <Card.Header style={{ backgroundColor: 'transparent', padding: theme.spacing.lg, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            <Card.Title style={{ fontSize: '18px', fontWeight: 700, color: '#333', margin: 0 }}>
              Coming Soon: Advanced Agent Testing Capabilities
            </Card.Title>
          </div>
          <p style={{ fontSize: '13px', color: '#666', margin: 0, paddingLeft: '32px' }}>
            Next-generation testing features for production-grade AI agents. These capabilities are in active development.
          </p>
        </Card.Header>
        <Card.Body style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: theme.spacing.lg
          }}>
            {/* Row 1 */}
            {/* Feature 1 - Agent Hallucination Firewall */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>🛡️</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Agent Hallucination Firewall (AHF)
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                Real-Time Protection
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> Agents hallucinate while calling tools, APIs, or executing code. No runtime safety net.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> Runtime service between Agent → Tool/API that:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Blocks suspicious tool calls</li>
                <li>Flags invented APIs</li>
                <li>Auto retries with LLM</li>
                <li>Logs for hallucination audit</li>
              </ul>
            </div>

            {/* Feature 2 - Load Testing & Reliability Simulator */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Load Testing & Reliability Simulator
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                Chaos Engineering
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> No one knows how agents behave under stress, long sessions, or tool failures.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> "Chaos Monkey for Agents" with:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Random tool outages & latency</li>
                <li>Long session memory fatigue</li>
                <li>Multi-agent concurrency</li>
                <li>Malformed tool & API outputs</li>
              </ul>
            </div>

            {/* Feature 3 - Agent Audit & Compliance Recorder */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>📋</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Agent Audit & Compliance Recorder
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                Enterprise Compliance
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> Enterprises need proof of agent actions for infrastructure/API/ML compliance.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> Compliance layer that:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Records every agent call</li>
                <li>Hashes access for immutability</li>
                <li>"Playback" agent replay</li>
                <li>Exportable compliance data reports</li>
              </ul>
            </div>

            {/* Feature 4 - Agent Behavior Drift Detector */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>📊</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Agent Behavior Drift Detector
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#E0E7FF',
                color: '#3730A3',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                Continuous Monitoring
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> LLMs get over time. Agents silently become worse or unpredictable.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> Continuous monitoring that:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Runs baseline tests daily</li>
                <li>Detects behavioral drift</li>
                <li>Tracks LLM model updates</li>
                <li>Alerts on AI model break agents</li>
              </ul>
            </div>

            {/* Row 2 */}
            {/* Feature 5 - Multi-Agent Task Orchestrator */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>🔀</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Multi-Agent Task Orchestrator (MATO)
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#F3E8FF',
                color: '#6B21A8',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                Orchestration for Agents
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> No universal orchestrator for multiple collaborating agents.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> Orchestration framework with:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Subordinate tasks between agents</li>
                <li>Manages agent memory alignment</li>
                <li>Cross-agent context resolution</li>
                <li>Performance scoring</li>
              </ul>
            </div>

            {/* Feature 6 - Agent Telemetry & Observability */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>📡</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Agent Telemetry & Observability
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#DCFCE7',
                color: '#166534',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                Datadog for Agents
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> No deep observability, behavior visualization, or intent path-graphs.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> Advanced dashboard with:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Agent reasoning timeline</li>
                <li>Agent tool-call graph</li>
                <li>Token cost profiler</li>
                <li>Error clustering & insights</li>
              </ul>
            </div>

            {/* Feature 7 - Real-Time Identity & Permission Brain */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>🔐</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Real-Time Identity & Permission Brain
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                Production IAM
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> Cloud IAM isn't built for autonomous agents needing dynamic permissions.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> Permission Brain that:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Creates temporary agent identities</li>
                <li>Grants scoped permissions dynamically</li>
                <li>Enterprise permission dynamics</li>
                <li>Revokes after task completion</li>
              </ul>
            </div>

            {/* Feature 8 - Agent Benchmark Marketplace */}
            <div style={{ 
              padding: theme.spacing.md,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                <span style={{ fontSize: '16px' }}>🏪</span>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#333', margin: 0, flex: 1 }}>
                  Agent Benchmark Marketplace
                </h4>
              </div>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                marginBottom: theme.spacing.sm
              }}>
                AI/Test for Agents
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Problem:</strong> Every company tests agents manually. No standardized benchmarks.
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: theme.spacing.sm, lineHeight: '1.5' }}>
                <strong>Solution:</strong> Marketplace where:
              </p>
              <ul style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>
                <li>Anyone can publish test suites</li>
                <li>Buy domain-specific agent tests</li>
                <li>Results shareable as scores</li>
                <li>Community-driven test library</li>
              </ul>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AgentTestingMain;
