# Current AWS Costs Report - November 28, 2024

## 💰 Current Month Costs (November 2024)

### Total Costs: ~$0.24 USD

### Cost Breakdown by Service:

| Service | Cost (USD) | Status | Action |
|---------|-----------|--------|--------|
| **Claude 3 Sonnet (Bedrock)** | $0.1089 | ✅ Active | KEEP - Used by POC |
| **Claude 3 Haiku (Bedrock)** | $0.0904 | ✅ Active | KEEP - Used by POC |
| **Claude 3.5 Sonnet (Bedrock)** | $0.0396 | ✅ Active | KEEP - Used by POC |
| **All Other Services** | ~$0.00 | ⚠️ Minimal | Review |

**Total Bedrock (AI) Costs**: $0.2389 USD

---

## 🏗️ Infrastructure Found (NOT Currently Costing Money)

### ⚠️ Resources That WILL Cost Money When Active:

#### 1. Application Load Balancer
- **Name**: `agent-hub-mcp-alb-dev`
- **Status**: Active (created Nov 5, 2024)
- **Potential Cost**: ~$16-22/month when in use
- **Current Cost**: $0 (no traffic/usage yet)
- **Action**: ⚠️ DELETE - Not used by local POC

#### 2. NAT Gateway
- **ID**: `nat-0f17e48e90e2b03f6`
- **Status**: Available (created Nov 5, 2024)
- **Potential Cost**: ~$32-45/month (EXPENSIVE!)
- **Current Cost**: $0 (likely in free tier or minimal usage)
- **Action**: ⚠️ DELETE - Not used by local POC

#### 3. ECS Cluster
- **Name**: `agent-hub-mcp-cluster-dev`
- **Services**: 1 service (mcp-office365-service)
- **Status**: Active but 0 running tasks
- **Potential Cost**: $0 (no tasks running)
- **Current Cost**: $0
- **Action**: ⚠️ DELETE - Not used by local POC

#### 4. ECS Service
- **Name**: `mcp-office365-service`
- **Launch Type**: Fargate
- **Running Count**: 0
- **Desired Count**: 1 (trying to start but failing)
- **Potential Cost**: ~$10-15/month if running
- **Current Cost**: $0 (not running)
- **Action**: ⚠️ DELETE - Not used by local POC

#### 5. Elastic IP
- **IP**: `3.235.217.253`
- **Allocation ID**: `eipalloc-0985ac39d9da25baf`
- **Status**: Associated (with NAT Gateway)
- **Potential Cost**: $0 (associated) or $3.60/month (unassociated)
- **Current Cost**: $0
- **Action**: ⚠️ RELEASE after deleting NAT Gateway

#### 6. ECR Repositories (4 total)
- **agent-hub-mcp-github-dev** (created Nov 5, 2024)
- **agent-hub-mcp-teams-dev** (created Nov 5, 2024)
- **agent-hub-mcp-office365-dev** (created Nov 5, 2024)
- **cdk-hnb659fds-container-assets-...** (created Oct 7, 2024)
- **Potential Cost**: ~$0.10/GB/month for storage
- **Current Cost**: $0 (minimal storage)
- **Action**: ⚠️ DELETE - Not used by local POC

---

## 🎯 Key Findings

### Good News! 🎉
1. **No EC2 instances running** - No compute costs
2. **No active ECS tasks** - No container costs
3. **NAT Gateway exists but minimal usage** - Not costing much yet
4. **Load Balancer exists but no traffic** - Not costing much yet
5. **Total current costs are VERY LOW** (~$0.24/month)

### ⚠️ Warning - Potential Future Costs
The infrastructure is deployed but not actively costing money YET because:
- ECS service has 0 running tasks (desired is 1, but failing to start)
- Load Balancer has no traffic
- NAT Gateway has minimal data transfer

**However**, these resources WILL start costing money if:
- ECS service successfully starts tasks
- Load Balancer starts receiving traffic
- NAT Gateway starts transferring data

---

## 📊 Cost Analysis

### Current Situation (November 2024)
```
Bedrock (AI Usage):           $0.24
Infrastructure (Idle):        $0.00
─────────────────────────────────
TOTAL:                        $0.24/month
```

### If Infrastructure Becomes Active
```
Bedrock (AI Usage):           $5-20/month (varies with usage)
NAT Gateway:                  $32-45/month
Application Load Balancer:    $16-22/month
ECS Fargate (1 task):        $10-15/month
ECR Storage:                  $1-2/month
Elastic IP (if unassociated): $3.60/month
─────────────────────────────────
POTENTIAL TOTAL:              $67-107/month
```

---

## 🔍 Why These Resources Exist

Based on the naming (`agent-hub-mcp-*-dev`) and creation dates (Nov 5, 2024), these resources were created during an attempt to deploy MCP (Model Context Protocol) servers to AWS.

