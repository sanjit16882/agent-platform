# AWS Cleanup Commands - Step by Step Guide

## 🔍 Analysis Summary

After reviewing both `aws-native` and `local_version` folders:

### Finding 1: AWS-Native Deployment (Old)
- **Location**: `aws-native/agent-hub-aws-native/`
- **Services Used**: EC2, ECS, ALB, NAT Gateway, VPC, ECR, CloudWatch
- **Status**: Abandoned deployment attempt
- **Cost Impact**: HIGH (~$100/month)

### Finding 2: Local Version Deployment Attempts
- **Location**: `local_version/`
- **Services Used**: Only S3 + Bedrock (no EC2)
- **Docker**: Only for LOCAL development (docker-compose.local.yml)
- **AWS Lambda**: Folder exists but empty (no deployment)
- **Status**: Running locally on your machine
- **Cost Impact**: LOW (~$5-10/month)

### 🎯 Conclusion
**You have NO EC2 instances from local_version folder**. All EC2 costs are from the old `aws-native` deployment.

---

## 📋 Phase 1: IDENTIFY Resources (Run These First)

### Step 1: Check EC2 Instances
```powershell
# List all EC2 instances with their state and tags
aws ec2 describe-instances `
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,LaunchTime,Tags[?Key==`Name`].Value|[0],Tags[?Key==`Project`].Value|[0]]' `
  --output table

# Get just running instances
aws ec2 describe-instances `
  --filters "Name=instance-state-name,Values=running" `
  --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,Tags[?Key==`Name`].Value|[0]]' `
  --output table
```

**Look for instances with names containing**:
- "mcp"
- "agenthub"
- "teams"
- "office365"
- Any instances created around the time of aws-native deployment

### Step 2: Check ECS Clusters and Services
```powershell
# List all ECS clusters
aws ecs list-clusters --output table

# For each cluster, list services (replace CLUSTER_NAME)
aws ecs list-services --cluster CLUSTER_NAME --output table

# Get detailed info about a service
aws ecs describe-services `
  --cluster CLUSTER_NAME `
  --services SERVICE_NAME `
  --output table
```

### Step 3: Check Load Balancers
```powershell
# List all Application Load Balancers
aws elbv2 describe-load-balancers `
  --query 'LoadBalancers[*].[LoadBalancerName,LoadBalancerArn,State.Code,CreatedTime,VpcId]' `
  --output table

# Get target groups
aws elbv2 describe-target-groups `
  --query 'TargetGroups[*].[TargetGroupName,TargetGroupArn,VpcId]' `
  --output table
```

### Step 4: Check NAT Gateways (EXPENSIVE!)
```powershell
# List all NAT Gateways
aws ec2 describe-nat-gateways `
  --query 'NatGateways[*].[NatGatewayId,State,VpcId,SubnetId,CreateTime]' `
  --output table

# Check which VPC they belong to
aws ec2 describe-vpcs `
  --query 'Vpcs[*].[VpcId,IsDefault,Tags[?Key==`Name`].Value|[0]]' `
  --output table
```

### Step 5: Check S3 Buckets
```powershell
# List all S3 buckets
aws s3 ls

# Check bucket details
aws s3api list-buckets `
  --query 'Buckets[*].[Name,CreationDate]' `
  --output table
```

**IMPORTANT**: Keep `agenthub-agents-storage` - this is used by your local POC!

### Step 6: Check ECR Repositories
```powershell
# List all ECR repositories
aws ecr describe-repositories `
  --query 'repositories[*].[repositoryName,createdAt,repositoryUri]' `
  --output table
```

### Step 7: Check Elastic IPs
```powershell
# List all Elastic IPs
aws ec2 describe-addresses `
  --query 'Addresses[*].[PublicIp,AllocationId,AssociationId,InstanceId]' `
  --output table
```

### Step 8: Check EBS Volumes
```powershell
# List all EBS volumes
aws ec2 describe-volumes `
  --query 'Volumes[*].[VolumeId,State,Size,Attachments[0].InstanceId,CreateTime]' `
  --output table

# Find unattached volumes (orphaned)
aws ec2 describe-volumes `
  --filters "Name=status,Values=available" `
  --query 'Volumes[*].[VolumeId,Size,CreateTime]' `
  --output table
