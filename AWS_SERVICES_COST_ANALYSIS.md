# AWS Services Cost Analysis - Current POC vs Old AWS-Native

## 🎯 Executive Summary

**Current Situation**: You're seeing EC2 costs in your AWS account from the old `aws-native` deployment attempt, but your current POC under `local_version` doesn't use EC2 at all.

**Recommendation**: Terminate all EC2 and related infrastructure from the old aws-native deployment to eliminate unnecessary costs.

---

## 📊 Current POC (local_version) - Required AWS Services

### ✅ Services Actually Used

#### 1. **Amazon S3**
- **Purpose**: Agent storage and configuration
- **Bucket**: `agenthub-agents-storage`
- **Usage**: Stores agent definitions, metadata
- **Cost**: ~$0.023/GB/month (very low)
- **Status**: ✅ KEEP - Required

#### 2. **Amazon Bedrock**
- **Purpose**: AI model inference (Claude, etc.)
- **Usage**: Real AI processing for agents
- **Cost**: Pay-per-use (tokens consumed)
- **Status**: ✅ KEEP - Required

#### 3. **AWS Cost Explorer API** (Optional)
- **Purpose**: Real-time cost tracking in FinOps dashboard
- **Usage**: Fetches actual AWS costs
- **Cost**: $0.01 per API request
- **Status**: ✅ KEEP - Optional but useful

### 🏗️ Architecture
```
Local Machine (Windows)
├── Frontend (React) - Port 3001
├── Backend (Node.js) - Port 3002
│   ├── Connects to S3 for agent storage
│   └── Connects to Bedrock for AI inference
└── SQLite Database (local file)
```

**Key Point**: Everything runs locally on your machine. No EC2, no ECS, no ALB needed!

---

## ❌ Old AWS-Native Deployment - Services to Terminate

### Services That Were Deployed (Costing Money)

#### 1. **EC2 Instances** 💰
- **What**: Virtual servers running in AWS
- **Why deployed**: Old attempt to run backend on AWS
- **Current status**: Not used by local_version POC
- **Cost**: ~$8-30/month per instance (t3.micro to t3.small)
- **Action**: ✅ TERMINATE

#### 2. **ECS (Elastic Container Service)** 💰
- **What**: Container orchestration service
- **Why deployed**: To run MCP servers (Teams, Office365)
- **Current status**: Not used by local_version POC
- **Cost**: Free for service, but charges for underlying EC2/Fargate
- **Action**: ✅ DELETE SERVICES & CLUSTERS

#### 3. **Application Load Balancer (ALB)** 💰
- **What**: Load balancer for distributing traffic
- **Why deployed**: To route traffic to ECS services
- **Current status**: Not used by local_version POC
- **Cost**: ~$16-22/month + data transfer
- **Action**: ✅ DELETE

#### 4. **VPC with NAT Gateway** 💰💰💰
- **What**: Virtual network with internet gateway
- **Why deployed**: Network infrastructure for ECS
- **Current status**: Not used by local_version POC
- **Cost**: ~$32-45/month (NAT Gateway is expensive!)
- **Action**: ✅ DELETE (or keep default VPC only)

#### 5. **EBS Volumes** 💰
- **What**: Storage volumes attached to EC2
- **Why deployed**: Persistent storage for EC2 instances
- **Current status**: Not used by local_version POC
- **Cost**: ~$0.10/GB/month
- **Action**: ✅ DELETE

#### 6. **Elastic IPs** 💰
- **What**: Static IP addresses
- **Why deployed**: For EC2 instances
- **Current status**: Not used by local_version POC
- **Cost**: ~$3.60/month if not attached
- **Action**: ✅ RELEASE

#### 7. **CloudWatch Logs** 💰
- **What**: Log storage from ECS/EC2
- **Why deployed**: Application logging
- **Current status**: Not used by local_version POC
- **Cost**: ~$0.50/GB ingested + storage
- **Action**: ✅ DELETE LOG GROUPS

