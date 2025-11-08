#!/bin/bash

# Local Development Setup for AWS Native Agent Hub
# Cost: $0 - Everything runs locally

set -e

echo "🏠 Setting up Local Development Environment"
echo "💰 Cost: $0 (No AWS charges during local development)"

# Configuration
export AWS_ACCOUNT_ID="448049831733"
export NOTIFICATION_EMAIL="sanjitdikshit83@gmail.com"
export ENVIRONMENT="local"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Local Development Configuration:${NC}"
echo "  Account ID: ${AWS_ACCOUNT_ID}"
echo "  Email: ${NOTIFICATION_EMAIL}"
echo "  Environment: ${ENVIRONMENT}"
echo "  Cost: $0 (Local only)"

# Check prerequisites
echo -e "\n${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker Desktop.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites found${NC}"

# Install LocalStack
echo -e "\n${BLUE}📦 Installing LocalStack...${NC}"
if ! command -v localstack &> /dev/null; then
    echo "Installing LocalStack..."
    pip3 install localstack awscli-local || {
        echo -e "${YELLOW}⚠️  pip3 not found, trying with pip...${NC}"
        pip install localstack awscli-local
    }
else
    echo -e "${GREEN}✅ LocalStack already installed${NC}"
fi

# Create local environment configuration
echo -e "\n${BLUE}⚙️  Creating local configuration...${NC}"
cat > .env.local << 'EOF'
# Local Development Configuration - NO AWS COSTS
NODE_ENV=development
ENVIRONMENT=local

# LocalStack Configuration (Free)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1
USE_LOCALSTACK=true

# Application URLs
API_BASE_URL=http://localhost:4566
FRONTEND_URL=http://localhost:3001
MCP_WEBSOCKET_URL=ws://localhost:3002

# Mock Services (No AWS charges)
BEDROCK_MOCK=true
USE_MOCK_DATA=true
ENABLE_COST_TRACKING=false

# Development Settings
DEBUG=true
LOG_LEVEL=debug
ENABLE_CORS=true

# Database (LocalStack DynamoDB)
AGENTS_TABLE=agent-hub-agents-local
EXECUTIONS_TABLE=agent-hub-executions-local
INTELLIGENCE_TABLE=agent-hub-intelligence-local

# Storage (LocalStack S3)
ASSETS_BUCKET=agent-hub-assets-local
FRONTEND_BUCKET=agent-hub-frontend-local
EOF

echo -e "${GREEN}✅ Local configuration created${NC}"

# Create Docker Compose for local services
echo -e "\n${BLUE}🐳 Creating Docker Compose configuration...${NC}"
cat > docker-compose.local.yml << 'EOF'
version: '3.8'

services:
  # LocalStack - Free AWS service emulation
  localstack:
    image: localstack/localstack:latest
    container_name: agent-hub-localstack
    ports:
      - "4566:4566"      # LocalStack main port
      - "4510-4559:4510-4559"  # Additional service ports
    environment:
      - SERVICES=lambda,dynamodb,s3,apigateway,cognito-idp,events,sqs,sns,iam,sts
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - LAMBDA_EXECUTOR=docker-reuse
      - DOCKER_HOST=unix:///var/run/docker.sock
      - PERSISTENCE=1
    volumes:
      - "./tmp/localstack:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
    networks:
      - agent-hub-local

  # Mock Bedrock Service (Free alternative)
  mock-bedrock:
    build:
      context: ./local-services/mock-bedrock
      dockerfile: Dockerfile
    container_name: agent-hub-mock-bedrock
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    networks:
      - agent-hub-local

  # MCP Filesystem Server (Local)
  mcp-filesystem:
    build:
      context: ./mcp-servers/filesystem
      dockerfile: Dockerfile.local
    container_name: agent-hub-mcp-filesystem
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - MCP_SERVER_TYPE=filesystem
    volumes:
      - "./test-data:/app/sandbox"  # Sandboxed file access
    networks:
      - agent-hub-local

  # MCP Git Server (Local)
  mcp-git:
    build:
      context: ./mcp-servers/git
      dockerfile: Dockerfile.local
    container_name: agent-hub-mcp-git
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=development
      - MCP_SERVER_TYPE=git
    volumes:
      - "./test-repos:/app/repos"   # Test git repositories
    networks:
      - agent-hub-local

  # MCP Database Server (Local with SQLite)
  mcp-database:
    build:
      context: ./mcp-servers/database
      dockerfile: Dockerfile.local
    container_name: agent-hub-mcp-database
    ports:
      - "3003:3000"
    environment:
      - NODE_ENV=development
      - MCP_SERVER_TYPE=database
      - DATABASE_URL=sqlite:///app/data/test.db
    volumes:
      - "./test-data/db:/app/data"
    networks:
      - agent-hub-local

networks:
  agent-hub-local:
    driver: bridge

volumes:
  localstack-data:
EOF

echo -e "${GREEN}✅ Docker Compose configuration created${NC}"

# Create mock Bedrock service
echo -e "\n${BLUE}🤖 Creating Mock Bedrock service...${NC}"
mkdir -p local-services/mock-bedrock

cat > local-services/mock-bedrock/package.json << 'EOF'
{
  "name": "mock-bedrock-service",
  "version": "1.0.0",
  "description": "Mock AWS Bedrock service for local development",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  }
}
EOF

