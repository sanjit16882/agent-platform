# AgentHub Task 1.1 Testing

## Test Suite Overview

This directory contains comprehensive tests for validating the AgentHub infrastructure deployment (Task 1.1).

## Test Files

### `run_tests.py` - Quick Validation
Simple test runner that validates core infrastructure components:
- ✅ S3 bucket accessibility
- ✅ DynamoDB tables status
- ✅ Lambda functions deployment
- ✅ API Gateway connectivity
- ✅ Cognito User Pool configuration

### `test_infrastructure.py` - Comprehensive Tests
Detailed test suite covering:
- Infrastructure components (S3, DynamoDB, Lambda, Cognito)
- API endpoints and CORS configuration
- Lambda function code structure
- Service integrations and permissions

## Running Tests

### Quick Validation (Recommended)
```bash
cd agent-hub-cdk/tests
python run_tests.py
```

### Comprehensive Testing
```bash
cd agent-hub-cdk/tests
pip install pytest boto3 requests
python test_infrastructure.py
```

### Using pytest
```bash
cd agent-hub-cdk/tests
pytest test_infrastructure.py -v
```

## Test Categories

### 1. Infrastructure Tests
- S3 bucket creation and lifecycle policies
- DynamoDB table schema and indexes
- Lambda function deployment and configuration
- Cognito User Pool setup

### 2. API Tests
- API Gateway endpoint responses
- CORS header configuration
- Authentication requirements

### 3. Integration Tests
- Lambda-DynamoDB permissions
- S3 write permissions
- IAM role configurations

### 4. Code Structure Tests
- Lambda function imports
- Required function existence
- Environment variable configuration

## Expected Results

### Successful Deployment
```
🧪 Running AgentHub Task 1.1 Validation Tests

✅ Test 1: S3 bucket accessible
✅ Test 2: DynamoDB tables active
✅ Test 3: Lambda functions active
✅ Test 4: API Gateway responding
✅ Test 5: Cognito User Pool configured

📊 Test Results: 5/5 tests passed
🎉 All infrastructure tests passed! Task 1.1 deployment is successful.
```

### Common Issues

#### AWS Credentials
```
❌ Test 1: S3 bucket failed - NoCredentialsError
```
**Solution:** Configure AWS credentials with `aws configure`

#### Permissions
```
❌ Test 2: DynamoDB tables failed - AccessDenied
```
**Solution:** Ensure your AWS user has the required permissions

#### Network Issues
```
❌ Test 4: API Gateway failed - ConnectionError
```
**Solution:** Check internet connectivity and API URL

## Test Configuration

Update these values in test files if your deployment differs:

```python
API_BASE_URL = "https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod"
BUCKET_NAME = "agent-hub-storage-448049831733"
USER_POOL_ID = "us-east-1_G46Iiw7Sy"
CLIENT_ID = "ogbc3dna1g1geptovu4d03r3u"
```

## Troubleshooting

### Test Failures
1. **Check AWS credentials:** `aws sts get-caller-identity`
2. **Verify deployment:** `cdk list` and `cdk diff`
3. **Check resource status:** Use AWS Console to verify resources
4. **Review CloudFormation:** Check for deployment errors

### Performance Issues
- Tests may take 30-60 seconds due to AWS API calls
- Network latency can affect API Gateway tests
- DynamoDB table status checks may need retry logic

## Next Steps

After successful testing:
1. ✅ Task 1.1 infrastructure validated
2. 🚀 Ready to proceed with Task 1.2 or Task 3.1
3. 📝 Document any custom configurations
4. 🔄 Set up continuous testing for future changes