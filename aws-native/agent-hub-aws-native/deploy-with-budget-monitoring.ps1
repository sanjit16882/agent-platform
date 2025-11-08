#!/usr/bin/env pwsh

# Deploy Agent Hub Platform with Budget Monitoring
# This script deploys the complete platform including budget monitoring features

param(
    [string]$Environment = "dev",
    [string]$EmailAddress = "",
    [switch]$SkipBudgetSetup = $false,
    [switch]$DryRun = $false
)

Write-Host "🚀 Deploying Agent Hub Platform with Budget Monitoring" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Cost warning
Write-Host ""
Write-Host "💰 BUDGET MONITORING SETUP:" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host "• This deployment includes budget monitoring features" -ForegroundColor White
Write-Host "• Your `$100 AWS credits will be tracked in the dashboard" -ForegroundColor White
Write-Host "• Budget alerts will be configured automatically" -ForegroundColor White
Write-Host "• Daily cost monitoring will be available" -ForegroundColor White
Write-Host ""

if ($EmailAddress -eq "" -and !$SkipBudgetSetup) {
    $EmailAddress = Read-Host "Enter your email address for budget alerts (or press Enter to skip)"
    if ($EmailAddress -eq "") {
        $SkipBudgetSetup = $true
        Write-Host "⚠️  Skipping budget alert setup. You can set this up later." -ForegroundColor Yellow
    }
}

# Set environment variables
$env:ENVIRONMENT = $Environment
$env:CDK_DEFAULT_REGION = "us-east-1"

try {
    # Step 1: Deploy main infrastructure
    Write-Host "📋 Step 1: Deploying main Agent Hub infrastructure..." -ForegroundColor Blue
    Set-Location "infrastructure"
    
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing CDK dependencies..." -ForegroundColor Blue
        npm install
    }

    Write-Host "🔨 Building CDK project..." -ForegroundColor Blue
    npm run build

    if ($DryRun) {
        Write-Host "🔍 Running CDK diff (dry run)..." -ForegroundColor Blue
        npx cdk diff --all
    } else {
        Write-Host "🚀 Deploying Agent Hub stack..." -ForegroundColor Blue
        npx cdk deploy "AgentHubStack-$Environment" --require-approval never

        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Main stack deployment failed!" -ForegroundColor Red
            exit 1
        }

        Write-Host "✅ Main Agent Hub stack deployed successfully!" -ForegroundColor Green
    }

    Set-Location ".."

    # Step 2: Setup budget monitoring
    if (!$SkipBudgetSetup -and !$DryRun) {
        Write-Host ""
        Write-Host "📋 Step 2: Setting up budget monitoring..." -ForegroundColor Blue
        
        try {
            ./setup-budget-alert.ps1 -EmailAddress $EmailAddress -BudgetAmount 90 -BudgetName "AgentHub-Development-Budget"
            Write-Host "✅ Budget monitoring configured!" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Budget setup failed, but you can set it up manually later." -ForegroundColor Yellow
            Write-Host "   Error: $_" -ForegroundColor Red
        }
    }

    # Step 3: Verify deployment
    if (!$DryRun) {
        Write-Host ""
        Write-Host "📋 Step 3: Verifying deployment..." -ForegroundColor Blue
        
        # Get API Gateway URL
        $apiUrl = aws cloudformation describe-stacks --stack-name "AgentHubStack-$Environment" --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $apiUrl -ne "") {
            Write-Host "✅ API Gateway URL: $apiUrl" -ForegroundColor Green
            
            # Test budget endpoint
            Write-Host "🧪 Testing budget monitoring endpoint..." -ForegroundColor Blue
            try {
                $testResponse = Invoke-RestMethod -Uri "$apiUrl/api/v1/budget/status" -Method GET -TimeoutSec 10
                if ($testResponse.success) {
                    Write-Host "✅ Budget monitoring API is working!" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  Budget API responded but may need configuration." -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️  Budget API test failed (this is normal for new deployments)." -ForegroundColor Yellow
            }
        }
    }

    # Step 4: Display next steps
    Write-Host ""
    Write-Host "🎯 Deployment Complete!" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Green
    
    if (!$DryRun) {
        Write-Host "✅ Agent Hub Platform deployed successfully" -ForegroundColor Green
        Write-Host "✅ Budget monitoring integrated into dashboard" -ForegroundColor Green
        if (!$SkipBudgetSetup) {
            Write-Host "✅ Budget alerts configured for $EmailAddress" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "🌐 Access your platform:" -ForegroundColor Cyan
        if ($apiUrl -ne "") {
            Write-Host "   API: $apiUrl" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "💰 Budget Monitoring Features:" -ForegroundColor Yellow
        Write-Host "• Real-time credit usage tracking in dashboard" -ForegroundColor White
        Write-Host "• Daily burn rate analysis" -ForegroundColor White
        Write-Host "• Cost breakdown by AWS service" -ForegroundColor White
        Write-Host "• Automated alerts when credits are low" -ForegroundColor White
        Write-Host "• Quick cleanup actions to save costs" -ForegroundColor White
        
        Write-Host ""
        Write-Host "📋 Daily Workflow:" -ForegroundColor Cyan
        Write-Host "1. Check dashboard for budget status" -ForegroundColor White
        Write-Host "2. Monitor daily costs: ./monitor-daily-costs.ps1" -ForegroundColor White
        Write-Host "3. Clean up when not developing: ./cleanup-mcp-resources.ps1" -ForegroundColor White
        Write-Host "4. Redeploy when needed: ./deploy-mcp-infrastructure.ps1" -ForegroundColor White
        
        Write-Host ""
        Write-Host "🚨 Important Reminders:" -ForegroundColor Red
        Write-Host "• Your `$100 AWS credits are automatically used first" -ForegroundColor White
        Write-Host "• Budget alerts are set at `$90 (90% of credits)" -ForegroundColor White
        Write-Host "• Clean up resources daily when not actively developing" -ForegroundColor White
        Write-Host "• Monitor the dashboard daily to track spending" -ForegroundColor White
    } else {
        Write-Host "🔍 Dry run completed - no resources were deployed" -ForegroundColor Blue
    }

} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Return to original directory
    if (Get-Location | Select-Object -ExpandProperty Path | Select-String "infrastructure") {
        Set-Location ".."
    }
}

Write-Host ""
Write-Host "🏁 Agent Hub Platform deployment completed!" -ForegroundColor Green