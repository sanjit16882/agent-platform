# S3 Test Storage Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd local_version/agent-hub-backend
npm install @aws-sdk/client-s3
```

✅ **Already done!**

### 2. Configure AWS Credentials

#### Option A: Environment Variables (Recommended for Development)

Edit `local_version/agent-hub-backend/.env`:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-key-here

# S3 Bucket
S3_AGENTS_BUCKET=agenthub-agents-storage
```

#### Option B: AWS CLI Profile (Recommended for Production)

```bash
# Configure AWS CLI
aws configure

# The SDK will automatically use these credentials
```

#### Option C: IAM Role (Recommended for EC2/Lambda)

If running on AWS infrastructure, attach an IAM role with S3 permissions.

### 3. Create S3 Bucket

#### Using AWS Console:

1. Go to [S3 Console](https://console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Bucket name: `agenthub-agents-storage`
4. Region: `us-east-1` (or your preferred region)
5. Keep default settings
6. Click "Create bucket"

#### Using AWS CLI:

```bash
aws s3 mb s3://agenthub-agents-storage --region us-east-1
```

### 4. Set Bucket Permissions

#### Using AWS Console:

1. Go to bucket → Permissions
2. Edit Bucket Policy
3. Add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AgentHubTestStorage",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/YOUR-IAM-USER"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::agenthub-agents-storage/*",
        "arn:aws:s3:::agenthub-agents-storage"
      ]
    }
  ]
}
```

Replace:
- `YOUR-ACCOUNT-ID` with your AWS account ID
- `YOUR-IAM-USER` with your IAM username

### 5. Test the Setup

#### Start the Backend:

```bash
cd local_version/agent-hub-backend
npm start
```

#### Start the Frontend:

```bash
cd local_version/agent-hub-ui
npm start
```

#### Run a Test:

1. Go to http://localhost:3000
2. Navigate to Testing → DDATF Testing
3. Select an agent
4. Configure and run tests
5. Check console logs:

```
✅ Saved test run to S3: run-1234567890-abc123
```

#### Verify in S3:

```bash
aws s3 ls s3://agenthub-agents-storage/test-runs/
```

Should show:
```
2024-11-20 10:00:00  1234 run-1234567890-abc123.json
```

## Troubleshooting

### Error: "Access Denied"

**Problem**: AWS credentials don't have S3 permissions

**Solution**:
1. Check IAM user has S3 permissions
2. Verify bucket policy allows your IAM user
3. Check AWS credentials in `.env` are correct

```bash
# Test AWS credentials
aws sts get-caller-identity
```

### Error: "Bucket does not exist"

**Problem**: S3 bucket not created or wrong name

**Solution**:
1. Create bucket: `aws s3 mb s3://agenthub-agents-storage`
2. Verify bucket name in `.env` matches
3. Check region matches

```bash
# List your buckets
aws s3 ls
```

### Error: "Region mismatch"

**Problem**: Bucket in different region than configured

**Solution**:
1. Check bucket region in S3 console
2. Update `AWS_REGION` in `.env` to match
3. Or create bucket in correct region

### Error: "Failed to save test run to S3"

**Problem**: Network or AWS service issue

**Solution**:
1. Check internet connection
2. Verify AWS service status
3. Check console logs for detailed error
4. **Fallback**: localStorage still works!

### No Data in Test History Tab

**Problem**: S3 fetch failing or no tests run yet

**Solution**:
1. Run a test first in DDATF tab
2. Check console for S3 save confirmation
3. Verify S3 bucket has files
4. Check backend logs for errors

## Cost Estimation

### S3 Storage Costs (us-east-1):

- **Storage**: $0.023 per GB/month
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests

### Example Usage:

- 1,000 test runs/month
- Average 10 KB per test run
- 100 views/month

**Monthly Cost**:
- Storage: 10 MB = $0.0002
- PUT: 1,000 = $0.005
- GET: 100 = $0.00004
- **Total: ~$0.01/month** (essentially free!)

## Security Best Practices

### 1. Use IAM Roles (Production)

Don't hardcode credentials. Use IAM roles when running on AWS.

### 2. Enable Bucket Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket agenthub-agents-storage \
  --versioning-configuration Status=Enabled
```

### 3. Enable Server-Side Encryption

```bash
aws s3api put-bucket-encryption \
  --bucket agenthub-agents-storage \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 4. Enable Access Logging

```bash
aws s3api put-bucket-logging \
  --bucket agenthub-agents-storage \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "agenthub-logs",
      "TargetPrefix": "s3-access-logs/"
    }
  }'
```

### 5. Restrict Public Access

Ensure "Block all public access" is enabled (default).

## Alternative: Local Development Without S3

If you don't want to set up S3 for local development:

1. Tests will still work with localStorage
2. Data persists across page refreshes
3. Just won't be shared across devices
4. No AWS costs

The application gracefully falls back to localStorage if S3 is unavailable.

## Production Deployment

### Using AWS Lambda:

1. Attach IAM role with S3 permissions to Lambda
2. No need for AWS credentials in environment
3. Use same S3 bucket

### Using EC2:

1. Attach IAM role with S3 permissions to EC2 instance
2. Or use AWS credentials in environment
3. Use same S3 bucket

### Using Docker:

```dockerfile
# Pass AWS credentials as environment variables
ENV AWS_REGION=us-east-1
ENV AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
ENV AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
ENV S3_AGENTS_BUCKET=agenthub-agents-storage
```

## Monitoring

### CloudWatch Metrics:

Monitor S3 bucket metrics:
- Number of objects
- Bucket size
- Request count
- Error rate

### Application Logs:

Check backend logs for:
```
✅ Saved test run to S3
📜 Retrieved X test runs from S3
❌ Error saving to S3: [error details]
```

## Backup Strategy

### S3 Versioning:

Enable versioning to keep history of all changes.

### Cross-Region Replication:

For critical data, replicate to another region:

```bash
aws s3api put-bucket-replication \
  --bucket agenthub-agents-storage \
  --replication-configuration file://replication.json
```

### Lifecycle Policies:

Archive old test runs to Glacier:

```json
{
  "Rules": [{
    "Id": "ArchiveOldTests",
    "Status": "Enabled",
    "Transitions": [{
      "Days": 90,
      "StorageClass": "GLACIER"
    }]
  }]
}
```

---

**Need Help?**

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/
- Check backend logs: `local_version/agent-hub-backend/logs/`
- Check browser console for frontend errors
