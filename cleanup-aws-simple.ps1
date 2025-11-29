# AWS Infrastructure Cleanup Script
# Removes unused AWS infrastructure from MCP deployment
# SAFE: Only deletes resources NOT used by your local POC
# KEEPS: S3 bucket, Bedrock access, IAM roles

param(
    [switch]$DryRun = $false,
    [switch]$SkipConfirmation = $false
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "cleanup_log_$timestamp.txt"

function Write-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green; $msg | Out-File -Append $logFile }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan; $msg | Out-File -Append $logFile }
function Write-Warning { param($msg) Write-Host "[WARNING] $msg" -ForegroundColor Yellow; $msg | Out-File -Append $logFile }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red; $msg | Out-File -Append $logFile }
function Write-Step { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Magenta; $msg | Out-File -Append $logFile }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWS Infrastructure Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check AWS CLI
Write-Info "Checking AWS CLI configuration..."
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Success "Connected to AWS Account: $($identity.Account)"
    Write-Info "User: $($identity.Arn)"
} catch {
    Write-Error "AWS CLI not configured"
    exit 1
}

# Show what will be deleted
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  RESOURCES TO BE DELETED" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Write-Host "`nWill DELETE:" -ForegroundColor Yellow
Write-Host "  1. ECS Service: mcp-office365-service"
Write-Host "  2. ECS Cluster: agent-hub-mcp-cluster-dev"
Write-Host "  3. Application Load Balancer: agent-hub-mcp-alb-dev"
Write-Host "  4. Target Groups (associated with ALB)"
Write-Host "  5. NAT Gateway: nat-0f17e48e90e2b03f6"
Write-Host "  6. Elastic IP: 3.235.217.253"
Write-Host "  7. ECR Repositories (3 repos)"

Write-Host "`nWill KEEP:" -ForegroundColor Green
Write-Host "  - S3 Bucket: agenthub-agents-storage"
Write-Host "  - Bedrock access and models"
Write-Host "  - IAM roles and policies"

Write-Host "`nExpected Savings: `$60-100/month" -ForegroundColor Green

if ($DryRun) {
    Write-Warning "DRY RUN MODE - No resources will be deleted"
}

# Confirmation
if (-not $SkipConfirmation -and -not $DryRun) {
    Write-Host "`nWARNING: This action cannot be undone!" -ForegroundColor Red
    Write-Host "Type 'DELETE' to confirm: " -ForegroundColor Yellow -NoNewline
    $confirmation = Read-Host
    
    if ($confirmation -ne "DELETE") {
        Write-Warning "Cleanup cancelled"
        exit 0
    }
}

Write-Info "Starting cleanup..."
$deletedResources = @()
$failedResources = @()

# ============================================================================
# STEP 1: ECS Service
# ============================================================================
Write-Step "Step 1: Stopping ECS Service"

