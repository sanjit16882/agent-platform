#!/usr/bin/env python3
"""
Manual deployment script for AgentHub infrastructure
This script creates AWS resources using boto3 instead of CDK to work around bootstrap issues
"""

import boto3
import json
import time
import sys
from botocore.exceptions import ClientError

# AWS clients
dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')
apigateway = boto3.client('apigateway')
cognito = boto3.client('cognito-idp')
iam = boto3.client('iam')

def create_s3_bucket():
    """Create S3 bucket for agent storage"""
    bucket_name = f"agent-hub-storage-{boto3.client('sts').get_caller_identity()['Account']}"
    
    try:
        # Check if bucket exists
        s3.head_bucket(Bucket=bucket_name)
        print(f"✅ S3 bucket {bucket_name} already exists")
        return bucket_name
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            # Bucket doesn't exist, create it
            try:
                s3.create_bucket(Bucket=bucket_name)
                
                # Add lifecycle configuration
                lifecycle_config = {
                    'Rules': [
                        {
                            'ID': 'DeleteOldExecutions',
                            'Status': 'Enabled',
                            'Filter': {'Prefix': 'executions/'},
                            'Expiration': {'Days': 30}
                        }
                    ]
                }
                s3.put_bucket_lifecycle_configuration(
                    Bucket=bucket_name,
                    LifecycleConfiguration=lifecycle_config
                )
                
                # Block public access
                s3.put_public_access_block(
                    Bucket=bucket_name,
                    PublicAccessBlockConfiguration={
                        'BlockPublicAcls': True,
                        'IgnorePublicAcls': True,
                        'BlockPublicPolicy': True,
                        'RestrictPublicBuckets': True
                    }
                )
                
                print(f"✅ Created S3 bucket: {bucket_name}")
                return bucket_name
            except ClientError as e:
                print(f"❌ Failed to create S3 bucket: {e}")
                return None
        else:
            print(f"❌ Error checking S3 bucket: {e}")
            return None

