#!/usr/bin/env pwsh

# Setup AWS Budget Alert for Credit Monitoring
# This script creates a budget to monitor your $100 AWS credits

param(
    [string]$EmailAddress = "",
    [int]$BudgetAmount = 90,  # Alert at $90 (90% of $100 credits)
    [string]$BudgetName = "MCP-Development-Budget"
)

if ($EmailAddress -eq "") {
    $EmailAddress = Read-Host "Enter your email address for budget alerts"
}

Write-Host "💰 Setting up AWS Budget Alert" -ForegroundColor Green
Write-Host "Budget Amount: `$$BudgetAmount USD" -ForegroundColor Yellow
Write-Host "Alert Email: $EmailAddress" -ForegroundColor Yellow

try {
    # Get AWS Account ID
    $awsAccount = aws sts get-caller-identity --query 'Account' --output text
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to get AWS account ID. Please check AWS CLI configuration." -ForegroundColor Red
        exit 1
    }

    # Create budget JSON configuration
    $budgetConfig = @{
        BudgetName = $BudgetName
        BudgetLimit = @{
            Amount = $BudgetAmount.ToString()
            Unit = "USD"
        }
        TimeUnit = "MONTHLY"
        TimePeriod = @{
            Start = (Get-Date -Day 1).ToString("yyyy-MM-dd")
            End = "2087-06-15"  # Far future date
        }
        BudgetType = "COST"
        CostFilters = @{
            TagKey = @("Project")
            TagValue = @("AgentHub")
        }
    } | ConvertTo-Json -Depth 10

    # Create notification configuration
    $notificationConfig = @{
        Notification = @{
            NotificationType = "ACTUAL"
            ComparisonOperator = "GREATER_THAN"
            Threshold = 80.0  # Alert at 80% of budget
            ThresholdType = "PERCENTAGE"
            NotificationState = "ALARM"
        }
        Subscribers = @(
            @{
                SubscriptionType = "EMAIL"
                Address = $EmailAddress
            }
        )
    } | ConvertTo-Json -Depth 10

    # Save configurations to temporary files
    $budgetFile = "budget-config.json"
    $notificationFile = "notification-config.json"
    
    $budgetConfig | Out-File -FilePath $budgetFile -Encoding UTF8
    $notificationConfig | Out-File -FilePath $notificationFile -Encoding UTF8

    Write-Host "📋 Creating budget..." -ForegroundColor Blue
    
    # Create the budget
    aws budgets create-budget --account-id $awsAccount --budget file://$budgetFile --notifications-with-subscribers file://$notificationFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Budget '$BudgetName' created successfully!" -ForegroundColor Green
        Write-Host "📧 You'll receive email alerts when costs exceed 80% of `$$BudgetAmount" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create budget. You may need billing permissions." -ForegroundColor Red
        Write-Host "💡 You can create this manually in AWS Console > Billing & Cost Management > Budgets" -ForegroundColor Yellow
    }

    # Clean up temporary files
    Remove-Item $budgetFile -ErrorAction SilentlyContinue
    Remove-Item $notificationFile -ErrorAction SilentlyContinue

} catch {
    Write-Host "❌ Error setting up budget: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your email for budget confirmation" -ForegroundColor White
Write-Host "2. Verify the budget in AWS Console > Billing & Cost Management" -ForegroundColor White
Write-Host "3. Monitor costs daily during development" -ForegroundColor White
Write-Host "4. Consider setting up additional alerts at `$50 and `$70" -ForegroundColor White