# AWS Cost Explorer Setup Guide

## Prerequisites
You need an AWS account with Cost Explorer enabled and appropriate IAM permissions.

## Step 1: Enable AWS Cost Explorer
1. Log in to AWS Console
2. Go to **AWS Cost Management** → **Cost Explorer**
3. Click **Enable Cost Explorer** (if not already enabled)
4. Wait 24 hours for initial data to populate

## Step 2: Create IAM User for Cost Explorer Access

### Option A: Using AWS Console
1. Go to **IAM** → **Users** → **Create user**
2. User name: `agenthub-cost-explorer`
3. Select **Programmatic access**
4. Click **Next: Permissions**

### Attach Policy
1. Click **Attach policies directly**
2. Search for and select: `AWSBillingReadOnlyAccess` or create custom policy below
3. Click **Next** → **Create user**
4. **IMPORTANT**: Save the Access Key ID and Secret Access Key

### Option B: Custom Policy (Minimal Permissions)
If you want minimal permissions, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetDimensionValues",
        "ce:GetTags"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 3: Configure Credentials

### Method 1: Environment Variables (Recommended for Development)
Edit `local_version/agent-hub-backend/.env`:

```bash
# Uncomment and fill in your AWS credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Optional: Set monthly budget for tracking
AWS_MONTHLY_BUDGET=5000
```

### Method 2: AWS CLI Configuration (Alternative)
If you have AWS CLI installed:

```bash
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Enter region: us-east-1
# Enter output format: json
```

The backend will automatically use AWS CLI credentials if environment variables are not set.

## Step 4: Restart Backend Server
After configuring credentials, restart the backend:

```bash
# Stop the current backend process
# Then start it again
cd local_version/agent-hub-backend
node comprehensive-server.js
```

## Step 5: Verify Connection
1. Open the FinOps Dashboard at http://localhost:3001
2. Go to **Integration** → **Deployment** tab
3. You should see real AWS costs instead of mock data
4. The "AWS Not Configured" message should disappear

## Troubleshooting

### Error: "AWS credentials not configured"
- Check that credentials are correctly set in `.env` file
- Ensure no extra spaces or quotes around values
- Verify credentials are valid in AWS Console

### Error: "Access Denied"
- Ensure IAM user has `ce:GetCostAndUsage` permission
- Check that Cost Explorer is enabled in your AWS account
- Verify the IAM policy is attached to the user

### No data showing
- Cost Explorer needs 24 hours after enabling to show data
- Check that you have actual AWS usage in your account
- Verify the date range in the query

### Error: "Cost Explorer not available in this region"
- Cost Explorer is only available in `us-east-1` region
- Set `AWS_REGION=us-east-1` in your `.env` file

## Security Best Practices

1. **Never commit credentials to Git**
   - The `.env` file is already in `.gitignore`
   - Use environment variables in production

2. **Use IAM roles in production**
   - For EC2/ECS deployments, use IAM roles instead of access keys
   - Rotate access keys regularly

3. **Limit permissions**
   - Only grant Cost Explorer read permissions
   - Don't use root account credentials

4. **Monitor usage**
   - Set up AWS Budgets to alert on unexpected costs
   - Review IAM access logs regularly

## Cost Information

- **Cost Explorer API**: First 1,000 requests per month are free
- **Additional requests**: $0.01 per request
- **Typical usage**: ~10-50 requests per day for this dashboard

## Support

If you encounter issues:
1. Check the backend console logs for detailed error messages
2. Verify AWS credentials with: `aws sts get-caller-identity`
3. Test Cost Explorer access in AWS Console first
