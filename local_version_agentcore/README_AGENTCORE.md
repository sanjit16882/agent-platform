# Agent Hub - AWS AgentCore Integration Version

This is a specialized version of the Agent Hub platform integrated with **AWS AgentCore** for enterprise-grade agent orchestration and management.

## What is AWS AgentCore?

AWS AgentCore is Amazon's managed service for building, deploying, and managing AI agents at scale. It provides:

- **Agent Orchestration**: Coordinate multiple agents working together
- **Built-in Tools**: Pre-integrated AWS services (S3, DynamoDB, Lambda, etc.)
- **Memory Management**: Persistent conversation and context storage
- **Security & Compliance**: IAM integration, encryption, audit logs
- **Scalability**: Auto-scaling based on demand
- **Monitoring**: CloudWatch integration for metrics and logs

## Key Differences from Local Version

### Architecture
- **Local Version**: Self-hosted with local databases and file storage
- **AgentCore Version**: Fully integrated with AWS managed services

### Agent Execution
- **Local Version**: Agents run on local infrastructure
- **AgentCore Version**: Agents run on AWS Lambda/ECS with AgentCore orchestration

### Storage
- **Local Version**: Local PostgreSQL, MongoDB, file system
- **AgentCore Version**: RDS, DynamoDB, S3, with AgentCore memory management

### Scalability
- **Local Version**: Manual scaling, limited by local resources
- **AgentCore Version**: Auto-scaling, serverless, enterprise-grade

## Features Enabled by AgentCore

### 1. **Enterprise Agent Orchestration**
- Multi-agent workflows with automatic coordination
- Agent-to-agent communication
- Shared context and memory across agents
- Workflow state management

### 2. **AWS Service Integration**
- Direct access to 200+ AWS services
- Pre-built connectors for common services
- Secure credential management via IAM
- Service quotas and cost management

### 3. **Advanced Testing Capabilities**
- Integration with AWS testing services
- Load testing with AWS infrastructure
- Compliance testing with AWS Config
- Security testing with AWS Security Hub

### 4. **Production-Ready Features**
- High availability and disaster recovery
- Multi-region deployment
- Enterprise SLAs
- 24/7 AWS support

## Port Configuration

**Important:** This AgentCore version uses different ports to avoid conflicts with the local version:

- **Frontend UI:** http://localhost:4001 (local version uses 3001)
- **Backend API:** http://localhost:4002 (local version uses 3002)
- **Testing API:** http://localhost:4003 (local version uses 3003)

This allows you to run both versions simultaneously for comparison and testing.

## Getting Started

### Prerequisites
- AWS Account with AgentCore enabled
- AWS CLI configured
- Node.js 18+ and npm
- Terraform (for infrastructure)

### Setup

1. **Configure AWS Credentials**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

2. **Deploy AgentCore Infrastructure**
```bash
cd infrastructure/agentcore
terraform init
terraform plan
terraform apply
```

3. **Install Dependencies**
```bash
npm install
```

4. **Configure Environment**
```bash
cp .env.agentcore.example .env
# Edit .env with your AgentCore endpoints and credentials
```

5. **Start the Platform**
```bash
npm run start:agentcore
```

## Configuration

### Environment Variables

```env
# AWS AgentCore Configuration
AWS_REGION=us-east-1
AGENTCORE_ENDPOINT=https://agentcore.us-east-1.amazonaws.com
AGENTCORE_AGENT_ID=your-agent-id
AGENTCORE_AGENT_ALIAS=production

# AWS Services
AWS_S3_BUCKET=agent-hub-storage
AWS_DYNAMODB_TABLE=agent-hub-data
AWS_RDS_ENDPOINT=your-rds-endpoint

# Authentication
AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id

# Monitoring
CLOUDWATCH_LOG_GROUP=/aws/agenthub
CLOUDWATCH_METRICS_NAMESPACE=AgentHub
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Hub UI (React)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway + Lambda (Backend)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS AgentCore                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Agent 1    │  │   Agent 2    │  │   Agent N    │      │
│  │ Orchestrator │  │   Executor   │  │   Analyzer   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
    ┌───────┐    ┌─────────┐   ┌──────┐     ┌─────────┐
    │   S3  │    │DynamoDB │   │ RDS  │     │ Bedrock │
    └───────┘    └─────────┘   └──────┘     └─────────┘
```

## Advanced Features

### Multi-Agent Workflows

Create complex workflows with multiple agents:

```javascript
const workflow = {
  name: "Customer Support Workflow",
  agents: [
    {
      id: "classifier",
      type: "intent-classifier",
      next: ["technical-support", "billing-support"]
    },
    {
      id: "technical-support",
      type: "technical-agent",
      condition: "intent === 'technical'"
    },
    {
      id: "billing-support",
      type: "billing-agent",
      condition: "intent === 'billing'"
    }
  ]
};
```

### AgentCore Testing Integration

Run tests directly against AgentCore:

```javascript
const testSuite = {
  name: "AgentCore Integration Tests",
  agentCoreConfig: {
    agentId: "prod-agent-123",
    alias: "production"
  },
  tests: [
    {
      name: "Multi-agent coordination",
      type: "workflow",
      agents: ["classifier", "executor", "validator"]
    }
  ]
};
```

## Cost Optimization

AgentCore version includes cost tracking and optimization:

- **Real-time cost monitoring** via CloudWatch
- **Budget alerts** for agent execution costs
- **Cost allocation tags** for different agents/workflows
- **Automatic scaling** to optimize costs

## Security & Compliance

- **IAM Integration**: Fine-grained access control
- **Encryption**: At-rest and in-transit encryption
- **Audit Logs**: Complete audit trail in CloudTrail
- **Compliance**: HIPAA, SOC 2, PCI DSS ready
- **VPC Integration**: Private network deployment

## Monitoring & Observability

- **CloudWatch Dashboards**: Real-time metrics
- **X-Ray Tracing**: Distributed tracing for agent workflows
- **CloudWatch Logs**: Centralized logging
- **Custom Metrics**: Agent-specific performance metrics

## Migration from Local Version

To migrate from the local version:

1. Export your agents and configurations
2. Deploy AgentCore infrastructure
3. Import agents to AgentCore
4. Update API endpoints
5. Test thoroughly in staging
6. Gradual rollout to production

See `docs/MIGRATION_GUIDE.md` for detailed instructions.

## Support

- **AWS Support**: Enterprise support for AgentCore
- **Documentation**: [AWS AgentCore Docs](https://docs.aws.amazon.com/agentcore)
- **Community**: GitHub Discussions
- **Issues**: GitHub Issues

## License

Same as the main Agent Hub platform - see LICENSE file.

## Next Steps

1. Review the [AgentCore Integration Guide](docs/AGENTCORE_INTEGRATION.md)
2. Set up your AWS infrastructure
3. Deploy your first agent to AgentCore
4. Enable advanced testing features
5. Configure monitoring and alerts

---

**Note**: This version requires an active AWS account and AgentCore access. For local development without AWS, use the `local_version` directory instead.