try {
    $service = aws ecs describe-services `
        --cluster agent-hub-mcp-cluster-dev `
        --services mcp-office365-service `
        --query 'services[0]' 2>&1 | ConvertFrom-Json
    
    if ($service) {
        Write-Info "Service found: $($service.serviceName)"
        
        if (-not $DryRun) {
            Write-Info "Scaling to 0 tasks..."
            aws ecs update-service `
                --cluster agent-hub-mcp-cluster-dev `
                --service mcp-office365-service `
                --desired-count 0 | Out-Null
            
            Start-Sleep -Seconds 3
            
            Write-Info "Deleting service..."
            aws ecs delete-service `
                --cluster agent-hub-mcp-cluster-dev `
                --service mcp-office365-service `
                --force | Out-Null
            
            Write-Success "ECS service deleted"
            $deletedResources += "ECS Service: mcp-office365-service"
        } else {
            Write-Info "[DRY RUN] Would delete ECS service"
        }
    }
} catch {
    Write-Warning "Could not delete ECS service: $_"
    $failedResources += "ECS Service"
}

# ============================================================================
# STEP 2: Load Balancer
# ============================================================================
Write-Step "Step 2: Deleting Load Balancer"

try {
    $lbArn = aws elbv2 describe-load-balancers `
        --query 'LoadBalancers[?LoadBalancerName==`agent-hub-mcp-alb-dev`].LoadBalancerArn' `
        --output text 2>&1
    
    if ($lbArn -and $lbArn -ne "") {
        Write-Info "Load balancer found"
        
        $targetGroups = aws elbv2 describe-target-groups `
            --load-balancer-arn $lbArn `
            --query 'TargetGroups[*].TargetGroupArn' `
            --output text 2>&1
        
        if (-not $DryRun) {
            Write-Info "Deleting load balancer..."
            aws elbv2 delete-load-balancer --load-balancer-arn $lbArn 2>&1 | Out-Null
            Write-Success "Load balancer deleted (saves ~`$18/month)"
            $deletedResources += "Load Balancer: agent-hub-mcp-alb-dev"
            
            Start-Sleep -Seconds 5
            
            if ($targetGroups -and $targetGroups -ne "") {
                foreach ($tgArn in $targetGroups -split '\s+') {
                    if ($tgArn) {
                        Write-Info "Deleting target group..."
                        aws elbv2 delete-target-group --target-group-arn $tgArn 2>&1 | Out-Null
                    }
                }
                Write-Success "Target groups deleted"
            }
        } else {
            Write-Info "[DRY RUN] Would delete load balancer"
        }
    }
} catch {
    Write-Warning "Could not delete load balancer: $_"
    $failedResources += "Load Balancer"
}

# ============================================================================
# STEP 3: NAT Gateway (BIGGEST COST!)
# ============================================================================
Write-Step "Step 3: Deleting NAT Gateway"

try {
    $natGateway = aws ec2 describe-nat-gateways `
        --nat-gateway-ids nat-0f17e48e90e2b03f6 `
        --query 'NatGateways[0]' 2>&1 | ConvertFrom-Json
    
    if ($natGateway -and $natGateway.State -eq "available") {
        Write-Info "NAT Gateway found: $($natGateway.NatGatewayId)"
        
        if (-not $DryRun) {
            Write-Info "Deleting NAT Gateway (takes 3-5 minutes)..."
            aws ec2 delete-nat-gateway --nat-gateway-id nat-0f17e48e90e2b03f6 | Out-Null
            Write-Success "NAT Gateway deletion initiated"
            Write-Info "Waiting for deletion..."
            
            $maxWait = 300
            $waited = 0
            $deleted = $false
            
            while ($waited -lt $maxWait) {
                Start-Sleep -Seconds 10
                $waited += 10
                
                $state = aws ec2 describe-nat-gateways `
                    --nat-gateway-ids nat-0f17e48e90e2b03f6 `
                    --query 'NatGateways[0].State' `
                    --output text 2>&1
                
                Write-Info "Status: $state (waited $waited seconds)"
                
                if ($state -eq "deleted") {
                    $deleted = $true
                    break
                }
            }
            
            if ($deleted) {
                Write-Success "NAT Gateway deleted (saves ~`$35/month)"
                $deletedResources += "NAT Gateway (saves ~`$35/month)"
            } else {
                Write-Warning "NAT Gateway deletion in progress"
                $deletedResources += "NAT Gateway (deletion in progress)"
            }
        } else {
            Write-Info "[DRY RUN] Would delete NAT Gateway"
        }
    }
} catch {
    Write-Warning "Could not delete NAT Gateway: $_"
    $failedResources += "NAT Gateway"
}

# ============================================================================
# STEP 4: Elastic IP
# ============================================================================
Write-Step "Step 4: Releasing Elastic IP"