```

### Step 9: Check CloudWatch Log Groups
```powershell
# List all log groups
aws logs describe-log-groups `
  --query 'logGroups[*].[logGroupName,creationTime,storedBytes]' `
  --output table
```

---

## 🛑 Phase 2: STOP Services (Immediate Cost Reduction)

### Option A: Stop EC2 Instances (Recommended First Step)
```powershell
# Stop a specific instance (replace INSTANCE_ID)
aws ec2 stop-instances --instance-ids INSTANCE_ID

# Stop multiple instances at once
aws ec2 stop-instances --instance-ids i-1234567890abcdef0 i-0987654321fedcba0

# Verify they're stopped
aws ec2 describe-instances `
  --instance-ids INSTANCE_ID `
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name]' `
  --output table
```

**Cost Impact**: Stops compute charges immediately. EBS storage charges continue (~$2/month).

### Option B: Stop ECS Services
```powershell
# Update service to 0 desired tasks (replace CLUSTER and SERVICE)
aws ecs update-service `
  --cluster CLUSTER_NAME `
  --service SERVICE_NAME `
  --desired-count 0

# Verify service is stopped
aws ecs describe-services `
  --cluster CLUSTER_NAME `
  --services SERVICE_NAME `
  --query 'services[*].[serviceName,runningCount,desiredCount]' `
  --output table
```

**Cost Impact**: Stops container charges immediately.

---

## 🗑️ Phase 3: DELETE Resources (Complete Cleanup)

### ⚠️ IMPORTANT: Create a Backup Script First
```powershell
# Save current state to file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "aws_resources_backup_$timestamp.txt"

"=== EC2 Instances ===" | Out-File $backupFile
aws ec2 describe-instances --output json | Out-File -Append $backupFile

"=== ECS Clusters ===" | Out-File -Append $backupFile
aws ecs list-clusters --output json | Out-File -Append $backupFile

"=== Load Balancers ===" | Out-File -Append $backupFile
aws elbv2 describe-load-balancers --output json | Out-File -Append $backupFile

"=== NAT Gateways ===" | Out-File -Append $backupFile
aws ec2 describe-nat-gateways --output json | Out-File -Append $backupFile

Write-Host "Backup saved to: $backupFile" -ForegroundColor Green
```

### Step 1: Delete ECS Services
```powershell
# Delete a service (must scale to 0 first)
aws ecs update-service `
  --cluster CLUSTER_NAME `
  --service SERVICE_NAME `
  --desired-count 0

# Wait for tasks to stop, then delete
aws ecs delete-service `
  --cluster CLUSTER_NAME `
  --service SERVICE_NAME `
  --force
```

### Step 2: Delete Load Balancers
```powershell
# Delete target groups first
aws elbv2 delete-target-group --target-group-arn TARGET_GROUP_ARN

# Then delete load balancer
aws elbv2 delete-load-balancer --load-balancer-arn LOAD_BALANCER_ARN

# Verify deletion
aws elbv2 describe-load-balancers --output table
```

**Cost Savings**: ~$18/month

### Step 3: Delete NAT Gateways (BIGGEST SAVER!)
```powershell
# Delete NAT Gateway
aws ec2 delete-nat-gateway --nat-gateway-id NAT_GATEWAY_ID

# Wait for deletion (takes a few minutes)
aws ec2 describe-nat-gateways `
  --nat-gateway-ids NAT_GATEWAY_ID `
  --query 'NatGateways[*].[NatGatewayId,State]' `
  --output table

# After NAT Gateway is deleted, release the Elastic IP
aws ec2 release-address --allocation-id ALLOCATION_ID
```

**Cost Savings**: ~$35/month

### Step 4: Terminate EC2 Instances
```powershell
# Terminate instance (PERMANENT - cannot be undone!)
aws ec2 terminate-instances --instance-ids INSTANCE_ID

# Verify termination
aws ec2 describe-instances `
  --instance-ids INSTANCE_ID `
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name]' `
  --output table
```

**Cost Savings**: ~$30/month

### Step 5: Delete ECS Clusters
```powershell
# Delete cluster (must delete all services first)
aws ecs delete-cluster --cluster CLUSTER_NAME

# Verify deletion
aws ecs list-clusters --output table
```

### Step 6: Delete EBS Volumes
```powershell
# Delete a volume (must be unattached)
aws ec2 delete-volume --volume-id VOLUME_ID

