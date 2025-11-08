# Setup agenthub.ai Domain - PowerShell Version
# Cost-optimized: Frontend DNS + Backend IPs

$DOMAIN_NAME = "agenthub.ai"
$AWS_ACCOUNT_ID = "448049831733"
$AWS_REGION = "us-east-1"

Write-Host "🌐 Setting up agenthub.ai domain" -ForegroundColor Blue
Write-Host "💰 Cost-optimized approach:" -ForegroundColor Green
Write-Host "  ✅ Frontend Portal: https://agenthub.ai"
Write-Host "  ✅ API: IP address (no DNS cost)"
Write-Host "  ✅ MCP: IP addresses (no DNS cost)"
Write-Host ""
Write-Host "💰 Estimated cost: Only +$2-5/month (vs +$17-26/month)" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Continue with agenthub.ai setup? (y/N)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Domain setup cancelled."
    exit
}

Write-Host "`n🔍 Checking domain availability..." -ForegroundColor Blue

# Check if domain is available for registration
try {
    $domainCheck = aws route53domains check-domain-availability --domain-name $DOMAIN_NAME --query 'Availability' --output text 2>$null
    if ($domainCheck -eq "AVAILABLE") {
        Write-Host "✅ Domain agenthub.ai is available for registration" -ForegroundColor Green
        
        $register = Read-Host "Register domain with AWS Route 53? (~$32/year) (y/N)"
        if ($register -eq "y" -or $register -eq "Y") {
            Write-Host "📝 Registering domain..." -ForegroundColor Blue
            
            # Create contact info file
            $contactInfo = @{
                FirstName = "Agent"
                LastName = "Hub"
                ContactType = "PERSON"
                OrganizationName = "Agent Hub Platform"
                AddressLine1 = "123 Tech Street"
                City = "San Francisco"
                State = "CA"
                CountryCode = "US"
                ZipCode = "94105"
                PhoneNumber = "+1.4155551234"
                Email = "admin@agenthub.ai"
            } | ConvertTo-Json

            $contactInfo | Out-File -FilePath "domain-contact.json" -Encoding UTF8

            # Register domain
            aws route53domains register-domain --domain-name $DOMAIN_NAME --duration-in-years 1 --admin-contact file://domain-contact.json --registrant-contact file://domain-contact.json --tech-contact file://domain-contact.json --privacy-protect-admin-contact --privacy-protect-registrant-contact --privacy-protect-tech-contact

            Remove-Item "domain-contact.json"
            Write-Host "✅ Domain registration initiated" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Domain may not be available or already registered" -ForegroundColor Yellow
        Write-Host "Will attempt to create hosted zone (works if you own the domain)"
    }
} catch {
    Write-Host "⚠️ Could not check domain availability, continuing with hosted zone setup" -ForegroundColor Yellow
}

Write-Host "`n🏗️ Creating Route 53 hosted zone..." -ForegroundColor Blue

# Create hosted zone
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$HOSTED_ZONE_ID = aws route53 create-hosted-zone --name $DOMAIN_NAME --caller-reference "agenthub-minimal-$timestamp" --hosted-zone-config "Comment=Agent Hub Platform - Minimal DNS" --query 'HostedZone.Id' --output text
$HOSTED_ZONE_ID = $HOSTED_ZONE_ID.Split('/')[-1]

Write-Host "✅ Hosted zone created: $HOSTED_ZONE_ID" -ForegroundColor Green

Write-Host "`n🔒 Requesting SSL certificate..." -ForegroundColor Blue

# Request SSL certificate
$CERT_ARN = aws acm request-certificate --domain-name $DOMAIN_NAME --validation-method DNS --region $AWS_REGION --query 'CertificateArn' --output text

Write-Host "✅ SSL certificate requested: $CERT_ARN" -ForegroundColor Green

Write-Host "`n⏳ Waiting for certificate validation records..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Get certificate validation records
$validationRecords = aws acm describe-certificate --certificate-arn $CERT_ARN --region $AWS_REGION --query 'Certificate.DomainValidationOptions[0].ResourceRecord' --output json | ConvertFrom-Json

$VALIDATION_NAME = $validationRecords.Name
$VALIDATION_VALUE = $validationRecords.Value

Write-Host "📝 Creating DNS validation record..." -ForegroundColor Blue

# Create validation record
$validationRecord = @{
    Changes = @(
        @{
            Action = "CREATE"
            ResourceRecordSet = @{
                Name = $VALIDATION_NAME
                Type = "CNAME"
                TTL = 300
                ResourceRecords = @(
                    @{
                        Value = $VALIDATION_VALUE
                    }
                )
            }
        }
    )
} | ConvertTo-Json -Depth 10

$validationRecord | Out-File -FilePath "validation-record.json" -Encoding UTF8

aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://validation-record.json

Remove-Item "validation-record.json"

Write-Host "✅ DNS validation record created" -ForegroundColor Green

# Create minimal domain configuration
Write-Host "`n⚙️ Creating domain configuration..." -ForegroundColor Blue

$domainConfig = @{
    domainName = $DOMAIN_NAME
    hostedZoneId = $HOSTED_ZONE_ID
    certificateArn = $CERT_ARN
    architecture = "cost-optimized"
    dnsServices = @{
        frontend = "https://agenthub.ai"
        api = "IP_ADDRESS_ONLY"
        mcp = "IP_ADDRESS_ONLY"
        admin = "IP_ADDRESS_ONLY"
    }
    costSavings = @{
        noCDN = "Saves $1-5/month"
        noLoadBalancer = "Saves $16-20/month"
        noMultipleSubdomains = "Saves $0.50/subdomain"
        totalSavings = "$17-25/month"
    }
} | ConvertTo-Json -Depth 10

$domainConfig | Out-File -FilePath "domain-config-minimal.json" -Encoding UTF8

# Update environment configuration
$envConfig = @"
# Minimal Domain Configuration - Cost Optimized
DOMAIN_NAME=agenthub.ai
HOSTED_ZONE_ID=$HOSTED_ZONE_ID
CERTIFICATE_ARN=$CERT_ARN

# Frontend URL (DNS)
FRONTEND_URL=https://agenthub.ai

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
DOMAIN_COST_MONTHLY=2-3
ADDITIONAL_AWS_COST=1-3
TOTAL_ADDITIONAL_COST=3-6
"@

$envConfig | Out-File -FilePath ".env.minimal-domain" -Encoding UTF8

Write-Host "✅ Minimal domain configuration created" -ForegroundColor Green

Write-Host "`n🚀 Updating CDK configuration..." -ForegroundColor Blue

# Update CDK context
Set-Location infrastructure
npm install

$cdkContext = @{
    "@aws-cdk/core:enableStackNameDuplicates" = $true
    "aws-cdk:enableDiffNoFail" = $true
    "@aws-cdk/core:stackRelativeExports" = $true
    domainName = $DOMAIN_NAME
    hostedZoneId = $HOSTED_ZONE_ID
    certificateArn = $CERT_ARN
    useMinimalDomain = $true
    frontendOnlyDNS = $true
    backendUseIPs = $true
    costOptimized = $true
    environment = "production"
    accountId = $AWS_ACCOUNT_ID
    region = $AWS_REGION
} | ConvertTo-Json -Depth 10

$cdkContext | Out-File -FilePath "cdk.context.json" -Encoding UTF8

Set-Location ..

Write-Host "`n🎉 agenthub.ai setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Cost-Optimized Configuration:" -ForegroundColor Blue
Write-Host "  🌐 Frontend Domain: agenthub.ai"
Write-Host "  🏗️ Hosted Zone ID: $HOSTED_ZONE_ID"
Write-Host "  🔒 Certificate ARN: $CERT_ARN"
Write-Host ""
Write-Host "📱 Your URLs will be:" -ForegroundColor Green
Write-Host "  🎨 Frontend Portal: https://agenthub.ai"
Write-Host "  🔌 API: http://[IP-ADDRESS]:3000"
Write-Host "  🛠️ MCP: http://[IP-ADDRESS]:3001-3004"
Write-Host "  ⚙️ Admin: http://[IP-ADDRESS]:3005"
Write-Host ""
Write-Host "💰 Cost Savings:" -ForegroundColor Green
Write-Host "  ❌ No CloudFront CDN: Saves $1-5/month"
Write-Host "  ❌ No Load Balancer: Saves $16-20/month"
Write-Host "  ❌ No Multiple Subdomains: Saves $0.50 each"
Write-Host "  ✅ Total Savings: $17-25/month"
Write-Host ""
Write-Host "⏳ Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait for SSL certificate validation (~5-10 minutes)"
Write-Host "  2. Deploy with minimal domain: ./deployment/deploy-minimal-domain.sh"
Write-Host "  3. Get IP addresses for backend services"
Write-Host ""
Write-Host "💰 Additional Monthly Cost: Only $3-6 (vs $17-26)" -ForegroundColor Green
Write-Host "🎯 Professional frontend + cost-optimized backend!" -ForegroundColor Blue