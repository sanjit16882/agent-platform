# Agent Hub MCP Servers

Model Context Protocol (MCP) servers for the Agent Hub platform, providing various integrations and capabilities.

## Available Servers

### 1. GitHub MCP Server (`/github`)
Real GitHub integration with comprehensive API access.

**Features:**
- Repository management and search
- Issue tracking and creation
- Pull request monitoring
- User profile information
- Advanced GitHub search capabilities

**Status:** ✅ Ready for deployment
**Dependencies:** GitHub Personal Access Token
**Rate Limits:** 5,000 requests/hour (authenticated)

### 2. Mock MCP Server (`/mock`)
Simulated responses for demonstration and testing.

**Features:**
- User management simulation
- Project and task tracking
- System metrics and notifications
- Report generation
- API call simulation

**Status:** ✅ Ready for deployment
**Dependencies:** None (works offline)
**Rate Limits:** None

## Quick Start

### GitHub Server
```bash
cd github
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN
npm install
npm start
```

### Mock Server
```bash
cd mock
npm install
npm start
```

## Testing

### Test GitHub Server
```bash
cd github
npm test                    # Full MCP test (requires connection)
node src/simple-test.js     # API-only test (works without MCP)
```

### Test Mock Server
```bash
cd mock
npm test
```

## Docker Deployment

### Build Images
```bash
# GitHub server
cd github && npm run build

# Mock server  
cd mock && npm run build
```

### Run Containers
```bash
# GitHub server (with environment file)
cd github && npm run docker:run

# Mock server
cd mock && npm run docker:run
```

## AWS ECS Integration

Both servers are designed for AWS ECS deployment:

1. **Health Checks**: `/health` endpoint for ALB monitoring
2. **Logging**: Structured logging for CloudWatch
3. **Security**: Non-root containers with security headers
4. **Scalability**: Stateless design for horizontal scaling

### Deployment Process

1. **Build and Push to ECR**:
   ```bash
   # Will be automated in deployment scripts
   docker build -t github-mcp ./github
   docker build -t mock-mcp ./mock
   ```

2. **ECS Task Definitions**: Already configured in infrastructure
3. **Load Balancer Routing**: 
   - `/github/*` → GitHub MCP Server
   - `/mock/*` → Mock MCP Server
   - `/health` → Health checks

## Tool Comparison

| Feature | GitHub Server | Mock Server |
|---------|---------------|-------------|
| **External APIs** | ✅ GitHub API | ❌ None |
| **Authentication** | ✅ Required | ❌ Not needed |
| **Rate Limits** | ✅ 5K/hour | ❌ None |
| **Real Data** | ✅ Live GitHub | ❌ Simulated |
| **Offline Demo** | ❌ No | ✅ Yes |
| **Setup Complexity** | 🟡 Medium | 🟢 Simple |
| **Demo Ready** | 🟡 Needs token | 🟢 Immediate |

## Available Tools

### GitHub Server Tools
- `list_repositories` - List user/org repositories
- `get_repository` - Get repository details
- `list_issues` - List repository issues
- `create_issue` - Create new issues
- `list_pull_requests` - List pull requests
- `search_repositories` - Advanced repository search
- `get_user` - Get user information

### Mock Server Tools
- `list_users` - List system users
- `get_user` - Get user details
- `list_projects` - List projects
- `get_project` - Get project details
- `list_tasks` - List tasks with filtering
- `create_task` - Create new tasks
- `get_system_metrics` - System performance
- `get_notifications` - Recent notifications
- `simulate_api_call` - API simulation
- `generate_report` - Various reports

## Demo Scenarios

### Scenario 1: GitHub Integration Demo
1. Start GitHub server with token
2. Demonstrate repository search
3. Show issue creation workflow
4. Display user profiles and statistics

### Scenario 2: Offline Demo
1. Start Mock server (no setup needed)
2. Show user and project management
3. Demonstrate task creation and filtering
4. Generate various reports

### Scenario 3: Full Platform Demo
1. Deploy both servers to AWS
2. Show load balancer routing
3. Demonstrate health monitoring
4. Test scalability and failover

## Configuration

### Environment Variables

**GitHub Server:**
```bash
GITHUB_TOKEN=your_token_here
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

**Mock Server:**
```bash
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### AWS Secrets Manager (Production)
- GitHub credentials stored securely
- Automatic token rotation support
- IAM role-based access

## Monitoring and Observability

### Health Endpoints
- `GET /health` - Service health status
- `GET /tools` - Available MCP tools
- `GET /demo` - Demo information (Mock server only)

### Logging
- Structured JSON logging
- CloudWatch integration
- Request/response tracking
- Error monitoring

### Metrics
- Response times
- Request counts
- Error rates
- Tool usage statistics

## Security Considerations

### GitHub Server
- Secure token storage (AWS Secrets Manager)
- Rate limit handling
- Input validation and sanitization
- Audit logging for sensitive operations

### Mock Server
- No external network calls
- No sensitive data storage
- Safe for public demonstrations
- Isolated mock data environment

## Development Workflow

1. **Local Development**:
   ```bash
   npm run dev  # File watching enabled
   ```

2. **Testing**:
   ```bash
   npm test     # Run test suite
   ```

3. **Docker Testing**:
   ```bash
   npm run build && npm run docker:run
   ```

4. **Deployment**:
   - Push to ECR repositories
   - Update ECS task definitions
   - Deploy via CDK

## Troubleshooting

### Common Issues

1. **GitHub Rate Limits**
   - Use authenticated requests
   - Implement request caching
   - Monitor usage patterns

2. **Container Health Checks**
   - Verify `/health` endpoint responds
   - Check container logs
   - Validate environment variables

3. **MCP Connection Issues**
   - Ensure stdio transport is working
   - Check tool registration
   - Validate request/response format

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

## Next Steps

1. **Deploy Infrastructure** (Option 2)
2. **Test MCP Servers Locally** ✅ Complete
3. **Deploy to AWS ECS**
4. **Configure Load Balancer Routing**
5. **Set up Monitoring and Alerts**
6. **Create Demo Scripts**

## Contributing

1. Fork the repository
2. Create feature branches for new servers
3. Add comprehensive tests
4. Update documentation
5. Submit pull requests

## License

MIT License - see individual server directories for details.