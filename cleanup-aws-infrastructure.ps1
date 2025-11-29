# AWS Infrastructure Cleanup Script
# This script safely removes unused AWS infrastructure from the MCP deployment attempt
# 
# SAFE TO RUN: Only deletes resources NOT used by your local POC
# KEEPS: S3 bucket (agenthub-agents-storage), Bedrock access, IAM roles
#
# Estimated savings: $60-100/month

param(
    [switch]$DryRun = $false,
    [switch]$SkipConfirmation = $false
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "cleanup_log_$timestamp.txt"

# Color functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green; $msg | Out-File -Append $logFile }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan; $msg | Out-File -Append $logFile }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow; $msg | Out-File -Append $logFile }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red; $msg | Out-File -Append $logFile }
function Write-Step { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Magenta; $msg | Out-File -Append $logFile }

# Banner
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     AWS Infrastructure Cleanup Script                     ║" -ForegroundColor Cyan
Write-Host "║     Removes unused MCP deployment resources                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check AWS CLI
Write-Info "Checking AWS CLI configuration..."
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Success "Connected to AWS Account: $($identity.Account)"
    Write-Info "User: $($identity.Arn)"
} catch {
    Write-Error "AWS CLI not configured or not authenticated"
    Write-Host "Please run: aws configure" -ForegroundColor Yellow
    exit 1
}

# Show what will be deleted
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║                  RESOURCES TO BE DELETED                   ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

Write-Host "`n📋 The following resources will be DELETED:" -ForegroundColor Yellow
Write-Host "   1. ECS Service: mcp-office365-service" -ForegroundColor White
Write-Host "   2. ECS Cluster: agent-hub-mcp-cluster-dev" -ForegroundColor White
Write-Host "   3. Application Load Balancer: agent-hub-mcp-alb-dev" -ForegroundColor White
Write-Host "   4. Target Groups (associated with ALB)" -ForegroundColor White
Write-Host "   5. NAT Gateway: nat-0f17e48e90e2b03f6" -ForegroundColor White
Write-Host "   6. Elastic IP: 3.235.217.253" -ForegroundColor White
Write-Host "   7. ECR Repositories:" -ForegroundColor White
Write-Host "      - agent-hub-mcp-github-dev" -ForegroundColor White
Write-Host "      - agent-hub-mcp-teams-dev" -ForegroundColor White
Write-Host "      - agent-hub-mcp-office365-dev" -ForegroundColor White

Write-Host "`n✅ The following resources will be KEPT:" -ForegroundColor Green
Write-Host "   • S3 Bucket: agenthub-agents-storage" -ForegroundColor White
Write-Host "   • Bedrock access and models" -ForegroundColor White
Write-Host "   • IAM roles and policies" -ForegroundColor White
Write-Host "   • Default VPC" -ForegroundColor White

Write-Host "`n💰 Expected Savings: $60-100/month (~$720-1,200/year)" -ForegroundColor Green

if ($DryRun) {
    Write-Warning "DRY RUN MODE - No resources will be deleted"
}

# Confirmation
if (-not $SkipConfirmation -and -not $DryRun) {
    Write-Host "`n⚠️  WARNING: This action cannot be undone!" -ForegroundColor Red
    Write-Host "Type 'DELETE' to confirm, or anything else to cancel: " -ForegroundColor Yellow -NoNewline
    $confirmation = Read-Host
    
    if ($confirmation -ne "DELETE") {
        Write-Warning "Cleanup cancelled by user"
        exit 0
    }
}

Write-Info "Starting cleanup process..."
Write-Info "Log file: $logFile"

# Track what was deleted
$deletedResources = @()
$failedResources = @()

# ============================================================================
# STEP 1: Stop and Delete ECS Service
# ============================================================================
Write-Step "Step 1: Stopping ECS Service"

