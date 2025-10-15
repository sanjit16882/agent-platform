#!/usr/bin/env python3
"""
Simple test runner for AgentHub infrastructure tests
Run this to validate Task 1.1 deployment
"""

import sys
import os
import subprocess

def install_requirements():
    """Install required packages for testing"""
    requirements = [
        'boto3>=1.26.0',
        'requests>=2.28.0',
        'pytest>=7.0.0'
    ]
    
    for req in requirements:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', req])
        except subprocess.CalledProcessError as e:
            print(f"Failed to install {req}: {e}")
            return False
    return True

def run_basic_tests():
    """Run basic infrastructure validation tests"""
    print("🧪 Running AgentHub Task 1.1 Validation Tests\n")
    
    import boto3
    import requests
    from botocore.exceptions import ClientError
    
    # Test configuration
    API_BASE_URL = "https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod"
    BUCKET_NAME = "agent-hub-storage-448049831733"
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: S3 Bucket
    tests_total += 1
    try:
        s3 = boto3.client('s3')
        s3.head_bucket(Bucket=BUCKET_NAME)
        print("✅ Test 1: S3 bucket accessible")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Test 1: S3 bucket failed - {e}")
    
    # Test 2: DynamoDB Tables
    tests_total += 1
    try:
        dynamodb = boto3.client('dynamodb')
        tables = ['AgentRegistry', 'ExecutionHistory', 'UserProfiles']
        for table in tables:
            response = dynamodb.describe_table(TableName=table)
            assert response['Table']['TableStatus'] == 'ACTIVE'
        print("✅ Test 2: DynamoDB tables active")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Test 2: DynamoDB tables failed - {e}")
    
    # Test 3: Lambda Functions
    tests_total += 1
    try:
        lambda_client = boto3.client('lambda')
        functions = ['AgentExecutor', 'AgentManager']
        for func in functions:
            response = lambda_client.get_function(FunctionName=func)
            assert response['Configuration']['State'] == 'Active'
        print("✅ Test 3: Lambda functions active")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Test 3: Lambda functions failed - {e}")
    
    # Test 4: API Gateway
    tests_total += 1
    try:
        response = requests.get(f"{API_BASE_URL}/agents", timeout=10)
        # Should return 401 (unauthorized) which means API is working
        assert response.status_code == 401
        print("✅ Test 4: API Gateway responding")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Test 4: API Gateway failed - {e}")
    
    # Test 5: Cognito User Pool
    tests_total += 1
    try:
        cognito = boto3.client('cognito-idp')
        response = cognito.describe_user_pool(UserPoolId='us-east-1_G46Iiw7Sy')
        assert response['UserPool']['Name'] == 'AgentHubUsers'
        print("✅ Test 5: Cognito User Pool configured")
        tests_passed += 1
    except Exception as e:
        print(f"❌ Test 5: Cognito User Pool failed - {e}")
    
    # Summary
    print(f"\n📊 Test Results: {tests_passed}/{tests_total} tests passed")
    
    if tests_passed == tests_total:
        print("🎉 All infrastructure tests passed! Task 1.1 deployment is successful.")
        return True
    else:
        print("⚠️  Some tests failed. Check the errors above.")
        return False

if __name__ == '__main__':
    print("Installing test dependencies...")
    if install_requirements():
        print("Dependencies installed successfully.\n")
        success = run_basic_tests()
        sys.exit(0 if success else 1)
    else:
        print("Failed to install dependencies.")
        sys.exit(1)