# Delete all available (unattached) volumes
$volumes = aws ec2 describe-volumes `
  --filters "Name=status,Values=available" `
  --query 'Volumes[*].VolumeId' `
  --output text

foreach ($vol in $volumes -split '\s+') {
  if ($vol) {
    Write-Host "Deleting volume: $vol"
    aws ec2 delete-volume --volume-id $vol
  }
}
```

**Cost Savings**: ~$2/month

### Step 7: Release Elastic IPs
```powershell
# Release an Elastic IP
aws ec2 release-address --allocation-id ALLOCATION_ID

# Release all unassociated Elastic IPs
$eips = aws ec2 describe-addresses `
  --query 'Addresses[?AssociationId==null].AllocationId' `
  --output text

foreach ($eip in $eips -split '\s+') {
  if ($eip) {
    Write-Host "Releasing Elastic IP: $eip"
    aws ec2 release-address --allocation-id $eip
  }
}
```

**Cost Savings**: ~$3.60/month

### Step 8: Delete ECR Repositories
```powershell
# Delete a repository (will delete all images)
aws ecr delete-repository `
  --repository-name REPO_NAME `
  --force

# List and delete all repositories (CAREFUL!)
$repos = aws ecr describe-repositories `
  --query 'repositories[*].repositoryName' `
  --output text

foreach ($repo in $repos -split '\s+') {
  if ($repo) {
    Write-Host "Deleting ECR repository: $repo"
    aws ecr delete-repository --repository-name $repo --force
  }
}
```

**Cost Savings**: ~$2/month

### Step 9: Delete CloudWatch Log Groups
```powershell
# Delete a log group
aws logs delete-log-group --log-group-name LOG_GROUP_NAME

# Delete log groups matching pattern
$logGroups = aws logs describe-log-groups `
  --log-group-name-prefix "/aws/ecs/" `
  --query 'logGroups[*].logGroupName' `
  --output text

foreach ($lg in $logGroups -split '\s+') {
  if ($lg) {
    Write-Host "Deleting log group: $lg"
    aws logs delete-log-group --log-group-name $lg
  }
}
```

**Cost Savings**: ~$5/month

### Step 10: Delete Custom VPC (Optional)
```powershell
# First, delete all dependencies:
# - Subnets
# - Route tables
# - Internet gateways
# - Security groups
# - Network ACLs

# Then delete VPC
aws ec2 delete-vpc --vpc-id VPC_ID
```

**Note**: Only delete custom VPCs, NOT the default VPC!

---

## 🔒 Phase 4: PROTECT Required Resources

### Tag Resources to Keep
```powershell
# Tag the S3 bucket you want to keep
aws s3api put-bucket-tagging `
  --bucket agenthub-agents-storage `
  --tagging 'TagSet=[{Key=Environment,Value=Production},{Key=DoNotDelete,Value=true}]'

# Verify tags
aws s3api get-bucket-tagging --bucket agenthub-agents-storage
```

### Create Deletion Protection
```powershell
# Enable termination protection on important resources
aws ec2 modify-instance-attribute `
  --instance-id INSTANCE_ID `
  --disable-api-termination

# Enable deletion protection on S3 bucket
aws s3api put-bucket-versioning `
  --bucket agenthub-agents-storage `
  --versioning-configuration Status=Enabled
```

---

## 📊 Phase 5: VERIFY Cleanup

### Check Remaining Resources
```powershell
# Create verification script
$verifyScript = @"
Write-Host "=== Verification Report ===" -ForegroundColor Cyan

Write-Host "`nEC2 Instances:" -ForegroundColor Yellow
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name]' --output table

Write-Host "`nECS Clusters:" -ForegroundColor Yellow
aws ecs list-clusters --output table

Write-Host "`nLoad Balancers:" -ForegroundColor Yellow
aws elbv2 describe-load-balancers --query 'LoadBalancers[*].LoadBalancerName' --output table

Write-Host "`nNAT Gateways:" -ForegroundColor Yellow
aws ec2 describe-nat-gateways --query 'NatGateways[?State!=`deleted`].[NatGatewayId,State]' --output table

Write-Host "`nElastic IPs:" -ForegroundColor Yellow
aws ec2 describe-addresses --query 'Addresses[*].[PublicIp,AllocationId]' --output table

