# How to Enable Real AWS Bedrock

## Current Status: MOCK Mode

Your system is currently showing **"MOCK"** because:
- ✅ Development mode is active (safe for testing)
- ❌ No AWS credentials configured
- ❌ Real Bedrock API not connected

## Why Use Mock Mode?

**Mock mode is actually GOOD for development:**
- ✅ No AWS costs
- ✅ Fast responses
- ✅ No API rate limits
- ✅ Works offline
- ✅ Predictable behavior for testing

## When to Enable Real Bedrock?

Enable real Bedrock when you need:
- 🎯 Production-quality AI responses
- 🎯 Real model capabilities (Claude 3, Titan, etc.)
- 🎯 Actual cost tracking
- 🎯 Production deployment

---

## Steps to Enable Real AWS Bedrock

### Step 1: Get AWS Credentials

1. **Log into AWS Console**: https://console.aws.amazon.com
2. **Go to IAM** → Users → Your User
3. **Security Credentials** tab
4. **Create Access Key** → Choose "Application running outside AWS"
5. **Save the credentials** (you won't see them again!)

### Step 2: Enable Bedrock Model Access

1. **Go to AWS Bedrock Console**: https://console.aws.amazon.com/bedrock
2. **Model Access** (left sidebar)
3. **Request Access** for these models:
   - ✅ Anthropic Claude 3 Haiku
   - ✅ Anthropic Claude 3 Sonnet
   - ✅ Amazon Titan Text Express
   - ✅ Meta Llama 3 (optional)
4. **Wait for approval** (usually instant)

### Step 3: Configure Your Environment

Edit `local_version/.env`:

```env
# AWS Configuration for Real Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_MONTHLY_BUDGET=1000
ENABLE_REAL_COST_TRACKING=true
```

**⚠️ IMPORTANT SECURITY NOTES:**
- Never commit `.env` to git (it's in `.gitignore`)
- Use IAM roles in production (not access keys)
- Set up billing alerts in AWS
- Restrict IAM permissions to only Bedrock

### Step 4: Restart the Backend

```bash
cd local_version/agent-hub-backend
npm run dev
```

Or if using the start script:
```bash
cd local_version
.\restart-backend.bat
```

### Step 5: Verify Real Bedrock is Active

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Check the Bedrock Status card**:
   - Should show: **Real AI: ✅ Yes** (instead of Mock Data)
   - Badge should be **LIVE** (green) instead of **MOCK** (yellow)
3. **Click "Test Connection"** to verify it works

---

## Cost Considerations

### Estimated Costs (per 1M tokens)

| Model | Input Cost | Output Cost | Best For |
|-------|-----------|-------------|----------|
| Claude 3 Haiku | $0.25 | $1.25 | Fast, cheap tasks |
| Claude 3 Sonnet | $3.00 | $15.00 | Complex reasoning |
| Titan Text Express | $0.80 | $0.80 | Budget option |

### Typical Usage Costs

**For development/testing:**
- ~100 agent executions/day
- ~500 tokens per execution
- **Estimated: $1-5/day** with Haiku

**For production:**
- Depends on your usage
- Set up AWS Budget Alerts
- Monitor in AWS Cost Explorer

### Cost Protection Features

The system includes:
- ✅ Automatic model selection (cheapest for task)
- ✅ Token limit enforcement
- ✅ Cost tracking per execution
- ✅ Monthly budget monitoring
- ✅ Alerts when approaching limits

---

## Troubleshooting

### Still Shows "MOCK" After Adding Credentials?

1. **Check .env file** - Make sure credentials are uncommented
2. **Restart backend** - Changes require restart
3. **Check AWS credentials** - Test with AWS CLI:
   ```bash
   aws bedrock list-foundation-models --region us-east-1
   ```
4. **Check model access** - Verify in Bedrock console

### "Access Denied" Errors?

Your IAM user needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel"
      ],
      "Resource": "*"
    }
  ]
}
```

### High Costs?

1. **Check usage** in AWS Cost Explorer
2. **Review agent configurations** - Some may use expensive models
3. **Set stricter token limits** in agent configs
4. **Use Haiku instead of Sonnet** for simple tasks
5. **Enable request throttling** in production

---

## Recommended Setup for Different Scenarios

### 🧪 Development/Testing
```env
# Use MOCK mode (current setup)
# No AWS credentials needed
# Zero cost, fast responses
```

### 🚀 Staging/Pre-Production
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_MONTHLY_BUDGET=100
ENABLE_REAL_COST_TRACKING=true
```

### 🏭 Production
```env
# Use IAM roles instead of access keys
# Set up CloudWatch alarms
# Enable detailed cost tracking
AWS_REGION=us-east-1
AWS_MONTHLY_BUDGET=1000
ENABLE_REAL_COST_TRACKING=true
```

---

## Alternative: Keep Using Mock Mode

**Mock mode is perfectly fine for:**
- ✅ UI/UX development
- ✅ Testing workflows
- ✅ Demos and presentations
- ✅ Learning the platform
- ✅ Development without AWS account

**The system works identically in both modes**, just with simulated AI responses instead of real ones.

---

## Summary

**Current State:**
- Status: MOCK mode (development)
- Cost: $0
- Functionality: Full (with simulated AI)

**To Enable Real Bedrock:**
1. Add AWS credentials to `.env`
2. Enable model access in AWS Bedrock
3. Restart backend
4. Verify "Real AI: ✅ Yes" in UI

**Recommendation:**
- Keep MOCK mode for development
- Enable real Bedrock only when needed
- Monitor costs carefully
- Use budget alerts

---

**Need Help?**
- AWS Bedrock Docs: https://docs.aws.amazon.com/bedrock/
- Cost Calculator: https://calculator.aws/
- IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
