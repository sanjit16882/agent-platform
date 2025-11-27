# 💰 Budget Monitoring for Agent Hub Platform

This document explains the integrated budget monitoring system that helps you track your $100 AWS credits directly in the Agent Hub Platform dashboard.

## 🎯 Overview

The budget monitoring system provides real-time visibility into your AWS spending, helping you maximize your $100 credit usage during development of the Agent Hub Platform.

## ✨ Features

### Dashboard Integration
- **Real-time Credit Tracking**: See remaining credits at a glance
- **Burn Rate Analysis**: Understand daily spending patterns
- **Cost Breakdown**: View spending by AWS service
- **Visual Progress Bars**: Easy-to-understand credit usage visualization
- **Smart Alerts**: Color-coded warnings based on usage levels

### Automated Monitoring
- **Daily Cost Updates**: Automatic refresh every 5 minutes
- **Email Alerts**: Notifications when you hit 80% of budget
- **Predictive Analysis**: Estimated days remaining at current burn rate
- **Service Breakdown**: Top 10 AWS services by cost

### Cost Optimization Tools
- **Quick Cleanup**: One-click resource cleanup buttons
- **Resource Monitoring**: Track which services are costing the most
- **Optimization Tips**: Built-in recommendations for cost savings

## 📊 Dashboard Components

### Budget Status Card
```
💰 AWS Budget Monitor                    [23.5% Used] [🔄 Refresh]
================================================================
🚨 Critical: Over 90% of credits used! Consider pausing development.

Credit Usage: $23.45 / $100.00  [████████░░] 23.5%

Credits Remaining: $76.55    |    Days Remaining: 24
Daily Burn Rate: $3.20      |    This Month: $23.45
```

### Cost Breakdown
- Amazon Elastic Container Service: $12.30 (52.5%)
- Elastic Load Balancing: $6.20 (26.4%)
- Amazon CloudWatch: $2.95 (12.6%)
- AWS Secrets Manager: $1.50 (6.4%)
- Amazon ECR: $0.50 (2.1%)

### Alert Levels
- **🟢 Green (0-50%)**: Credit usage under control
- **🔵 Blue (50-75%)**: Good progress, keep monitoring
- **🟡 Yellow (75-90%)**: Caution, monitor closely
- **🔴 Red (90%+)**: Critical, consider pausing development

## 🚀 Quick Start

### 1. Deploy with Budget Monitoring
```powershell
# Deploy the complete platform with budget monitoring
./deploy-with-budget-monitoring.ps1 -Environment dev -EmailAddress your@email.com

# Or deploy without email alerts
./deploy-with-budget-monitoring.ps1 -Environment dev -SkipBudgetSetup
```

### 2. Access the Dashboard
1. Open your Agent Hub Platform URL
2. Navigate to the Dashboard (home page)
3. The Budget Monitor appears at the top of the page
4. Click "🔄 Refresh" to update data manually

### 3. Set Up Budget Alerts (Optional)
```powershell
# Set up email alerts at $90 threshold
./setup-budget-alert.ps1 -EmailAddress your@email.com -BudgetAmount 90
```

## 📈 Daily Monitoring Workflow

### Morning Check (2 minutes)
1. **Open Dashboard**: Check budget status in the platform
2. **Review Alerts**: Look for any warning messages
3. **Check Burn Rate**: Ensure daily spending is reasonable

### Development Session
1. **Monitor Actively**: Keep dashboard open during development
2. **Watch for Warnings**: Pay attention to color changes
3. **Optimize Resources**: Use minimal resources for testing

### End of Day (2 minutes)
1. **Run Cost Check**: `./monitor-daily-costs.ps1`
2. **Clean Up Resources**: `./cleanup-mcp-resources.ps1` (if not continuing tomorrow)
3. **Review Spending**: Check which services cost the most

## 🛠️ Manual Monitoring Commands

### Check Current Status
```powershell
# Detailed cost analysis
./monitor-daily-costs.ps1 -Detailed

# Quick status check
./monitor-daily-costs.ps1
```

### Verify AWS Credits
```powershell
# Check AWS configuration and credits
./check-aws-credits.ps1
```

### Clean Up Resources
```powershell
# Stop all MCP resources to save money
./cleanup-mcp-resources.ps1

# Dry run to see what would be deleted
./cleanup-mcp-resources.ps1 -DryRun
```