Write-Host "`nEBS Volumes:" -ForegroundColor Yellow
aws ec2 describe-volumes --query 'Volumes[*].[VolumeId,State,Size]' --output table

Write-Host "`nS3 Buckets:" -ForegroundColor Yellow
aws s3 ls

Write-Host "`nECR Repositories:" -ForegroundColor Yellow
aws ecr describe-repositories --query 'repositories[*].repositoryName' --output table

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
"@

$verifyScript | Out-File "verify_cleanup.ps1"
Write-Host "Verification script created: verify_cleanup.ps1" -ForegroundColor Green
```

### Monitor Costs
```powershell
# Check current month costs
aws ce get-cost-and-usage `
  --time-period Start=2024-11-01,End=2024-11-30 `
  --granularity MONTHLY `
  --metrics BlendedCost `
  --group-by Type=SERVICE `
  --output table

# Check daily costs for last 7 days
$endDate = Get-Date -Format "yyyy-MM-dd"
$startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")

aws ce get-cost-and-usage `
  --time-period Start=$startDate,End=$endDate `
  --granularity DAILY `
  --metrics BlendedCost `
  --output table
```

---

## 🎯 Complete Cleanup Script

### All-in-One Cleanup (USE WITH CAUTION!)
```powershell
# Save this as cleanup_aws_resources.ps1

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "cleanup_log_$timestamp.txt"

function Log {
    param($message, $color = "White")
    $logMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $message"
    Write-Host $logMessage -ForegroundColor $color
    $logMessage | Out-File -Append $logFile
}

if (-not $Force) {
    Write-Host "⚠️  WARNING: This will delete AWS resources!" -ForegroundColor Red
    Write-Host "Resources to be deleted:" -ForegroundColor Yellow
    Write-Host "  - ECS Services and Clusters" -ForegroundColor Yellow
    Write-Host "  - Load Balancers" -ForegroundColor Yellow
    Write-Host "  - NAT Gateways" -ForegroundColor Yellow
    Write-Host "  - EC2 Instances" -ForegroundColor Yellow
    Write-Host "  - EBS Volumes" -ForegroundColor Yellow
    Write-Host "  - Elastic IPs" -ForegroundColor Yellow
    Write-Host "  - ECR Repositories" -ForegroundColor Yellow
    Write-Host "`nResources to KEEP:" -ForegroundColor Green
    Write-Host "  - S3 bucket: agenthub-agents-storage" -ForegroundColor Green
    Write-Host "  - IAM roles and policies" -ForegroundColor Green
    
    $confirm = Read-Host "`nType 'DELETE' to confirm"
    if ($confirm -ne "DELETE") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit
    }
}

Log "Starting AWS cleanup..." "Cyan"

# 1. Stop ECS Services
Log "Stopping ECS services..." "Yellow"
$clusters = aws ecs list-clusters --query 'clusterArns[*]' --output text
foreach ($cluster in $clusters -split '\s+') {
    if ($cluster) {
        $clusterName = $cluster.Split('/')[-1]
        Log "  Checking cluster: $clusterName"
        
        $services = aws ecs list-services --cluster $clusterName --query 'serviceArns[*]' --output text
        foreach ($service in $services -split '\s+') {
            if ($service) {
                $serviceName = $service.Split('/')[-1]
                Log "    Scaling down service: $serviceName"
                
                if (-not $DryRun) {
                    aws ecs update-service --cluster $clusterName --service $serviceName --desired-count 0
                    Start-Sleep -Seconds 5
                    aws ecs delete-service --cluster $clusterName --service $serviceName --force
                }
            }
        }
    }
}

# 2. Delete Load Balancers
Log "Deleting load balancers..." "Yellow"
$lbs = aws elbv2 describe-load-balancers --query 'LoadBalancers[*].LoadBalancerArn' --output text
foreach ($lb in $lbs -split '\s+') {
    if ($lb) {
        Log "  Deleting LB: $lb"
        if (-not $DryRun) {
            aws elbv2 delete-load-balancer --load-balancer-arn $lb
        }
    }
}

# 3. Delete NAT Gateways
Log "Deleting NAT gateways..." "Yellow"
$natGateways = aws ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].NatGatewayId' --output text
foreach ($nat in $natGateways -split '\s+') {
    if ($nat) {
        Log "  Deleting NAT Gateway: $nat"
        if (-not $DryRun) {
            aws ec2 delete-nat-gateway --nat-gateway-id $nat
        }
    }
}

