#!/usr/bin/env pwsh

# Daily Cost Monitoring for MCP Development
# This script helps track your AWS spending against your $100 credit

param(
    [int]$CreditBalance = 100,
    [switch]$Detailed = $false
)

Write-Host "💰 Daily AWS Cost Monitor" -ForegroundColor Green
Write-Host "Available Credits: `$$CreditBalance USD" -ForegroundColor Yellow

try {
    # Get current month dates
    $currentMonth = Get-Date -Format "yyyy-MM"
    $startDate = "$currentMonth-01"
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    
    Write-Host "📊 Retrieving cost data for $currentMonth..." -ForegroundColor Blue

    # Get total costs for current month
    $totalCost = aws ce get-cost-and-usage --time-period Start=$startDate,End=$endDate --granularity MONTHLY --metrics BlendedCost --query 'ResultsByTime[0].Total.BlendedCost.Amount' --output text 2>$null

    if ($LASTEXITCODE -eq 0 -and $totalCost -ne "None") {
        $costFloat = [float]$totalCost
        $remainingCredits = $CreditBalance - $costFloat
        $percentUsed = ($costFloat / $CreditBalance) * 100

        Write-Host ""
        Write-Host "💳 Cost Summary:" -ForegroundColor Cyan
        Write-Host "===============" -ForegroundColor Cyan
        Write-Host "Total Spent This Month: `$$($costFloat.ToString('F2'))" -ForegroundColor White
        Write-Host "Remaining Credits: `$$($remainingCredits.ToString('F2'))" -ForegroundColor $(if ($remainingCredits -gt 50) { "Green" } elseif ($remainingCredits -gt 20) { "Yellow" } else { "Red" })
        Write-Host "Credits Used: $($percentUsed.ToString('F1'))%" -ForegroundColor $(if ($percentUsed -lt 50) { "Green" } elseif ($percentUsed -lt 80) { "Yellow" } else { "Red" })

        # Warning thresholds
        if ($percentUsed -gt 90) {
            Write-Host "🚨 WARNING: You've used over 90% of your credits!" -ForegroundColor Red
            Write-Host "   Consider pausing development or optimizing resources." -ForegroundColor Red
        } elseif ($percentUsed -gt 75) {
            Write-Host "⚠️  CAUTION: You've used over 75% of your credits." -ForegroundColor Yellow
            Write-Host "   Monitor spending closely and consider cost optimization." -ForegroundColor Yellow
        } elseif ($percentUsed -gt 50) {
            Write-Host "📈 INFO: You've used over 50% of your credits." -ForegroundColor Blue
            Write-Host "   Good progress! Keep monitoring daily." -ForegroundColor Blue
        } else {
            Write-Host "✅ GOOD: Credit usage is under control." -ForegroundColor Green
        }

    } else {
        Write-Host "⚠️  Unable to retrieve cost data. Check billing permissions." -ForegroundColor Yellow
    }

    # Get costs by service (if detailed)
    if ($Detailed) {
        Write-Host ""
        Write-Host "🔍 Detailed Cost Breakdown:" -ForegroundColor Blue
        Write-Host "===========================" -ForegroundColor Blue
        
        $serviceCosts = aws ce get-cost-and-usage --time-period Start=$startDate,End=$endDate --granularity MONTHLY --metrics BlendedCost --group-by Type=DIMENSION,Key=SERVICE --query 'ResultsByTime[0].Groups[*].[Keys[0],Metrics.BlendedCost.Amount]' --output table 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Host $serviceCosts
        } else {
            Write-Host "❌ Unable to retrieve service breakdown" -ForegroundColor Red
        }
    }

    # Estimated daily burn rate
    if ($LASTEXITCODE -eq 0 -and $totalCost -ne "None") {
        $daysInMonth = (Get-Date).Day
        $dailyBurn = $costFloat / $daysInMonth
        $daysRemaining = if ($dailyBurn -gt 0) { [math]::Floor($remainingCredits / $dailyBurn) } else { 999 }

        Write-Host ""
        Write-Host "📈 Burn Rate Analysis:" -ForegroundColor Cyan
        Write-Host "=====================" -ForegroundColor Cyan
        Write-Host "Average Daily Spend: `$$($dailyBurn.ToString('F2'))" -ForegroundColor White
        Write-Host "Days of Credits Remaining: $daysRemaining days" -ForegroundColor $(if ($daysRemaining -gt 30) { "Green" } elseif ($daysRemaining -gt 14) { "Yellow" } else { "Red" })
        
        if ($daysRemaining -lt 30) {
            Write-Host "💡 Consider optimizing resources to extend credit usage" -ForegroundColor Yellow
        }
    }

} catch {
    Write-Host "❌ Error retrieving cost data: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Cost Optimization Tips:" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host "• Stop/terminate unused resources daily" -ForegroundColor White
Write-Host "• Use Fargate Spot instances where possible" -ForegroundColor White
Write-Host "• Set short log retention periods (1 week)" -ForegroundColor White
Write-Host "• Delete unused ECR images regularly" -ForegroundColor White
Write-Host "• Monitor and delete unused EBS volumes" -ForegroundColor White
Write-Host "• Use t3.micro instances for testing" -ForegroundColor White

Write-Host ""
Write-Host "📋 Quick Commands:" -ForegroundColor Cyan
Write-Host "• Check this daily: ./monitor-daily-costs.ps1" -ForegroundColor White
Write-Host "• Detailed breakdown: ./monitor-daily-costs.ps1 -Detailed" -ForegroundColor White
Write-Host "• Setup budget alert: ./setup-budget-alert.ps1" -ForegroundColor White