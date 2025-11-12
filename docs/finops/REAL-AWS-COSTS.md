# Real AWS Cost Tracking

This guide explains how to configure the FinOps dashboard to show **real AWS costs** instead of dummy test data.

## Current Behavior (Before Setup)

- FinOps dashboard shows dummy/test data
- Costs disappear when you refresh the page
- "Generate Test Data" button creates fake executions
- No real AWS integration

## After Setup (Real AWS Costs)

- FinOps dashboard shows actual AWS spending
- Costs persist across page refreshes
- Data comes from AWS Cost Explorer API
- Real budget alerts and ROI calculations

## Prerequisites

1. **AWS Account** with active usage
2. **AWS IAM User** with appropriate permissions
3. **AWS CLI configured** (optional but recommended)

## Required AWS Permissions

Your AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetUsageReport",
        "ce:GetReservationCoverage",
        "ce:GetReservationPurchaseRecommendation",
        "ce:GetReservationUtilization",
        "ce:ListCostCategoryDefinitions",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

## Quick Setup

Run the interactive setup script:

```bash
npm run setup:aws:costs
```

This will prompt you for:
- AWS Region (default: us-east-1)
- AWS Access Key ID
- AWS Secret Access Key  
- Monthly Budget (default: $1000)

## Manual Setup

1. **Create `.env` file** in the project root:

```bash
# AWS Configuration for Real Cost Tracking
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_MONTHLY_BUDGET=1000
ENABLE_REAL_COST_TRACKING=true
```

2. **Restart the backend server**:

```bash
npm run start:backend:local
```

## How It Works

### Backend Integration

- **AWS Cost Explorer API**: Fetches real cost data for the last 30 days
- **CloudWatch API**: Gets active alarms and system metrics
- **Service Breakdown**: Automatically categorizes costs by AWS service
- **Budget Tracking**: Compares actual spending to your configured budget

### Frontend Updates

- **Real Data Display**: Shows actual AWS costs instead of dummy data
- **Persistent Data**: Costs remain after page refresh
- **Live Updates**: Refreshes every minute with latest data
- **Budget Alerts**: Real alerts when approaching budget limits

### Cost Tracking Features

1. **Service Breakdown**:
   - AWS Bedrock (AI model costs)
   - S3 Storage (agent artifacts)
   - Lambda (serverless executions)
   - EC2/Compute (infrastructure)

2. **Budget Monitoring**:
   - Real-time budget utilization
   - Automatic alerts at 60%, 80%, 100%
   - Monthly projection based on current usage

3. **ROI Analysis**:
   - Actual AWS investment vs. cost savings
   - Real payback period calculations
   - Automation impact metrics

## Troubleshooting

### No Cost Data Showing

**Possible causes:**
- AWS credentials not configured correctly
- Insufficient IAM permissions
- New AWS account (Cost Explorer needs 24-48 hours)
- No actual AWS usage yet

**Solutions:**
1. Verify AWS credentials: `aws sts get-caller-identity`
2. Check IAM permissions for Cost Explorer
3. Execute some agents to generate AWS usage
4. Wait 24-48 hours for new accounts

### API Errors

**Common errors:**
- `AccessDenied`: Missing IAM permissions
- `InvalidCredentials`: Wrong access keys
- `RegionNotSupported`: Cost Explorer not available in region

**Solutions:**
1. Use `us-east-1` region (Cost Explorer global endpoint)
2. Verify IAM user has Cost Explorer permissions
3. Check AWS credentials are active and valid

### High Costs

**If costs are higher than expected:**
1. Check the service breakdown in FinOps dashboard
2. Review agent execution frequency
3. Consider using cheaper AI models (Haiku vs Sonnet)
4. Set up CloudWatch billing alarms

## Cost Optimization Tips

1. **Model Selection**:
   - Use Claude Haiku for simple tasks ($0.25/$1.25 per 1M tokens)
   - Reserve Sonnet for complex analysis ($3.00/$15.00 per 1M tokens)

2. **Execution Patterns**:
   - Batch similar requests
   - Cache results when possible
   - Use shorter prompts for simple tasks

3. **Monitoring**:
   - Set up CloudWatch billing alarms
   - Review costs weekly in FinOps dashboard
   - Monitor cost per agent execution

## Security Notes

- Store AWS credentials securely (use IAM roles in production)
- Rotate access keys regularly
- Use least-privilege IAM policies
- Never commit credentials to version control

## Production Deployment

For production environments:

1. **Use IAM Roles** instead of access keys
2. **Enable CloudTrail** for audit logging
3. **Set up Cost Anomaly Detection**
4. **Configure automated budget alerts**

```bash
# Production deployment with real costs
npm run start:production
```

## Support

If you need help setting up real AWS cost tracking:

1. Check the troubleshooting section above
2. Verify your AWS account has Cost Explorer enabled
3. Ensure you have actual AWS usage to track
4. Contact your AWS support team for billing questions