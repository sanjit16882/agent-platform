#!/usr/bin/env node

/**
 * Organization Deployment Script for AgentHub VS Code Extension
 * 
 * This script helps organizations customize and deploy the extension
 * with their specific branding and configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration - Update these values for your organization
const ORG_CONFIG = {
  name: 'your-company-agenthub',
  displayName: 'YourCompany AgentHub Assistant',
  description: 'AI-powered development assistant for YourCompany developers',
  publisher: 'your-company',
  apiUrl: 'https://agenthub.yourcompany.com',
  version: '1.0.0'
};

function updatePackageJson() {
  console.log('📦 Updating package.json with organization settings...');
  
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Update basic info
  packageJson.name = ORG_CONFIG.name;
  packageJson.displayName = ORG_CONFIG.displayName;
  packageJson.description = ORG_CONFIG.description;
  packageJson.publisher = ORG_CONFIG.publisher;
  packageJson.version = ORG_CONFIG.version;
  
  // Update default API URL
  if (packageJson.contributes && packageJson.contributes.configuration) {
    const apiUrlProp = packageJson.contributes.configuration.properties['agenthub.apiUrl'];
    if (apiUrlProp) {
      apiUrlProp.default = ORG_CONFIG.apiUrl;
    }
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json updated successfully');
}

function updateReadme() {
  console.log('📖 Updating README with organization info...');
  
  const readmePath = path.join(__dirname, 'README.md');
  let readme = fs.readFileSync(readmePath, 'utf8');
  
  // Replace generic placeholders with organization info
  readme = readme.replace(/your-organization/g, ORG_CONFIG.publisher);
  readme = readme.replace(/https:\/\/your-agenthub-instance\.com/g, ORG_CONFIG.apiUrl);
  readme = readme.replace(/YourCompany/g, ORG_CONFIG.publisher);
  
  fs.writeFileSync(readmePath, readme);
  console.log('✅ README updated successfully');
}

function buildExtension() {
  console.log('🔨 Building extension...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    execSync('npm run compile', { stdio: 'inherit' });
    console.log('✅ Extension built successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function packageExtension() {
  console.log('📦 Packaging extension...');
  
  try {
    // Check if vsce is installed
    try {
      execSync('vsce --version', { stdio: 'pipe' });
    } catch {
      console.log('Installing vsce...');
      execSync('npm install -g vsce', { stdio: 'inherit' });
    }
    
    execSync('vsce package', { stdio: 'inherit' });
    console.log('✅ Extension packaged successfully');
    
    const vsixFile = `${ORG_CONFIG.name}-${ORG_CONFIG.version}.vsix`;
    console.log(`📁 Extension package: ${vsixFile}`);
    console.log(`🚀 Install with: code --install-extension ${vsixFile}`);
    
  } catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
  }
}

function createDeploymentInstructions() {
  console.log('📋 Creating deployment instructions...');
  
  const instructions = `# Deployment Instructions for ${ORG_CONFIG.displayName}

## Installation

### Option 1: Direct Installation
\`\`\`bash
code --install-extension ${ORG_CONFIG.name}-${ORG_CONFIG.version}.vsix
\`\`\`

### Option 2: Workspace Recommendation
Add to your workspace \`.vscode/extensions.json\`:
\`\`\`json
{
  "recommendations": [
    "${ORG_CONFIG.publisher}.${ORG_CONFIG.name}"
  ]
}
\`\`\`

## Configuration

Add to user or workspace settings:
\`\`\`json
{
  "agenthub.apiUrl": "${ORG_CONFIG.apiUrl}",
  "agenthub.apiKey": "\${env:AGENTHUB_API_KEY}",
  "agenthub.autoSecurityScan": true,
  "agenthub.showStatusBar": true
}
\`\`\`

## Environment Variables

Set the following environment variable:
\`\`\`bash
export AGENTHUB_API_KEY="your-api-key-here"
\`\`\`

## Support

Contact your development team or AgentHub administrator for support.
`;

  fs.writeFileSync('DEPLOYMENT.md', instructions);
  console.log('✅ Deployment instructions created: DEPLOYMENT.md');
}

function main() {
  console.log(`🚀 Deploying AgentHub VS Code Extension for ${ORG_CONFIG.publisher}`);
  console.log('=' .repeat(60));
  
  // Check if this is a customization
  if (ORG_CONFIG.publisher === 'your-company') {
    console.log('⚠️  Please update ORG_CONFIG in this script with your organization details');
    console.log('   Edit the ORG_CONFIG object at the top of this file');
    process.exit(1);
  }
  
  updatePackageJson();
  updateReadme();
  buildExtension();
  packageExtension();
  createDeploymentInstructions();
  
  console.log('=' .repeat(60));
  console.log('🎉 Deployment completed successfully!');
  console.log(`📦 Extension: ${ORG_CONFIG.name}-${ORG_CONFIG.version}.vsix`);
  console.log('📋 Instructions: DEPLOYMENT.md');
}

if (require.main === module) {
  main();
}

module.exports = { ORG_CONFIG, updatePackageJson, updateReadme };