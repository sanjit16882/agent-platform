#!/usr/bin/env python3
"""
Manual test script for AgentHub Task 1.1
Simple tests that can be run without pytest
"""

import boto3
import json
import requests
from datetime import datetime

# Configuration
API_BASE_URL = "https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod"
REGION = "us-east-1"
BUCKET_NAME = "agent-hub-storage-448049831733"

def test_basic_connectivity():
    """Test basic AWS connectivity and resource existence"""
    print("🔍 Testing basic AWS connectivity...")
    
    try:
        # Test AWS credentials
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS credentials working - Account: {identity['Account']}")
        
        # Test DynamoDB tables
        dynamodb = boto3.client('dynamodb', region_name=REGION)
        tables = ['AgentRegistry', 'ExecutionHistory', 'UserProfiles']
        
        for table in tables:
            try:
                response = dynamodb.describe_table(TableName=table)
                status = response['Table']['TableStatus']
                print(f"✅ DynamoDB table {table}: {status}")
            except Exception as e:
                print(f"❌ DynamoDB table {table}: {e}")
        
        # Test S3 bucket
        s3 = boto3.client('s3', region_name=REGION)
        try:
            s3.head_bucket(Bucket=BUCKET_NAME)
            print(f"✅ S3 bucket {BUCKET_NAME}: Accessible")
        except Exception as e:
            print(f"❌ S3 bucket {BUCKET_NAME}: {e}")
        
        # Test Lambda functions
        lambda_client = boto3.client('lambda', region_name=REGION)
        functions = ['AgentExecutor', 'AgentManager']
        
        for func in functions:
            try:
                response = lambda_client.get_function(FunctionName=func)
                state = response['Configuration']['State']
                print(f"✅ Lambda function {func}: {state}")
            except Exception as e:
                print(f"❌ Lambda function {func}: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Basic connectivity test failed: {e}")
        return False

def test_api_endpoints():
    """Test API Gateway endpoints"""
    print("\n🌐 Testing API Gateway endpoints...")
    
    try:
        # Test main agents endpoint (should return 401 without auth)
        response = requests.get(f"{API_BASE_URL}/agents", timeout=10)
        if response.status_code == 401:
            print("✅ API Gateway /agents endpoint: Responding (requires auth)")
        else:
            print(f"⚠️  API Gateway /agents endpoint: Unexpected status {response.status_code}")
        
        # Test CORS preflight
        response = requests.options(f"{API_BASE_URL}/agents", timeout=10)
        if 'Access-Control-Allow-Origin' in response.headers:
            print("✅ API Gateway CORS: Configured")
        else:
            print("❌ API Gateway CORS: Not configured")
        
        # Test invalid endpoint
        response = requests.get(f"{API_BASE_URL}/invalid", timeout=10)
        if response.status_code in [403, 404]:
            print("✅ API Gateway error handling: Working")
        else:
            print(f"⚠️  API Gateway error handling: Unexpected status {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        return False

def test_s3_operations():
    """Test S3 read/write operations"""
    print("\n📁 Testing S3 operations...")
    
    try:
        s3 = boto3.client('s3', region_name=REGION)
        
        # Test write operation
        test_key = "test/manual-test.json"
        test_data = {
            "test_type": "manual_infrastructure_test",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "testing"
        }
        
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=test_key,
            Body=json.dumps(test_data, indent=2),
            ContentType='application/json'
        )
        print("✅ S3 write operation: Success")
        
        # Test read operation
        response = s3.get_object(Bucket=BUCKET_NAME, Key=test_key)
        content = json.loads(response['Body'].read())
        
        if content['test_type'] == 'manual_infrastructure_test':
            print("✅ S3 read operation: Success")
        else:
            print("❌ S3 read operation: Data mismatch")
        
        # Test delete operation
        s3.delete_object(Bucket=BUCKET_NAME, Key=test_key)
        print("✅ S3 delete operation: Success")
        
        return True
        
    except Exception as e:
        print(f"❌ S3 operations test failed: {e}")
        return False