# 4. Terminate EC2 Instances
Log "Terminating EC2 instances..." "Yellow"
$instances = aws ec2 describe-instances --filters "Name=instance-state-name,Values=running,stopped" --query 'Reservations[*].Instances[*].InstanceId' --output text
foreach ($instance in $instances -split '\s+') {
    if ($instance) {
        Log "  Terminating instance: $instance"
        if (-not $DryRun) {
            aws ec2 terminate-instances --instance-ids $instance
        }
    }
}

# 5. Delete ECS Clusters
Log "Deleting ECS clusters..." "Yellow"
foreach ($cluster in $clusters -split '\s+') {
    if ($cluster) {
        $clusterName = $cluster.Split('/')[-1]
        Log "  Deleting cluster: $clusterName"
        if (-not $DryRun) {
            aws ecs delete-cluster --cluster $clusterName
        }
    }
}

# 6. Delete EBS Volumes
Log "Deleting unattached EBS volumes..." "Yellow"
$volumes = aws ec2 describe-volumes --filters "Name=status,Values=available" --query 'Volumes[*].VolumeId' --output text
foreach ($vol in $volumes -split '\s+') {
    if ($vol) {
        Log "  Deleting volume: $vol"
        if (-not $DryRun) {
            aws ec2 delete-volume --volume-id $vol
        }
    }
}

# 7. Release Elastic IPs
Log "Releasing Elastic IPs..." "Yellow"
$eips = aws ec2 describe-addresses --query 'Addresses[?AssociationId==null].AllocationId' --output text
foreach ($eip in $eips -split '\s+') {
    if ($eip) {
        Log "  Releasing EIP: $eip"
        if (-not $DryRun) {
            aws ec2 release-address --allocation-id $eip
        }
    }
}

# 8. Delete ECR Repositories
Log "Deleting ECR repositories..." "Yellow"
$repos = aws ecr describe-repositories --query 'repositories[*].repositoryName' --output text
foreach ($repo in $repos -split '\s+') {
    if ($repo) {
        Log "  Deleting repository: $repo"
        if (-not $DryRun) {
            aws ecr delete-repository --repository-name $repo --force
        }
    }
}

Log "Cleanup complete!" "Green"
Log "Log file: $logFile" "Cyan"

if ($DryRun) {
    Write-Host "`n⚠️  DRY RUN MODE - No resources were actually deleted" -ForegroundColor Yellow
    Write-Host "Run without -DryRun flag to perform actual deletion" -ForegroundColor Yellow
}
```

### Usage:
```powershell
# Dry run (see what would be deleted)
.\cleanup_aws_resources.ps1 -DryRun

# Actual cleanup (will prompt for confirmation)
.\cleanup_aws_resources.ps1

# Force cleanup (no confirmation)
.\cleanup_aws_resources.ps1 -Force
```

---

## 📝 Summary

### Safe Approach (Recommended):
1. **Day 1**: Run identification commands, review resources
2. **Day 2**: Stop EC2 instances and ECS services (immediate cost reduction)
3. **Day 3**: Verify local POC still works
4. **Day 4**: Delete Load Balancers and NAT Gateways (big savings)
5. **Day 5**: Terminate EC2 instances
6. **Day 6**: Delete remaining resources
7. **Day 7**: Verify cleanup and monitor costs

### Aggressive Approach:
1. Run the complete cleanup script with `-DryRun` first
2. Review the log
3. Run the actual cleanup script
4. Monitor costs for 24-48 hours

### Expected Cost Reduction:
- **Before**: ~$105/month
- **After**: ~$5-10/month
- **Savings**: ~$95-100/month (~$1,140-1,200/year)

---

## ⚠️ Final Warnings

### DO NOT DELETE:
- ✅ S3 bucket: `agenthub-agents-storage`
- ✅ IAM roles for Bedrock/S3
- ✅ Your AWS credentials
- ✅ Default VPC

### SAFE TO DELETE:
- ❌ All EC2 instances
- ❌ All ECS resources
- ❌ All Load Balancers
- ❌ All NAT Gateways
- ❌ Custom VPCs
- ❌ ECR repositories
- ❌ Unattached EBS volumes
- ❌ Unassociated Elastic IPs

Your local POC will continue to work perfectly after cleanup! 🎉
