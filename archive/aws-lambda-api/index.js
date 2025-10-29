const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock agents data
const mockAgents = [
  {
    id: 'test-generator',
    name: 'Test Generator Agent',
    description: 'Generates comprehensive test suites for JavaScript, TypeScript, Python, and Java',
    version: '1.2.0',
    tags: ['testing', 'automation', 'quality-assurance']
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner Agent',
    description: 'Advanced security vulnerability scanning with OWASP compliance',
    version: '1.3.0',
    tags: ['security', 'analysis', 'compliance']
  },
  {
    id: 'code-quality',
    name: 'Code Quality Agent',
    description: 'Comprehensive code quality analysis and improvement suggestions',
    version: '1.1.0',
    tags: ['quality', 'analysis', 'refactoring']
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AgentHub AWS Lambda API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// List agents
app.get('/api/agents', (req, res) => {
  res.json({ 
    agents: mockAgents,
    total: mockAgents.length,
    timestamp: new Date().toISOString()
  });
});

// Get specific agent
app.get('/api/agents/:id', (req, res) => {
  const agent = mockAgents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ 
      error: 'Agent not found',
      available_agents: mockAgents.map(a => a.id)
    });
  }
  
  res.json({
    ...agent,
    components: [
      { type: 'llm', name: 'GPT-4 Analysis Engine' },
      { type: 'validator', name: 'Code Validator' }
    ],
    inputSchema: {
      source_code: 'string',
      file_path: 'string',
      context: 'object'
    },
    outputSchema: {
      analysis: 'object',
      suggestions: 'array'
    }
  });
});

// Execute agent
app.post('/api/agents/:id/execute', (req, res) => {
  const agentId = req.params.id;
  const input = req.body.input;
  
  let mockResponse = {};
  
  switch (agentId) {
    case 'test-generator':
      mockResponse = {
        test_cases: `
// Generated tests for ${input.file_path || 'code'}
describe('Tests', () => {
  test('should handle valid input', () => {
    expect(true).toBe(true);
  });
  
  test('should handle edge cases', () => {
    expect(true).toBe(true);
  });
});`,
        analysis: {
          coverage_estimate: '85%',
          test_count: 3,
          complexity_score: 'medium'
        }
      };
      break;
      
    case 'security-scanner':
      mockResponse = {
        security_issues: [
          {
            severity: 'high',
            title: 'Potential SQL Injection',
            description: 'User input directly concatenated into SQL query',
            file: input.file_path || 'unknown',
            line: 42,
            suggestion: 'Use parameterized queries'
          }
        ],
        analysis: {
          total_issues: 1,
          high: 1,
          medium: 0,
          low: 0
        }
      };
      break;
      
    default:
      mockResponse = {
        analysis: { message: 'Agent executed successfully' },
        suggestions: ['Mock response generated']
      };
  }
  
  res.json(mockResponse);
});

// Export for Lambda
module.exports.handler = serverless(app);