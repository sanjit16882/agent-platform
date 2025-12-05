# AgentHub API Gateway

REST API for AgentHub - Execute and manage AI agents programmatically.

## 🚀 Features

- **🤖 Agent Execution API** - Execute agents via REST endpoints with sync/async support
- **🔐 Authentication** - Secure API key-based authentication with JWT
- **⚡ Rate Limiting** - Redis-based rate limiting per API key
- **📡 Webhooks** - Real-time notifications for execution events (coming soon)
- **📚 Documentation** - Interactive OpenAPI/Swagger documentation
- **📊 Monitoring** - Comprehensive logging and error handling
- **🎯 Agent Discovery** - Browse and search available agents
- **📈 Execution Tracking** - Monitor execution status and retrieve results

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   API Gateway   │    │  Agent Services │
│                 │    │                 │    │                 │
│ • Web Apps      │───▶│ • Authentication│───▶│ • QE Agents     │
│ • Mobile Apps   │    │ • Rate Limiting │    │ • DevOps Agents │
│ • CI/CD         │    │ • Execution API │    │ • Security      │
│ • Scripts       │    │ • Monitoring    │    │ • Business Intel│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** 
- **SQLite** (included, no setup required)
- **Redis** (optional, for rate limiting)

### Installation

```bash
# Clone and navigate to backend
cd agent-hub-backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development server (auto-builds and runs)
npm run dev
```

### Windows Quick Start

```bash
# Use the provided batch file
start-dev.bat
```

The API will be available at:
- **API Base**: http://localhost:4001/api/v1
- **Documentation**: http://localhost:4001/api/docs
- **Health Check**: http://localhost:4001/health

## 📖 API Documentation

### 🔐 Authentication Flow

1. **Generate API Key** (requires initial setup):
```bash
curl -X POST http://localhost:4001/api/v1/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key"}'
```

2. **Use API Key** in requests:
```bash
curl -H "X-API-Key: ak_your_key_here" \
  http://localhost:4001/api/v1/agents
```

### 🤖 Agent Execution

1. **List Available Agents**:
```bash
curl http://localhost:4001/api/v1/agents
```

2. **Get Agent Details**:
```bash
curl http://localhost:4001/api/v1/agents/qe-test-generator-v2
```

3. **Execute Agent (Async)**:
```bash
curl -X POST http://localhost:4001/api/v1/agents/qe-test-generator-v2/execute \
  -H "X-API-Key: ak_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "requirements": "Test user login functionality",
      "framework": "cypress",
      "language": "typescript"
    }
  }'
```

4. **Execute Agent (Sync)**:
```bash
curl -X POST http://localhost:4001/api/v1/agents/qe-test-generator-v2/execute \
  -H "X-API-Key: ak_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "requirements": "Test user login functionality",
      "framework": "cypress"
    },
    "sync": true,
    "timeout": 120
  }'
```

5. **Check Execution Status**:
```bash
curl -H "X-API-Key: ak_your_key_here" \
  http://localhost:4001/api/v1/executions/exec_123456789
```

6. **Get Execution Results**:
```bash
curl -H "X-API-Key: ak_your_key_here" \
  http://localhost:4001/api/v1/executions/exec_123456789/results
```

## 🎯 Available Agents

### QE & Testing
- **QE Test Generator Pro** (`qe-test-generator-v2`)
  - Generate comprehensive test suites from requirements
  - Supports: Cypress, Selenium, Playwright, Jest
  - Languages: TypeScript, JavaScript, Python

### DevOps
- **DevOps Infrastructure Monitor** (`devops-monitor-v1`)
  - Analyze and optimize cloud infrastructure
  - Supports: AWS, Azure, GCP
  - Analysis: Cost, Performance, Security

### Security
- **Security Vulnerability Scanner** (`security-scanner-v1`)
  - Comprehensive security assessment
  - Targets: Kubernetes, Docker, Code, Infrastructure
  - Compliance: SOC2, HIPAA, PCI, GDPR

