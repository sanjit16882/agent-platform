#!/usr/bin/env pwsh

# Validate MCP Monitoring Setup
# This script validates that all monitoring components are properly configured

param(
    [string]$Environment = "dev",
    [switch]$Detailed = $false
)

Write-Host "📊 Validating MCP Monitoring Setup" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

$stackName = "MCPInfrastructureStack-$Environment"
$agentHubStackName = "AgentHubStack-$Environment"
$validationErrors = @()

try {
    # Check if MCP infrastructure stack exists
    Write-Host "📋 Checking MCP infrastructure stack..." -ForegroundColor Blue
    $mcpStackStatus = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].StackStatus' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        $validationErrors += "❌ MCP Infrastructure stack '$stackName' not found"
    } elseif ($mcpStackStatus -ne "CREATE_COMPLETE" -and $mcpStackStatus -ne "UPDATE_COMPLETE") {
        $validationErrors += "❌ MCP Infrastructure stack is in state: $mcpStackStatus"
    } else {
        Write-Host "✅ MCP Infrastructure stack is healthy: $mcpStackStatus" -ForegroundColor Green
    }

    # Check Agent Hub stack
    Write-Host "📋 Checking Agent Hub stack..." -ForegroundColor Blue
    $agentHubStackStatus = aws cloudformation describe-stacks --stack-name $agentHubStackName --query 'Stacks[0].StackStatus' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        $validationErrors += "❌ Agent Hub stack '$agentHubStackName' not found"
    } elseif ($agentHubStackStatus -ne "CREATE_COMPLETE" -and $agentHubStackStatus -ne "UPDATE_COMPLETE") {
        $validationErrors += "❌ Agent Hub stack is in state: $agentHubStackStatus"
    } else {
        Write-Host "✅ Agent Hub stack is healthy: $agentHubStackStatus" -ForegroundColor Green
    }

    # Get stack outputs
    Write-Host "📊 Retrieving monitoring configuration..." -ForegroundColor Blue
    $mcpOutputs = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs' --output json 2>$null | ConvertFrom-Json
    $agentHubOutputs = aws cloudformation describe-stacks --stack-name $agentHubStackName --query 'Stacks[0].Outputs' --output json 2>$null | ConvertFrom-Json
    
    if ($LASTEXITCODE -ne 0) {
        $validationErrors += "❌ Failed to retrieve stack outputs"
    } else {
        $mcpOutputMap = @{}
        foreach ($output in $mcpOutputs) {
            $mcpOutputMap[$output.OutputKey] = $output.OutputValue
        }
        
        $agentHubOutputMap = @{}
        foreach ($output in $agentHubOutputs) {
            $agentHubOutputMap[$output.OutputKey] = $output.OutputValue
        }

        # Validate monitoring outputs
        $requiredMCPOutputs = @(
            "MCPDashboardName",
            "MCPAlertTopicArn",
            "MCPDashboardUrl"
        )
        
        foreach ($requiredOutput in $requiredMCPOutputs) {
            if ($mcpOutputMap.ContainsKey($requiredOutput)) {
                Write-Host "✅ Output '$requiredOutput': $($mcpOutputMap[$requiredOutput])" -ForegroundColor Green
            } else {
                $validationErrors += "❌ Missing required MCP output: $requiredOutput"
            }
        }

        # Check API Gateway URL
        if ($agentHubOutputMap.ContainsKey("ApiGatewayUrl")) {
            Write-Host "✅ API Gateway URL: $($agentHubOutputMap['ApiGatewayUrl'])" -ForegroundColor Green
        } else {
            $validationErrors += "❌ Missing API Gateway URL"
        }
    }

    # Validate CloudWatch Dashboard
    if ($mcpOutputMap.ContainsKey("MCPDashboardName")) {
        Write-Host "📊 Validating CloudWatch Dashboard..." -ForegroundColor Blue
        $dashboardName = $mcpOutputMap["MCPDashboardName"]
        $dashboardExists = aws cloudwatch get-dashboard --dashboard-name $dashboardName --query 'DashboardName' --output text 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ CloudWatch Dashboard '$dashboardName' exists" -ForegroundColor Green
        } else {
            $validationErrors += "❌ CloudWatch Dashboard '$dashboardName' not found"
        }
    }

    # Validate SNS Topic
    if ($mcpOutputMap.ContainsKey("MCPAlertTopicArn")) {
        Write-Host "📧 Validating SNS Alert Topic..." -ForegroundColor Blue
        $topicArn = $mcpOutputMap["MCPAlertTopicArn"]
        $topicAttributes = aws sns get-topic-attributes --topic-arn $topicArn --query 'Attributes.DisplayName' --output text 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SNS Topic exists: $topicAttributes" -ForegroundColor Green
            
            # Check subscriptions
            $subscriptions = aws sns list-subscriptions-by-topic --topic-arn $topicArn --query 'Subscriptions[*].[Protocol,Endpoint,SubscriptionArn]' --output table 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "📧 SNS Subscriptions:" -ForegroundColor Blue
                Write-Host $subscriptions
            }
        } else {
            $validationErrors += "❌ SNS Topic '$topicArn' not accessible"
        }
    }

    # Validate CloudWatch Alarms
    Write-Host "🚨 Validating CloudWatch Alarms..." -ForegroundColor Blue
    $expectedAlarms = @(
        "agent-hub-mcp-high-error-rate-$Environment",
        "agent-hub-mcp-high-latency-$Environment",
        "agent-hub-mcp-alb-high-response-time-$Environment",
        "agent-hub-mcp-alb-5xx-errors-$Environment",
        "agent-hub-mcp-ecs-high-cpu-$Environment",
        "agent-hub-mcp-ecs-high-memory-$Environment"
    )

    foreach ($alarmName in $expectedAlarms) {
        $alarmState = aws cloudwatch describe-alarms --alarm-names $alarmName --query 'MetricAlarms[0].StateValue' --output text 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $alarmState -ne "None") {
            Write-Host "✅ Alarm '$alarmName': $alarmState" -ForegroundColor Green
        } else {
            $validationErrors += "❌ Alarm '$alarmName' not found or not accessible"
        }
    }

    # Validate Log Groups
    Write-Host "📋 Validating CloudWatch Log Groups..." -ForegroundColor Blue
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
            $validationErrors += "❌ Log Group '$logGroup' not found"
        }
    }

    # Test Metrics API
    if ($agentHubOutputMap.ContainsKey("ApiGatewayUrl")) {
        Write-Host "🧪 Testing Metrics API..." -ForegroundColor Blue
        $apiUrl = $agentHubOutputMap["ApiGatewayUrl"]
        
        try {
            $healthResponse = Invoke-RestMethod -Uri "$apiUrl/api/v1/metrics/health" -Method GET -TimeoutSec 10
            if ($healthResponse.success) {
                Write-Host "✅ Metrics API health check passed" -ForegroundColor Green
                if ($Detailed) {
                    Write-Host "   Status: $($healthResponse.data.status)" -ForegroundColor Cyan
                    Write-Host "   Environment: $($healthResponse.data.environment)" -ForegroundColor Cyan
                }
            } else {
                $validationErrors += "❌ Metrics API health check failed"
            }
        } catch {
            $validationErrors += "❌ Metrics API not accessible: $_"
        }
    }

    # Summary
    Write-Host ""
    Write-Host "📋 Monitoring Validation Summary" -ForegroundColor Blue
    Write-Host "================================" -ForegroundColor Blue
    
    if ($validationErrors.Count -eq 0) {
        Write-Host "✅ All monitoring components are properly configured!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🎯 Monitoring Features Available:" -ForegroundColor Yellow
        Write-Host "• CloudWatch Dashboard with custom widgets" -ForegroundColor White
        Write-Host "• 6 CloudWatch Alarms for proactive monitoring" -ForegroundColor White
        Write-Host "• SNS Topic for email/SMS notifications" -ForegroundColor White
        Write-Host "• Custom metrics for tool execution tracking" -ForegroundColor White
        Write-Host "• Log aggregation and search capabilities" -ForegroundColor White
        Write-Host "• Metrics API for programmatic access" -ForegroundColor White
        
        if ($mcpOutputMap.ContainsKey("MCPDashboardUrl")) {
            Write-Host ""
            Write-Host "📊 Quick Access:" -ForegroundColor Cyan
            Write-Host "   Dashboard: $($mcpOutputMap['MCPDashboardUrl'])" -ForegroundColor White
        }
        
        if ($agentHubOutputMap.ContainsKey("ApiGatewayUrl")) {
            Write-Host "   Metrics API: $($agentHubOutputMap['ApiGatewayUrl'])/api/v1/metrics/health" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Subscribe to SNS alerts: ./setup-monitoring-alerts.ps1" -ForegroundColor White
        Write-Host "2. Deploy MCP services to start generating metrics" -ForegroundColor White
        Write-Host "3. Monitor the dashboard during development" -ForegroundColor White
        Write-Host "4. Test alert notifications" -ForegroundColor White
        
        exit 0
    } else {
        Write-Host "❌ Monitoring validation failed with $($validationErrors.Count) error(s):" -ForegroundColor Red
        foreach ($error in $validationErrors) {
            Write-Host "   $error" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Ensure both stacks are deployed: ./deploy-mcp-infrastructure.ps1" -ForegroundColor White
        Write-Host "2. Check AWS permissions for CloudWatch and SNS" -ForegroundColor White
        Write-Host "3. Verify the stacks are in the correct region" -ForegroundColor White
        Write-Host "4. Review CloudFormation stack events for errors" -ForegroundColor White
        
        exit 1
    }

} catch {
    Write-Host "❌ Validation script error: $_" -ForegroundColor Red
    exit 1
}