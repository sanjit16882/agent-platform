#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 AWS Cost Tracking Setup');
console.log('==========================');
console.log('');
console.log('This script will help you configure real AWS cost tracking for the FinOps dashboard.');
console.log('');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAWSCosts() {
  try {
    console.log('📋 AWS Configuration');
    console.log('');
    
    const region = await question('AWS Region (default: us-east-1): ') || 'us-east-1';
    const accessKey = await question('AWS Access Key ID: ');
    const secretKey = await question('AWS Secret Access Key: ');
    const monthlyBudget = await question('Monthly AWS Budget in USD (default: 1000): ') || '1000';
    
    if (!accessKey || !secretKey) {
      console.log('❌ AWS credentials are required for real cost tracking.');
      console.log('');
      console.log('To get AWS credentials:');
      console.log('1. Go to AWS Console > IAM > Users');
      console.log('2. Create a new user or select existing user');
      console.log('3. Attach policies: CostExplorerServiceRole, CloudWatchReadOnlyAccess');
      console.log('4. Create access keys in Security credentials tab');
      console.log('');
      process.exit(1);
    }
    
    // Create or update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Remove existing AWS config if present
    envContent = envContent.replace(/^AWS_.*$/gm, '').replace(/\n\n+/g, '\n\n');
    
    // Add new AWS config
    const awsConfig = `
# AWS Configuration for Real Cost Tracking
AWS_REGION=${region}
AWS_ACCESS_KEY_ID=${accessKey}
AWS_SECRET_ACCESS_KEY=${secretKey}
AWS_MONTHLY_BUDGET=${monthlyBudget}
ENABLE_REAL_COST_TRACKING=true
`;
    
    envContent += awsConfig;
    
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    console.log('');
    console.log('✅ AWS cost tracking configured successfully!');
    console.log('');
    console.log('📊 What happens now:');
    console.log('• FinOps dashboard will show real AWS costs');
    console.log('• Costs will persist across page refreshes');
    console.log('• Data comes from AWS Cost Explorer API');
    console.log('• Budget alerts based on your monthly budget');
    console.log('');
    console.log('🚀 Restart your backend server to apply changes:');
    console.log('   npm run start:backend:local');
    console.log('');
    console.log('⚠️  Note: It may take 24-48 hours for AWS Cost Explorer');
    console.log('   to show data for new AWS accounts or services.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupAWSCosts();