#!/usr/bin/env pwsh

# Validate MCP Infrastructure Deployment
# This script validates that the MCP infrastructure is properly deployed and configured

param(
    [string]$Environment = "dev",
    [switch]$Detailed = $false
)

Write-Host "🔍 Validating MCP Infrastructure Deployment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

$stackName = "MCPInfrastructureStack-$Environment"
$validationErrors = @()

try {
    # Check if stack exists and is in good state
    Write-Host "📋 Checking CloudFormation stack status..." -ForegroundColor Blue
    $stackStatus = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].StackStatus' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        $validationErrors += "❌ Stack '$stackName' not found"
    } elseif ($stackStatus -ne "CREATE_COMPLETE" -and $stackStatus -ne "UPDATE_COMPLETE") {
        $validationErrors += "❌ Stack '$stackName' is in state: $stackStatus"
    } else {
        Write-Host "✅ Stack '$stackName' is in good state: $stackStatus" -ForegroundColor Green
    }

    # Get stack outputs
    Write-Host "📊 Retrieving stack outputs..." -ForegroundColor Blue
    $outputs = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs' --output json 2>$null | ConvertFrom-Json
    
    if ($LASTEXITCODE -ne 0) {
        $validationErrors += "❌ Failed to retrieve stack outputs"
    } else {
        $outputMap = @{}
        foreach ($output in $outputs) {
            $outputMap[$output.OutputKey] = $output.OutputValue
        }
        
        # Validate required outputs
        $requiredOutputs = @(
            "MCPClusterName",
            "MCPVpcId", 
            "MCPLoadBalancerArn",
            "MCPSecurityGroupId",
            "Office365RepositoryUri",
            "TeamsRepositoryUri",
            "GitHubRepositoryUri",
            "TaskExecutionRoleArn",
            "TaskRoleArn"
        )
        
        foreach ($requiredOutput in $requiredOutputs) {
            if ($outputMap.ContainsKey($requiredOutput)) {
                Write-Host "✅ Output '$requiredOutput': $($outputMap[$requiredOutput])" -ForegroundColor Green
            } else {
                $validationErrors += "❌ Missing required output: $requiredOutput"
            }
        }
    }

    # Validate ECS Cluster
    if ($outputMap.ContainsKey("MCPClusterName")) {
        Write-Host "🐳 Validating ECS cluster..." -ForegroundColor Blue
        $clusterName = $outputMap["MCPClusterName"]
        $clusterStatus = aws ecs describe-clusters --clusters $clusterName --query 'clusters[0].status' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            $validationErrors += "❌ Failed to describe ECS cluster '$clusterName'"
        } elseif ($clusterStatus -ne "ACTIVE") {
            $validationErrors += "❌ ECS cluster '$clusterName' is not active: $clusterStatus"
        } else {
            Write-Host "✅ ECS cluster '$clusterName' is active" -ForegroundColor Green
            
            # Check cluster capacity providers
            $capacityProviders = aws ecs describe-clusters --clusters $clusterName --include CAPACITY_PROVIDERS --query 'clusters[0].capacityProviders' --output json 2>$null | ConvertFrom-Json
            if ($capacityProviders -contains "FARGATE") {
                Write-Host "✅ Fargate capacity provider is enabled" -ForegroundColor Green
            } else {
                $validationErrors += "❌ Fargate capacity provider not found"
            }
        }
    }

    # Validate VPC
    if ($outputMap.ContainsKey("MCPVpcId")) {
        Write-Host "🌐 Validating VPC configuration..." -ForegroundColor Blue
        $vpcId = $outputMap["MCPVpcId"]
        $vpcState = aws ec2 describe-vpcs --vpc-ids $vpcId --query 'Vpcs[0].State' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            $validationErrors += "❌ Failed to describe VPC '$vpcId'"
        } elseif ($vpcState -ne "available") {
            $validationErrors += "❌ VPC '$vpcId' is not available: $vpcState"
        } else {
            Write-Host "✅ VPC '$vpcId' is available" -ForegroundColor Green
            
            # Check subnets
            $subnets = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" --query 'Subnets[*].[SubnetId,AvailabilityZone,MapPublicIpOnLaunch]' --output table 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ VPC subnets configured" -ForegroundColor Green
                if ($Detailed) {
                    Write-Host $subnets
                }
            }
        }
    }

    # Validate Load Balancer
    if ($outputMap.ContainsKey("MCPLoadBalancerArn")) {
        Write-Host "⚖️ Validating Application Load Balancer..." -ForegroundColor Blue
        $albArn = $outputMap["MCPLoadBalancerArn"]
        $albState = aws elbv2 describe-load-balancers --load-balancer-arns $albArn --query 'LoadBalancers[0].State.Code' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            $validationErrors += "❌ Failed to describe Load Balancer '$albArn'"
        } elseif ($albState -ne "active") {
            $validationErrors += "❌ Load Balancer '$albArn' is not active: $albState"
        } else {
            Write-Host "✅ Application Load Balancer is active" -ForegroundColor Green
        }
    }

    # Validate ECR Repositories
    Write-Host "📦 Validating ECR repositories..." -ForegroundColor Blue
    $repositories = @("Office365RepositoryUri", "TeamsRepositoryUri", "GitHubRepositoryUri")
    foreach ($repoOutput in $repositories) {
        if ($outputMap.ContainsKey($repoOutput)) {
            $repoUri = $outputMap[$repoOutput]
            $repoName = $repoUri.Split('/')[1]
            $repoExists = aws ecr describe-repositories --repository-names $repoName --query 'repositories[0].repositoryName' --output text 2>$null
            
            if ($LASTEXITCODE -ne 0) {
                $validationErrors += "❌ ECR repository '$repoName' not found"
            } else {
                Write-Host "✅ ECR repository '$repoName' exists" -ForegroundColor Green
            }
        }
    }

    # Validate Secrets Manager
    Write-Host "🔐 Validating Secrets Manager secrets..." -ForegroundColor Blue
    $secrets = @(
        "agent-hub-mcp-office365-credentials-$Environment",
        "agent-hub-mcp-teams-credentials-$Environment", 
        "agent-hub-mcp-github-credentials-$Environment"
    )
    
    foreach ($secretName in $secrets) {
        $secretExists = aws secretsmanager describe-secret --secret-id $secretName --query 'Name' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            $validationErrors += "❌ Secret '$secretName' not found"
        } else {
            Write-Host "✅ Secret '$secretName' exists" -ForegroundColor Green
        }
    }

    # Validate CloudWatch Log Groups
    Write-Host "📊 Validating CloudWatch log groups..." -ForegroundColor Blue
    $logGroups = @(
        "/aws/ecs/agent-hub-mcp-office365-$Environment",
        "/aws/ecs/agent-hub-mcp-teams-$Environment",
        "/aws/ecs/agent-hub-mcp-github-$Environment"
    )
    
    foreach ($logGroup in $logGroups) {
        $logGroupExists = aws logs describe-log-groups --log-group-name-prefix $logGroup --query 'logGroups[0].logGroupName' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0 -or $logGroupExists -eq "None") {
            $validationErrors += "❌ Log group '$logGroup' not found"
        } else {
            Write-Host "✅ Log group '$logGroup' exists" -ForegroundColor Green
        }
    }

    # Validate IAM Roles
    Write-Host "🔑 Validating IAM roles..." -ForegroundColor Blue
    $roles = @(
        "agent-hub-mcp-task-execution-role-$Environment",
        "agent-hub-mcp-task-role-$Environment"
    )
    
    foreach ($roleName in $roles) {
        $roleExists = aws iam get-role --role-name $roleName --query 'Role.RoleName' --output text 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            $validationErrors += "❌ IAM role '$roleName' not found"
        } else {
            Write-Host "✅ IAM role '$roleName' exists" -ForegroundColor Green
        }
    }

    # Summary
    Write-Host ""
    Write-Host "📋 Validation Summary" -ForegroundColor Blue
    Write-Host "===================" -ForegroundColor Blue
    
    if ($validationErrors.Count -eq 0) {
        Write-Host "✅ All validations passed! MCP infrastructure is properly deployed." -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Configure OAuth credentials in Secrets Manager"
        Write-Host "2. Build and push MCP server Docker images"
        Write-Host "3. Deploy MCP services to the ECS cluster"
        Write-Host "4. Test MCP server endpoints"
        
        exit 0
    } else {
        Write-Host "❌ Validation failed with $($validationErrors.Count) error(s):" -ForegroundColor Red
        foreach ($error in $validationErrors) {
            Write-Host "   $error" -ForegroundColor Red
        }
        exit 1
    }

} catch {
    Write-Host "❌ Validation script error: $_" -ForegroundColor Red
    exit 1
}