### Business Intelligence
- **Business Intelligence Analyzer** (`business-analyst-v1`)
  - Automated data analysis and insights
  - Sources: CSV, Database, API, Excel
  - Analysis: Sales, Customer, Financial, Operational

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/keys` | Generate API key |
| `GET` | `/api/v1/auth/keys` | List user's API keys |
| `GET` | `/api/v1/auth/keys/{keyId}` | Get API key details |
| `DELETE` | `/api/v1/auth/keys/{keyId}` | Revoke API key |
| `GET` | `/api/v1/auth/permissions` | List available permissions |
| `GET` | `/api/v1/auth/me` | Get current user info |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/agents` | List all agents |
| `GET` | `/api/v1/agents/categories` | Get agent categories |
| `GET` | `/api/v1/agents/{agentId}` | Get agent details |
| `GET` | `/api/v1/agents/{agentId}/stats` | Get agent statistics |
| `POST` | `/api/v1/agents/{agentId}/execute` | Execute agent |

### Executions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/executions` | List user's executions |
| `GET` | `/api/v1/executions/stats` | Get execution statistics |
| `GET` | `/api/v1/executions/{executionId}` | Get execution status |
| `GET` | `/api/v1/executions/{executionId}/results` | Get execution results |
| `GET` | `/api/v1/executions/{executionId}/logs` | Get execution logs |
| `POST` | `/api/v1/executions/{executionId}/cancel` | Cancel execution |

## 🔒 Security & Permissions

### API Key Permissions
- `agent:read` - View agent details and list agents
- `agent:execute` - Execute agents
- `execution:read` - View execution status and results
- `execution:cancel` - Cancel running executions
- `apikey:read` - View API key information
- `apikey:create` - Create new API keys
- `apikey:revoke` - Revoke API keys

### User Roles
- **Admin** - Full access to all features
- **User** - Standard access to agents and executions
- **Viewer** - Read-only access

## ⚡ Rate Limiting

- **Default**: 100 requests per minute per API key
- **Headers**: Rate limit info in response headers
- **Exceeded**: HTTP 429 with retry-after header

## 🐛 Error Handling

All errors follow a consistent format:

```json
{
  "error": "Brief error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_1234567890abcdef",
  "details": {
    "additional": "context"
  }
}
```

### Common Error Codes
- `INVALID_API_KEY` - API key is invalid or expired
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AGENT_NOT_FOUND` - Agent doesn't exist
- `EXECUTION_NOT_FOUND` - Execution doesn't exist
- `VALIDATION_ERROR` - Request validation failed
- `EXECUTION_TIMEOUT` - Agent execution timed out

## 🧪 Testing

```bash
# Run the test script
node test-api.js

# Run unit tests (when available)
npm test

# Run integration tests
npm run test:integration
```

## 🔧 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🌍 Environment Variables

Key configuration options in `.env`:

```bash
# Server
PORT=4001
NODE_ENV=development

# Database
DATABASE_URL=sqlite:./data/agenthub.db

# Authentication
JWT_SECRET=your-secret-key
API_KEY_LENGTH=32

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Production Deployment

```bash
# Build the application
npm run build

# Start production server
NODE_ENV=production npm start

# Or use PM2 for process management
pm2 start dist/server.js --name "agenthub-api"
```

## 📈 Monitoring

The API includes comprehensive logging and monitoring:

- **Request/Response logging** with unique request IDs
- **Performance metrics** for all endpoints
- **Error tracking** with stack traces
- **Authentication events** for security monitoring
- **Execution tracking** for agent performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

## 🎯 Next Steps

1. **Generate your first API key** using the auth endpoints
2. **Execute an agent** to see the system in action
3. **Integrate with your applications** using the REST API
4. **Set up webhooks** for real-time notifications (coming soon)
5. **Monitor usage** with the analytics endpoints

**Happy coding! 🚀**