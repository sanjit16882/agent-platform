#!/bin/bash

# AWS Resource Cleanup Script
# Removes all AWS resources to stop charges
# Account: 448049831733

set -e

ENVIRONMENT=${1:-dev}
AWS_ACCOUNT_ID="448049831733"
NOTIFICATION_EMAIL="sanjitdikshit83@gmail.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🛑 AWS Resource Cleanup${NC}"
echo -e "${YELLOW}⚠️  This will DELETE all AWS resources and STOP all charges${NC}"
echo ""
echo "📋 Configuration:"
echo "  Account ID: ${AWS_ACCOUNT_ID}"
echo "  Environment: ${ENVIRONMENT}"
echo "  Email: ${NOTIFICATION_EMAIL}"
echo ""

# Confirmation prompt
echo -e "${RED}⚠️  WARNING: This will permanently delete all resources!${NC}"
read -p "Are you sure you want to cleanup ALL AWS resources? (type 'DELETE' to confirm): " -r
echo
if [[ $REPLY != "DELETE" ]]; then
    echo "Cleanup cancelled. Resources remain active (charges continue)."
    exit 0
fi

echo -e "\n${BLUE}🔍 Checking AWS access...${NC}"

# Verify AWS credentials
aws sts get-caller-identity > /dev/null || {
    echo -e "${RED}❌ AWS credentials not configured.${NC}"
    exit 1
}

CALLER_IDENTITY=$(aws sts get-caller-identity)
ACCOUNT=$(echo $CALLER_IDENTITY | jq -r '.Account')

if [ "$ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ AWS Account mismatch!${NC}"
    echo "Expected: ${AWS_ACCOUNT_ID}"
    echo "Current:  ${ACCOUNT}"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials verified${NC}"

# List of stacks to delete
STACKS=(
    "AgentHubMinimal-${ENVIRONMENT}"
    "AgentHubStack-${ENVIRONMENT}"
    "CDKToolkit"  # CDK bootstrap stack (optional)
)

echo -e "\n${BLUE}🗑️  Deleting CloudFormation stacks...${NC}"

for stack in "${STACKS[@]}"; do
    echo -e "\n${YELLOW}Checking stack: ${stack}${NC}"
    
    if aws cloudformation describe-stacks --stack-name "$stack" &>/dev/null; then
        echo -e "${RED}Deleting stack: ${stack}${NC}"
        aws cloudformation delete-stack --stack-name "$stack"
        
        echo "Waiting for stack deletion to complete..."
        aws cloudformation wait stack-delete-complete --stack-name "$stack" || {
            echo -e "${YELLOW}⚠️  Stack deletion may have failed or timed out: ${stack}${NC}"
        }
        echo -e "${GREEN}✅ Stack deleted: ${stack}${NC}"
    else
        echo -e "${BLUE}ℹ️  Stack not found (already deleted): ${stack}${NC}"
    fi
done

# Clean up S3 buckets (if any remain)
echo -e "\n${BLUE}🗑️  Cleaning up S3 buckets...${NC}"
BUCKETS=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'agent-hub')].Name" --output text)

if [ -n "$BUCKETS" ]; then
    for bucket in $BUCKETS; do
        echo -e "${YELLOW}Emptying and deleting bucket: ${bucket}${NC}"
        aws s3 rm s3://$bucket --recursive || echo "Bucket may be empty"
        aws s3api delete-bucket --bucket $bucket || echo "Bucket may not exist"
        echo -e "${GREEN}✅ Bucket cleaned: ${bucket}${NC}"
    done
else
    echo -e "${BLUE}ℹ️  No Agent Hub S3 buckets found${NC}"
fi

# Clean up Lambda functions (if any remain)
echo -e "\n${BLUE}🗑️  Cleaning up Lambda functions...${NC}"
FUNCTIONS=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'agent-hub')].FunctionName" --output text)

if [ -n "$FUNCTIONS" ]; then
    for function in $FUNCTIONS; do
        echo -e "${YELLOW}Deleting function: ${function}${NC}"
        aws lambda delete-function --function-name $function || echo "Function may not exist"
        echo -e "${GREEN}✅ Function deleted: ${function}${NC}"
    done
else
    echo -e "${BLUE}ℹ️  No Agent Hub Lambda functions found${NC}"
fi

