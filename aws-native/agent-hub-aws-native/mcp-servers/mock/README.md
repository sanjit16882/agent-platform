# Mock MCP Server

A Model Context Protocol (MCP) server that provides simulated responses for demonstration and testing purposes. Perfect for demos, development, and testing without external API dependencies.

## Features

- **No External Dependencies**: Works completely offline with realistic mock data
- **Comprehensive Tools**: 10 different tools covering user management, projects, tasks, metrics, and reporting
- **Realistic Responses**: Simulated delays and response patterns
- **Rich Mock Data**: Pre-populated with users, projects, tasks, metrics, and notifications
- **Flexible Filtering**: Advanced filtering options for all data types
- **Report Generation**: Multiple report types with different formats
- **API Simulation**: Configurable API call simulation with success/failure rates

## Available Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `list_users` | List users with role/status filtering | User management demos |
| `get_user` | Get detailed user information | User profile displays |
| `list_projects` | List projects with status/progress filtering | Project dashboard |
| `get_project` | Get detailed project information | Project details view |
| `list_tasks` | List tasks with multiple filters | Task management |
| `create_task` | Create new tasks (simulated) | Task creation workflows |
| `get_system_metrics` | Get system performance metrics | Monitoring dashboards |
| `get_notifications` | Get recent notifications | Alert systems |
| `simulate_api_call` | Simulate API calls with delays/failures | API testing |
| `generate_report` | Generate various report types | Reporting features |

## Mock Data

### Users (5 total)
- Alice Johnson (Developer) - Active
- Bob Smith (Designer) - Active  
- Carol Davis (Manager) - Inactive
- David Wilson (Developer) - Active
- Eva Brown (QA Engineer) - Active

### Projects (5 total)
- Agent Hub Platform (75% complete, Active)
- MCP Integration (90% complete, Active)
- UI Redesign (25% complete, Planning)
- Performance Optimization (100% complete, Completed)
- Security Audit (60% complete, Active)

### Tasks (5 total)
- Various priorities (Low, Medium, High, Critical)
- Different statuses (Todo, In-Progress, Completed)
- Assigned to different team members

### System Metrics
- CPU Usage: 45.2%
- Memory Usage: 67.8%
- Disk Usage: 34.1%
- Active Users: 1,247
- Response Time: 145ms avg

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
# Development mode (with file watching)
npm run dev

# Production mode
npm start
```

### 3. Test the Server

```bash
npm test
```

## Usage Examples

### List Active Users Only

```javascript
{
  "name": "list_users",
  "arguments": {
    "active_only": true,
    "role": "Developer"
  }
}
```

### Get Project with Tasks

```javascript
{
  "name": "get_project",
  "arguments": {
    "project_id": 1
  }
}
```

### Create a New Task

```javascript
{
  "name": "create_task",
  "arguments": {
    "title": "Implement user authentication",
    "project": "Agent Hub Platform",
    "assignee": "Alice",
    "priority": "high",
    "description": "Add OAuth2 integration for secure login"
  }
}
```

### Filter Tasks by Status and Priority

```javascript
{
  "name": "list_tasks",
  "arguments": {
    "status": "in-progress",
    "priority": "high"
  }
}
```

### Generate Detailed Report

```javascript
{
  "name": "generate_report",
  "arguments": {
    "report_type": "project_summary",
    "format": "detailed"
  }
}
```

### Simulate API Call with Custom Parameters

```javascript
{
  "name": "simulate_api_call",
  "arguments": {
    "endpoint": "user-service/authenticate",
    "delay_ms": 500,
    "success_rate": 0.9
  }
}
```

### Get System Metrics

```javascript
{
  "name": "get_system_metrics",
  "arguments": {
    "category": "application"
  }
}
```

### Get Recent Error Notifications

```javascript
{
  "name": "get_notifications",
  "arguments": {
    "type": "error",
    "limit": 5
  }
}
```

## HTTP Endpoints

When running, the server provides these HTTP endpoints:

- `GET /health` - Health check for load balancers
- `GET /tools` - List all available MCP tools
- `GET /demo` - Demo information and sample data overview

## Docker Support

### Build and Run

```bash
# Build Docker image
npm run build

# Run with Docker
npm run docker:run
```

### Manual Docker Commands

```bash
# Build
docker build -t agent-hub-mock-mcp .

# Run
docker run -p 3000:3000 agent-hub-mock-mcp
```

## Integration with Agent Hub

This mock server integrates seamlessly with the Agent Hub platform:

1. **ECS Deployment**: Runs as a containerized service
2. **Load Balancer**: Accessible through MCP ALB routing
3. **Health Checks**: Provides health endpoints for monitoring
4. **Logging**: Structured logging for CloudWatch
5. **Development**: Perfect for local development and testing

## Use Cases

### 1. Demonstrations
- Show MCP functionality without external API setup
- Demonstrate user interfaces and workflows
- Present to stakeholders without dependencies

### 2. Development
- Develop MCP client integrations
- Test error handling and edge cases
- Prototype new features quickly

### 3. Testing
- Load testing and performance benchmarking
- Integration testing without external services
- Automated testing pipelines

### 4. Training
- Educational purposes and workshops
- Learning MCP protocol implementation
- Understanding tool integration patterns

## Configuration

### Environment Variables

```bash
# Server configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Customizing Mock Data

Edit the `MOCK_DATA` object in `src/index.js` to customize:
- User profiles and roles
- Project information and status
- Task assignments and priorities
- System metrics and thresholds
- Notification types and messages

## Response Patterns

### Realistic Delays
- Random delays between 50-250ms
- Simulates real API response times
- Configurable in `simulate_api_call` tool

### Error Simulation
- Configurable success/failure rates
- Realistic error messages
- Proper error handling and logging

### Data Relationships
- Users linked to tasks and projects
- Projects contain team members and tasks
- Consistent data relationships across tools

## Performance

- **Memory Usage**: ~50MB typical
- **Response Time**: 50-250ms simulated
- **Throughput**: Handles 1000+ requests/second
- **CPU Usage**: Minimal (single-threaded Node.js)

## Security

- No external network calls
- No sensitive data storage
- Runs as non-root user in Docker
- Security headers with Helmet.js

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port
   PORT=3001 npm start
   ```

2. **Module import errors**
   ```bash
   # Ensure Node.js 18+ is installed
   node --version
   ```

3. **Docker build fails**
   ```bash
   # Check Docker is running
   docker --version
   ```

## Contributing

1. Fork the repository
2. Add new mock tools or data
3. Update tests and documentation
4. Submit a pull request

## License

MIT License - see LICENSE file for details.