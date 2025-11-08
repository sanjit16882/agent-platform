#!/usr/bin/env pwsh

# Cleanup MCP Resources to Save Credits
# This script helps you clean up AWS resources when not in use

param(
    [string]$Environment = "dev",
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

Write-Host "🧹 MCP Resource Cleanup" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

if (!$Force) {
    Write-Host ""
    Write-Host "⚠️  WARNING: This will delete AWS resources and may cause data loss!" -ForegroundColor Red
    Write-Host "Make sure you have backups of any important data." -ForegroundColor Red
    Write-Host ""
    
    $confirm = Read-Host "Are you sure you want to proceed? (type 'DELETE' to confirm)"
    if ($confirm -ne "DELETE") {
        Write-Host "Cleanup cancelled by user." -ForegroundColor Yellow
        exit 0
    }
}

$stackName = "MCPInfrastructureStack-$Environment"

try {
    if ($DryRun) {
        Write-Host "🔍 DRY RUN - No resources will be deleted" -ForegroundColor Blue
        Write-Host ""
    }

    # Check if stack exists
    Write-Host "📋 Checking for MCP infrastructure stack..." -ForegroundColor Blue
    $stackExists = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].StackName' --output text 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Found stack: $stackName" -ForegroundColor Green
        
        if (!$DryRun) {
            Write-Host "🗑️  Deleting MCP infrastructure stack..." -ForegroundColor Blue
            aws cloudformation delete-stack --stack-name $stackName
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Stack deletion initiated" -ForegroundColor Green
                Write-Host "⏳ This may take 10-15 minutes to complete" -ForegroundColor Yellow
                
                # Wait for deletion (optional)
                $waitForDeletion = Read-Host "Wait for deletion to complete? (y/N)"
                if ($waitForDeletion -eq "y" -or $waitForDeletion -eq "Y") {
                    Write-Host "⏳ Waiting for stack deletion..." -ForegroundColor Blue
                    aws cloudformation wait stack-delete-complete --stack-name $stackName
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ Stack deleted successfully!" -ForegroundColor Green
                    } else {
                        Write-Host "❌ Stack deletion may have failed. Check AWS Console." -ForegroundColor Red
                    }
                }
            } else {
                Write-Host "❌ Failed to initiate stack deletion" -ForegroundColor Red
            }
        } else {
            Write-Host "🔍 Would delete stack: $stackName" -ForegroundColor Blue
        }
    } else {
        Write-Host "ℹ️  Stack $stackName not found (already deleted or never created)" -ForegroundColor Blue
    }

    # Check for orphaned resources
    Write-Host ""
    Write-Host "🔍 Checking for orphaned resources..." -ForegroundColor Blue
    
    # Check for ECR repositories
    $ecrRepos = aws ecr describe-repositories --query "repositories[?contains(repositoryName, 'agent-hub-mcp')].repositoryName" --output text 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $ecrRepos -ne "") {
        Write-Host "📦 Found ECR repositories: $ecrRepos" -ForegroundColor Yellow
        
        if (!$DryRun) {
            $cleanupECR = Read-Host "Delete ECR repositories and images? (y/N)"
            if ($cleanupECR -eq "y" -or $cleanupECR -eq "Y") {
                foreach ($repo in $ecrRepos.Split()) {
                    if ($repo.Trim() -ne "") {
                        Write-Host "🗑️  Deleting ECR repository: $repo" -ForegroundColor Blue
                        aws ecr delete-repository --repository-name $repo --force 2>$null
                        
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "✅ Deleted ECR repository: $repo" -ForegroundColor Green
                        } else {
                            Write-Host "❌ Failed to delete ECR repository: $repo" -ForegroundColor Red
                        }
                    }
                }
            }
        } else {
            Write-Host "🔍 Would delete ECR repositories: $ecrRepos" -ForegroundColor Blue
        }
    } else {
        Write-Host "✅ No orphaned ECR repositories found" -ForegroundColor Green
    }

    # Check for log groups
    $logGroups = aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/agent-hub-mcp" --query 'logGroups[*].logGroupName' --output text 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $logGroups -ne "") {
        Write-Host "📊 Found log groups: $logGroups" -ForegroundColor Yellow
        
        if (!$DryRun) {
            $cleanupLogs = Read-Host "Delete CloudWatch log groups? (y/N)"
            if ($cleanupLogs -eq "y" -or $cleanupLogs -eq "Y") {
                foreach ($logGroup in $logGroups.Split()) {
                    if ($logGroup.Trim() -ne "") {
                        Write-Host "🗑️  Deleting log group: $logGroup" -ForegroundColor Blue
                        aws logs delete-log-group --log-group-name $logGroup 2>$null
                        
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "✅ Deleted log group: $logGroup" -ForegroundColor Green
                        } else {
                            Write-Host "❌ Failed to delete log group: $logGroup" -ForegroundColor Red
                        }
                    }
                }
            }
        } else {
            Write-Host "🔍 Would delete log groups: $logGroups" -ForegroundColor Blue
        }
    } else {
        Write-Host "✅ No orphaned log groups found" -ForegroundColor Green
    }

} catch {
    Write-Host "❌ Error during cleanup: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💰 Cost Savings:" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host "• ECS Fargate: ~`$2-4/day saved" -ForegroundColor White
Write-Host "• Application Load Balancer: ~`$0.60/day saved" -ForegroundColor White
Write-Host "• CloudWatch Logs: ~`$0.10-0.50/day saved" -ForegroundColor White
Write-Host "• Total Daily Savings: ~`$2.70-5.10" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "• Run './monitor-daily-costs.ps1' to verify cost reduction" -ForegroundColor White
Write-Host "• Redeploy when ready: './deploy-mcp-infrastructure.ps1'" -ForegroundColor White
Write-Host "• Consider using this cleanup script daily during development" -ForegroundColor White

Write-Host ""
Write-Host "🏁 Cleanup completed!" -ForegroundColor Green