cat > local-services/mock-bedrock/index.js << 'EOF'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock Bedrock responses
const mockResponses = {
  'claude-3-sonnet': {
    frameworks: ['React', 'Vue.js', 'Angular'],
    languages: ['JavaScript', 'TypeScript'],
    capabilities: ['Web Development', 'API Development'],
    confidence: 0.85,
    reasoning: 'Mock analysis for local development'
  },
  'claude-3-haiku': {
    frameworks: ['Node.js', 'Express'],
    languages: ['JavaScript'],
    capabilities: ['Backend Development', 'API Development'],
    confidence: 0.80,
    reasoning: 'Mock analysis - fast response model'
  }
};

// Mock Bedrock InvokeModel endpoint
app.post('/bedrock/invoke-model', (req, res) => {
  const { modelId, body } = req.body;
  
  console.log(`🤖 Mock Bedrock: ${modelId} invoked`);
  
  const response = mockResponses['claude-3-sonnet'] || mockResponses['claude-3-haiku'];
  
  res.json({
    body: JSON.stringify({
      content: [{
        text: JSON.stringify(response)
      }]
    })
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mock-bedrock', cost: '$0' });
});

app.listen(PORT, () => {
  console.log(`🤖 Mock Bedrock Service running on port ${PORT}`);
  console.log(`💰 Cost: $0 (Local mock service)`);
});
EOF

cat > local-services/mock-bedrock/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Create test data directories
echo -e "\n${BLUE}📁 Creating test data directories...${NC}"
mkdir -p test-data/files
mkdir -p test-data/db
mkdir -p test-repos
mkdir -p tmp/localstack

# Create sample test files
cat > test-data/files/sample.txt << 'EOF'
This is a sample file for MCP filesystem testing.
You can read, write, and manipulate files safely in this sandbox.
EOF

cat > test-data/files/config.json << 'EOF'
{
  "environment": "local",
  "cost": "$0",
  "services": ["filesystem", "git", "database"],
  "mock_bedrock": true
}
EOF

# Create sample git repository
echo -e "\n${BLUE}📚 Creating sample git repository...${NC}"
cd test-repos
git init sample-repo
cd sample-repo
echo "# Sample Repository for MCP Git Testing" > README.md
echo "This repository is used for testing MCP git operations locally." >> README.md
git add README.md
git config user.email "test@example.com"
git config user.name "Test User"
git commit -m "Initial commit"
cd ../..

# Create startup script
echo -e "\n${BLUE}🚀 Creating startup script...${NC}"
cat > start-local-dev.sh << 'EOF'
#!/bin/bash

echo "🏠 Starting Local Development Environment"
echo "💰 Cost: $0 (No AWS charges)"

# Load environment
source .env.local

# Start services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.local.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
curl -s http://localhost:4566/health || echo "LocalStack starting..."
curl -s http://localhost:3000/health || echo "Mock Bedrock starting..."

echo ""
echo "✅ Local development environment is ready!"
echo ""
echo "📋 Available Services:"
echo "  🏗️  LocalStack (AWS Mock):     http://localhost:4566"
echo "  🤖 Mock Bedrock:              http://localhost:3000"
echo "  📁 MCP Filesystem:            http://localhost:3001"
echo "  🔧 MCP Git:                   http://localhost:3002"
echo "  🗄️  MCP Database:              http://localhost:3003"
echo ""
echo "💰 Total Cost: $0 (Everything runs locally)"
echo ""
echo "🚀 Next Steps:"
echo "  1. cd lambda-functions && npm run dev:local"
echo "  2. cd frontend && npm start"
echo "  3. Open http://localhost:3001 in your browser"
echo ""
echo "🛑 To stop: docker-compose -f docker-compose.local.yml down"
EOF

chmod +x start-local-dev.sh

# Create stop script
cat > stop-local-dev.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Local Development Environment"

# Stop Docker services
docker-compose -f docker-compose.local.yml down

echo "✅ All local services stopped"
echo "💰 AWS Cost: $0 (No charges for local development)"
EOF

chmod +x stop-local-dev.sh

# Install dependencies for mock services
echo -e "\n${BLUE}📦 Installing mock service dependencies...${NC}"
cd local-services/mock-bedrock
npm install
cd ../..

echo -e "\n${GREEN}🎉 Local Development Environment Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 What was created:${NC}"
echo "  ✅ LocalStack configuration (Free AWS emulation)"
echo "  ✅ Mock Bedrock service (No AI costs)"
echo "  ✅ MCP servers for local testing"
echo "  ✅ Test data and sample repositories"
echo "  ✅ Docker Compose configuration"
echo "  ✅ Environment configuration"
echo ""
echo -e "${GREEN}💰 Total Setup Cost: $0${NC}"
echo ""
echo -e "${BLUE}🚀 To start development:${NC}"
echo "  ./start-local-dev.sh"
echo ""
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo "  ./stop-local-dev.sh"
echo ""
echo -e "${YELLOW}⚠️  AWS Deployment (when ready):${NC}"
echo "  ./deployment/deploy-minimal.sh  # Estimated cost: $5-15/month"
echo ""
echo -e "${GREEN}🎯 Your $100 AWS credits are safe during local development!${NC}"