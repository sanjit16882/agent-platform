#!/usr/bin/env python3
"""
Test cases for AgentHub Task 1.1 Infrastructure
Tests AWS resources, Lambda functions, and API endpoints
"""

import boto3
import json
import pytest
import requests
from botocore.exceptions import ClientError
from datetime import datetime

# Test configuration
API_BASE_URL = "https://z5ujq1k916.execute-api.us-east-1.amazonaws.com/prod"
REGION = "us-east-1"
BUCKET_NAME = "agent-hub-storage-448049831733"
USER_POOL_ID = "us-east-1_G46Iiw7Sy"
CLIENT_ID = "ogbc3dna1g1geptovu4d03r3u"

# AWS clients
dynamodb = boto3.client('dynamodb', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)
cognito = boto3.client('cognito-idp', region_name=REGION)

class TestInfrastructure:
    """Test AWS infrastructure components"""
    
    def test_s3_bucket_exists(self):
        """Test S3 bucket creation and configuration"""
        try:
            response = s3.head_bucket(Bucket=BUCKET_NAME)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
            print("✅ S3 bucket exists and accessible")
        except ClientError as e:
            pytest.fail(f"S3 bucket test failed: {e}")
    
    def test_s3_bucket_lifecycle(self):
        """Test S3 bucket lifecycle configuration"""
        try:
            response = s3.get_bucket_lifecycle_configuration(Bucket=BUCKET_NAME)
            rules = response.get('Rules', [])
            
            # Check for execution cleanup rule
            cleanup_rule = next((rule for rule in rules if rule['ID'] == 'DeleteOldExecutions'), None)
            assert cleanup_rule is not None, "Lifecycle rule not found"
            assert cleanup_rule['Status'] == 'Enabled'
            assert cleanup_rule['Expiration']['Days'] == 30
            print("✅ S3 lifecycle configuration correct")
        except ClientError as e:
            pytest.fail(f"S3 lifecycle test failed: {e}")
    
    def test_dynamodb_tables_exist(self):
        """Test DynamoDB table creation"""
        required_tables = ['AgentRegistry', 'ExecutionHistory', 'UserProfiles']
        
        for table_name in required_tables:
            try:
                response = dynamodb.describe_table(TableName=table_name)
                assert response['Table']['TableStatus'] == 'ACTIVE'
                print(f"✅ DynamoDB table {table_name} is active")
            except ClientError as e:
                pytest.fail(f"DynamoDB table {table_name} test failed: {e}")
    
    def test_dynamodb_agent_registry_schema(self):
        """Test AgentRegistry table schema and indexes"""
        try:
            response = dynamodb.describe_table(TableName='AgentRegistry')
            table = response['Table']
            
            # Check primary key
            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            assert key_schema.get('agent_id') == 'HASH'
            assert key_schema.get('version') == 'RANGE'
            
            # Check GSIs
            gsi_names = [gsi['IndexName'] for gsi in table.get('GlobalSecondaryIndexes', [])]
            assert 'CategoryIndex' in gsi_names
            assert 'PopularityIndex' in gsi_names
            
            print("✅ AgentRegistry table schema correct")
        except ClientError as e:
            pytest.fail(f"AgentRegistry schema test failed: {e}")
    
    def test_lambda_functions_exist(self):
        """Test Lambda function deployment"""
        required_functions = ['AgentExecutor', 'AgentManager']
        
        for function_name in required_functions:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                assert response['Configuration']['State'] == 'Active'
                assert response['Configuration']['Runtime'] == 'python3.9'
                print(f"✅ Lambda function {function_name} is active")
            except ClientError as e:
                pytest.fail(f"Lambda function {function_name} test failed: {e}")
    
    def test_lambda_environment_variables(self):
        """Test Lambda environment variable configuration"""
        try:
            # Test AgentExecutor environment
            response = lambda_client.get_function(FunctionName='AgentExecutor')
            env_vars = response['Configuration']['Environment']['Variables']
            
            required_vars = [
                'AGENT_REGISTRY_TABLE',
                'EXECUTION_HISTORY_TABLE', 
                'USER_PROFILES_TABLE',
                'STORAGE_BUCKET',
                'BEDROCK_MODEL_ID'
            ]
            
            for var in required_vars:
                assert var in env_vars, f"Missing environment variable: {var}"
            
            assert env_vars['STORAGE_BUCKET'] == BUCKET_NAME
            assert 'claude-3-5-haiku' in env_vars['BEDROCK_MODEL_ID']
            
            print("✅ Lambda environment variables configured correctly")
        except ClientError as e:
            pytest.fail(f"Lambda environment test failed: {e}")
    
    def test_cognito_user_pool_exists(self):
        """Test Cognito User Pool configuration"""
        try:
            response = cognito.describe_user_pool(UserPoolId=USER_POOL_ID)
            pool = response['UserPool']
            
            assert pool['Name'] == 'AgentHubUsers'
            assert 'email' in pool['AutoVerifiedAttributes']
            assert 'email' in pool['AliasAttributes']
            
            # Check password policy
            password_policy = pool['Policies']['PasswordPolicy']
            assert password_policy['MinimumLength'] == 8
            assert password_policy['RequireUppercase'] == True
            assert password_policy['RequireLowercase'] == True
            assert password_policy['RequireNumbers'] == True
            
            print("✅ Cognito User Pool configured correctly")
        except ClientError as e:
            pytest.fail(f"Cognito User Pool test failed: {e}")

