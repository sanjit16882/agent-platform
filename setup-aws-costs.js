#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 AWS Cost Explorer Setup');
console.log('==========================\n');

console.log('This script will help you configure AWS credentials for real cost tracking.\n');

console.log('📋 Prerequisites:');
console.log('1. AWS Account with Cost Explorer enabled');
console.log('2. IAM user with Cost Explorer permissions');
console.log('3. AWS Access Key ID and Secret Access Key\n');

console.log('🔑 Required IAM Permissions:');
console.log('- ce:GetCostAndUsage');
console.log('- ce:GetDimensionValues');
console.log('- ce:GetReservationCoverage');
console.log('- ce:GetReservationPurchaseRecommendation');
console.log('- ce:GetReservationUtilization\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupAWSCredentials() {
  try {
    console.log('🚀 Starting AWS credentials setup...\n');

    const accessKeyId = await askQuestion('Enter your AWS Access Key ID: ');
    if (!accessKeyId.trim()) {
      console.log('❌ Access Key ID is required');
      process.exit(1);
    }

    const secretAccessKey = await askQuestion('Enter your AWS Secret Access Key: ');
    if (!secretAccessKey.trim()) {
      console.log('❌ Secret Access Key is required');
      process.exit(1);
    }

    const region = await askQuestion('Enter your AWS Region (default: us-east-1): ') || 'us-east-1';

    // Create .env file for backend
    const envContent = `# AWS Configuration for Cost Explorer
AWS_ACCESS_KEY_ID=${accessKeyId}
AWS_SECRET_ACCESS_KEY=${secretAccessKey}
AWS_REGION=${region}

# Optional: Set a monthly budget for tracking
AWS_MONTHLY_BUDGET=5000
`;

    const backendEnvPath = path.join(__dirname, 'agent-hub-backend', '.env');
    fs.writeFileSync(backendEnvPath, envContent);

    console.log('\n✅ AWS credentials configured successfully!');
    console.log(`📁 Configuration saved to: ${backendEnvPath}`);

    console.log('\n🔄 Next steps:');
    console.log('1. Restart the backend server');
    console.log('2. Refresh the FinOps dashboard');
    console.log('3. Real AWS costs will be displayed\n');

    console.log('⚠️  Security Note:');
    console.log('- Keep your .env file secure and never commit it to version control');
    console.log('- Consider using IAM roles instead of access keys in production\n');

    const testConnection = await askQuestion('Would you like to test the connection now? (y/n): ');
    if (testConnection.toLowerCase() === 'y' || testConnection.toLowerCase() === 'yes') {
      console.log('\n🧪 Testing AWS connection...');
      
      // Set environment variables for testing
      process.env.AWS_ACCESS_KEY_ID = accessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
      process.env.AWS_REGION = region;

      try {
        const awsCostService = require('./agent-hub-backend/services/awsCostService');
        await awsCostService.initializeClient();
        
        if (awsCostService.isConfigured) {
          console.log('✅ AWS Cost Explorer connection successful!');
          console.log('🎉 Real cost data will be available after restarting the server.');
        } else {
          console.log('❌ AWS Cost Explorer connection failed.');
          console.log('Please check your credentials and permissions.');
        }
      } catch (error) {
        console.log('❌ Connection test failed:', error.message);
        console.log('\nCommon issues:');
        console.log('- Invalid credentials');
        console.log('- Insufficient IAM permissions');
        console.log('- Cost Explorer not enabled in your AWS account');
        console.log('- Region not supported for Cost Explorer');
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Create AWS credentials directory if it doesn't exist
function createAWSCredentialsFile() {
  const homeDir = require('os').homedir();
  const awsDir = path.join(homeDir, '.aws');
  const credentialsFile = path.join(awsDir, 'credentials');

  if (!fs.existsSync(awsDir)) {
    fs.mkdirSync(awsDir, { recursive: true });
  }

  console.log('\n📝 Alternative: AWS Credentials File');
  console.log('You can also configure credentials using the AWS credentials file:');
  console.log(`Location: ${credentialsFile}`);
  console.log('\nExample content:');
  console.log('[default]');
  console.log('aws_access_key_id = YOUR_ACCESS_KEY');
  console.log('aws_secret_access_key = YOUR_SECRET_KEY');
  console.log('region = us-east-1\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node setup-aws-costs.js [options]');
    console.log('\nOptions:');
    console.log('  --help, -h     Show this help message');
    console.log('  --credentials  Show AWS credentials file information');
    console.log('\nThis script configures AWS Cost Explorer for real cost tracking.');
    process.exit(0);
  }

  if (args.includes('--credentials')) {
    createAWSCredentialsFile();
    process.exit(0);
  }

  await setupAWSCredentials();
}

if (require.main === module) {
  main().catch(console.error);
}