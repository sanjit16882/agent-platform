#!/usr/bin/env pwsh

# Test Infrastructure Health
# This script performs comprehensive health checks on deployed MCP infrastructure

param(
    [string]$Environment = "dev",
    [switch]$Detailed = $false,
    [switch]$FixIssues = $false
)

Write-Host "🏥 Testing MCP Infrastructure Health" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

$mcpStackName = "MCPInfrastructureStack-$Environment"
$agentHubStackName = "AgentHubStack-$Environment"
$healthIssues = @()
$healthWarnings = @()

try {
    # Test 1: CloudFormation Stack Health
    Write-Host ""
    Write-Host "📋 Testing CloudFormation Stack Health..." -ForegroundColor Blue
    
    $mcpStackStatus = aws cloudformation describe-stacks --stack-name $mcpStackName --query 'Stacks[0].StackStatus' --output text 2>$null
    $agentHubStackStatus = aws cloudformation describe-stacks --stack-name $agentHubStackName --query 'Stacks[0].StackStatus' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0 -or $mcpStackStatus -eq "" -or $mcpStackStatus -eq "None") {
        $healthIssues += "❌ MCP Infrastructure stack not found or not accessible"
    } elseif ($mcpStackStatus -notmatch "COMPLETE$") {
        $healthIssues += "❌ MCP Infrastructure stack is in unhealthy state: $mcpStackStatus"
    } else {
        Write-Host "✅ MCP Infrastructure stack is healthy: $mcpStackStatus" -ForegroundColor Green
    }
    
    if ($LASTEXITCODE -ne 0 -or $agentHubStackStatus -eq "" -or $agentHubStackStatus -eq "None") {
        $healthIssues += "❌ Agent Hub stack not found or not accessible"
    } elseif ($agentHubStackStatus -notmatch "COMPLETE$") {
        $healthIssues += "❌ Agent Hub stack is in unhealthy state: $agentHubStackStatus"
    } else {
        Write-Host "✅ Agent Hub stack is healthy: $agentHubStackStatus" -ForegroundColor Green
    }

    # Test 2: ECS Cluster Health
    Write-Host ""
    Write-Host "🐳 Testing ECS Cluster Health..." -ForegroundColor Blue
    
    $clusterName = aws cloudformation describe-stacks --stack-name $mcpStackName --query 'Stacks[0].Outputs[?OutputKey==`MCPClusterName`].OutputValue' --output text 2>$null
    
    if ($clusterName -and $clusterName -ne "None") {
        $clusterStatus = aws ecs describe-clusters --clusters $clusterName --query 'clusters[0].status' --output text 2>$null
        
        if ($clusterStatus -eq "ACTIVE") {
            Write-Host "✅ ECS Cluster '$clusterName' is active" -ForegroundColor Green
            
            # Check running services
            $services = aws ecs list-services --cluster $clusterName --query 'serviceArns' --output text 2>$null
            if ($services -and $services -ne "None" -and $services.Trim() -ne "") {
                $serviceCount = ($services -split '\s+').Count
                Write-Host "✅ ECS Cluster has $serviceCount running services" -ForegroundColor Green
            } else {
                $healthWarnings += "⚠️  ECS Cluster has no running services (expected for new deployment)"
            }
        } else {
            $healthIssues += "❌ ECS Cluster '$clusterName' is not active: $clusterStatus"
        }
    } else {
        $healthIssues += "❌ Could not retrieve ECS cluster name"
    }

    # Test 3: Application Load Balancer Health
    Write-Host ""
    Write-Host "⚖️ Testing Application Load Balancer Health..." -ForegroundColor Blue
    
    $albArn = aws cloudformation describe-stacks --stack-name $mcpStackName --query 'Stacks[0].Outputs[?OutputKey==`MCPLoadBalancerArn`].OutputValue' --output text 2>$null
    
    if ($albArn -and $albArn -ne "None") {
        $albState = aws elbv2 describe-load-balancers --load-balancer-arns $albArn --query 'LoadBalancers[0].State.Code' --output text 2>$null
        
        if ($albState -eq "active") {
            Write-Host "✅ Application Load Balancer is active" -ForegroundColor Green
            
            # Test ALB DNS resolution
            $albDns = aws cloudformation describe-stacks --stack-name $mcpStackName --query 'Stacks[0].Outputs[?OutputKey==`MCPLoadBalancerDNS`].OutputValue' --output text 2>$null
            
            if ($albDns -and $albDns -ne "None") {
                try {
                    $dnsResult = Resolve-DnsName $albDns -ErrorAction Stop
                    Write-Host "✅ ALB DNS '$albDns' resolves successfully" -ForegroundColor Green
                } catch {
                    $healthWarnings += "⚠️  ALB DNS resolution failed: $_"
                }
            }
        } else {
            $healthIssues += "❌ Application Load Balancer is not active: $albState"
        }
    } else {
        $healthIssues += "❌ Could not retrieve Application Load Balancer ARN"
    }

    # Test 4: Target Groups Health
    Write-Host ""
    Write-Host "🎯 Testing Target Groups Health..." -ForegroundColor Blue
    
    $targetGroups = @(
        @{ Name = "Office365"; Key = "Office365TargetGroupArn" },
        @{ Name = "Teams"; Key = "TeamsTargetGroupArn" },
        @{ Name = "GitHub"; Key = "GitHubTargetGroupArn" }
    )
    
    foreach ($tg in $targetGroups) {
        $tgArn = aws cloudformation describe-stacks --stack-name $mcpStackName --query "Stacks[0].Outputs[?OutputKey==``$($tg.Key)``].OutputValue" --output text 2>$null
        
        if ($tgArn -and $tgArn -ne "None") {
            $tgHealth = aws elbv2 describe-target-health --target-group-arn $tgArn --query 'TargetHealthDescriptions' --output json 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                $healthData = $tgHealth | ConvertFrom-Json
                if ($healthData.Count -eq 0) {
                    $healthWarnings += "⚠️  $($tg.Name) Target Group has no registered targets (expected for new deployment)"
                } else {
                    $healthyTargets = ($healthData | Where-Object { $_.TargetHealth.State -eq "healthy" }).Count
                    $totalTargets = $healthData.Count
                    
                    if ($healthyTargets -eq $totalTargets) {
                        Write-Host "✅ $($tg.Name) Target Group: $healthyTargets/$totalTargets targets healthy" -ForegroundColor Green
                    } else {
                        $healthWarnings += "⚠️  $($tg.Name) Target Group: $healthyTargets/$totalTargets targets healthy"
                    }
                }
            } else {
                $healthIssues += "❌ Could not check $($tg.Name) target group health"
            }
        } else {
            $healthIssues += "❌ Could not retrieve $($tg.Name) target group ARN"
        }
    }

    # Test 5: CloudWatch Monitoring Health
    Write-Host ""
    Write-Host "📊 Testing CloudWatch Monitoring Health..." -ForegroundColor Blue
    
    # Check CloudWatch Alarms
    $expectedAlarms = @(
        "agent-hub-mcp-high-error-rate-$Environment",
        "agent-hub-mcp-high-latency-$Environment",
        "agent-hub-mcp-alb-high-response-time-$Environment",
        "agent-hub-mcp-alb-5xx-errors-$Environment",
        "agent-hub-mcp-ecs-high-cpu-$Environment",
        "agent-hub-mcp-ecs-high-memory-$Environment"
    )
    
    $alarmStates = aws cloudwatch describe-alarms --alarm-names $expectedAlarms --query 'MetricAlarms[*].[AlarmName,StateValue]' --output text 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $alarmStates) {
        $alarmLines = $alarmStates -split "`n"
        $alarmCount = $alarmLines.Count
        $okAlarms = ($alarmLines | Where-Object { $_ -match "\tOK$" }).Count
        $insufficientDataAlarms = ($alarmLines | Where-Object { $_ -match "\tINSUFFICIENT_DATA$" }).Count
        $alarmingAlarms = ($alarmLines | Where-Object { $_ -match "\tALARM$" }).Count
        
        Write-Host "✅ CloudWatch Alarms: $alarmCount total, $okAlarms OK, $insufficientDataAlarms insufficient data, $alarmingAlarms alarming" -ForegroundColor Green
        
        if ($alarmingAlarms -gt 0) {
            $healthWarnings += "⚠️  $alarmingAlarms CloudWatch alarms are currently in ALARM state"
        }
    } else {
        $healthIssues += "❌ Could not retrieve CloudWatch alarm states"
    }
    
    # Check SNS Topic
    $snsTopicArn = aws cloudformation describe-stacks --stack-name $mcpStackName --query 'Stacks[0].Outputs[?OutputKey==`MCPAlertTopicArn`].OutputValue' --output text 2>$null
    
    if ($snsTopicArn -and $snsTopicArn -ne "None") {
        $topicAttributes = aws sns get-topic-attributes --topic-arn $snsTopicArn --query 'Attributes.DisplayName' --output text 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SNS Alert Topic is accessible: $topicAttributes" -ForegroundColor Green
            
            # Check subscriptions
            $subscriptions = aws sns list-subscriptions-by-topic --topic-arn $snsTopicArn --query 'Subscriptions[*].Protocol' --output text 2>$null
            
            if ($subscriptions -and $subscriptions.Trim() -ne "") {
                $subCount = ($subscriptions -split '\s+').Count
                Write-Host "✅ SNS Topic has $subCount subscription(s)" -ForegroundColor Green
            } else {
                $healthWarnings += "⚠️  SNS Topic has no subscriptions (alerts won't be delivered)"
            }
        } else {
            $healthIssues += "❌ SNS Alert Topic is not accessible"
        }
    } else {
        $healthIssues += "❌ Could not retrieve SNS Topic ARN"
    }

    # Test 6: API Gateway Health
    Write-Host ""
    Write-Host "🌐 Testing API Gateway Health..." -ForegroundColor Blue
    
    $apiUrl = aws cloudformation describe-stacks --stack-name $agentHubStackName --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>$null
    
    if ($apiUrl -and $apiUrl -ne "None") {
        Write-Host "✅ API Gateway URL: $apiUrl" -ForegroundColor Green
        
        # Test metrics health endpoint
        try {
            $healthResponse = Invoke-RestMethod -Uri "$apiUrl/api/v1/metrics/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
            
            if ($healthResponse.success) {
                Write-Host "✅ Metrics API health check passed" -ForegroundColor Green
            } else {
                $healthWarnings += "⚠️  Metrics API health check returned success=false"
            }
        } catch {
            $healthWarnings += "⚠️  Metrics API health check failed: $($_.Exception.Message)"
        }
        
        # Test budget status endpoint
        try {
            $budgetResponse = Invoke-RestMethod -Uri "$apiUrl/api/v1/budget/status" -Method GET -TimeoutSec 10 -ErrorAction Stop
            
            if ($budgetResponse.success) {
                Write-Host "✅ Budget API health check passed" -ForegroundColor Green
            } else {
                $healthWarnings += "⚠️  Budget API health check returned success=false"
            }
        } catch {
            $healthWarnings += "⚠️  Budget API health check failed: $($_.Exception.Message)"
        }
    } else {
        $healthIssues += "❌ Could not retrieve API Gateway URL"
    }

    # Test 7: Log Groups Health
    Write-Host ""
    Write-Host "📋 Testing CloudWatch Log Groups Health..." -ForegroundColor Blue
    
    $expectedLogGroups = @(
        "/aws/ecs/agent-hub-mcp-office365-$Environment",
        "/aws/ecs/agent-hub-mcp-teams-$Environment",
        "/aws/ecs/agent-hub-mcp-github-$Environment"
    )
    
    foreach ($logGroup in $expectedLogGroups) {
        $logGroupExists = aws logs describe-log-groups --log-group-name-prefix $logGroup --query 'logGroups[0].logGroupName' --output text 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $logGroupExists -ne "None") {
            Write-Host "✅ Log Group '$logGroup' exists" -ForegroundColor Green
        } else {
            $healthIssues += "❌ Log Group '$logGroup' not found"
        }
    }

    # Health Summary
    Write-Host ""
    Write-Host "🏥 Infrastructure Health Summary" -ForegroundColor Blue
    Write-Host "================================" -ForegroundColor Blue
    
    if ($healthIssues.Count -eq 0 -and $healthWarnings.Count -eq 0) {
        Write-Host "✅ All infrastructure components are healthy!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Infrastructure Status:" -ForegroundColor Yellow
        Write-Host "• CloudFormation stacks: Deployed and healthy" -ForegroundColor White
        Write-Host "• ECS cluster: Active and ready" -ForegroundColor White
        Write-Host "• Application Load Balancer: Active with healthy target groups" -ForegroundColor White
        Write-Host "• CloudWatch monitoring: All alarms configured" -ForegroundColor White
        Write-Host "• API Gateway: Accessible with working endpoints" -ForegroundColor White
        Write-Host "• Log groups: Created and ready for logging" -ForegroundColor White
        
        exit 0
    } else {
        if ($healthIssues.Count -gt 0) {
            Write-Host "❌ Infrastructure health check failed with $($healthIssues.Count) critical issue(s):" -ForegroundColor Red
            foreach ($issue in $healthIssues) {
                Write-Host "   $issue" -ForegroundColor Red
            }
        }
        
        if ($healthWarnings.Count -gt 0) {
            Write-Host "⚠️  Infrastructure has $($healthWarnings.Count) warning(s):" -ForegroundColor Yellow
            foreach ($warning in $healthWarnings) {
                Write-Host "   $warning" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "🔧 Recommended Actions:" -ForegroundColor Yellow
        
        if ($healthIssues.Count -gt 0) {
            Write-Host "1. Review CloudFormation stack events for deployment errors" -ForegroundColor White
            Write-Host "2. Check AWS service limits and permissions" -ForegroundColor White
            Write-Host "3. Verify AWS credentials and region configuration" -ForegroundColor White
            Write-Host "4. Re-deploy infrastructure if necessary" -ForegroundColor White
        }
        
        if ($healthWarnings.Count -gt 0) {
            Write-Host "1. Deploy MCP services to register targets with load balancer" -ForegroundColor White
            Write-Host "2. Configure SNS subscriptions for alert notifications" -ForegroundColor White
            Write-Host "3. Wait for services to start generating metrics" -ForegroundColor White
        }
        
        if ($healthIssues.Count -gt 0) {
            exit 1
        } else {
            exit 0
        }
    }

} catch {
    Write-Host "❌ Health check script error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏁 Infrastructure health check completed!" -ForegroundColor Green