# DNS Setup for Agent Hub Platform

## 🌐 **Custom Domain Strategy**

### **Recommended Domain Structure**
```
Primary Domain: agenthub.dev (or your choice)
├── api.agenthub.dev          # API Gateway endpoints
├── app.agenthub.dev          # Frontend React application  
├── mcp.agenthub.dev          # MCP servers
├── admin.agenthub.dev        # Admin dashboard
└── docs.agenthub.dev         # Documentation
```

## 🏗️ **AWS Services for DNS & Domain**

### **1. Amazon Route 53 (DNS Management)**
- **Purpose**: DNS hosting and domain management
- **Features**: 
  - DNS resolution for your custom domain
  - Health checks and failover
  - Subdomain routing
  - SSL certificate validation
- **Cost**: $0.50 per hosted zone + $0.40 per million queries

### **2. AWS Certificate Manager (SSL Certificates)**
- **Purpose**: Free SSL certificates for HTTPS
- **Features**:
  - Wildcard certificates (*.agenthub.dev)
  - Automatic renewal
  - Integration with CloudFront and API Gateway
- **Cost**: FREE

### **3. Amazon CloudFront (CDN + Custom Domain)**
- **Purpose**: Global content delivery with custom domain
- **Features**:
  - Custom domain for frontend
  - HTTPS termination
  - Global edge locations
  - Caching for better performance
- **Cost**: $0.085 per GB + $0.0075 per 10,000 requests

### **4. API Gateway Custom Domain**
- **Purpose**: Custom domain for API endpoints
- **Features**:
  - api.agenthub.dev for all API calls
  - SSL termination
  - Request routing
- **Cost**: $0.50 per month per custom domain

## 💰 **Domain Cost Breakdown**

### **Domain Registration Options**

#### **Option 1: Register with AWS Route 53**
```
Domain Registration Costs (Annual):
├── .dev domain: $12/year
├── .com domain: $12/year  
├── .io domain: $32/year
├── .app domain: $18/year
└── .tech domain: $15/year
```

#### **Option 2: Use Existing Domain**
- If you already own a domain, just point DNS to AWS
- Transfer DNS management to Route 53
- Keep registration with current provider

### **AWS DNS Services Cost**
```
Service                    | Cost
---------------------------|------------------
Route 53 Hosted Zone      | $0.50/month
SSL Certificate (ACM)     | FREE
CloudFront Distribution   | $1-5/month
API Gateway Custom Domain | $0.50/month
---------------------------|------------------
Total AWS DNS Costs      | $2-6/month
```

## 🚀 **Quick Setup Options**

### **Option A: Professional Setup (Recommended)**
**Domain**: `agenthub.dev` or `youragents.com`
**Cost**: ~$15-20/month total

```bash
# 1. Register domain
aws route53domains register-domain --domain-name agenthub.dev

# 2. Deploy with custom domain
./deployment/deploy-with-domain.sh agenthub.dev
```

### **Option B: Budget-Friendly Setup**
**Use AWS-provided URLs with custom subdomain**
**Cost**: ~$2-5/month

```bash
# Use CloudFront distribution domain
# Example: d1234567890.cloudfront.net → app.agenthub.dev (CNAME)
./deployment/deploy-budget-domain.sh
```

### **Option C: Free Development Domain**
**Use ngrok or similar for temporary access**
**Cost**: $0 (for development/testing)

```bash
# Expose local development to internet
ngrok http 3000 --subdomain=agenthub-demo
# Access via: https://agenthub-demo.ngrok.io
```

## 🔧 **Implementation Steps**

### **Step 1: Domain Registration**

#### **Register New Domain (AWS Route 53)**
```bash
# Register domain through AWS
aws route53domains register-domain \
  --domain-name agenthub.dev \
  --duration-in-years 1 \
  --admin-contact file://admin-contact.json \
  --registrant-contact file://registrant-contact.json \
  --tech-contact file://tech-contact.json
```

#### **Or Use Existing Domain**
```bash
# Create hosted zone for existing domain
aws route53 create-hosted-zone \
  --name agenthub.dev \
  --caller-reference $(date +%s)
```

### **Step 2: SSL Certificate**
```bash
# Request wildcard SSL certificate
aws acm request-certificate \
  --domain-name agenthub.dev \
  --subject-alternative-names "*.agenthub.dev" \
  --validation-method DNS \
  --region us-east-1
```

### **Step 3: CloudFront Distribution**
```typescript
// infrastructure/lib/domain-stack.ts
const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(frontendBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
  },
  domainNames: ['app.agenthub.dev'],
  certificate: certificate,
  defaultRootObject: 'index.html'
});
```

### **Step 4: API Gateway Custom Domain**
```typescript
const apiDomain = new apigateway.DomainName(this, 'ApiDomain', {
  domainName: 'api.agenthub.dev',
  certificate: certificate,
  endpointType: apigateway.EndpointType.REGIONAL
});

new apigateway.BasePathMapping(this, 'ApiMapping', {
  domainName: apiDomain,
  restApi: api,
  basePath: 'v1'
});
```

