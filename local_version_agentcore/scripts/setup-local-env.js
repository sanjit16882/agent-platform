#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Setup script for local development environment
 */
function setupLocalEnvironment() {
  console.log('🚀 Setting up local development environment...');

  // Create necessary directories
  const directories = ['data', 'logs', 'localstack-data'];
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });

  // Copy environment files if they don't exist
  const envFiles = [
    {
      source: 'agent-hub-backend/.env.example',
      target: 'agent-hub-backend/.env.local'
    }
  ];

  envFiles.forEach(({ source, target }) => {
    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.copyFileSync(source, target);
      console.log(`✅ Created environment file: ${target}`);
    }
  });

  // Create local configuration if it doesn't exist
  const localConfigPath = 'config/local.json';
  if (!fs.existsSync(localConfigPath)) {
    console.log(`⚠️  Local configuration not found at ${localConfigPath}`);
    console.log('Please run the configuration setup first.');
  }

  console.log('\n🎉 Local environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Review and update config/local.json if needed');
  console.log('2. Run: npm run start:local');
  console.log('3. Or use Docker: npm run docker:local');
}

function setupProductionEnvironment() {
  console.log('🏭 Setting up production environment...');

  // Check for required production files
  const requiredFiles = [
    'agent-hub-backend/.env.production',
    'config/production.json'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    console.log('❌ Missing required production files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\nPlease create these files before deploying to production.');
    console.log('Use the .example files as templates.');
    return false;
  }

  console.log('✅ Production environment files found');
  return true;
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'local':
    setupLocalEnvironment();
    break;
  case 'production':
    setupProductionEnvironment();
    break;
  default:
    setupLocalEnvironment();
    break;
}