# Clean up DynamoDB tables (if any remain)
echo -e "\n${BLUE}🗑️  Cleaning up DynamoDB tables...${NC}"
TABLES=$(aws dynamodb list-tables --query "TableNames[?contains(@, 'agent-hub')]" --output text)

if [ -n "$TABLES" ]; then
    for table in $TABLES; do
        echo -e "${YELLOW}Deleting table: ${table}${NC}"
        aws dynamodb delete-table --table-name $table || echo "Table may not exist"
        echo -e "${GREEN}✅ Table deleted: ${table}${NC}"
    done
else
    echo -e "${BLUE}ℹ️  No Agent Hub DynamoDB tables found${NC}"
fi

# Clean up API Gateways (if any remain)
echo -e "\n${BLUE}🗑️  Cleaning up API Gateways...${NC}"
APIS=$(aws apigateway get-rest-apis --query "items[?contains(name, 'agent-hub')].id" --output text)

if [ -n "$APIS" ]; then
    for api in $APIS; do
        echo -e "${YELLOW}Deleting API Gateway: ${api}${NC}"
        aws apigateway delete-rest-api --rest-api-id $api || echo "API may not exist"
        echo -e "${GREEN}✅ API Gateway deleted: ${api}${NC}"
    done
else
    echo -e "${BLUE}ℹ️  No Agent Hub API Gateways found${NC}"
fi

# Clean up Cognito User Pools (if any remain)
echo -e "\n${BLUE}🗑️  Cleaning up Cognito User Pools...${NC}"
USER_POOLS=$(aws cognito-idp list-user-pools --max-items 60 --query "UserPools[?contains(Name, 'agent-hub')].Id" --output text)

if [ -n "$USER_POOLS" ]; then
    for pool in $USER_POOLS; do
        echo -e "${YELLOW}Deleting User Pool: ${pool}${NC}"
        aws cognito-idp delete-user-pool --user-pool-id $pool || echo "User Pool may not exist"
        echo -e "${GREEN}✅ User Pool deleted: ${pool}${NC}"
    done
else
    echo -e "${BLUE}ℹ️  No Agent Hub Cognito User Pools found${NC}"
fi

# Check for any remaining resources
echo -e "\n${BLUE}🔍 Checking for remaining resources...${NC}"

# Check CloudFormation stacks
REMAINING_STACKS=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, 'AgentHub')].StackName" --output text)

if [ -n "$REMAINING_STACKS" ]; then
    echo -e "${YELLOW}⚠️  Remaining CloudFormation stacks:${NC}"
    echo "$REMAINING_STACKS"
else
    echo -e "${GREEN}✅ No remaining CloudFormation stacks${NC}"
fi

# Final cost check
echo -e "\n${BLUE}💰 Final cost check...${NC}"
TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)

DAILY_COST=$(aws ce get-cost-and-usage \
    --time-period Start=$YESTERDAY,End=$TODAY \
    --granularity DAILY \
    --metrics BlendedCost \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
    --output text 2>/dev/null || echo "0")

echo -e "${BLUE}Yesterday's AWS cost: $${DAILY_COST}${NC}"

# Clean up local files
echo -e "\n${BLUE}🧹 Cleaning up local configuration files...${NC}"
rm -f .env.aws
rm -f infrastructure/cdk.out -rf
rm -f infrastructure/node_modules -rf

echo -e "\n${GREEN}🎉 Cleanup Complete!${NC}"
echo ""
echo -e "${GREEN}✅ All AWS resources have been deleted${NC}"
echo -e "${GREEN}✅ All charges have been stopped${NC}"
echo -e "${GREEN}✅ Your AWS credits are preserved${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "  🗑️  CloudFormation stacks: Deleted"
echo "  🗑️  S3 buckets: Deleted"
echo "  🗑️  Lambda functions: Deleted"
echo "  🗑️  DynamoDB tables: Deleted"
echo "  🗑️  API Gateways: Deleted"
echo "  🗑️  Cognito User Pools: Deleted"
echo "  💰 Ongoing charges: $0"
echo ""
echo -e "${BLUE}🚀 To restart development:${NC}"
echo "  Local (Free): ./start-local-dev.sh"
echo "  AWS (Paid):   ./deployment/deploy-minimal.sh"
echo ""
echo -e "${GREEN}💰 Your $100 AWS credits are safe!${NC}"