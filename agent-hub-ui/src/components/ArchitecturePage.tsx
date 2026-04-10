import React from 'react';
import Card from './common/Card';
import { theme } from '../styles/theme';

/**
 * ArchitecturePage Component
 * 
 * Displays simplified architecture diagram for non-technical audiences
 */
const ArchitecturePage: React.FC = () => {
  return (
    <div style={{ padding: theme.spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing['2xl'] }}>
        <h1 style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm
        }}>
          How Agent Hub Works
        </h1>
        <p style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.textSecondary
        }}>
          A complete platform for building, testing, and deploying AI agents
        </p>
      </div>

      {/* Architecture Diagram */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <Card.Header>
          <Card.Title>Platform Architecture</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{ 
            padding: theme.spacing.xl,
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            position: 'relative'
          }}>
            <svg width="100%" height="600" viewBox="0 0 1200 600" style={{ maxWidth: '100%' }}>
              {/* Background layers */}
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4854D9', stopOpacity: 0.1 }} />
                  <stop offset="100%" style={{ stopColor: '#4854D9', stopOpacity: 0.05 }} />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.1 }} />
                  <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.05 }} />
                </linearGradient>
                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 0.1 }} />
                  <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 0.05 }} />
                </linearGradient>
              </defs>

              {/* Layer 1: User Interface */}
              <rect x="50" y="30" width="1100" height="120" fill="url(#blueGradient)" stroke="#4854D9" strokeWidth="2" rx="8" />
              <text x="600" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1F2937">
                What You See & Use
              </text>
              
              {/* User Interface Components */}
              <rect x="100" y="75" width="200" height="60" fill="white" stroke="#4854D9" strokeWidth="2" rx="6" />
              <text x="200" y="100" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1F2937">🎨 Visual Builder</text>
              <text x="200" y="120" textAnchor="middle" fontSize="11" fill="#6B7280">Drag & drop agents</text>

              <rect x="340" y="75" width="200" height="60" fill="white" stroke="#4854D9" strokeWidth="2" rx="6" />
              <text x="440" y="100" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1F2937">📊 Dashboard</text>
              <text x="440" y="120" textAnchor="middle" fontSize="11" fill="#6B7280">View performance</text>

              <rect x="580" y="75" width="200" height="60" fill="white" stroke="#4854D9" strokeWidth="2" rx="6" />
              <text x="680" y="100" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1F2937">🧪 Testing</text>
              <text x="680" y="120" textAnchor="middle" fontSize="11" fill="#6B7280">Run & validate tests</text>

              <rect x="820" y="75" width="200" height="60" fill="white" stroke="#4854D9" strokeWidth="2" rx="6" />
              <text x="920" y="100" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1F2937">🚀 Deployment</text>
              <text x="920" y="120" textAnchor="middle" fontSize="11" fill="#6B7280">Launch to cloud</text>

              {/* Arrows from UI to Backend */}
              <path d="M 200 135 L 200 180" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 440 135 L 440 180" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 680 135 L 680 180" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 920 135 L 920 180" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />

              {/* Layer 2: Business Logic */}
              <rect x="50" y="180" width="1100" height="140" fill="url(#greenGradient)" stroke="#10B981" strokeWidth="2" rx="8" />
              <text x="600" y="205" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1F2937">
                What Happens Behind the Scenes
              </text>

              {/* Backend Services */}
              <rect x="80" y="225" width="180" height="80" fill="white" stroke="#10B981" strokeWidth="2" rx="6" />
              <text x="170" y="250" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">Agent Manager</text>
              <text x="170" y="268" textAnchor="middle" fontSize="10" fill="#6B7280">Creates & organizes</text>
              <text x="170" y="283" textAnchor="middle" fontSize="10" fill="#6B7280">your agents</text>
              <text x="170" y="298" textAnchor="middle" fontSize="10" fill="#6B7280">Runs workflows</text>

              <rect x="280" y="225" width="180" height="80" fill="white" stroke="#10B981" strokeWidth="2" rx="6" />
              <text x="370" y="250" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">Test Engine</text>
              <text x="370" y="268" textAnchor="middle" fontSize="10" fill="#6B7280">Runs all tests</text>
              <text x="370" y="283" textAnchor="middle" fontSize="10" fill="#6B7280">Checks quality</text>
              <text x="370" y="298" textAnchor="middle" fontSize="10" fill="#6B7280">Finds problems</text>

              <rect x="480" y="225" width="180" height="80" fill="white" stroke="#10B981" strokeWidth="2" rx="6" />
              <text x="570" y="250" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">Deploy Manager</text>
              <text x="570" y="268" textAnchor="middle" fontSize="10" fill="#6B7280">Launches to cloud</text>
              <text x="570" y="283" textAnchor="middle" fontSize="10" fill="#6B7280">Manages servers</text>
              <text x="570" y="298" textAnchor="middle" fontSize="10" fill="#6B7280">Health monitoring</text>

              <rect x="680" y="225" width="180" height="80" fill="white" stroke="#10B981" strokeWidth="2" rx="6" />
              <text x="770" y="250" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">Analytics</text>
              <text x="770" y="268" textAnchor="middle" fontSize="10" fill="#6B7280">Tracks usage</text>
              <text x="770" y="283" textAnchor="middle" fontSize="10" fill="#6B7280">Calculates costs</text>
              <text x="770" y="298" textAnchor="middle" fontSize="10" fill="#6B7280">Shows insights</text>

              <rect x="880" y="225" width="220" height="80" fill="white" stroke="#10B981" strokeWidth="2" rx="6" />
              <text x="990" y="250" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">Multi-Agent Coordinator</text>
              <text x="990" y="268" textAnchor="middle" fontSize="10" fill="#6B7280">Connects agents</text>
              <text x="990" y="283" textAnchor="middle" fontSize="10" fill="#6B7280">Manages conversations</text>
              <text x="990" y="298" textAnchor="middle" fontSize="10" fill="#6B7280">Handles errors</text>

              {/* Arrows from Backend to Data/External */}
              <path d="M 170 305 L 170 360" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 370 305 L 370 360" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 570 305 L 570 430" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 770 305 L 770 360" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <path d="M 990 305 L 990 430" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />

              {/* Layer 3: Data Storage & External Services */}
              <rect x="50" y="360" width="500" height="120" fill="url(#orangeGradient)" stroke="#F59E0B" strokeWidth="2" rx="8" />
              <text x="300" y="385" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1F2937">
                Where Data is Stored
              </text>

              {/* Data Components */}
              <rect x="80" y="400" width="140" height="60" fill="white" stroke="#F59E0B" strokeWidth="2" rx="6" />
              <text x="150" y="425" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">📦 Agent Data</text>
              <text x="150" y="445" textAnchor="middle" fontSize="10" fill="#6B7280">Your configurations</text>

              <rect x="240" y="400" width="140" height="60" fill="white" stroke="#F59E0B" strokeWidth="2" rx="6" />
              <text x="310" y="425" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">📊 Test Results</text>
              <text x="310" y="445" textAnchor="middle" fontSize="10" fill="#6B7280">Performance data</text>

              <rect x="400" y="400" width="140" height="60" fill="white" stroke="#F59E0B" strokeWidth="2" rx="6" />
              <text x="470" y="425" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">💾 Cache</text>
              <text x="470" y="445" textAnchor="middle" fontSize="10" fill="#6B7280">Fast access</text>

              {/* External Services */}
              <rect x="600" y="360" width="550" height="120" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2" rx="8" />
              <text x="875" y="385" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1F2937">
                External AI & Cloud Services
              </text>

              <rect x="620" y="400" width="160" height="60" fill="white" stroke="#9CA3AF" strokeWidth="2" rx="6" />
              <text x="700" y="425" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">🤖 AI Models</text>
              <text x="700" y="445" textAnchor="middle" fontSize="10" fill="#6B7280">GPT-4, Claude, etc.</text>

              <rect x="800" y="400" width="160" height="60" fill="white" stroke="#9CA3AF" strokeWidth="2" rx="6" />
              <text x="880" y="425" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">☁️ Cloud (AWS)</text>
              <text x="880" y="445" textAnchor="middle" fontSize="10" fill="#6B7280">Hosting & scaling</text>

              <rect x="980" y="400" width="160" height="60" fill="white" stroke="#9CA3AF" strokeWidth="2" rx="6" />
              <text x="1060" y="425" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F2937">📡 Monitoring</text>
              <text x="1060" y="445" textAnchor="middle" fontSize="10" fill="#6B7280">System health</text>

              {/* Layer 4: Deployment Options */}
              <rect x="50" y="510" width="1100" height="70" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" rx="8" />
              <text x="600" y="535" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1F2937">
                Where Your Agents Run
              </text>

              <rect x="200" y="550" width="220" height="25" fill="white" stroke="#6366F1" strokeWidth="1.5" rx="4" />
              <text x="310" y="568" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1F2937">☁️ AWS Cloud (Production)</text>

              <rect x="470" y="550" width="220" height="25" fill="white" stroke="#6366F1" strokeWidth="1.5" rx="4" />
              <text x="580" y="568" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1F2937">🐳 Containers (Flexible)</text>

              <rect x="740" y="550" width="220" height="25" fill="white" stroke="#6366F1" strokeWidth="1.5" rx="4" />
              <text x="850" y="568" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1F2937">💻 Local (Development)</text>

              {/* Arrow marker definition */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#6B7280" />
                </marker>
              </defs>
            </svg>
          </div>
        </Card.Body>
      </Card>

      {/* Simple Explanation Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.xl
      }}>
        <Card>
          <Card.Header style={{ backgroundColor: '#EEF2FF' }}>
            <Card.Title>🎨 User Interface Layer</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151' }}>
              <strong>What you interact with:</strong> Beautiful, easy-to-use screens where you build agents, 
              run tests, view results, and deploy to production. No coding required.
            </p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header style={{ backgroundColor: '#ECFDF5' }}>
            <Card.Title>⚙️ Business Logic Layer</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151' }}>
              <strong>The brain of the platform:</strong> Handles all the complex work - managing agents, 
              running tests, deploying to cloud, tracking costs, and coordinating multiple agents.
            </p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header style={{ backgroundColor: '#FEF3C7' }}>
            <Card.Title>💾 Data & Services Layer</Card.Title>
          </Card.Header>
          <Card.Body>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151' }}>
              <strong>Storage and connections:</strong> Securely stores your data and connects to AI models 
              (GPT-4, Claude) and cloud services (AWS) to make everything work seamlessly.
            </p>
          </Card.Body>
        </Card>
      </div>

      {/* Key Features */}
      <Card>
        <Card.Header>
          <Card.Title>🔑 Why This Architecture Matters</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: theme.spacing.lg
          }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: theme.spacing.xs }}>
                ⚡ Fast & Reliable
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                Built for speed with smart caching. Your agents respond in milliseconds, not seconds.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: theme.spacing.xs }}>
                🔒 Secure & Private
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                Your data is encrypted and isolated. We never share or train on your information.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: theme.spacing.xs }}>
                📈 Scales Automatically
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                Handles 10 users or 10,000 users seamlessly. Infrastructure grows with your needs.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: theme.spacing.xs }}>
                🌐 Works with Any AI
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                Not locked to one provider. Use OpenAI, Anthropic, AWS, or open-source models.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: theme.spacing.xs }}>
                📊 Always Monitored
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                Real-time tracking of performance, costs, and errors. Know what's happening 24/7.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: theme.spacing.xs }}>
                🔌 Easy to Extend
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
                Add custom tools, integrations, and features without rebuilding everything.
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ArchitecturePage;
