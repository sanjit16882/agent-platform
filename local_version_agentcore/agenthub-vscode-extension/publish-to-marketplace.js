#!/usr/bin/env node

/**
 * Automated Publishing Script for AgentHub VS Code Extension
 * 
 * This script automates the process of publishing to VS Code Marketplace
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PUBLISHER_NAME = 'your-publisher-name'; // Update this!
const EXTENSION_NAME = 'agenthub-vscode-extension';

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if vsce is installed
  try {
    execSync('vsce --version', { stdio: 'pipe' });
    console.log('✅ VSCE is installed');
  } catch {
    console.log('📦 Installing VSCE...');
    execSync('npm install -g vsce', { stdio: 'inherit' });
  }
  
  // Check if logged in
  try {
    execSync(`vsce ls-publishers`, { stdio: 'pipe' });
    console.log('✅ Logged in to marketplace');
  } catch {
    console.log('❌ Not logged in to marketplace');
    console.log('🔑 Please run: vsce login ' + PUBLISHER_NAME);
    console.log('   You\'ll need your Personal Access Token from Azure DevOps');
    process.exit(1);
  }
}

function validatePackageJson() {
  console.log('📋 Validating package.json...');
  
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const required = ['name', 'displayName', 'description', 'version', 'publisher', 'engines'];
  const missing = required.filter(field => !packageJson[field]);
  
  if (missing.length > 0) {
    console.log('❌ Missing required fields:', missing.join(', '));
    process.exit(1);
  }
  
  if (packageJson.publisher === 'your-organization' || packageJson.publisher === 'your-publisher-name') {
    console.log('❌ Please update the publisher field in package.json');
    console.log('   Current: ' + packageJson.publisher);
    console.log('   Should be your actual marketplace publisher name');
    process.exit(1);
  }
  
  console.log('✅ Package.json is valid');
  return packageJson;
}

function checkRequiredFiles() {
  console.log('📁 Checking required files...');
  
  const requiredFiles = ['README.md', 'CHANGELOG.md'];
  const optionalFiles = ['LICENSE', 'icon.png'];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`❌ Missing required file: ${file}`);
      process.exit(1);
    }
  });
  
  optionalFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  Missing recommended file: ${file}`);
    } else {
      console.log(`✅ Found ${file}`);
    }
  });
  
  console.log('✅ Required files present');
}

function buildExtension() {
  console.log('🔨 Building extension...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    execSync('npm run compile', { stdio: 'inherit' });
    console.log('✅ Extension built successfully');
  } catch (error) {
    console.log('❌ Build failed');
    process.exit(1);
  }
}

function packageExtension() {
  console.log('📦 Packaging extension...');
  
  try {
    execSync('vsce package', { stdio: 'inherit' });
    console.log('✅ Extension packaged successfully');
  } catch (error) {
    console.log('❌ Packaging failed');
    process.exit(1);
  }
}

function publishExtension(packageJson) {
  console.log('🚀 Publishing to marketplace...');
  
  try {
    execSync('vsce publish', { stdio: 'inherit' });
    console.log('✅ Extension published successfully!');
    
    const marketplaceUrl = `https://marketplace.visualstudio.com/items?itemName=${packageJson.publisher}.${packageJson.name}`;
    console.log('🌐 Marketplace URL:', marketplaceUrl);
    
    console.log('\n🎉 Success! Your extension is now available on the marketplace.');
    console.log('📊 It may take a few minutes to appear in search results.');
    console.log('🔍 Users can now search for "agenthub" in VS Code extensions.');
    
  } catch (error) {
    console.log('❌ Publishing failed');
    console.log('💡 Common issues:');
    console.log('   - Check your Personal Access Token');
    console.log('   - Verify publisher name matches your marketplace account');
    console.log('   - Ensure version number is higher than current published version');
    process.exit(1);
  }
}

function showPostPublishInstructions(packageJson) {
  console.log('\n📋 Post-Publish Checklist:');
  console.log('1. ✅ Verify extension appears in marketplace search');
  console.log('2. ✅ Test installation from VS Code');
  console.log('3. ✅ Update documentation with marketplace link');
  console.log('4. ✅ Announce to your team/community');
  
  console.log('\n🔗 Useful Links:');
  console.log(`   Marketplace: https://marketplace.visualstudio.com/items?itemName=${packageJson.publisher}.${packageJson.name}`);
  console.log(`   Management: https://marketplace.visualstudio.com/manage/publishers/${packageJson.publisher}`);
  console.log('   Analytics: Available in marketplace management portal');
  
  console.log('\n📈 Next Steps:');
  console.log('   - Monitor download statistics');
  console.log('   - Respond to user reviews');
  console.log('   - Plan future updates');
  console.log('   - Consider adding telemetry for usage insights');
}

function main() {
  console.log('🚀 AgentHub VS Code Extension - Marketplace Publisher');
  console.log('=' .repeat(60));
  
  // Validate configuration
  if (PUBLISHER_NAME === 'your-publisher-name') {
    console.log('❌ Please update PUBLISHER_NAME in this script');
    console.log('   Edit the PUBLISHER_NAME constant at the top of this file');
    process.exit(1);
  }
  
  try {
    checkPrerequisites();
    const packageJson = validatePackageJson();
    checkRequiredFiles();
    buildExtension();
    packageExtension();
    publishExtension(packageJson);
    showPostPublishInstructions(packageJson);
    
  } catch (error) {
    console.log('❌ Publishing process failed:', error.message);
    process.exit(1);
  }
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('AgentHub VS Code Extension Publisher');
  console.log('');
  console.log('Usage: node publish-to-marketplace.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --check        Only run validation checks');
  console.log('  --package      Only package, don\'t publish');
  console.log('');
  console.log('Prerequisites:');
  console.log('1. Update PUBLISHER_NAME in this script');
  console.log('2. Login to marketplace: vsce login <publisher-name>');
  console.log('3. Ensure package.json has correct publisher field');
  process.exit(0);
}

if (args.includes('--check')) {
  console.log('🔍 Running validation checks only...');
  checkPrerequisites();
  validatePackageJson();
  checkRequiredFiles();
  console.log('✅ All checks passed!');
  process.exit(0);
}

if (args.includes('--package')) {
  console.log('📦 Packaging only...');
  validatePackageJson();
  checkRequiredFiles();
  buildExtension();
  packageExtension();
  console.log('✅ Package created successfully!');
  process.exit(0);
}

if (require.main === module) {
  main();
}