#!/usr/bin/env pwsh

# Check AWS Credits and Billing Configuration
# This script helps verify your AWS credits are being used properly

Write-Host "💰 Checking AWS Credits and Billing Configuration" -ForegroundColor Green

try {
    # Check AWS CLI configuration
    Write-Host "🔍 Checking AWS CLI configuration..." -ForegroundColor Blue
    $awsAccount = aws sts get-caller-identity --query 'Account' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ AWS Account ID: $awsAccount" -ForegroundColor Green

    # Check current region
    $region = aws configure get region
    Write-Host "✅ Current Region: $region" -ForegroundColor Green

    # Check for credits (requires billing permissions)
    Write-Host ""
    Write-Host "💳 Checking AWS Credits..." -ForegroundColor Blue
    
    # Get current month's billing
    $currentMonth = Get-Date -Format "yyyy-MM"
    $startDate = "$currentMonth-01"
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    
    Write-Host "📊 Attempting to retrieve billing information..." -ForegroundColor Blue
    $costData = aws ce get-cost-and-usage --time-period Start=$startDate,End=$endDate --granularity MONTHLY --metrics BlendedCost --query 'ResultsByTime[0].Total.BlendedCost.Amount' --output text 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $costData -ne "None") {
        Write-Host "✅ Current month charges: `$$costData USD" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unable to retrieve billing data. This requires billing permissions." -ForegroundColor Yellow
        Write-Host "   You can check credits manually in the AWS Console > Billing & Cost Management" -ForegroundColor Yellow
    }

    # Check for budget alerts
    Write-Host ""
    Write-Host "📋 Checking Budget Configuration..." -ForegroundColor Blue
    $budgets = aws budgets describe-budgets --account-id $awsAccount --query 'Budgets[*].BudgetName' --output text 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $budgets -ne "") {
        Write-Host "✅ Existing budgets found: $budgets" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No budgets configured. Consider setting up budget alerts." -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Error checking AWS configuration: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Manual Steps to Verify Credits:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host "1. Go to AWS Console > Billing & Cost Management" -ForegroundColor White
Write-Host "2. Click 'Credits' in the left sidebar" -ForegroundColor White
Write-Host "3. Verify your `$100 credit is listed and active" -ForegroundColor White
Write-Host "4. Check 'Payment Methods' to ensure credits are used first" -ForegroundColor White
Write-Host "5. Set up billing alerts for when credits are low" -ForegroundColor White

Write-Host ""
Write-Host "💡 Recommended Actions:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "• Set up a `$90 budget alert (90% of your credits)" -ForegroundColor White
Write-Host "• Enable detailed billing reports" -ForegroundColor White
Write-Host "• Monitor daily costs during development" -ForegroundColor White
Write-Host "• Use cost allocation tags for tracking" -ForegroundColor White