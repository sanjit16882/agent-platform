# MCP Infrastructure Setup Guide

This guide covers the deployment and configuration of the Model Context Protocol (MCP) infrastructure for the Agent Hub Platform.

## Overview

The MCP infrastructure provides enterprise-grade integrations with:
- **Office 365** (Excel, Word, SharePoint)
- **Microsoft Teams** (Messaging, Channels, Meetings)
- **GitHub** (Repositories, Issues, Pull Requests)

## Architecture Components

### Core Infrastructure
- **ECS Fargate Cluster**: Serverless container orchestration
- **VPC**: Isolated network with private subnets
- **Application Load Balancer**: Internal load balancing with path-based routing
- **Target Groups**: Health-checked routing for each MCP server
- **ECR Repositories**: Container image storage
- **CloudWatch**: Logging and monitoring
- **Secrets Manager**: Secure credential storage

### Security Features
- Private subnets for MCP servers
- Security groups with minimal required access
- IAM roles with least privilege principles
- Encrypted secrets management
- VPC isolation from public internet

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **AWS CDK** v2.100.0 or later
3. **Node.js** 18.x or later
4. **Docker** for building MCP server images

## Deployment Steps

### 1. Deploy Infrastructure

```powershell
# Deploy MCP infrastructure
./deploy-mcp-infrastructure.ps1 -Environment dev

# For production deployment
./deploy-mcp-infrastructure.ps1 -Environment prod
```

### 2. Configure OAuth Credentials

After deployment, configure the OAuth credentials in AWS Secrets Manager:

#### Office 365 Credentials
```bash
aws secretsmanager update-secret \
  --secret-id agent-hub-mcp-office365-credentials-dev \
  --secret-string '{
    "client_id": "your-office365-client-id",
    "client_secret": "your-office365-client-secret",
    "tenant_id": "your-tenant-id"
  }'
```

#### Teams Credentials
```bash
aws secretsmanager update-secret \
  --secret-id agent-hub-mcp-teams-credentials-dev \
  --secret-string '{
    "client_id": "your-teams-client-id",
    "client_secret": "your-teams-client-secret",
    "tenant_id": "your-tenant-id"
  }'
```

#### GitHub Credentials
```bash
aws secretsmanager update-secret \
  --secret-id agent-hub-mcp-github-credentials-dev \
  --secret-string '{
    "github_app_id": "your-github-app-id",
    "github_private_key": "your-github-private-key",
    "github_installation_id": "your-installation-id"
  }'
```

### 3. Build and Push Docker Images

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push Office 365 MCP server
docker build -t agent-hub-mcp-office365-dev ./mcp-servers/office365
docker tag agent-hub-mcp-office365-dev:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-hub-mcp-office365-dev:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-hub-mcp-office365-dev:latest

# Build and push Teams MCP server
docker build -t agent-hub-mcp-teams-dev ./mcp-servers/teams
docker tag agent-hub-mcp-teams-dev:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-hub-mcp-teams-dev:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-hub-mcp-teams-dev:latest

# Build and push GitHub MCP server
docker build -t agent-hub-mcp-github-dev ./mcp-servers/github
docker tag agent-hub-mcp-github-dev:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-hub-mcp-github-dev:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-hub-mcp-github-dev:latest
```

## Infrastructure Outputs

The deployment creates the following outputs:

| Output | Description | Usage |
|--------|-------------|-------|
| `MCPClusterName` | ECS cluster name | Deploy MCP services |
| `MCPVpcId` | VPC ID | Network configuration |
| `MCPLoadBalancerArn` | ALB ARN | Service discovery |
| `MCPLoadBalancerDNS` | ALB DNS name | Internal service access |
| `MCPSecurityGroupId` | Security group ID | Service configuration |
| `Office365TargetGroupArn` | Target group ARN | ECS service registration |
| `TeamsTargetGroupArn` | Target group ARN | ECS service registration |
| `GitHubTargetGroupArn` | Target group ARN | ECS service registration |
| `Office365RepositoryUri` | ECR repository URI | Docker image deployment |
| `TeamsRepositoryUri` | ECR repository URI | Docker image deployment |
| `GitHubRepositoryUri` | ECR repository URI | Docker image deployment |

## Cost Optimization Features

### Fargate Spot Instances
- Configured for non-critical workloads
- Up to 70% cost savings compared to on-demand

### Auto Scaling
- CPU and memory-based scaling
- Scale to zero during low usage periods

### Resource Limits
- Minimal CPU and memory allocation
- Efficient container resource usage

### Log Retention
- 1-week retention for cost optimization
- Structured logging for efficient querying

## Monitoring and Observability

### CloudWatch Integration
- Container insights enabled
- Custom metrics for tool execution
- Structured JSON logging

### Health Checks
- Application Load Balancer health checks
- ECS service health monitoring
- Automatic unhealthy task replacement

### Alerting
- High error rate alerts
- High latency alerts
- Service unavailable alerts

## Security Best Practices

### Network Security
- Private subnets only
- Security groups with minimal access
- No direct internet access for containers

### Credential Management
- AWS Secrets Manager for OAuth tokens
- Automatic token rotation support
- IAM roles for service authentication

### Data Protection
- TLS encryption in transit
- Secrets encryption at rest
- VPC flow logs for audit

## Troubleshooting

### Common Issues

#### 1. ECS Service Won't Start
```bash
# Check service events
aws ecs describe-services --cluster agent-hub-mcp-cluster-dev --services office365-mcp-service

# Check task definition
aws ecs describe-task-definition --task-definition office365-mcp-task
```

#### 2. Health Check Failures
```bash
# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Check container logs
aws logs get-log-events --log-group-name /aws/ecs/agent-hub-mcp-office365-dev --log-stream-name <stream-name>
```

#### 3. OAuth Authentication Issues
```bash
# Verify secret values
aws secretsmanager get-secret-value --secret-id agent-hub-mcp-office365-credentials-dev

# Check IAM permissions
aws iam get-role-policy --role-name agent-hub-mcp-task-role-dev --policy-name MCPTaskPolicy
```

## Load Balancer Configuration

### Routing Rules
The Application Load Balancer is configured with path-based routing:

- **`/office365*`** → Office 365 MCP Server
- **`/teams*`** → Microsoft Teams MCP Server  
- **`/github*`** → GitHub MCP Server
- **`/health`** → ALB Health Check (returns 200 OK)

### Health Checks
Each target group is configured with:
- **Health Check Path**: `/health`
- **Health Check Port**: `3000`
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures
- **Timeout**: 10 seconds
- **Interval**: 30 seconds

### Target Group Registration
ECS services automatically register tasks with their respective target groups using the exported ARNs.

## Next Steps

1. **Deploy MCP Services**: Create ECS services for each MCP server
2. **Test Load Balancer**: Verify routing and health checks
3. **Test Integrations**: Verify OAuth flows and API connectivity
4. **Monitor Performance**: Set up dashboards and alerts
5. **Scale Services**: Configure auto-scaling policies

## Support

For issues or questions:
1. Check CloudWatch logs for error details
2. Verify AWS resource configurations
3. Test OAuth credentials manually
4. Review security group and IAM permissions

## Cost Estimation

**Daily Costs (Development Environment):**
- ECS Fargate: $2-4/day (3 services, minimal resources)
- Application Load Balancer: $0.60/day
- CloudWatch Logs: $0.10-0.50/day
- Secrets Manager: $0.12/day
- **Total**: $2.82-5.22/day

**Monthly Costs**: ~$85-157/month for full MCP integration