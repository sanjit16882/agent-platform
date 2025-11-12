# Publishing AgentHub VS Code Extension to Visual Studio Marketplace

This guide explains how to publish the AgentHub VS Code extension to the Visual Studio Marketplace so users can find and install it directly from VS Code.

## 📋 Prerequisites

### 1. Microsoft Account & Azure DevOps
- Create a Microsoft account if you don't have one
- Sign up for Azure DevOps: https://dev.azure.com
- Create an organization in Azure DevOps

### 2. Publisher Account
- Go to Visual Studio Marketplace: https://marketplace.visualstudio.com
- Click "Publish extensions" 
- Sign in with your Microsoft account
- Create a publisher profile

### 3. Personal Access Token (PAT)
1. Go to Azure DevOps: https://dev.azure.com
2. Click on your profile → Personal Access Tokens
3. Create new token with these scopes:
   - **Marketplace**: Manage
   - **Expiration**: Set to 1 year or custom
4. **Save the token securely** - you won't see it again!

## 🛠️ Setup for Publishing

### 1. Install VSCE (Visual Studio Code Extension Manager)
```bash
npm install -g vsce
```

### 2. Login to Publisher Account
```bash
vsce login <your-publisher-name>
```
Enter your Personal Access Token when prompted.

### 3. Update package.json for Marketplace

Make sure your `package.json` has these required fields:

```json
{
  "name": "agenthub-vscode-extension",
  "displayName": "AgentHub - AI Development Assistant",
  "description": "Integrate AI agents into VS Code for testing, security analysis, and code generation",
  "version": "1.0.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": [
    "Other",
    "Testing", 
    "Linters",
    "Machine Learning"
  ],
  "keywords": [
    "ai",
    "agent", 
    "agenthub",
    "testing",
    "security",
    "automation",
    "code generation",
    "artificial intelligence"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/agenthub-vscode-extension"
  },
  "bugs": {
    "url": "https://github.com/your-org/agenthub-vscode-extension/issues"
  },
  "homepage": "https://github.com/your-org/agenthub-vscode-extension#readme",
  "license": "MIT",
  "icon": "icon.png"
}
```

### 4. Add Required Files

#### Icon (Required)
Create `icon.png` - 128x128 pixels, PNG format:
```bash
# Add your extension icon as icon.png in the root directory
```

#### License (Recommended)
Create `LICENSE` file:
```bash
# Add MIT or your preferred license
```

#### .vscodeignore (Important)
Update `.vscodeignore` to exclude unnecessary files:
```
.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
node_modules/**
*.vsix
.git/**
```

## 🚀 Publishing Process

### 1. Pre-publish Checklist
- [ ] Extension works locally (`F5` to test)
- [ ] All required files present (icon, license, README)
- [ ] Version number updated
- [ ] Keywords include "agenthub" for discoverability
- [ ] Repository URL is correct

### 2. Package the Extension
```bash
# Test packaging first
vsce package

# This creates: agenthub-vscode-extension-1.0.0.vsix
```

### 3. Publish to Marketplace
```bash
# Publish directly
vsce publish

# Or publish with version increment
vsce publish patch  # 1.0.0 → 1.0.1
vsce publish minor  # 1.0.0 → 1.1.0  
vsce publish major  # 1.0.0 → 2.0.0
```

### 4. Verify Publication
1. Go to https://marketplace.visualstudio.com
2. Search for "agenthub"
3. Your extension should appear in results
4. Test installation from VS Code: `Ctrl+Shift+X` → Search "agenthub"

## 📈 Making Your Extension Discoverable

### 1. Optimize Keywords
Include relevant keywords in `package.json`:
```json
"keywords": [
  "agenthub",
  "ai assistant", 
  "code generation",
  "test automation",
  "security scanning",
  "artificial intelligence",
  "development tools",
  "productivity"
]
```

### 2. Write Good Description
```json
"description": "Connect VS Code to AgentHub platforms for AI-powered testing, security analysis, and code generation. Boost productivity with intelligent development assistance."
```

### 3. Create Compelling README
- Add screenshots/GIFs of the extension in action
- Clear installation and setup instructions
- Feature highlights with examples
- Configuration guide

### 4. Categories
Choose appropriate categories:
```json
"categories": [
  "Machine Learning",
  "Testing",
  "Linters", 
  "Other"
]
```

## 🔄 Updating Your Extension

### 1. Update Version
```bash
# Update package.json version, then:
vsce publish patch
```

### 2. Update with Changes
```bash
# Make your changes, then:
vsce package
vsce publish
```

## 📊 Monitoring and Analytics

### 1. Marketplace Analytics
- View download statistics in Visual Studio Marketplace
- Monitor user ratings and reviews
- Track installation trends

### 2. Usage Analytics (Optional)
Add telemetry to track feature usage:
```typescript
// In your extension code
import * as vscode from 'vscode';

// Track command usage
vscode.commands.executeCommand('setContext', 'agenthub.featureUsed', true);
```

## 🛡️ Best Practices

### 1. Security
- Never include API keys in the extension
- Use VS Code's SecretStorage for sensitive data
- Validate all user inputs

### 2. Performance
- Lazy load heavy dependencies
- Use VS Code's progress API for long operations
- Cache API responses when appropriate

### 3. User Experience
- Provide clear error messages
- Show progress for long operations
- Follow VS Code UX guidelines

## 🔧 Troubleshooting Publishing Issues

### Common Issues:

#### 1. "Publisher not found"
```bash
# Create publisher first at marketplace.visualstudio.com
# Then login again:
vsce login your-publisher-name
```

#### 2. "Invalid icon"
- Icon must be 128x128 PNG
- Place in root directory as `icon.png`

#### 3. "Missing repository"
Add to package.json:
```json
"repository": {
  "type": "git", 
  "url": "https://github.com/your-org/repo"
}
```

#### 4. "Package too large"
Update `.vscodeignore` to exclude:
- `node_modules/`
- Source TypeScript files
- Test files
- Build artifacts

## 📞 Support Resources

- **VS Code Extension API**: https://code.visualstudio.com/api
- **Publishing Guide**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Marketplace**: https://marketplace.visualstudio.com/manage
- **VSCE Documentation**: https://github.com/microsoft/vscode-vsce

## 🎯 Success Metrics

After publishing, track:
- **Downloads**: Number of installations
- **Ratings**: User satisfaction (aim for 4+ stars)
- **Reviews**: User feedback and feature requests
- **Active Users**: Regular usage statistics

Your extension will be discoverable at:
`https://marketplace.visualstudio.com/items?itemName=your-publisher.agenthub-vscode-extension`

And users can install it directly from VS Code by searching "agenthub"!