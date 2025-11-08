# Agent Hub MCP Platform - Deployment Guide

Complete deployment guide for the Agent Hub Model Context Protocol (MCP) platform on AWS.

## 🚀 Quick Start - Complete Deployment

### One-Command Deployment
```bash
npm run deploy:complete
```

This single command will:
1. Deploy all AWS infrastructure (ECS, ALB, ElastiCache, VPC, etc.)
2. Build and push Docker images to ECR
3. Deploy MCP services to ECS
4. Configure load balancer routing
5. Test all endpoints
6. Provide access URLs and monitoring links

**Estimated Time:** 30-40 minutes  
**Estimated Cost:** $2-5/day while running

## 📋 What Gets Deployed

### Infrastructure Components
- **ECS Fargate Cluster** - Container orchestration
- **Application Load Balancer** - Traffic routing and health checks
- **ElastiCache Redis** - Caching layer for MCP responses
- **VPC with Private Subnets** - Secure networking
- **CloudWatch Dashboard** - Monitoring and metrics
- **ECR Repositories** - Docker image storage
- **Secrets Manager** - Secure credential storage
- **SNS Topics** - Alert notifications

### MCP Servers
- **GitHub MCP Server** - Real GitHub API integration (7 tools)
- **Mock MCP Server** - Offline demo server (10 tools)

### Monitoring & Security
- **Health Check Endpoints** - `/health` for each service
- **CloudWatch Alarms** - Performance and error monitoring
- **Security Groups** - Network access control
- **IAM Roles** - Least-privilege access

## 🛠️ Manual Deployment Steps

If you prefer step-by-step deployment:

### Step 1: Deploy Infrastructure Only
```bash
cd infrastructure
npm run deploy
```

### Step 2: Build and Push MCP Servers
```bash
npm run deploy:mcp
```

### Step 3: Test Deployment
```bash
npm run test:mcp
```

## 🧪 Local Testing (Before Deployment)

Test everything locally first:

### Test MCP Servers Locally
```bash
# Test both servers
npm run test:mcp

# Test individual servers
cd mcp-servers/mock && npm test
cd mcp-servers/github && npm test
```

### Test Infrastructure Validation
```bash
cd infrastructure
npm run validate
```

## 🔧 Configuration

### Required Setup
1. **AWS CLI configured** with appropriate permissions
2. **Docker installed** and running
3. **Node.js 18+** installed

### Optional Configuration
- **GitHub Token** - For full GitHub MCP server functionality
  - Set in AWS Secrets Manager after deployment
  - Without token: Limited to public API (60 requests/hour)
  - With token: Full access (5,000 requests/hour)

## 📊 Monitoring and Access

After deployment, you'll get:

### Access URLs
- **Load Balancer**: `http://your-alb-dns.amazonaws.com`
- **Mock Server**: `http://your-alb-dns.amazonaws.com/mock/health`
- **GitHub Server**: `http://your-alb-dns.amazonaws.com/github/health`
- **CloudWatch Dashboard**: Direct link provided

### Available Endpoints

#### Mock MCP Server (`/mock/*`)
- `GET /mock/health` - Health check
- `GET /mock/tools` - List available tools
- `GET /mock/demo` - Demo information
- **Tools**: 10 simulation tools (users, projects, tasks, metrics, reports)

#### GitHub MCP Server (`/github/*`)
- `GET /github/health` - Health check  
- `GET /github/tools` - List available tools
- **Tools**: 7 GitHub integration tools (repos, issues, PRs, users, search)

## 💰 Cost Management

### Estimated Costs
- **ECS Fargate**: ~$0.04/hour per task (2 tasks = ~$0.08/hour)
- **Application Load Balancer**: ~$0.0225/hour
- **ElastiCache t3.micro**: ~$0.017/hour
- **CloudWatch**: ~$3-5/month
- **Data Transfer**: Minimal for demo usage
- **Total**: ~$2-5/day while running

