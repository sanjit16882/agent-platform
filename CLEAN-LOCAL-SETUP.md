# Agent Factory - Local Development Platform

## 🎯 **Project Overview**

This is a **local development platform** for creating and managing AI agents with **real-time AWS Bedrock integration**. The platform runs entirely on your local machine while connecting to AWS Bedrock for live AI processing.

## 🏗️ **Architecture**

- **Frontend**: React application running on `http://localhost:3001`
- **Backend**: Node.js/Express server running on `http://localhost:3002`
- **AI Integration**: Real-time AWS Bedrock connection (Claude, Titan models)
- **Database**: Local SQLite for development
- **Environment**: Local development only

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- AWS credentials configured for Bedrock access
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd agent-factory

# Install backend dependencies
cd agent-hub-backend
npm install

# Install frontend dependencies
cd ../agent-hub-ui
npm install
```

### Running the Platform
```bash
# Start backend (Terminal 1)
cd agent-hub-backend
npm run dev

# Start frontend (Terminal 2)
cd agent-hub-ui
npm start
```

### Access the Platform
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## 🤖 **AI Integration**

### AWS Bedrock Models Available:
- **Claude 3 Haiku** - Fast, cost-effective
- **Claude 3.5 Sonnet** - High-performance reasoning
- **Amazon Titan Text Express** - AWS native

### Features:
- ✅ Real-time Bedrock connection
- ✅ Live model selection in UI
- ✅ Cost and performance information
- ✅ Smart model recommendations
- ✅ Token usage tracking

## 📁 **Project Structure**

```
agent-factory/
├── agent-hub-backend/          # Node.js backend server
│   ├── src/                    # Source code
│   ├── .env.local             # Local environment config
│   └── package.json           # Dependencies
├── agent-hub-ui/              # React frontend
│   ├── src/                   # Source code
│   ├── .env.local            # Local environment config
│   └── package.json          # Dependencies
├── bedrock-integration/       # AWS Bedrock configuration
├── config/                    # Application configuration
│   └── local.json            # Local development config
└── scripts/                   # Utility scripts
```

## 🛠️ **Development Scripts**

### Backend Scripts:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm test` - Run tests

### Frontend Scripts:
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Utility Scripts:
- `start-clean-development.bat` - Start both frontend and backend
- `check-ports.bat` - Check if ports are available
- `cleanup-ports.bat` - Clean up port conflicts

## 🔧 **Configuration**

### Environment Files:
- `agent-hub-backend/.env.local` - Backend local config
- `agent-hub-ui/.env.local` - Frontend local config
- `config/local.json` - Application configuration

### Port Configuration:
- Frontend: **3001** (fixed)
- Backend: **3002** (fixed)

## 🧪 **Testing**

### Manual Testing:
1. Visit http://localhost:3001
2. Check Bedrock status (should show "LIVE")
3. Create agents with model selection
4. Test different agent builders

### API Testing:
```bash
# Test backend health
curl http://localhost:3002/health

# Test Bedrock models
curl http://localhost:3002/api/v1/bedrock/models

# Test Bedrock connection
curl http://localhost:3002/api/v1/bedrock/test-connection
```

## 📚 **Agent Builders Available**

1. **Hybrid Agent Builder** (`/hybrid-builder`)
   - Visual component-based agent creation
   - LLM, RPA, Selenium, Custom components
   - Real-time model selection

2. **Natural Language Generator** (`/natural-language`)
   - Describe agents in plain English
   - AI-powered component suggestion
   - Automatic agent generation

3. **Purpose-Driven Builder** (`/purpose-driven`)
   - Template-based agent creation
   - Custom agent definition
   - Structured input/output schemas

4. **Agent Management** (`/agents`)
   - View and manage deployed agents
   - Health monitoring
   - Performance metrics

## 🔒 **Security**

- Local development environment
- AWS credentials required for Bedrock
- No external deployments
- Local SQLite database

## 🎯 **Next Steps**

This platform is designed for **local development and prototyping**. For production deployment, you would create a separate AWS-native application with:
- AWS Lambda functions
- API Gateway
- RDS/DynamoDB
- CloudFormation/CDK
- CI/CD pipelines

## 📞 **Support**

For issues or questions:
1. Check the logs in terminal
2. Verify AWS credentials
3. Ensure ports 3001/3002 are available
4. Check Bedrock service availability