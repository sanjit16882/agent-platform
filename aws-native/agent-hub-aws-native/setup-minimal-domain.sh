#!/bin/bash

# Minimal Domain Setup - Only Frontend Portal
# Cost-optimized: One DNS name + IP addresses for backend services

set -e

DOMAIN_NAME=$1
AWS_ACCOUNT_ID="448049831733"
AWS_REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}❌ Usage: ./setup-minimal-domain.sh <domain-name>${NC}"
    echo "Examples:"
    echo "  ./setup-minimal-domain.sh agenthub.dev"
    echo "  ./setup-minimal-domain.sh myagents.com"
    echo ""
    echo -e "${GREEN}💰 Cost Savings: Only frontend gets DNS, backend uses IPs${NC}"
    exit 1
fi

echo -e "${BLUE}🌐 Setting up minimal domain: ${DOMAIN_NAME}${NC}"
echo -e "${GREEN}💰 Cost-optimized approach:${NC}"
echo "  ✅ Frontend Portal: https://${DOMAIN_NAME}"
echo "  ✅ API: IP address (no DNS cost)"
echo "  ✅ MCP: IP addresses (no DNS cost)"
echo "  ✅ Admin: IP address (no DNS cost)"
echo ""
echo -e "${YELLOW}💰 Estimated cost: Only +$2-5/month (vs +$17-26/month)${NC}"
echo ""

# Confirmation
read -p "Continue with minimal domain setup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Domain setup cancelled."
    exit 0
fi

echo -e "\n${BLUE}🔍 Checking domain availability...${NC}"

# Check if domain is available for registration
DOMAIN_AVAILABLE=$(aws route53domains check-domain-availability \
    --domain-name $DOMAIN_NAME \
    --query 'Availability' \
    --output text 2>/dev/null || echo "UNKNOWN")

if [ "$DOMAIN_AVAILABLE" = "AVAILABLE" ]; then
    echo -e "${GREEN}✅ Domain ${DOMAIN_NAME} is available for registration${NC}"
    
    read -p "Register domain with AWS Route 53? ($12-32/year) (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📝 Registering domain...${NC}"
        
        # Create contact info file
        cat > domain-contact.json << EOF
{
    "FirstName": "Agent",
    "LastName": "Hub",
    "ContactType": "PERSON",
    "OrganizationName": "Agent Hub Platform",
    "AddressLine1": "123 Tech Street",
    "City": "San Francisco",
    "State": "CA",
    "CountryCode": "US",
    "ZipCode": "94105",
    "PhoneNumber": "+1.4155551234",
    "Email": "admin@${DOMAIN_NAME}"
}
EOF

        # Register domain
        aws route53domains register-domain \
            --domain-name $DOMAIN_NAME \
            --duration-in-years 1 \
            --admin-contact file://domain-contact.json \
            --registrant-contact file://domain-contact.json \
            --tech-contact file://domain-contact.json \
            --privacy-protect-admin-contact \
            --privacy-protect-registrant-contact \
            --privacy-protect-tech-contact
        
        rm domain-contact.json
        echo -e "${GREEN}✅ Domain registration initiated${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Domain may not be available or already registered${NC}"
    echo "Will attempt to create hosted zone (works if you own the domain)"
fi

echo -e "\n${BLUE}🏗️ Creating Route 53 hosted zone (minimal)...${NC}"

# Create hosted zone
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
    --name $DOMAIN_NAME \
    --caller-reference "agenthub-minimal-$(date +%s)" \
    --hosted-zone-config Comment="Agent Hub Platform - Minimal DNS" \
    --query 'HostedZone.Id' \
    --output text | cut -d'/' -f3)

echo -e "${GREEN}✅ Hosted zone created: ${HOSTED_ZONE_ID}${NC}"

echo -e "\n${BLUE}🔒 Requesting SSL certificate (frontend only)...${NC}"

# Request SSL certificate for main domain only
CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN_NAME \
    --validation-method DNS \
    --region $AWS_REGION \
    --query 'CertificateArn' \
    --output text)

echo -e "${GREEN}✅ SSL certificate requested: ${CERT_ARN}${NC}"

echo -e "\n${BLUE}⏳ Waiting for certificate validation records...${NC}"
sleep 10

# Get certificate validation records
VALIDATION_RECORDS=$(aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --region $AWS_REGION \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
    --output json)

VALIDATION_NAME=$(echo $VALIDATION_RECORDS | jq -r '.Name')
VALIDATION_VALUE=$(echo $VALIDATION_RECORDS | jq -r '.Value')

echo -e "${BLUE}📝 Creating DNS validation record...${NC}"

