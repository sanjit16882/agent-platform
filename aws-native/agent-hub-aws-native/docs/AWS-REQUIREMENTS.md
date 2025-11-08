# AWS Requirements & Configuration Checklist

## 🔧 **Required AWS Information**

### **1. AWS Account & Access**
- [ ] **AWS Account ID**: `____________` (12-digit number)
- [ ] **AWS Region**: `____________` (e.g., us-east-1, eu-west-1)
- [ ] **AWS CLI Profile Name**: `____________` (or use default)
- [ ] **Deployment Environment**: `____________` (dev/staging/prod)

### **2. AWS Credentials & Permissions**
- [ ] **AWS Access Key ID**: `AKIA____________`
- [ ] **AWS Secret Access Key**: `____________`
- [ ] **AWS Session Token** (if using temporary credentials): `____________`

**OR**

- [ ] **IAM Role ARN** (if using role-based access): `arn:aws:iam::____________:role/____________`
- [ ] **AWS SSO Profile** (if using AWS SSO): `____________`

### **3. Required AWS Permissions**
Your AWS user/role needs the following permissions:

#### **Core Services**
- [ ] **CloudFormation**: Full access for CDK deployments
- [ ] **IAM**: Create/manage roles and policies
- [ ] **Lambda**: Create/manage functions
- [ ] **API Gateway**: Create/manage APIs
- [ ] **DynamoDB**: Create/manage tables
- [ ] **S3**: Create/manage buckets
- [ ] **Cognito**: Create/manage user pools

#### **Advanced Services**
- [ ] **ECS/Fargate**: For MCP server containers
- [ ] **ECR**: Container registry for MCP servers
- [ ] **EventBridge**: Event-driven architecture
- [ ] **SQS/SNS**: Message queuing
- [ ] **CloudWatch**: Monitoring and logging
- [ ] **Systems Manager**: Configuration management
- [ ] **Secrets Manager**: Secure credential storage

#### **AI/ML Services**
- [ ] **Bedrock**: AI model access (Claude, Titan)
- [ ] **Bedrock Model Access**: Specific models you want to use
  - [ ] Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)
  - [ ] Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`)
  - [ ] Titan Text Express (`amazon.titan-text-express-v1`)

### **4. Networking Configuration**
- [ ] **VPC ID** (if using existing VPC): `vpc-____________`
- [ ] **Subnet IDs** (if using existing subnets):
  - Private Subnet 1: `subnet-____________`
  - Private Subnet 2: `subnet-____________`
  - Public Subnet 1: `subnet-____________`
  - Public Subnet 2: `subnet-____________`
- [ ] **Create New VPC**: Yes/No `____________`

### **5. Domain & SSL Configuration**
- [ ] **Custom Domain Name**: `____________` (e.g., agents.yourcompany.com)
- [ ] **Route 53 Hosted Zone ID**: `____________` (if using Route 53)
- [ ] **SSL Certificate ARN**: `arn:aws:acm:____________:____________:certificate/____________`
- [ ] **Use AWS-provided domain**: Yes/No `____________`

### **6. Environment-Specific Settings**

#### **Development Environment**
- [ ] **Environment Name**: `dev`
- [ ] **Budget Limit**: `$____________/month`
- [ ] **Auto-shutdown**: Yes/No `____________`
- [ ] **Backup Retention**: `____________ days`

#### **Production Environment**
- [ ] **Environment Name**: `prod`
- [ ] **Multi-AZ Deployment**: Yes/No `____________`
- [ ] **Backup Strategy**: `____________`
- [ ] **Disaster Recovery Region**: `____________`

### **7. Security & Compliance**
- [ ] **Enable CloudTrail**: Yes/No `____________`
- [ ] **Enable GuardDuty**: Yes/No `____________`
- [ ] **Enable Config**: Yes/No `____________`
- [ ] **Compliance Requirements**: `____________` (SOC2, HIPAA, etc.)
- [ ] **Data Residency Requirements**: `____________`

### **8. Monitoring & Alerting**
- [ ] **SNS Topic for Alerts**: `arn:aws:sns:____________:____________:____________`
- [ ] **Email for Notifications**: `____________`
- [ ] **Slack Webhook URL**: `____________` (optional)
- [ ] **PagerDuty Integration Key**: `____________` (optional)

### **9. Cost Management**
- [ ] **Monthly Budget Limit**: `$____________`
- [ ] **Cost Allocation Tags**:
  - Project: `AgentHub`
  - Environment: `____________`
  - Owner: `____________`
  - Department: `____________`

### **10. Bedrock Model Access**
Please ensure you have requested access to these models in your AWS region:

- [ ] **Claude 3 Sonnet**: Model access requested and approved
- [ ] **Claude 3 Haiku**: Model access requested and approved  
- [ ] **Titan Text Express**: Model access requested and approved

**How to request Bedrock model access:**
1. Go to AWS Bedrock console
2. Navigate to "Model access" in the left sidebar
3. Click "Request model access"
4. Select the models you need
5. Provide use case justification
6. Wait for approval (usually 24-48 hours)

## 🛠️ **Pre-Deployment Setup**

### **1. Install Required Tools**
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# AWS CDK
npm install -g aws-cdk

# Verify installations
aws --version
cdk --version
node --version
```

