# 💰 Setup Real AWS Cost Tracking

## 🎯 **OVERVIEW**
This guide will help you configure real AWS Cost Explorer integration to show actual AWS costs instead of mock data in your FinOps dashboard.

## 📋 **PREREQUISITES**

### **1. AWS Account Requirements:**
- ✅ Active AWS account with billing access
- ✅ Cost Explorer enabled (may take 24 hours after first enabling)
- ✅ IAM user with Cost Explorer permissions

### **2. Required IAM Permissions:**
Create an IAM policy with these permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ce:GetCostAndUsage",
                "ce:GetDimensionValues",
                "ce:GetReservationCoverage",
                "ce:GetReservationPurchaseRecommendation",
                "ce:GetReservationUtilization",
                "ce:GetUsageReport"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🚀 **SETUP METHODS**

### **Method 1: Automated Setup Script (Recommended)**

1. **Run the setup script:**
   ```bash
   cd local_version/agent-hub-backend
   npm run setup:aws:costs
   ```

2. **Follow the prompts:**
   - Enter your AWS Access Key ID
   - Enter your AWS Secret Access Key  
   - Choose your AWS Region (default: us-east-1)
   - Test the connection

3. **Restart the backend server:**
   ```bash
   # Stop current server (Ctrl+C)
   node comprehensive-server.js
   ```

### **Method 2: Manual Environment Variables**

1. **Create `.env` file in `agent-hub-backend` directory:**
   ```bash
   # AWS Configuration for Cost Explorer
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   
   # Optional: Set monthly budget for tracking
   AWS_MONTHLY_BUDGET=5000
   ```

2. **Restart the backend server**

### **Method 3: AWS Credentials File**

1. **Create/update `~/.aws/credentials` file:**
   ```ini
   [default]
   aws_access_key_id = your_access_key_here
   aws_secret_access_key = your_secret_key_here
   region = us-east-1
   ```

2. **Restart the backend server**

## 🔍 **VERIFICATION**

### **1. Check Backend Logs:**
Look for these messages when starting the server:
- ✅ `AWS Cost Explorer client initialized successfully`
- ❌ `AWS Cost Explorer not configured: [error message]`

### **2. Test API Endpoint:**
```bash
curl http://localhost:3002/api/v1/aws/status
```

**Expected Response (Configured):**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "region": "us-east-1",
    "message": "Connected to AWS Cost Explorer"
  }
}
```

### **3. Check FinOps Dashboard:**
- Refresh the FinOps dashboard
- Look for "Real AWS Costs" badge instead of mock data
- Verify costs match your AWS billing console

## 📊 **WHAT YOU'LL SEE**

### **Real Data Features:**
- ✅ **Actual AWS service costs** from Cost Explorer
- ✅ **Real daily cost trends** from your account
- ✅ **Accurate service breakdown** (EC2, S3, Lambda, etc.)
- ✅ **Current month spending** vs projections
- ✅ **Regional cost distribution** from your usage

### **Data Source Indicator:**
The API response will include:
```json
{
  "success": true,
  "data": { ... },
  "source": "aws-cost-explorer",
  "timestamp": "2025-11-06T17:30:00.000Z"
}
```

## 🛠️ **TROUBLESHOOTING**

### **Common Issues:**

#### **1. "Unable to find environment variable credentials"**
- **Solution:** Set AWS credentials using one of the methods above
- **Check:** Ensure `.env` file exists and has correct format

#### **2. "Access Denied" or "UnauthorizedOperation"**
- **Solution:** Verify IAM permissions include Cost Explorer access
- **Check:** User has `ce:GetCostAndUsage` permission

#### **3. "Cost Explorer not enabled"**
- **Solution:** Enable Cost Explorer in AWS Console
- **Note:** Takes up to 24 hours to activate

#### **4. "No cost data available"**
- **Solution:** Ensure you have AWS usage generating costs
- **Check:** Cost Explorer shows data in AWS Console

### **Debug Steps:**

1. **Test AWS CLI (if installed):**
   ```bash
   aws ce get-cost-and-usage --time-period Start=2025-11-01,End=2025-11-06 --granularity DAILY --metrics BlendedCost
   ```

2. **Check AWS Console:**
   - Go to AWS Cost Explorer
   - Verify you can see cost data
   - Check if Cost Explorer is enabled

3. **Verify Credentials:**
   ```bash
   aws sts get-caller-identity
   ```

## 🔒 **SECURITY BEST PRACTICES**

### **1. Credential Management:**
- ✅ Use IAM roles in production (recommended)
- ✅ Rotate access keys regularly
- ✅ Never commit `.env` files to version control
- ✅ Use least-privilege IAM policies

### **2. Environment Variables:**
Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### **3. Production Deployment:**
Consider using:
- AWS IAM roles for EC2/Lambda
- AWS Systems Manager Parameter Store
- AWS Secrets Manager

## 🎉 **SUCCESS INDICATORS**

When properly configured, you'll see:
- ✅ Backend logs: "AWS Cost Explorer client initialized successfully"
- ✅ Dashboard shows real costs instead of mock data
- ✅ "Real AWS Costs" badge in dashboard
- ✅ Costs match your AWS billing console
- ✅ Daily cost trends reflect actual usage

## 📞 **SUPPORT**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify AWS Console shows cost data
3. Test with AWS CLI if available
4. Check IAM permissions and policies

**Your FinOps dashboard will now display real AWS costs! 💰🚀**