try {
    Write-Info "Checking ECS service status..."
    $service = aws ecs describe-services `
        --cluster agent-hub-mcp-cluster-dev `
        --services mcp-office365-service `
        --query 'services[0]' 2>&1 | ConvertFrom-Json
    
    if ($service) {
        Write-Info "Service found: $($service.serviceName)"
        Write-Info "  Running tasks: $($service.runningCount)"
        Write-Info "  Desired tasks: $($service.desiredCount)"
        
        if (-not $DryRun) {
            # Scale to 0
            Write-Info "Scaling service to 0 tasks..."
            aws ecs update-service `
                --cluster agent-hub-mcp-cluster-dev `
                --service mcp-office365-service `
                --desired-count 0 | Out-Null
            
            Start-Sleep -Seconds 3
            
            # Delete service
            Write-Info "Deleting ECS service..."
            aws ecs delete-service `
                --cluster agent-hub-mcp-cluster-dev `
                --service mcp-office365-service `
                --force | Out-Null
            
            Write-Success "ECS service deleted"
            $deletedResources += "ECS Service: mcp-office365-service"
        } else {
            Write-Info "[DRY RUN] Would delete ECS service"
        }
    } else {
        Write-Info "ECS service not found or already deleted"
    }
} catch {
    Write-Warning "Could not delete ECS service: $_"
    $failedResources += "ECS Service: mcp-office365-service"
}

# ============================================================================
# STEP 2: Delete Load Balancer and Target Groups
# ============================================================================
Write-Step "Step 2: Deleting Application Load Balancer"

try {
    Write-Info "Finding load balancer..."
    $lbArn = aws elbv2 describe-load-balancers `
        --query 'LoadBalancers[?LoadBalancerName==`agent-hub-mcp-alb-dev`].LoadBalancerArn' `
        --output text 2>&1
    
    if ($lbArn -and $lbArn -ne "") {
        Write-Info "Load balancer found: $lbArn"
        
        # Get target groups
        Write-Info "Finding associated target groups..."
        $targetGroups = aws elbv2 describe-target-groups `
            --load-balancer-arn $lbArn `
            --query 'TargetGroups[*].TargetGroupArn' `
            --output text 2>&1
        
        if (-not $DryRun) {
            # Delete load balancer
            Write-Info "Deleting load balancer..."
            aws elbv2 delete-load-balancer --load-balancer-arn $lbArn 2>&1 | Out-Null
            Write-Success "Load balancer deleted"
            $deletedResources += "Application Load Balancer: agent-hub-mcp-alb-dev"
            
            # Wait a bit for LB to start deleting
            Start-Sleep -Seconds 5
            
            # Delete target groups
            if ($targetGroups -and $targetGroups -ne "") {
                foreach ($tgArn in $targetGroups -split '\s+') {
                    if ($tgArn) {
                        Write-Info "Deleting target group: $tgArn"
                        aws elbv2 delete-target-group --target-group-arn $tgArn 2>&1 | Out-Null
                        $deletedResources += "Target Group: $tgArn"
                    }
                }
                Write-Success "Target groups deleted"
            }
        } else {
            Write-Info "[DRY RUN] Would delete load balancer and target groups"
        }
    } else {
        Write-Info "Load balancer not found or already deleted"
    }
} catch {
    Write-Warning "Could not delete load balancer: $_"
    $failedResources += "Application Load Balancer"
}

# ============================================================================
# STEP 3: Delete NAT Gateway (BIGGEST COST SAVER!)
# ============================================================================
Write-Step "Step 3: Deleting NAT Gateway"

