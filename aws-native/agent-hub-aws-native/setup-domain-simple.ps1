# Simple Domain Setup for agenthub.ai
# Day 1 - Foundation Setup

$DOMAIN_NAME = "agenthub.ai"
$AWS_REGION = "us-east-1"

Write-Host "🌐 Setting up agenthub.ai domain (simplified)" -ForegroundColor Blue
Write-Host "💰 Cost-optimized approach for demo" -ForegroundColor Green
Write-Host ""

# Check if we already have a hosted zone
Write-Host "🔍 Checking for existing hosted zone..." -ForegroundColor Blue
$existingZone = aws route53 list-hosted-zones --query "HostedZones[?Name=='$DOMAIN_NAME.'].Id" --output text

if ($existingZone) {
    $HOSTED_ZONE_ID = $existingZone.Split('/')[-1]
    Write-Host "✅ Found existing hosted zone: $HOSTED_ZONE_ID" -ForegroundColor Green
} else {
    Write-Host "🏗️ Creating new hosted zone..." -ForegroundColor Blue
    $timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
    $HOSTED_ZONE_ID = aws route53 create-hosted-zone --name $DOMAIN_NAME --caller-reference "agenthub-$timestamp" --query 'HostedZone.Id' --output text
    $HOSTED_ZONE_ID = $HOSTED_ZONE_ID.Split('/')[-1]
    Write-Host "✅ Created hosted zone: $HOSTED_ZONE_ID" -ForegroundColor Green
}

# Request SSL certificate
Write-Host "🔒 Requesting SSL certificate..." -ForegroundColor Blue
$CERT_ARN = aws acm request-certificate --domain-name $DOMAIN_NAME --validation-method DNS --region $AWS_REGION --query 'CertificateArn' --output text

if ($CERT_ARN) {
    Write-Host "✅ SSL certificate requested: $CERT_ARN" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to request SSL certificate" -ForegroundColor Red
    exit 1
}

# Save configuration
$config = @"
# Domain Configuration
DOMAIN_NAME=$DOMAIN_NAME
HOSTED_ZONE_ID=$HOSTED_ZONE_ID
CERTIFICATE_ARN=$CERT_ARN
AWS_REGION=$AWS_REGION

# URLs
FRONTEND_URL=https://$DOMAIN_NAME
"@

$config | Out-File -FilePath ".env.domain" -Encoding UTF8

Write-Host ""
Write-Host "🎉 Domain setup complete!" -ForegroundColor Green
Write-Host "📋 Configuration saved to .env.domain" -ForegroundColor Blue
Write-Host "🏗️ Hosted Zone ID: $HOSTED_ZONE_ID" -ForegroundColor Yellow
Write-Host "🔒 Certificate ARN: $CERT_ARN" -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ Next: Deploy infrastructure with CDK" -ForegroundColor Cyan