try {
    $eip = aws ec2 describe-addresses `
        --allocation-ids eipalloc-0985ac39d9da25baf `
        --query 'Addresses[0]' 2>&1 | ConvertFrom-Json
    
    if ($eip) {
        Write-Info "Elastic IP found: $($eip.PublicIp)"
        
        if (-not $DryRun) {
            if ($eip.AssociationId) {
                Write-Info "Waiting for disassociation..."
                Start-Sleep -Seconds 30
            }
            
            Write-Info "Releasing Elastic IP..."
            aws ec2 release-address --allocation-id eipalloc-0985ac39d9da25baf 2>&1 | Out-Null
            Write-Success "Elastic IP released"
            $deletedResources += "Elastic IP: 3.235.217.253"
        } else {
            Write-Info "[DRY RUN] Would release Elastic IP"
        }
    }
} catch {
    Write-Warning "Could not release Elastic IP: $_"
    $failedResources += "Elastic IP"
}

# ============================================================================
# STEP 5: ECS Cluster
# ============================================================================
Write-Step "Step 5: Deleting ECS Cluster"

try {
    $cluster = aws ecs describe-clusters `
        --clusters agent-hub-mcp-cluster-dev `
        --query 'clusters[0]' 2>&1 | ConvertFrom-Json
    
    if ($cluster -and $cluster.status -eq "ACTIVE") {
        Write-Info "Cluster found: $($cluster.clusterName)"
        
        if (-not $DryRun) {
            Write-Info "Deleting cluster..."
            aws ecs delete-cluster --cluster agent-hub-mcp-cluster-dev | Out-Null
            Write-Success "ECS cluster deleted"
            $deletedResources += "ECS Cluster: agent-hub-mcp-cluster-dev"
        } else {
            Write-Info "[DRY RUN] Would delete cluster"
        }
    }
} catch {
    Write-Warning "Could not delete cluster: $_"
    $failedResources += "ECS Cluster"
}

# ============================================================================
# STEP 6: ECR Repositories
# ============================================================================
Write-Step "Step 6: Deleting ECR Repositories"

$repositories = @(
    "agent-hub-mcp-github-dev",
    "agent-hub-mcp-teams-dev",
    "agent-hub-mcp-office365-dev"
)

foreach ($repo in $repositories) {
    try {
        $repoInfo = aws ecr describe-repositories `
            --repository-names $repo `
            --query 'repositories[0]' 2>&1 | ConvertFrom-Json
        
        if ($repoInfo) {
            Write-Info "Repository found: $repo"
            
            if (-not $DryRun) {
                Write-Info "Deleting repository..."
                aws ecr delete-repository --repository-name $repo --force 2>&1 | Out-Null
                Write-Success "Repository deleted: $repo"
                $deletedResources += "ECR Repository: $repo"
            } else {
                Write-Info "[DRY RUN] Would delete repository"
            }
        }
    } catch {
        Write-Warning "Could not delete $repo : $_"
        $failedResources += "ECR Repository: $repo"
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

if ($deletedResources.Count -gt 0) {
    Write-Host "Successfully Deleted ($($deletedResources.Count) resources):" -ForegroundColor Green
    foreach ($resource in $deletedResources) {
        Write-Host "  - $resource"
    }
}

if ($failedResources.Count -gt 0) {
    Write-Host "`nFailed to Delete ($($failedResources.Count) resources):" -ForegroundColor Yellow
    foreach ($resource in $failedResources) {
        Write-Host "  - $resource"
    }
}

Write-Host "`nResources Kept:" -ForegroundColor Green
Write-Host "  - S3 Bucket: agenthub-agents-storage"
Write-Host "  - Bedrock models and access"
Write-Host "  - IAM roles and policies"

Write-Host "`nExpected Monthly Savings: `$60-100" -ForegroundColor Green
Write-Host "Expected Annual Savings: `$720-1,200" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 24 hours for billing to update"
Write-Host "  2. Check AWS Cost Explorer"
Write-Host "  3. Verify local POC still works"
Write-Host "  4. Review log: $logFile"

if ($DryRun) {
    Write-Host "`nDRY RUN COMPLETE - No resources deleted" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to perform actual cleanup" -ForegroundColor Yellow
}