#### 8. **ECR (Elastic Container Registry)** 💰
- **What**: Docker image storage
- **Why deployed**: Store container images for ECS
- **Current status**: Not used by local_version POC
- **Cost**: ~$0.10/GB/month
- **Action**: ✅ DELETE REPOSITORIES

---

## 💰 Estimated Monthly Cost Savings

### Current Costs (Old AWS-Native Infrastructure)
```
EC2 Instances (2x t3.small):        $30.00
Application Load Balancer:          $18.00
NAT Gateway:                        $35.00
EBS Volumes (20GB):                  $2.00
Elastic IPs (unused):                $3.60
CloudWatch Logs:                     $5.00
ECR Storage:                         $2.00
ECS (underlying resources):         $10.00
─────────────────────────────────────────
TOTAL MONTHLY:                     ~$105.60
```

### After Cleanup (Local POC Only)
```
S3 Storage (1GB):                    $0.02
Bedrock API (usage-based):          ~$5-20 (varies)
Cost Explorer API (optional):        $0.50
─────────────────────────────────────────
TOTAL MONTHLY:                      ~$5-20
```

**💵 SAVINGS: ~$85-100/month (~$1,020-1,200/year)**

---

## 🔍 How to Identify Resources to Delete

### Step 1: Check EC2 Dashboard
```bash
# List all running EC2 instances
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' --output table
```

**Look for**:
- Instances with names containing "mcp", "agenthub", "teams", "office365"
- Instances in "running" or "stopped" state

### Step 2: Check ECS Services
```bash
# List ECS clusters
aws ecs list-clusters

# List services in each cluster
aws ecs list-services --cluster <cluster-name>
```

**Look for**:
- Clusters named "mcp-cluster", "agenthub-cluster"
- Services for Teams, Office365, or other MCP servers

### Step 3: Check Load Balancers
```bash
# List all load balancers
aws elbv2 describe-load-balancers --query 'LoadBalancers[*].[LoadBalancerName,State.Code,CreatedTime]' --output table
```

**Look for**:
- ALBs created around the time of aws-native deployment
- ALBs with "mcp" or "agenthub" in the name

### Step 4: Check NAT Gateways
```bash
# List NAT Gateways
aws ec2 describe-nat-gateways --query 'NatGateways[*].[NatGatewayId,State,VpcId]' --output table
```

**Look for**:
- NAT Gateways in "available" state
- Associated with custom VPCs (not default VPC)

### Step 5: Check S3 Buckets
```bash
# List all S3 buckets
aws s3 ls
```

**Keep**:
- `agenthub-agents-storage` (used by current POC)

**Consider deleting**:
- Buckets with "mcp", "deployment", "cloudformation" in name
- Buckets created during aws-native deployment

### Step 6: Check ECR Repositories
```bash
# List ECR repositories
aws ecr describe-repositories --query 'repositories[*].[repositoryName,createdAt]' --output table
```

**Look for**:
- Repositories for "teams-mcp", "office365-mcp", etc.

---

## 🗑️ Safe Deletion Order

### Phase 1: Stop Active Services (Immediate Cost Reduction)
1. **Stop ECS Services**
   - Stops container tasks
   - Immediate cost reduction
   
2. **Stop EC2 Instances**
   - Stops compute charges
   - EBS charges continue (small)

### Phase 2: Delete Infrastructure (Complete Cleanup)
1. **Delete ECS Services & Tasks**
2. **Delete Load Balancers**
3. **Terminate EC2 Instances**
4. **Delete ECS Clusters**
5. **Delete NAT Gateways** (biggest cost saver!)
6. **Release Elastic IPs**
7. **Delete EBS Volumes**
8. **Delete ECR Repositories**
9. **Delete CloudWatch Log Groups**
10. **Delete Custom VPC** (optional, keep default)

### Phase 3: Verify Cleanup
1. Check AWS Cost Explorer for reduced costs
2. Verify no orphaned resources
3. Check for any remaining charges

---

## ⚠️ Important Warnings

