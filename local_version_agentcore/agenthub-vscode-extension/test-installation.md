# Testing AgentHub VS Code Extension

## Installation

The extension has been packaged as `agenthub-1.0.0.vsix`. To install and test:

### 1. Install Extension
```bash
# Option A: Install from VSIX file
code --install-extension agenthub-1.0.0.vsix

# Option B: Install from VS Code UI
# 1. Open VS Code
# 2. Go to Extensions (Ctrl+Shift+X)
# 3. Click "..." menu → "Install from VSIX..."
# 4. Select agenthub-1.0.0.vsix
```

### 2. Verify Installation
1. Open VS Code
2. Check Extensions panel - "AgentHub" should be listed
3. Look for AgentHub icon in Activity Bar (robot icon)
4. Status bar should show "AgentHub (Disconnected)"

## Testing Features

### 1. Configure Connection
```
Ctrl+Shift+P → "AgentHub: Configure AgentHub"
```
- Enter API URL: `http://localhost:4003` (or your AgentHub server)
- Enter API Key: (optional)
- Should show "AgentHub configured successfully!" if connection works

### 2. Test Right-Click Menu
1. Create a test JavaScript file:
```javascript
// test.js
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  return a / b; // Potential division by zero
}

module.exports = { add, divide };
```

2. Right-click on the file in Explorer
3. Should see AgentHub options:
   - "Generate Tests for This File"
   - "Security Analysis for This File"
   - "Generate Documentation for This File"

### 3. Test Command Palette
```
Ctrl+Shift+P → type "AgentHub"
```
Should show all AgentHub commands:
- AgentHub: Generate Tests
- AgentHub: Security Analysis
- AgentHub: Analyze Failure
- AgentHub: Generate Documentation
- AgentHub: List Available Agents
- AgentHub: Configure AgentHub
- AgentHub: Initialize AgentHub in Project

### 4. Test Generate Tests
1. Right-click test.js → "Generate Tests for This File"
2. Should create `tests/test.test.js` with generated tests
3. Generated file should open automatically
4. Check AgentHub output panel for details

### 5. Test Security Analysis
1. Right-click test.js → "Security Analysis for This File"
2. Should show security issues in output panel
3. Issues should appear in VS Code Problems panel
4. Status bar should update operation count

### 6. Test Side Panel
1. Click AgentHub icon in Activity Bar
2. Should show "Available Agents" and "Recent Operations" views
3. If connected, agents should be listed
4. Recent operations should show your test activities

### 7. Test Status Bar
1. Status bar should show connection status
2. Click status bar item → should open output panel
3. After operations, counter should increment

## Expected Results

✅ **Extension Loads**: No errors in VS Code Developer Console  
✅ **Commands Available**: All commands appear in Command Palette  
✅ **Right-Click Menu**: Context menu items appear for supported files  
✅ **Configuration Works**: Can set API URL and test connection  
✅ **File Operations**: Can generate tests, analyze security, create docs  
✅ **Output Panel**: Shows detailed results and logging  
✅ **Status Bar**: Shows connection status and operation count  
✅ **Side Panel**: Displays agents and operation history  

## Troubleshooting

### Extension Not Loading
- Check VS Code Developer Console: `Help → Toggle Developer Tools`
- Look for AgentHub-related errors
- Verify extension is enabled in Extensions panel

### Commands Not Appearing
- Reload VS Code: `Ctrl+Shift+P → "Developer: Reload Window"`
- Check if extension activated: Look for "AgentHub extension is now active!" in console

### Connection Issues
- Verify AgentHub server is running
- Check API URL in settings: `File → Preferences → Settings → Extensions → AgentHub`
- Test connection: `Ctrl+Shift+P → "AgentHub: Configure AgentHub"`

### Right-Click Menu Missing
- Ensure file has supported extension (.js, .ts, .py, .java, etc.)
- Try reloading VS Code
- Check if context conditions are met

## Mock Server for Testing

If you don't have AgentHub server running, use the mock server:

```bash
# Start mock server from CLI project
cd ../agent-hub-cli/test-server
npm start
# Runs on http://localhost:4003
```

Then configure extension to use `http://localhost:4003`.

## Development Testing

For development and debugging:

```bash
# Open extension in VS Code
code agenthub-vscode-extension

# Press F5 to launch Extension Development Host
# Test extension in the new VS Code window
```

The extension is now ready for production use and demonstrates complete integration between AgentHub agents and VS Code developer workflow!