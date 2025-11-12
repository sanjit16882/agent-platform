# 🚀 Complete Guide: Publishing AgentHub Extension to VS Code Marketplace

This guide walks you through the entire process of getting your AgentHub VS Code extension published so users can find it by searching "agenthub" in VS Code.

## 🎯 Goal
When users search for "agenthub" in VS Code Extensions (`Ctrl+Shift+X`), your extension will appear in the results and they can install it with one click.

## 📋 Prerequisites (One-time Setup)

### 1. Create Microsoft Account
- Go to https://account.microsoft.com
- Create account if you don't have one
- **Save credentials securely**

### 2. Set Up Azure DevOps
- Go to https://dev.azure.com
- Sign in with Microsoft account
- Create new organization (e.g., "your-company-devops")
- **Note the organization name**

### 3. Create Marketplace Publisher
- Go to https://marketplace.visualstudio.com/manage
- Sign in with same Microsoft account
- Click "Create publisher"
- Fill out publisher profile:
  ```
  Publisher ID: your-company (must be unique)
  Display Name: Your Company Name
  Description: Brief description of your organization
  ```
- **Save the Publisher ID** - you'll need this!

### 4. Generate Personal Access Token (PAT)
- In Azure DevOps, click your profile → Personal Access Tokens
- Click "New Token"
- Settings:
  ```
  Name: VS Code Extension Publishing
  Organization: All accessible organizations
  Expiration: 1 year (or custom)
  Scopes: Custom defined
  ✅ Marketplace: Manage
  ```
- **Copy and save the token immediately** - you won't see it again!

## 🛠️ Extension Setup

### 1. Update Publisher Information
Edit `package.json`:
```json
{
  "publisher": "your-actual-publisher-id",
  "name": "agenthub-vscode-extension"
}
```

### 2. Create Extension Icon
```bash
# Generate basic icon
node create-icon.js

# Convert SVG to PNG (128x128)
# Use online converter or graphics software
# Save as icon.png in root directory
```

### 3. Add Required Files
Ensure you have:
- ✅ `README.md` (with screenshots/examples)
- ✅ `CHANGELOG.md` (version history)
- ✅ `LICENSE` (MIT recommended)
- ✅ `icon.png` (128x128 pixels)

## 🚀 Publishing Process

### Method 1: Automated Script (Recommended)

1. **Configure the script:**
   ```javascript
   // In publish-to-marketplace.js, update:
   const PUBLISHER_NAME = 'your-actual-publisher-id';
   ```

2. **Run validation:**
   ```bash
   npm run publish:check
   ```

3. **Login to marketplace:**
   ```bash
   npx vsce login your-actual-publisher-id
   # Enter your Personal Access Token when prompted
   ```

4. **Publish:**
   ```bash
   npm run publish
   ```

### Method 2: Manual Steps

1. **Install VSCE:**
   ```bash
   npm install -g vsce
   ```

2. **Login:**
   ```bash
   vsce login your-publisher-id
   # Enter PAT when prompted
   ```

3. **Build and publish:**
   ```bash
   npm run compile
   vsce package
   vsce publish
   ```

## ✅ Verification

### 1. Check Marketplace
- Go to https://marketplace.visualstudio.com
- Search for "agenthub"
- Your extension should appear

### 2. Test in VS Code
- Open VS Code
- Press `Ctrl+Shift+X` (Extensions)
- Search "agenthub"
- Install your extension
- Verify it works

### 3. Check Management Portal
- Go to https://marketplace.visualstudio.com/manage
- View your extension statistics
- Monitor downloads and ratings

## 🎯 Making It Discoverable

### 1. Optimize Keywords
In `package.json`, ensure these keywords:
```json
"keywords": [
  "agenthub",
  "ai",
  "agent", 
  "artificial intelligence",
  "testing",
  "security",
  "automation",
  "code generation"
]
```

### 2. Write Compelling Description
```json
"description": "Connect VS Code to AgentHub platforms for AI-powered testing, security analysis, and code generation. Boost developer productivity with intelligent assistance."
```

### 3. Add Screenshots to README
Include GIFs or images showing:
- Right-click context menu
- Command palette usage
- Generated test files
- Security analysis results

## 🔄 Updates and Maintenance

### Publishing Updates
```bash
# Update version in package.json, then:
vsce publish patch  # 1.0.0 → 1.0.1
vsce publish minor  # 1.0.0 → 1.1.0
vsce publish major  # 1.0.0 → 2.0.0
```

### Monitor Performance
- **Downloads**: Track adoption rate
- **Ratings**: Aim for 4+ stars
- **Reviews**: Respond to user feedback
- **Issues**: Monitor GitHub issues

## 🛡️ Security Best Practices

### 1. Protect Sensitive Data
- Never include API keys in extension
- Use VS Code SecretStorage for credentials
- Validate all user inputs

### 2. Token Management
- Rotate Personal Access Tokens annually
- Use minimal required permissions
- Store tokens securely

### 3. Code Security
- Regular dependency updates
- Security scanning in CI/CD
- Code reviews for all changes

## 🚨 Troubleshooting

### Common Publishing Issues

#### "Publisher not found"
```bash
# Verify publisher ID matches marketplace account
vsce ls-publishers
```

#### "Authentication failed"
```bash
# Re-login with fresh token
vsce logout
vsce login your-publisher-id
```

#### "Version already exists"
```bash
# Increment version in package.json
# Then publish again
```

#### "Package too large"
Update `.vscodeignore`:
```
node_modules/**
src/**
*.ts
*.map
.git/**
```

### Extension Not Appearing in Search

1. **Wait**: Can take 15-30 minutes to index
2. **Check keywords**: Ensure "agenthub" is in keywords
3. **Verify publication**: Check marketplace management portal
4. **Clear VS Code cache**: Restart VS Code

## 📊 Success Metrics

After publishing, track:
- **Install count**: Number of downloads
- **Active users**: Regular usage
- **Rating**: User satisfaction (aim for 4+)
- **Reviews**: User feedback quality
- **GitHub stars**: Community engagement

## 🎉 Launch Checklist

- [ ] Extension published successfully
- [ ] Appears in marketplace search for "agenthub"
- [ ] Can be installed from VS Code
- [ ] All features work after installation
- [ ] Documentation updated with marketplace link
- [ ] Team/community notified
- [ ] Social media announcement (optional)

## 📞 Support Resources

- **VS Code Extension API**: https://code.visualstudio.com/api
- **Marketplace Management**: https://marketplace.visualstudio.com/manage
- **VSCE Documentation**: https://github.com/microsoft/vscode-vsce
- **Azure DevOps**: https://dev.azure.com

## 🎯 Your Extension URL

Once published, your extension will be available at:
```
https://marketplace.visualstudio.com/items?itemName=YOUR-PUBLISHER.agenthub-vscode-extension
```

Users can install it by:
1. Searching "agenthub" in VS Code Extensions
2. Visiting the marketplace URL
3. Using command: `code --install-extension YOUR-PUBLISHER.agenthub-vscode-extension`

**Congratulations! Your AgentHub extension is now available to developers worldwide! 🎉**