### DO NOT DELETE:
1. ✅ **S3 Bucket**: `agenthub-agents-storage` - Contains your agent configurations
2. ✅ **IAM Roles/Policies**: For Bedrock and S3 access
3. ✅ **AWS Credentials**: Access keys used by local POC
4. ✅ **Default VPC**: Keep the default VPC (free)

### SAFE TO DELETE:
1. ❌ All EC2 instances from aws-native
2. ❌ All ECS clusters and services
3. ❌ Application Load Balancers
4. ❌ NAT Gateways (custom VPCs)
5. ❌ Custom VPCs created for aws-native
6. ❌ ECR repositories
7. ❌ Unused Elastic IPs
8. ❌ Orphaned EBS volumes

---

## 📋 Cleanup Checklist

### Before Cleanup
- [ ] Backup any important data from EC2 instances
- [ ] Export any logs from CloudWatch if needed
- [ ] Document current architecture (already done in aws-native folder)
- [ ] Verify local POC is working without AWS infrastructure

### During Cleanup
- [ ] Stop all ECS services
- [ ] Stop all EC2 instances
- [ ] Delete Load Balancers
- [ ] Delete NAT Gateways
- [ ] Terminate EC2 instances
- [ ] Delete ECS clusters
- [ ] Release Elastic IPs
- [ ] Delete EBS volumes
- [ ] Delete ECR repositories
- [ ] Delete CloudWatch log groups

### After Cleanup
- [ ] Verify S3 bucket `agenthub-agents-storage` still exists
- [ ] Test local POC still works
- [ ] Check AWS Cost Explorer after 24 hours
- [ ] Verify no unexpected charges
- [ ] Set up billing alerts for remaining services

---

## 🎯 Recommended Actions

### Immediate (Today)
1. **Stop all EC2 instances** - Immediate cost reduction
2. **Stop all ECS services** - Stop container charges
3. **Identify NAT Gateways** - Biggest cost item

### This Week
1. **Delete Load Balancers** - $18/month savings
2. **Delete NAT Gateways** - $35/month savings
3. **Terminate EC2 instances** - $30/month savings
4. **Delete ECS clusters** - Cleanup

### This Month
1. **Delete ECR repositories** - Small savings
2. **Delete CloudWatch logs** - Small savings
3. **Release unused Elastic IPs** - $3.60/month savings
4. **Verify all cleanup complete**

---

## 📊 Cost Monitoring

### Set Up Billing Alerts
```bash
# Create budget alert for $20/month
aws budgets create-budget \
  --account-id <your-account-id> \
  --budget file://budget.json
```

### Monitor Daily Costs
- Check AWS Cost Explorer daily for first week
- Verify costs are decreasing
- Watch for any unexpected charges

### Expected Cost Trend
```
Week 1: $105 → $50 (stopped services)
Week 2: $50 → $20 (deleted infrastructure)
Week 3: $20 → $10 (cleanup complete)
Week 4: $10 → $5-10 (steady state)
```

---

## 🔐 Security Considerations

### Keep These IAM Resources
- IAM user/role for Bedrock access
- IAM user/role for S3 access
- IAM user/role for Cost Explorer (optional)

### Can Delete
- IAM roles for ECS tasks
- IAM roles for EC2 instances
- IAM roles for Load Balancers

---

## 📝 Summary

**Current POC Architecture**: Local development with S3 + Bedrock only
**Old AWS-Native**: Full cloud deployment with EC2, ECS, ALB, NAT Gateway
**Cost Impact**: ~$100/month in unnecessary charges
**Action Required**: Delete all aws-native infrastructure
**Risk**: Low - local POC doesn't depend on any of it
**Savings**: ~$1,200/year

---

## 🚀 Next Steps

1. **Review this analysis** - Confirm understanding
2. **Run AWS CLI commands** - Identify exact resources
3. **Create deletion plan** - Specific resource IDs
4. **Execute cleanup** - Follow safe deletion order
5. **Monitor costs** - Verify savings

Would you like me to help you:
1. Generate the specific AWS CLI commands to identify resources?
2. Create a deletion script?
3. Set up cost monitoring alerts?
