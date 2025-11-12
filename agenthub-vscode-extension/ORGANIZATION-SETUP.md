# Quick Setup for Organizations

This guide helps organizations quickly customize and deploy the AgentHub VS Code extension.

## 🚀 Quick Start (5 minutes)

### 1. Clone and Customize

```bash
git clone <this-repository>
cd agenthub-vscode-extension
```

### 2. Edit Organization Settings

Open `deploy-organization.js` and update the `ORG_CONFIG` object:

```javascript
const ORG_CONFIG = {
  name: 'acme-agenthub',                    // Your extension name
  displayName: 'ACME AgentHub Assistant',   // Display name in VS Code
  description: 'AI assistant for ACME developers',
  publisher: 'acme-corp',                   // Your organization identifier
  apiUrl: 'https://agenthub.acme.com',     // Your AgentHub instance URL
  version: '1.0.0'
};
```

### 3. Deploy

```bash
npm run deploy:org
```

This will:
- ✅ Update all configuration files
- ✅ Build the extension
- ✅ Package it as a `.vsix` file
- ✅ Create deployment instructions

### 4. Distribute

Share the generated `.vsix` file with your developers:

```bash
code --install-extension acme-agenthub-1.0.0.vsix
```

## 📋 What Gets Customized

- **Extension name and branding**
- **Default API URL** pointing to your AgentHub instance
- **Publisher information**
- **Documentation** with your organization details

## 🔧 Advanced Customization

For more advanced customization, see:
- [CUSTOMIZATION.md](./CUSTOMIZATION.md) - Detailed customization guide
- [README.md](./README.md) - Full documentation

## 📦 Distribution Options

### Option 1: Direct Installation
Distribute the `.vsix` file directly to developers.

### Option 2: Internal Marketplace
Upload to your organization's internal VS Code marketplace.

### Option 3: Workspace Recommendations
Include in project `.vscode/extensions.json` files.

## 🔐 Security Setup

1. **API Keys**: Use environment variables
   ```bash
   export AGENTHUB_API_KEY="your-key-here"
   ```

2. **Network**: Ensure your AgentHub instance is accessible from developer machines

3. **Permissions**: Configure appropriate access controls in your AgentHub instance

## 🆘 Troubleshooting

### Build Issues
```bash
npm install
npm run compile
```

### Packaging Issues
```bash
npm install -g vsce
vsce package
```

### Connection Issues
- Verify `agenthub.apiUrl` setting
- Check network connectivity
- Validate API key configuration

## 📞 Support

- Check the generated `DEPLOYMENT.md` file
- Review [CUSTOMIZATION.md](./CUSTOMIZATION.md) for detailed options
- Contact your AgentHub platform administrator