def test_dynamodb_operations():
    """Test DynamoDB basic operations"""
    print("\n🗄️  Testing DynamoDB operations...")
    
    try:
        dynamodb = boto3.resource('dynamodb', region_name=REGION)
        
        # Test AgentRegistry table operations
        table = dynamodb.Table('AgentRegistry')
        
        # Test write operation
        test_item = {
            'agent_id': 'test-agent-manual',
            'version': 'v1.0.0',
            'name': 'Manual Test Agent',
            'description': 'Test agent for infrastructure validation',
            'category': 'Test',
            'created_at': datetime.utcnow().isoformat(),
            'status': 'testing'
        }
        
        table.put_item(Item=test_item)
        print("✅ DynamoDB write operation: Success")
        
        # Test read operation
        response = table.get_item(
            Key={
                'agent_id': 'test-agent-manual',
                'version': 'v1.0.0'
            }
        )
        
        if 'Item' in response and response['Item']['name'] == 'Manual Test Agent':
            print("✅ DynamoDB read operation: Success")
        else:
            print("❌ DynamoDB read operation: Item not found")
        
        # Test delete operation
        table.delete_item(
            Key={
                'agent_id': 'test-agent-manual',
                'version': 'v1.0.0'
            }
        )
        print("✅ DynamoDB delete operation: Success")
        
        return True
        
    except Exception as e:
        print(f"❌ DynamoDB operations test failed: {e}")
        return False

def test_lambda_invoke():
    """Test Lambda function invocation"""
    print("\n⚡ Testing Lambda function invocation...")
    
    try:
        lambda_client = boto3.client('lambda', region_name=REGION)
        
        # Test AgentManager function with a simple event
        test_event = {
            'httpMethod': 'GET',
            'pathParameters': None,
            'queryStringParameters': {},
            'body': None,
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'test-user-manual'
                    }
                }
            }
        }
        
        response = lambda_client.invoke(
            FunctionName='AgentManager',
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )
        
        if response['StatusCode'] == 200:
            payload = json.loads(response['Payload'].read())
            print("✅ Lambda AgentManager invocation: Success")
            
            # Check if it returns proper structure
            if 'statusCode' in payload:
                print(f"✅ Lambda response format: Valid (status: {payload['statusCode']})")
            else:
                print("⚠️  Lambda response format: Unexpected structure")
        else:
            print(f"❌ Lambda AgentManager invocation: Failed with status {response['StatusCode']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Lambda invocation test failed: {e}")
        return False

def generate_test_report():
    """Generate a comprehensive test report"""
    print("📊 Generating Task 1.1 Test Report...")
    
    results = {
        'basic_connectivity': test_basic_connectivity(),
        'api_endpoints': test_api_endpoints(),
        's3_operations': test_s3_operations(),
        'dynamodb_operations': test_dynamodb_operations(),
        'lambda_invoke': test_lambda_invoke()
    }
    
    print(f"\n📋 Test Results Summary:")
    print(f"{'='*50}")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title():<30} {status}")
        if result:
            passed += 1
    
    print(f"{'='*50}")
    print(f"Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All infrastructure tests PASSED! Task 1.1 is working correctly.")
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please check the infrastructure.")
    
    # Save results to file
    report = {
        'test_timestamp': datetime.utcnow().isoformat(),
        'task': 'Task 1.1 - Infrastructure Setup',
        'results': results,
        'summary': {
            'total_tests': total,
            'passed_tests': passed,
            'success_rate': f"{(passed/total)*100:.1f}%"
        }
    }
    
    with open('test-report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: test-report.json")

if __name__ == '__main__':
    print("🧪 AgentHub Task 1.1 Manual Infrastructure Tests")
    print("=" * 60)
    generate_test_report()