try {
    Write-Info "Checking NAT Gateway..."
    $natGateway = aws ec2 describe-nat-gateways `
        --nat-gateway-ids nat-0f17e48e90e2b03f6 `
        --query 'NatGateways[0]' 2>&1 | ConvertFrom-Json
    
    if ($natGateway -and $natGateway.State -eq "available") {
        Write-Info "NAT Gateway found: $($natGateway.NatGatewayId)"
        Write-Info "  State: $($natGateway.State)"
        Write-Info "  VPC: $($natGateway.VpcId)"
        
        if (-not $DryRun) {
            Write-Info "Deleting NAT Gateway (this takes 3-5 minutes)..."
            aws ec2 delete-nat-gateway --nat-gateway-id nat-0f17e48e90e2b03f6 | Out-Null
            Write-Success "NAT Gateway deletion initiated"
            Write-Info "Waiting for NAT Gateway to delete..."
            
            # Wait for deletion
            $maxWait = 300 # 5 minutes
            $waited = 0
            $deleted = $false
            
            while ($waited -lt $maxWait) {
                Start-Sleep -Seconds 10
                $waited += 10
                
                $state = aws ec2 describe-nat-gateways `
                    --nat-gateway-ids nat-0f17e48e90e2b03f6 `
                    --query 'NatGateways[0].State' `
                    --output text 2>&1
                
                Write-Info "  Status: $state (waited $waited seconds)"
                
                if ($state -eq "deleted") {
                    $deleted = $true
                    break
                }
            }
            
            if ($deleted) {
                Write-Success "NAT Gateway deleted successfully"
                $deletedResources += "NAT Gateway: nat-0f17e48e90e2b03f6 (saves ~$35/month)"
            } else {
                Write-Warning "NAT Gateway deletion in progress (check AWS console)"
                $deletedResources += "NAT Gateway: nat-0f17e48e90e2b03f6 (deletion in progress)"
            }
        } else {
            Write-Info "[DRY RUN] Would delete NAT Gateway"
        }
    } else {
        Write-Info "NAT Gateway not found or already deleted"
    }
} catch {
    Write-Warning "Could not delete NAT Gateway: $_"
    $failedResources += "NAT Gateway"
}

# ============================================================================
# STEP 4: Release Elastic IP
# ============================================================================
Write-Step "Step 4: Releasing Elastic IP"

try {
    Write-Info "Checking Elastic IP..."
    $eip = aws ec2 describe-addresses `
        --allocation-ids eipalloc-0985ac39d9da25baf `
        --query 'Addresses[0]' 2>&1 | ConvertFrom-Json
    
    if ($eip) {
        Write-Info "Elastic IP found: $($eip.PublicIp)"
        Write-Info "  Allocation ID: $($eip.AllocationId)"
        Write-Info "  Association: $($eip.AssociationId)"
        
        if (-not $DryRun) {
            # Check if still associated
            if ($eip.AssociationId) {
                Write-Info "Waiting for NAT Gateway disassociation..."
                Start-Sleep -Seconds 30
            }
            
            Write-Info "Releasing Elastic IP..."
            aws ec2 release-address --allocation-id eipalloc-0985ac39d9da25baf 2>&1 | Out-Null
            Write-Success "Elastic IP released"
            $deletedResources += "Elastic IP: 3.235.217.253"
        } else {
            Write-Info "[DRY RUN] Would release Elastic IP"
        }
    } else {
        Write-Info "Elastic IP not found or already released"
    }
} catch {
    Write-Warning "Could not release Elastic IP (may still be associated): $_"
    Write-Info "You can manually release it later from AWS Console"
    $failedResources += "Elastic IP (may need manual release)"
}

# ============================================================================
# STEP 5: Delete ECS Cluster
# ============================================================================
Write-Step "Step 5: Deleting ECS Cluster"

try {
    Write-Info "Checking ECS cluster..."
    $cluster = aws ecs describe-clusters `
        --clusters agent-hub-mcp-cluster-dev `
        --query 'clusters[0]' 2>&1 | ConvertFrom-Json
    
    if ($cluster -and $cluster.status -eq "ACTIVE") {
        Write-Info "Cluster found: $($cluster.clusterName)"
        Write-Info "  Active services: $($cluster.activeServicesCount)"
        Write-Info "  Running tasks: $($cluster.runningTasksCount)"
        
        if (-not $DryRun) {
            Write-Info "Deleting ECS cluster..."
            aws ecs delete-cluster --cluster agent-hub-mcp-cluster-dev | Out-Null
            Write-Success "ECS cluster deleted"
            $deletedResources += "ECS Cluster: agent-hub-mcp-cluster-dev"
        } else {
            Write-Info "[DRY RUN] Would delete ECS cluster"
        }
    } else {
        Write-Info "ECS cluster not found or already deleted"
    }
} catch {
    Write-Warning "Could not delete ECS cluster: $_"
    $failedResources += "ECS Cluster"
}

# ============================================================================
# STEP 6: Delete ECR Repositories
# ============================================================================
Write-Step "Step 6: Deleting ECR Repositories"

$repositories = @(
    "agent-hub-mcp-github-dev",
    "agent-hub-mcp-teams-dev",
    "agent-hub-mcp-office365-dev"
)

foreach ($repo in $repositories) {
    try {
        Write-Info "Checking repository: $repo"
        $repoInfo = aws ecr describe-repositories `
            --repository-names $repo `
            --query 'repositories[0]' 2>&1 | ConvertFrom-Json
        
        if ($repoInfo) {
            Write-Info "  Repository found: $($repoInfo.repositoryName)"
            
            if (-not $DryRun) {
                Write-Info "  Deleting repository and all images..."
                aws ecr delete-repository --repository-name $repo --force 2>&1 | Out-Null
                Write-Success "  Repository deleted: $repo"
                $deletedResources += "ECR Repository: $repo"
            } else {
                Write-Info "  [DRY RUN] Would delete repository"
            }
        } else {
            Write-Info "  Repository not found or already deleted"
        }
    } catch {
        Write-Warning "Could not delete repository $repo : $_"
        $failedResources += "ECR Repository: $repo"
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    CLEANUP COMPLETE                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($deletedResources.Count -gt 0) {
    Write-Host "`n✅ Successfully Deleted ($($deletedResources.Count) resources):" -ForegroundColor Green
    foreach ($resource in $deletedResources) {
        Write-Host "   • $resource" -ForegroundColor White
    }
}

if ($failedResources.Count -gt 0) {
    Write-Host "`n⚠️  Failed to Delete ($($failedResources.Count) resources):" -ForegroundColor Yellow
    foreach ($resource in $failedResources) {
        Write-Host "   • $resource" -ForegroundColor White
    }
    Write-Host "`n   You can manually delete these from AWS Console" -ForegroundColor Yellow
}

Write-Host "`n✅ Resources Kept (Used by Local POC):" -ForegroundColor Green
Write-Host "   • S3 Bucket: agenthub-agents-storage" -ForegroundColor White
Write-Host "   • Bedrock models and access" -ForegroundColor White
Write-Host "   • IAM roles and policies" -ForegroundColor White

Write-Host "`nExpected Monthly Savings: `$60-100" -ForegroundColor Green
Write-Host "Expected Annual Savings: `$720-1,200" -ForegroundColor Green

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Wait 24 hours for AWS billing to update" -ForegroundColor White
Write-Host "   2. Check AWS Cost Explorer to verify reduced costs" -ForegroundColor White
Write-Host "   3. Verify your local POC still works (it should!)" -ForegroundColor White
Write-Host "   4. Review log file: $logFile" -ForegroundColor White

if ($failedResources.Count -gt 0) {
    Write-Host "`n⚠️  Some resources failed to delete. Check AWS Console:" -ForegroundColor Yellow
    Write-Host "   https://console.aws.amazon.com/" -ForegroundColor Cyan
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Log saved to: $logFile" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 DRY RUN COMPLETE - No resources were actually deleted" -ForegroundColor Yellow
    Write-Host "Run without -DryRun flag to perform actual cleanup:`n" -ForegroundColor Yellow
    Write-Host "   .\cleanup-aws-infrastructure.ps1`n" -ForegroundColor White
}