## 🔧 Technical Implementation

### Backend API
- **Endpoint**: `/api/v1/budget/status`
- **Lambda Function**: `agent-hub-budget-monitor`
- **Data Source**: AWS Cost Explorer API
- **Refresh Rate**: Real-time on request, cached for 5 minutes

### Frontend Component
- **Component**: `BudgetMonitor.tsx`
- **Location**: Top of Dashboard
- **Auto-refresh**: Every 5 minutes
- **Fallback**: Mock data if API unavailable

### AWS Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetUsageReport",
        "budgets:ViewBudget",
        "budgets:DescribeBudgets"
      ],
      "Resource": "*"
    }
  ]
}
```

## 💡 Cost Optimization Tips

### Daily Habits
- **Check Dashboard First**: Always check budget before starting work
- **Clean Up Nightly**: Stop resources when not actively developing
- **Monitor Trends**: Watch for unexpected cost spikes
- **Use Spot Instances**: Enable Fargate Spot for non-critical workloads

### Resource Management
- **ECS Services**: Scale down to 0 when not needed
- **Load Balancers**: Delete if not actively testing
- **Log Groups**: Use short retention periods (1 week)
- **ECR Images**: Clean up old images regularly

### Development Practices
- **Test Locally First**: Use local development when possible
- **Batch Deployments**: Deploy multiple changes together
- **Use Minimal Resources**: Start with smallest instance sizes
- **Monitor Real-time**: Keep dashboard open during development

## 🚨 Emergency Procedures

### If You Hit 90% Credit Usage
1. **Immediate Action**: Run `./cleanup-mcp-resources.ps1`
2. **Review Costs**: Check which services are most expensive
3. **Pause Development**: Consider stopping until next month
4. **Optimize**: Remove unnecessary resources

### If Credits Run Out
1. **Check Payment Method**: Ensure backup payment is configured
2. **Review Charges**: Verify all charges are legitimate
3. **Contact AWS**: Request credit extension if needed
4. **Plan Better**: Set up stricter budget alerts

## 📞 Support and Troubleshooting

### Common Issues

#### Budget Data Not Loading
- **Check Permissions**: Ensure Cost Explorer permissions are granted
- **Verify Region**: Budget APIs work in us-east-1
- **Wait for Data**: Cost data can take 24 hours to appear

#### Email Alerts Not Working
- **Check Email**: Verify email address in budget configuration
- **Confirm Subscription**: Check for AWS confirmation email
- **Test Threshold**: Manually trigger alert by adjusting threshold

#### Dashboard Shows Mock Data
- **Normal Behavior**: Fallback data is shown if API fails
- **Check Logs**: Review Lambda function logs for errors
- **Verify Deployment**: Ensure budget Lambda is deployed correctly

### Getting Help
1. **Check Logs**: CloudWatch logs for budget-monitor Lambda
2. **Test API**: Direct API calls to `/api/v1/budget/status`
3. **AWS Console**: Verify Cost Explorer and Budgets configuration
4. **Manual Verification**: Check AWS Billing dashboard directly

## 🎯 Best Practices Summary

### ✅ Do This
- Check dashboard daily before starting work
- Set up email alerts at 80% threshold
- Clean up resources when not developing
- Monitor burn rate trends
- Use cost allocation tags
- Keep log retention periods short

### ❌ Avoid This
- Ignoring budget warnings
- Leaving resources running overnight
- Deploying without checking costs first
- Using large instance sizes for testing
- Forgetting to clean up after experiments
- Disabling budget monitoring

## 📊 Expected Costs

### Daily Development Costs
- **Light Development**: $2-3/day
- **Active Development**: $3-5/day
- **Heavy Testing**: $5-8/day

### Credit Duration Estimates
- **$100 Credits**: 20-50 days depending on usage
- **Conservative Usage**: 35-45 days
- **Aggressive Development**: 15-25 days

### Cost Breakdown (Typical)
- **ECS Fargate**: 40-50% of costs
- **Load Balancers**: 20-30% of costs
- **CloudWatch**: 10-15% of costs
- **Storage/Other**: 10-20% of costs

---

**Remember**: Your $100 AWS credits are automatically applied before any charges to your credit card. The budget monitoring system helps you maximize these credits while building your Agent Hub Platform! 🚀