class TestAPIEndpoints:
    """Test API Gateway endpoints"""
    
    def test_api_gateway_responds(self):
        """Test API Gateway is responding"""
        try:
            response = requests.get(f"{API_BASE_URL}/agents", timeout=10)
            # Should return 401 Unauthorized (expected without auth)
            assert response.status_code == 401
            assert "Unauthorized" in response.text
            print("✅ API Gateway responding correctly (requires auth)")
        except requests.RequestException as e:
            pytest.fail(f"API Gateway test failed: {e}")
    
    def test_api_cors_headers(self):
        """Test CORS configuration"""
        try:
            response = requests.options(f"{API_BASE_URL}/agents", timeout=10)
            headers = response.headers
            
            # Check CORS headers are present
            assert 'Access-Control-Allow-Origin' in headers
            assert 'Access-Control-Allow-Methods' in headers
            assert 'Access-Control-Allow-Headers' in headers
            
            print("✅ API CORS headers configured correctly")
        except requests.RequestException as e:
            pytest.fail(f"API CORS test failed: {e}")

class TestLambdaFunctions:
    """Test Lambda function code and logic"""
    
    def test_agent_manager_import(self):
        """Test AgentManager Lambda can be imported"""
        try:
            # Test basic import and function structure
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '../lambda/agent-manager'))
            
            import agent_manager
            
            # Check required functions exist
            assert hasattr(agent_manager, 'lambda_handler')
            assert hasattr(agent_manager, 'list_agents')
            assert hasattr(agent_manager, 'register_agent')
            
            print("✅ AgentManager Lambda code structure correct")
        except ImportError as e:
            pytest.fail(f"AgentManager import test failed: {e}")
    
    def test_agent_executor_import(self):
        """Test AgentExecutor Lambda can be imported"""
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '../lambda/agent-executor'))
            
            import agent_executor
            
            # Check required functions exist
            assert hasattr(agent_executor, 'lambda_handler')
            assert hasattr(agent_executor, 'execute_agent')
            assert hasattr(agent_executor, 'execute_qe_agent')
            
            print("✅ AgentExecutor Lambda code structure correct")
        except ImportError as e:
            pytest.fail(f"AgentExecutor import test failed: {e}")

class TestIntegration:
    """Test service integration"""
    
    def test_lambda_dynamodb_permissions(self):
        """Test Lambda can access DynamoDB"""
        try:
            # This would require actual Lambda execution
            # For now, we test the IAM role exists
            iam = boto3.client('iam')
            
            # Get Lambda function role
            lambda_response = lambda_client.get_function(FunctionName='AgentExecutor')
            role_arn = lambda_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Check role exists
            role_response = iam.get_role(RoleName=role_name)
            assert role_response['Role']['RoleName'] == role_name
            
            print("✅ Lambda IAM role exists")
        except ClientError as e:
            pytest.fail(f"Lambda IAM test failed: {e}")
    
    def test_s3_write_permissions(self):
        """Test S3 write permissions"""
        try:
            # Test writing a small test file
            test_key = "test/infrastructure-test.json"
            test_data = {"test": "infrastructure", "timestamp": datetime.utcnow().isoformat()}
            
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=test_key,
                Body=json.dumps(test_data),
                ContentType='application/json'
            )
            
            # Verify file exists
            response = s3.head_object(Bucket=BUCKET_NAME, Key=test_key)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
            
            # Clean up
            s3.delete_object(Bucket=BUCKET_NAME, Key=test_key)
            
            print("✅ S3 write permissions working")
        except ClientError as e:
            pytest.fail(f"S3 write test failed: {e}")

def run_all_tests():
    """Run all infrastructure tests"""
    print("🧪 Running AgentHub Task 1.1 Infrastructure Tests...\n")
    
    test_classes = [TestInfrastructure, TestAPIEndpoints, TestLambdaFunctions, TestIntegration]
    
    for test_class in test_classes:
        print(f"\n📋 Running {test_class.__name__} tests:")
        instance = test_class()
        
        for method_name in dir(instance):
            if method_name.startswith('test_'):
                try:
                    method = getattr(instance, method_name)
                    method()
                except Exception as e:
                    print(f"❌ {method_name}: {e}")
                    continue
    
    print("\n🎉 Infrastructure tests completed!")

if __name__ == '__main__':
    run_all_tests()