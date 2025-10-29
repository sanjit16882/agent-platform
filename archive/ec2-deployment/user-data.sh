#!/bin/bash
# EC2 User Data Script - Runs automatically on instance launch

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install nginx
yum install -y nginx

# Create app directory
mkdir -p /opt/agenthub-api
chown ec2-user:ec2-user /opt/agenthub-api

# Create the server.js file directly
cat > /opt/agenthub-api/server.js << 'EOF'
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
  res.json({ 
    status: 'ok', 
    message: 'AgentHub EC2 API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
    inputSchema: { source_code: 'string', context: 'object' },
    outputSchema: { analysis: 'object', suggestions: 'array' }
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
        test_cases: `// Generated tests for ${input.file_path || 'code'}
describe('Tests', () => {
  test('should work', () => {
    expect(true).toBe(true);
  });
});`,
        analysis: { coverage_estimate: '85%', test_count: 3 }
      };
      break;
      
    case 'security-scanner':
      mockResponse = {
        security_issues: [{
          severity: 'high',
          title: 'Potential SQL Injection',
          description: 'User input not sanitized',
          file: input.file_path || 'unknown',
          line: 42,
          suggestion: 'Use parameterized queries'
        }],
        analysis: { total_issues: 1, high: 1 }
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AgentHub API running on port ${PORT}`);
});
EOF

# Create package.json
cat > /opt/agenthub-api/package.json << 'EOF'
{
  "name": "agenthub-ec2-api",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Install dependencies
cd /opt/agenthub-api
npm install

# Start with PM2 as ec2-user
sudo -u ec2-user pm2 start server.js --name "agenthub-api"
sudo -u ec2-user pm2 startup
sudo -u ec2-user pm2 save

# Configure nginx
cat > /etc/nginx/conf.d/agenthub.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Start nginx
systemctl start nginx
systemctl enable nginx

# Create a simple status page
echo "AgentHub API deployed successfully on $(date)" > /var/log/agenthub-deployment.log