def create_dynamodb_tables():
    """Create DynamoDB tables"""
    tables = []
    
    # Agent Registry Table
    try:
        table_name = 'AgentRegistry'
        dynamodb.describe_table(TableName=table_name)
        print(f"✅ DynamoDB table {table_name} already exists")
        tables.append(table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            try:
                response = dynamodb.create_table(
                    TableName='AgentRegistry',
                    KeySchema=[
                        {'AttributeName': 'agent_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'version', 'KeyType': 'RANGE'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'agent_id', 'AttributeType': 'S'},
                        {'AttributeName': 'version', 'AttributeType': 'S'},
                        {'AttributeName': 'category', 'AttributeType': 'S'},
                        {'AttributeName': 'created_at', 'AttributeType': 'S'},
                        {'AttributeName': 'usage_count', 'AttributeType': 'N'},
                        {'AttributeName': 'average_rating', 'AttributeType': 'N'}
                    ],
                    BillingMode='PAY_PER_REQUEST',
                    GlobalSecondaryIndexes=[
                        {
                            'IndexName': 'CategoryIndex',
                            'KeySchema': [
                                {'AttributeName': 'category', 'KeyType': 'HASH'},
                                {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                            ],
                            'Projection': {'ProjectionType': 'ALL'}
                        },
                        {
                            'IndexName': 'PopularityIndex',
                            'KeySchema': [
                                {'AttributeName': 'usage_count', 'KeyType': 'HASH'},
                                {'AttributeName': 'average_rating', 'KeyType': 'RANGE'}
                            ],
                            'Projection': {'ProjectionType': 'ALL'}
                        }
                    ]
                )
                print(f"✅ Created DynamoDB table: AgentRegistry")
                tables.append('AgentRegistry')
            except ClientError as e:
                print(f"❌ Failed to create AgentRegistry table: {e}")
    
    # Execution History Table
    try:
        table_name = 'ExecutionHistory'
        dynamodb.describe_table(TableName=table_name)
        print(f"✅ DynamoDB table {table_name} already exists")
        tables.append(table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            try:
                response = dynamodb.create_table(
                    TableName='ExecutionHistory',
                    KeySchema=[
                        {'AttributeName': 'user_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'execution_id', 'KeyType': 'RANGE'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'user_id', 'AttributeType': 'S'},
                        {'AttributeName': 'execution_id', 'AttributeType': 'S'},
                        {'AttributeName': 'agent_id', 'AttributeType': 'S'},
                        {'AttributeName': 'created_at', 'AttributeType': 'S'}
                    ],
                    BillingMode='PAY_PER_REQUEST',
                    GlobalSecondaryIndexes=[
                        {
                            'IndexName': 'AgentIndex',
                            'KeySchema': [
                                {'AttributeName': 'agent_id', 'KeyType': 'HASH'},
                                {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                            ],
                            'Projection': {'ProjectionType': 'ALL'}
                        }
                    ]
                )
                print(f"✅ Created DynamoDB table: ExecutionHistory")
                tables.append('ExecutionHistory')
            except ClientError as e:
                print(f"❌ Failed to create ExecutionHistory table: {e}")
    
    # User Profiles Table
    try:
        table_name = 'UserProfiles'
        dynamodb.describe_table(TableName=table_name)
        print(f"✅ DynamoDB table {table_name} already exists")
        tables.append(table_name)
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            try:
                response = dynamodb.create_table(
                    TableName='UserProfiles',
                    KeySchema=[
                        {'AttributeName': 'user_id', 'KeyType': 'HASH'}
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'user_id', 'AttributeType': 'S'}
                    ],
                    BillingMode='PAY_PER_REQUEST'
                )
                print(f"✅ Created DynamoDB table: UserProfiles")
                tables.append('UserProfiles')
            except ClientError as e:
                print(f"❌ Failed to create UserProfiles table: {e}")
    
    return tables

def create_cognito_user_pool():
    """Create Cognito User Pool"""
    try:
        # Check if user pool exists (we'll search by name)
        response = cognito.list_user_pools(MaxResults=50)
        for pool in response.get('UserPools', []):
            if pool['Name'] == 'AgentHubUsers':
                print(f"✅ Cognito User Pool already exists: {pool['Id']}")
                
                # Get client ID
                clients = cognito.list_user_pool_clients(UserPoolId=pool['Id'])
                client_id = None
                if clients.get('UserPoolClients'):
                    client_id = clients['UserPoolClients'][0]['ClientId']
                
                return pool['Id'], client_id
        
        # Create user pool
        response = cognito.create_user_pool(
            PoolName='AgentHubUsers',
            Policies={
                'PasswordPolicy': {
                    'MinimumLength': 8,
                    'RequireUppercase': True,
                    'RequireLowercase': True,
                    'RequireNumbers': True,
                    'RequireSymbols': False
                }
            },
            AutoVerifiedAttributes=['email'],
            AliasAttributes=['email'],
            UsernameConfiguration={
                'CaseSensitive': False
            }
        )
        
        user_pool_id = response['UserPool']['Id']
        print(f"✅ Created Cognito User Pool: {user_pool_id}")
        
        # Create user pool client
        client_response = cognito.create_user_pool_client(
            UserPoolId=user_pool_id,
            ClientName='AgentHubClient',
            GenerateSecret=False,
            ExplicitAuthFlows=[
                'ALLOW_USER_PASSWORD_AUTH',
                'ALLOW_ADMIN_USER_PASSWORD_AUTH',
                'ALLOW_USER_SRP_AUTH',
                'ALLOW_REFRESH_TOKEN_AUTH'
            ]
        )
        
        client_id = client_response['UserPoolClient']['ClientId']
        print(f"✅ Created Cognito User Pool Client: {client_id}")
        
        return user_pool_id, client_id
        
    except ClientError as e:
        print(f"❌ Failed to create Cognito User Pool: {e}")
        return None, None

def test_bedrock_access():
    """Test if we can access Bedrock"""
    try:
        bedrock = boto3.client('bedrock')
        response = bedrock.list_foundation_models()
        print("✅ Bedrock access confirmed")
        return True
    except ClientError as e:
        print(f"⚠️  Bedrock access issue: {e}")
        return False

def main():
    """Main deployment function"""
    print("🚀 Starting AgentHub manual deployment...")
    
    # Test AWS credentials
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS credentials confirmed for account: {identity['Account']}")
    except Exception as e:
        print(f"❌ AWS credentials issue: {e}")
        return False
    
    # Test Bedrock access
    bedrock_ok = test_bedrock_access()
    
    # Create S3 bucket
    bucket_name = create_s3_bucket()
    if not bucket_name:
        print("❌ Failed to create S3 bucket, stopping deployment")
        return False
    
    # Create DynamoDB tables
    tables = create_dynamodb_tables()
    if len(tables) < 3:
        print("⚠️  Some DynamoDB tables failed to create")
    
    # Wait for tables to be active
    print("⏳ Waiting for DynamoDB tables to be active...")
    for table_name in tables:
        waiter = dynamodb.get_waiter('table_exists')
        try:
            waiter.wait(TableName=table_name, WaiterConfig={'Delay': 2, 'MaxAttempts': 30})
            print(f"✅ Table {table_name} is active")
        except Exception as e:
            print(f"⚠️  Table {table_name} status unknown: {e}")
    
    # Create Cognito User Pool
    user_pool_id, client_id = create_cognito_user_pool()
    
    # Summary
    print("\n📋 Deployment Summary:")
    print(f"S3 Bucket: {bucket_name}")
    print(f"DynamoDB Tables: {', '.join(tables)}")
    print(f"Cognito User Pool: {user_pool_id}")
    print(f"Cognito Client: {client_id}")
    print(f"Bedrock Access: {'✅' if bedrock_ok else '❌'}")
    
    # Save configuration
    config = {
        'bucket_name': bucket_name,
        'tables': tables,
        'user_pool_id': user_pool_id,
        'client_id': client_id,
        'bedrock_available': bedrock_ok
    }
    
    with open('deployment-config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("\n✅ Manual deployment completed! Configuration saved to deployment-config.json")
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)