### **Step 5: DNS Records**
```typescript
// Create DNS records
new route53.ARecord(this, 'AppRecord', {
  zone: hostedZone,
  recordName: 'app',
  target: route53.RecordTarget.fromAlias(
    new targets.CloudFrontTarget(distribution)
  )
});

new route53.ARecord(this, 'ApiRecord', {
  zone: hostedZone,
  recordName: 'api', 
  target: route53.RecordTarget.fromAlias(
    new targets.ApiGatewayDomain(apiDomain)
  )
});
```

## 🎯 **Complete Domain Setup Script**

<function_calls>
<invoke name="fsWrite">
<parameter name="path">agent-hub-aws-native/setup-domain.sh/bash

# Domain Setup Script for Agent Hub Platform
# Creates professional DNS setup with custom domain

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
    echo -e "${RED}❌ Usage: ./setup-domain.sh <domain-name>${NC}"
    echo "Examples:"
    echo "  ./setup-domain.sh agenthub.dev"
    echo "  ./setup-domain.sh myagents.com"
    echo "  ./setup-domain.sh demo-agents.io"
    exit 1
fi

echo -e "${BLUE}🌐 Setting up custom domain: ${DOMAIN_NAME}${NC}"
echo -e "${YELLOW}💰 Estimated additional cost: $15-20/month${NC}"
echo ""

# Confirmation
read -p "Continue with domain setup? (y/N): " -n 1 -r
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

echo -e "\n${BLUE}🏗️ Creating Route 53 hosted zone...${NC}"

# Create hosted zone
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
    --name $DOMAIN_NAME \
    --caller-reference "agenthub-$(date +%s)" \
    --hosted-zone-config Comment="Agent Hub Platform DNS" \
    --query 'HostedZone.Id' \
    --output text | cut -d'/' -f3)

echo -e "${GREEN}✅ Hosted zone created: ${HOSTED_ZONE_ID}${NC}"

echo -e "\n${BLUE}🔒 Requesting SSL certificate...${NC}"

# Request SSL certificate
CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN_NAME \
    --subject-alternative-names "*.${DOMAIN_NAME}" \
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

# Create domain configuration file
echo -e "\n${BLUE}⚙️ Creating domain configuration...${NC}"

cat > domain-config.json << EOF
{
    "domainName": "$DOMAIN_NAME",
    "hostedZoneId": "$HOSTED_ZONE_ID",
    "certificateArn": "$CERT_ARN",
    "subdomains": {
        "app": "app.${DOMAIN_NAME}",
        "api": "api.${DOMAIN_NAME}",
        "mcp": "mcp.${DOMAIN_NAME}",
        "admin": "admin.${DOMAIN_NAME}",
        "docs": "docs.${DOMAIN_NAME}"
    },
    "urls": {
        "frontend": "https://app.${DOMAIN_NAME}",
        "api": "https://api.${DOMAIN_NAME}",
        "mcp": "https://mcp.${DOMAIN_NAME}",
        "admin": "https://admin.${DOMAIN_NAME}",
        "docs": "https://docs.${DOMAIN_NAME}"
    }
}
EOF

# Update environment configuration
cat > .env.domain << EOF
# Domain Configuration
DOMAIN_NAME=$DOMAIN_NAME
HOSTED_ZONE_ID=$HOSTED_ZONE_ID
CERTIFICATE_ARN=$CERT_ARN

# Application URLs
FRONTEND_URL=https://app.$DOMAIN_NAME
API_BASE_URL=https://api.$DOMAIN_NAME
MCP_BASE_URL=https://mcp.$DOMAIN_NAME
ADMIN_URL=https://admin.$DOMAIN_NAME
DOCS_URL=https://docs.$DOMAIN_NAME

# DNS Settings
USE_CUSTOM_DOMAIN=true
SSL_ENABLED=true
HTTPS_REDIRECT=true
EOF

echo -e "${GREEN}✅ Domain configuration created${NC}"

echo -e "\n${BLUE}🚀 Updating CDK configuration...${NC}"

# Update CDK context
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
    "useCustomDomain": true,
    "environment": "production",
    "accountId": "$AWS_ACCOUNT_ID",
    "region": "$AWS_REGION"
}
EOF

cd ..

echo -e "\n${GREEN}🎉 Domain setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Domain Configuration:${NC}"
echo "  🌐 Primary Domain: $DOMAIN_NAME"
echo "  🏗️ Hosted Zone ID: $HOSTED_ZONE_ID"
echo "  🔒 Certificate ARN: $CERT_ARN"
echo ""
echo -e "${BLUE}📱 Your URLs will be:${NC}"
echo "  🎨 Frontend: https://app.$DOMAIN_NAME"
echo "  🔌 API: https://api.$DOMAIN_NAME"
echo "  🛠️ MCP: https://mcp.$DOMAIN_NAME"
echo "  ⚙️ Admin: https://admin.$DOMAIN_NAME"
echo ""
echo -e "${YELLOW}⏳ Next Steps:${NC}"
echo "  1. Wait for SSL certificate validation (~5-10 minutes)"
echo "  2. Deploy with custom domain: ./deployment/deploy-with-domain.sh"
echo "  3. Update DNS if domain registered elsewhere"
echo ""
echo -e "${GREEN}💰 Additional Monthly Cost: ~$15-20${NC}"
echo -e "${BLUE}🎯 Your platform will be accessible from anywhere!${NC}"
EOF

chmod +x agent-hub-aws-native/setup-domain.sh