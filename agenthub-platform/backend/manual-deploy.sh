#!/bin/bash

# Manual deployment script for AgentHub without CDK bootstrap
echo "Creating AgentHub resources manually..."

# Create S3 bucket
aws s3 mb s3://agent-hub-storage-448049831733 --region us-east-1

# Create DynamoDB tables
echo "Creating DynamoDB tables..."

# Agent Registry Table
aws dynamodb create-table \
    --table-name AgentRegistry \
    --attribute-definitions \
        AttributeName=agent_id,AttributeType=S \
        AttributeName=version,AttributeType=S \
        AttributeName=category,AttributeType=S \
        AttributeName=created_at,AttributeType=S \
        AttributeName=usage_count,AttributeType=N \
        AttributeName=average_rating,AttributeType=N \
    --key-schema \
        AttributeName=agent_id,KeyType=HASH \
        AttributeName=version,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=CategoryIndex,KeySchema=[{AttributeName=category,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL} \
        IndexName=PopularityIndex,KeySchema=[{AttributeName=usage_count,KeyType=HASH},{AttributeName=average_rating,KeyType=RANGE}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

# Execution History Table
aws dynamodb create-table \
    --table-name ExecutionHistory \
    --attribute-definitions \
        AttributeName=user_id,AttributeType=S \
        AttributeName=execution_id,AttributeType=S \
        AttributeName=agent_id,AttributeType=S \
        AttributeName=created_at,AttributeType=S \
    --key-schema \
        AttributeName=user_id,KeyType=HASH \
        AttributeName=execution_id,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=AgentIndex,KeySchema=[{AttributeName=agent_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

# User Profiles Table
aws dynamodb create-table \
    --table-name UserProfiles \
    --attribute-definitions \
        AttributeName=user_id,AttributeType=S \
    --key-schema \
        AttributeName=user_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

echo "Core resources created! Next: Create Lambda functions and API Gateway manually."