**Timeline**:
- Oct 7, 2024: CDK container assets repository created
- Nov 5, 2024: MCP infrastructure deployed (ALB, NAT Gateway, ECS, ECR)
- Current: Infrastructure exists but not actively used

**Source**: Likely from the `aws-native` folder deployment scripts.

---

## ✅ What Your Local POC Actually Uses

Your current POC under `local_version` only uses:

1. **Amazon Bedrock** ✅
   - Claude 3 Haiku
   - Claude 3 Sonnet
   - Claude 3.5 Sonnet
   - Cost: Pay-per-use (~$0.24 this month)

2. **Amazon S3** ✅
   - Bucket: `agenthub-agents-storage`
   - Cost: ~$0.00 (minimal storage)

**Everything else is NOT needed for your local POC!**

---

## 🗑️ Recommended Actions

### Priority 1: Prevent Future Costs (Do This Now)
These resources aren't costing much NOW, but will cost ~$60-100/month if they become active:

```powershell
# 1. Scale ECS service to 0 (prevent it from starting)
aws ecs update-service `
  --cluster agent-hub-mcp-cluster-dev `
  --service mcp-office365-service `
  --desired-count 0

# 2. Delete the service
aws ecs delete-service `
  --cluster agent-hub-mcp-cluster-dev `
  --service mcp-office365-service `
  --force
```

### Priority 2: Delete Expensive Infrastructure (This Week)

```powershell
# 1. Delete Load Balancer
aws elbv2 describe-load-balancers `
  --query 'LoadBalancers[?LoadBalancerName==`agent-hub-mcp-alb-dev`].LoadBalancerArn' `
  --output text | ForEach-Object {
    aws elbv2 delete-load-balancer --load-balancer-arn $_
  }

# 2. Delete NAT Gateway (BIGGEST POTENTIAL COST)
aws ec2 delete-nat-gateway --nat-gateway-id nat-0f17e48e90e2b03f6

# Wait 5 minutes for NAT Gateway to delete, then:

# 3. Release Elastic IP
aws ec2 release-address --allocation-id eipalloc-0985ac39d9da25baf
```

### Priority 3: Clean Up Remaining Resources (This Month)

```powershell
# 1. Delete ECS Cluster
aws ecs delete-cluster --cluster agent-hub-mcp-cluster-dev

# 2. Delete ECR Repositories
aws ecr delete-repository --repository-name agent-hub-mcp-github-dev --force
aws ecr delete-repository --repository-name agent-hub-mcp-teams-dev --force
aws ecr delete-repository --repository-name agent-hub-mcp-office365-dev --force
# Keep the CDK repository if you plan to use CDK in future
```

---

## 💡 Why You Should Delete These Resources

### 1. Not Used by Local POC
Your `local_version` POC runs entirely on your local machine and only uses:
- S3 for agent storage
- Bedrock for AI inference

### 2. Potential Cost Bomb
If the ECS service successfully starts or the infrastructure becomes active, you'll suddenly see $60-100/month in charges.

### 3. No Benefit
These resources provide zero value to your current development workflow.

### 4. Easy to Recreate
If you ever need them again, you can redeploy using the scripts in `aws-native` folder.

---

## 🔒 Resources to KEEP

### ✅ DO NOT DELETE:
1. **S3 Bucket**: `agenthub-agents-storage`
   - Contains your agent configurations
   - Used by local POC

2. **IAM Roles/Policies**
   - For Bedrock access
   - For S3 access

3. **Bedrock Access**
   - Your AI models
   - Pay-per-use (very reasonable)

---

## 📈 Expected Cost After Cleanup

### Before Cleanup (Current)
```
Current:                      $0.24/month
Potential (if active):        $67-107/month
```

### After Cleanup
```
Bedrock (usage-based):        $5-20/month (varies)
S3 Storage:                   $0.02/month
─────────────────────────────────
TOTAL:                        $5-20/month
```

**Savings**: Prevents potential $60-100/month in charges

---

## 🎯 Summary

**Current Status**: ✅ Very low costs ($0.24/month)

**Risk Level**: ⚠️ MEDIUM - Infrastructure exists that could start costing $60-100/month

**Recommendation**: Delete unused infrastructure to prevent future cost surprises

**Impact on POC**: ✅ NONE - Your local POC will continue working perfectly

**Time to Execute**: ~15 minutes

**Potential Savings**: $60-100/month (~$720-1,200/year)

---

## 📝 Next Steps

1. **Review this report** - Understand what's deployed
2. **Run Priority 1 commands** - Prevent ECS service from starting
3. **Run Priority 2 commands** - Delete expensive infrastructure
4. **Run Priority 3 commands** - Clean up remaining resources
5. **Verify cleanup** - Check AWS console after 24 hours
6. **Monitor costs** - Watch Cost Explorer for next few days

Would you like me to create a simple cleanup script to automate this?