### Cost Optimization
- Services auto-scale down when not in use
- Use `npm run cleanup` to remove all resources
- Monitor costs in AWS Cost Explorer
- Set up billing alerts (included in deployment)

## 🧹 Cleanup

### Complete Cleanup (Removes Everything)
```bash
npm run cleanup
```

This will:
1. Stop all ECS services
2. Delete ECR repositories and images
3. Destroy all CloudFormation stacks
4. Remove all AWS resources
5. Stop all ongoing costs

**⚠️ Warning**: This is irreversible but preserves all code for redeployment.

### Partial Cleanup (Keep Infrastructure)
```bash
# Stop services only (keeps infrastructure)
cd mcp-servers
node deploy-services.js --stop

# Or scale down to 0 tasks
aws ecs update-service --cluster your-cluster --service mcp-github-service --desired-count 0
aws ecs update-service --cluster your-cluster --service mcp-mock-service --desired-count 0
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Docker Build Failures
```bash
# Check Docker is running
docker --version

# Login to ECR manually
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
```

#### 2. ECS Service Won't Start
- Check CloudWatch logs for container errors
- Verify ECR images were pushed successfully
- Check security group and subnet configuration

#### 3. Health Check Failures
- Wait 2-3 minutes for services to fully start
- Check ECS task logs in CloudWatch
- Verify load balancer target group health

#### 4. GitHub Server Issues
- Works without token (limited functionality)
- Set GitHub token in Secrets Manager for full access
- Check rate limits if getting 403 errors

### Debug Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster your-cluster --services mcp-github-service

# Check CloudWatch logs
aws logs tail /aws/ecs/agent-hub-mcp-github-dev --follow

# Test health endpoints directly
curl http://your-alb-dns.amazonaws.com/mock/health
curl http://your-alb-dns.amazonaws.com/github/health
```

## 🎯 Demo Scenarios

### Scenario 1: Complete Platform Demo
1. Deploy everything: `npm run deploy:complete`
2. Show CloudWatch dashboard
3. Test both MCP servers via HTTP
4. Demonstrate load balancer routing
5. Show ECS scaling and health monitoring

### Scenario 2: Quick Mock Demo
1. Deploy infrastructure only
2. Deploy mock server only
3. Demonstrate 10 simulation tools
4. Show offline capabilities

### Scenario 3: GitHub Integration Demo
1. Set up GitHub token in Secrets Manager
2. Test GitHub API integration
3. Demonstrate repository search and issue creation
4. Show real-time GitHub data

## 📚 Additional Resources

### Documentation
- [MCP Servers README](./mcp-servers/README.md)
- [Infrastructure README](./infrastructure/MCP-INFRASTRUCTURE-README.md)
- [GitHub Server Guide](./mcp-servers/github/README.md)
- [Mock Server Guide](./mcp-servers/mock/README.md)

### Monitoring
- CloudWatch Dashboard (provided after deployment)
- ECS Service Metrics
- Application Load Balancer Metrics
- Custom MCP Tool Usage Metrics

### Security
- All containers run as non-root users
- Security groups restrict network access
- Secrets stored in AWS Secrets Manager
- IAM roles follow least-privilege principle

## 🚀 Next Steps After Deployment

1. **Test MCP Integration**: Connect MCP clients to your servers
2. **Set Up GitHub Token**: Enable full GitHub functionality
3. **Monitor Performance**: Use CloudWatch dashboard
4. **Scale as Needed**: Adjust ECS service desired count
5. **Add More Servers**: Extend with additional MCP servers
6. **Integrate with Applications**: Use MCP tools in your applications

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ All health endpoints return 200 OK
- ✅ Both MCP servers list their tools correctly
- ✅ Load balancer routes traffic properly
- ✅ CloudWatch dashboard shows metrics
- ✅ ECS services are running and stable
- ✅ No errors in CloudWatch logs

**Congratulations! Your Agent Hub MCP Platform is live and ready for demos and development.**