### **2. Configure AWS CLI**
```bash
# Option 1: Using access keys
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format (json)

# Option 2: Using AWS SSO
aws configure sso
# Follow the prompts for SSO setup

# Option 3: Using environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### **3. Verify AWS Access**
```bash
# Test AWS connectivity
aws sts get-caller-identity

# Expected output:
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/YourUserName"
}
```

### **4. Bootstrap CDK (One-time setup)**
```bash
# Bootstrap CDK in your account/region
cdk bootstrap aws://ACCOUNT-NUMBER/REGION

# Example:
cdk bootstrap aws://123456789012/us-east-1
```

## 📋 **Configuration Template**

Please fill out this template and save it as `aws-config.env`:

```bash
# AWS Account Configuration
export AWS_ACCOUNT_ID="____________"
export AWS_REGION="____________"
export AWS_PROFILE="____________"

# Environment Configuration
export ENVIRONMENT="____________"
export PROJECT_NAME="agent-hub"

# Networking (leave empty to create new VPC)
export VPC_ID=""
export PRIVATE_SUBNET_1=""
export PRIVATE_SUBNET_2=""
export PUBLIC_SUBNET_1=""
export PUBLIC_SUBNET_2=""

# Domain Configuration (optional)
export CUSTOM_DOMAIN=""
export HOSTED_ZONE_ID=""
export SSL_CERTIFICATE_ARN=""

# Monitoring & Alerting
export NOTIFICATION_EMAIL="____________"
export SLACK_WEBHOOK_URL=""

# Budget & Cost Management
export MONTHLY_BUDGET_LIMIT="____________"
export COST_ALLOCATION_OWNER="____________"
export COST_ALLOCATION_DEPARTMENT="____________"

# Security & Compliance
export ENABLE_CLOUDTRAIL="true"
export ENABLE_GUARDDUTY="true"
export ENABLE_CONFIG="true"

# Bedrock Configuration
export BEDROCK_REGION="${AWS_REGION}"
export CLAUDE_SONNET_MODEL_ID="anthropic.claude-3-sonnet-20240229-v1:0"
export CLAUDE_HAIKU_MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"
export TITAN_MODEL_ID="amazon.titan-text-express-v1"
```

## 🚨 **Important Security Notes**

### **Credential Security**
- ❌ **Never commit AWS credentials to Git**
- ✅ **Use IAM roles when possible**
- ✅ **Enable MFA on your AWS account**
- ✅ **Use least-privilege permissions**
- ✅ **Rotate credentials regularly**

### **Cost Management**
- ✅ **Set up billing alerts**
- ✅ **Use AWS Cost Explorer**
- ✅ **Tag all resources**
- ✅ **Monitor usage regularly**
- ✅ **Set up auto-shutdown for dev environments**

### **Compliance**
- ✅ **Enable CloudTrail for audit logs**
- ✅ **Use encryption at rest and in transit**
- ✅ **Implement proper access controls**
- ✅ **Regular security reviews**

## 🎯 **Next Steps After Configuration**

1. **Validate Configuration**
   ```bash
   # Source your configuration
   source aws-config.env
   
   # Validate AWS access
   aws sts get-caller-identity
   
   # Check Bedrock model access
   aws bedrock list-foundation-models --region $AWS_REGION
   ```

2. **Deploy Infrastructure**
   ```bash
   cd AWS-Native-Agent-Hub
   ./deployment/deploy.sh $ENVIRONMENT
   ```

3. **Verify Deployment**
   - Check CloudFormation stacks
   - Test API endpoints
   - Verify Cognito user pool
   - Test Bedrock integration

4. **Initial Setup**
   - Create first admin user
   - Seed initial agent data
   - Configure monitoring alerts
   - Test end-to-end functionality

## 📞 **Support & Troubleshooting**

If you encounter issues:

1. **Check AWS Service Health**: https://status.aws.amazon.com/
2. **Verify Permissions**: Ensure your IAM user/role has required permissions
3. **Check Quotas**: Verify service limits in AWS Service Quotas
4. **Review Logs**: Check CloudWatch logs for error details
5. **CDK Issues**: Run `cdk doctor` to diagnose CDK problems

---

**Once you provide these details, we can proceed with the deployment! 🚀**