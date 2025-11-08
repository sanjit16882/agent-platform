#!/usr/bin/env pwsh

# Setup Monitoring Alerts for MCP Infrastructure
# This script configures email notifications for CloudWatch alarms

param(
    [string]$Environment = "dev",
    [string]$EmailAddress = "",
    [switch]$DryRun = $false
)

if ($EmailAddress -eq "") {
    $EmailAddress = Read-Host "Enter your email address for monitoring alerts"
    if ($EmailAddress -eq "") {
        Write-Host "❌ Email address is required for monitoring alerts." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📊 Setting up MCP Monitoring Alerts" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Email: $EmailAddress" -ForegroundColor Yellow

$stackName = "MCPInfrastructureStack-$Environment"

try {
    # Get the SNS topic ARN from stack outputs
    Write-Host "📋 Retrieving SNS topic ARN..." -ForegroundColor Blue
    $topicArn = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`MCPAlertTopicArn`].OutputValue' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0 -or $topicArn -eq "" -or $topicArn -eq "None") {
        Write-Host "❌ Could not find MCP Alert Topic. Make sure the MCP infrastructure is deployed." -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Found SNS Topic: $topicArn" -ForegroundColor Green

    if ($DryRun) {
        Write-Host "🔍 DRY RUN - Would subscribe $EmailAddress to $topicArn" -ForegroundColor Blue
        return
    }

    # Subscribe email to SNS topic
    Write-Host "📧 Subscribing email to monitoring alerts..." -ForegroundColor Blue
    $subscriptionArn = aws sns subscribe --topic-arn $topicArn --protocol email --notification-endpoint $EmailAddress --query 'SubscriptionArn' --output text

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Email subscription created successfully!" -ForegroundColor Green
        Write-Host "📧 Check your email for a confirmation message from AWS" -ForegroundColor Yellow
        
        # Get dashboard URL
        $dashboardUrl = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs[?OutputKey==`MCPDashboardUrl`].OutputValue' --output text 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $dashboardUrl -ne "" -and $dashboardUrl -ne "None") {
            Write-Host ""
            Write-Host "📊 CloudWatch Dashboard URL:" -ForegroundColor Cyan
            Write-Host "   $dashboardUrl" -ForegroundColor White
        }

        Write-Host ""
        Write-Host "🚨 Configured Alerts:" -ForegroundColor Yellow
        Write-Host "• High Error Rate: >10 errors in 10 minutes" -ForegroundColor White
        Write-Host "• High Latency: >30 seconds average response time" -ForegroundColor White
        Write-Host "• ALB High Response Time: >5 seconds" -ForegroundColor White
        Write-Host "• ALB 5XX Errors: >5 errors in 10 minutes" -ForegroundColor White
        Write-Host "• ECS High CPU: >80% utilization" -ForegroundColor White
        Write-Host "• ECS High Memory: >85% utilization" -ForegroundColor White

        Write-Host ""
        Write-Host "📈 Monitoring Features:" -ForegroundColor Cyan
        Write-Host "• Real-time CloudWatch Dashboard" -ForegroundColor White
        Write-Host "• Custom metrics for tool executions" -ForegroundColor White
        Write-Host "• Log aggregation and search" -ForegroundColor White
        Write-Host "• Performance and error tracking" -ForegroundColor White
        Write-Host "• Cost and resource utilization monitoring" -ForegroundColor White

    } else {
        Write-Host "❌ Failed to create email subscription" -ForegroundColor Red
        exit 1
    }

    # Test the metrics endpoint
    Write-Host ""
    Write-Host "🧪 Testing metrics endpoint..." -ForegroundColor Blue
    
    $apiUrl = aws cloudformation describe-stacks --stack-name "AgentHubStack-$Environment" --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $apiUrl -ne "" -and $apiUrl -ne "None") {
        try {
            $testResponse = Invoke-RestMethod -Uri "$apiUrl/api/v1/metrics/health" -Method GET -TimeoutSec 10
            if ($testResponse.success) {
                Write-Host "✅ Metrics endpoint is working!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Metrics endpoint responded but may need configuration." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️  Metrics endpoint test failed (this is normal for new deployments)." -ForegroundColor Yellow
        }
    }

} catch {
    Write-Host "❌ Error setting up monitoring alerts: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your email and confirm the SNS subscription" -ForegroundColor White
Write-Host "2. Bookmark the CloudWatch Dashboard URL" -ForegroundColor White
Write-Host "3. Deploy MCP services to start generating metrics" -ForegroundColor White
Write-Host "4. Test alerts by triggering high error rates or latency" -ForegroundColor White

Write-Host ""
Write-Host "📋 Monitoring Commands:" -ForegroundColor Cyan
Write-Host "• View dashboard: Open the CloudWatch Dashboard URL above" -ForegroundColor White
Write-Host "• Test metrics: curl -X POST $apiUrl/api/v1/metrics/tool-execution" -ForegroundColor White
Write-Host "• Check health: curl $apiUrl/api/v1/metrics/health" -ForegroundColor White

Write-Host ""
Write-Host "🏁 Monitoring alerts setup completed!" -ForegroundColor Green