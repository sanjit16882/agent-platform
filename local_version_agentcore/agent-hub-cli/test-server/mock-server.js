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
    description: 'Generates comprehensive test suites',
    version: '1.0.0',
    tags: ['testing', 'automation']
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner Agent',
    description: 'Scans code for security vulnerabilities',
    version: '1.0.0',
    tags: ['security', 'analysis']
  },
  {
    id: 'code-quality',
    name: 'Code Quality Agent',
    description: 'Analyzes code quality and suggests improvements',
    version: '1.0.0',
    tags: ['quality', 'analysis']
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock AgentHub API is running' });
});

// List agents
app.get('/api/agents', (req, res) => {
  res.json({ agents: mockAgents });
});

// Get specific agent
app.get('/api/agents/:id', (req, res) => {
  const agent = mockAgents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json({
    ...agent,
    components: [
      { type: 'llm', name: 'GPT-4 Analysis' },
      { type: 'validator', name: 'Code Validator' }
    ],
    inputSchema: {
      source_code: 'string',
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
  
  console.log(`Executing agent: ${agentId}`);
  console.log('Input:', JSON.stringify(input, null, 2));
  
  // Mock responses based on agent type
  let mockResponse = {};
  
  switch (agentId) {
    case 'test-generator':
      mockResponse = {
        test_cases: `
// Generated tests for ${input.file_path || 'code'}
describe('${input.file_path || 'Code'} Tests', () => {
  test('should handle valid input', () => {
    // Test implementation here
    expect(true).toBe(true);
  });
  
  test('should handle edge cases', () => {
    // Edge case test
    expect(true).toBe(true);
  });
  
  test('should handle error conditions', () => {
    // Error handling test
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
            description: 'User input is directly concatenated into SQL query',
            file: input.files?.[0] || 'unknown',
            line: 42,
            suggestion: 'Use parameterized queries instead'
          },
          {
            severity: 'medium',
            title: 'Hardcoded Secret',
            description: 'API key appears to be hardcoded',
            file: input.files?.[0] || 'unknown',
            line: 15,
            suggestion: 'Move secrets to environment variables'
          }
        ],
        analysis: {
          total_issues: 2,
          critical: 0,
          high: 1,
          medium: 1,
          low: 0
        }
      };
      break;
      
    case 'code-quality':
    case 'failure-analyzer':
      mockResponse = {
        analysis: {
          root_cause: 'Race condition in async payment processing',
          affected_files: ['src/payment.ts', 'src/validation.ts'],
          confidence: 0.95
        },
        suggestions: [
          'Add proper async/await handling in payment.ts:45',
          'Implement mutex lock for concurrent validation',
          'Add timeout handling for external API calls',
          'Consider using a queue for payment processing'
        ],
        generated_code: `
// Suggested fix for payment.ts
async function processPayment(amount: number): Promise<PaymentResult> {
  try {
    // Add proper error handling and async processing
    const result = await paymentService.process(amount);
    return result;
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw new PaymentError('Payment failed', error);
  }
}`
      };
      break;
      
    default:
      mockResponse = {
        analysis: { message: 'Mock analysis completed' },
        suggestions: ['This is a mock response', 'Agent executed successfully']
      };
  }
  
  // Simulate processing delay
  setTimeout(() => {
    res.json(mockResponse);
  }, 1000);
});

const PORT = process.env.PORT || 4003;

// Enhanced logging for production-like behavior
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
app.listen(PORT, () => {
  console.log(`🤖 Mock AgentHub API running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/agents');
  console.log('  GET  /api/agents/:id');
  console.log('  POST /api/agents/:id/execute');
});