# Create validation record
cat > validation-record.json << EOF
{
    "Changes": [{
        "Action": "CREATE",
        "ResourceRecordSet": {
            "Name": "$VALIDATION_NAME",
            "Type": "CNAME",
            "TTL": 300,
            "ResourceRecords": [{
                "Value": "$VALIDATION_VALUE"
            }]
        }
    }]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://validation-record.json

rm validation-record.json

echo -e "${GREEN}✅ DNS validation record created${NC}"

# Create minimal domain configuration
echo -e "\n${BLUE}⚙️ Creating minimal domain configuration...${NC}"

cat > domain-config-minimal.json << EOF
{
    "domainName": "$DOMAIN_NAME",
    "hostedZoneId": "$HOSTED_ZONE_ID",
    "certificateArn": "$CERT_ARN",
    "architecture": "cost-optimized",
    "dnsServices": {
        "frontend": "https://${DOMAIN_NAME}",
        "api": "IP_ADDRESS_ONLY",
        "mcp": "IP_ADDRESS_ONLY",
        "admin": "IP_ADDRESS_ONLY"
    },
    "costSavings": {
        "noCDN": "Saves $1-5/month",
        "noLoadBalancer": "Saves $16-20/month", 
        "noMultipleSubdomains": "Saves $0.50/subdomain",
        "totalSavings": "$17-25/month"
    }
}
EOF

# Update environment configuration
cat > .env.minimal-domain << EOF
# Minimal Domain Configuration - Cost Optimized
DOMAIN_NAME=$DOMAIN_NAME
HOSTED_ZONE_ID=$HOSTED_ZONE_ID
CERTIFICATE_ARN=$CERT_ARN

# Frontend URL (DNS)
FRONTEND_URL=https://$DOMAIN_NAME

# Backend URLs (IP addresses - no DNS cost)
API_BASE_URL=IP_WILL_BE_SET_AFTER_DEPLOYMENT
MCP_BASE_URL=IP_WILL_BE_SET_AFTER_DEPLOYMENT
ADMIN_URL=IP_WILL_BE_SET_AFTER_DEPLOYMENT

# Cost Optimization Settings
USE_MINIMAL_DOMAIN=true
FRONTEND_ONLY_DNS=true
BACKEND_USE_IPS=true
SSL_FRONTEND_ONLY=true

# Estimated Costs
DOMAIN_COST_MONTHLY=1-2
ADDITIONAL_AWS_COST=1-3
TOTAL_ADDITIONAL_COST=2-5
EOF

echo -e "${GREEN}✅ Minimal domain configuration created${NC}"

echo -e "\n${BLUE}🚀 Updating CDK configuration for cost optimization...${NC}"

# Update CDK context for minimal setup
cd infrastructure
npm install

cat > cdk.context.json << EOF
{
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "domainName": "$DOMAIN_NAME",
    "hostedZoneId": "$HOSTED_ZONE_ID", 
    "certificateArn": "$CERT_ARN",
    "useMinimalDomain": true,
    "frontendOnlyDNS": true,
    "backendUseIPs": true,
    "costOptimized": true,
    "environment": "production",
    "accountId": "$AWS_ACCOUNT_ID",
    "region": "$AWS_REGION"
}
EOF

cd ..

echo -e "\n${GREEN}🎉 Minimal domain setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Cost-Optimized Configuration:${NC}"
echo "  🌐 Frontend Domain: $DOMAIN_NAME"
echo "  🏗️ Hosted Zone ID: $HOSTED_ZONE_ID"
echo "  🔒 Certificate ARN: $CERT_ARN"
echo ""
echo -e "${GREEN}📱 Your URLs will be:${NC}"
echo "  🎨 Frontend Portal: https://$DOMAIN_NAME"
echo "  🔌 API: http://[IP-ADDRESS]:3000"
echo "  🛠️ MCP: http://[IP-ADDRESS]:3001-3004"
echo "  ⚙️ Admin: http://[IP-ADDRESS]:3005"
echo ""
echo -e "${GREEN}💰 Cost Savings:${NC}"
echo "  ❌ No CloudFront CDN: Saves $1-5/month"
echo "  ❌ No Load Balancer: Saves $16-20/month"
echo "  ❌ No Multiple Subdomains: Saves $0.50 each"
echo "  ✅ Total Savings: $17-25/month"
echo ""
echo -e "${YELLOW}⏳ Next Steps:${NC}"
echo "  1. Wait for SSL certificate validation (~5-10 minutes)"
echo "  2. Deploy with minimal domain: ./deployment/deploy-minimal-domain.sh"
echo "  3. Get IP addresses for backend services"
echo ""
echo -e "${GREEN}💰 Additional Monthly Cost: Only $2-5 (vs $17-26)${NC}"
echo -e "${BLUE}🎯 Professional frontend + cost-optimized backend!${NC}"