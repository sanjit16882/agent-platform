# Developer Tools Integration Guide

## 🛠️ **AgentHub Developer Experience**

The Agent Factory platform includes **two essential developer tools** to keep dev and QE teams focused within their integrated environment:

### 1. **VSCode Extension** - IDE Integration
### 2. **CLI Tool** - Terminal Integration

---

## 🎯 **VSCode Extension Integration**

### **Installation & Setup**

#### **Option A: Install from VSIX Package**
```bash
# Navigate to extension directory
cd agenthub-vscode-extension

# Install the pre-built extension
code --install-extension agenthub-1.0.0.vsix
```

#### **Option B: Development Installation**
```bash
# Build and install from source
cd agenthub-vscode-extension
npm install
npm run compile
npm run package
code --install-extension agenthub-1.0.0.vsix
```

### **Configuration**
1. **Open VSCode Settings** (`Ctrl+,`)
2. **Search for "AgentHub"**
3. **Configure:**
   ```json
   {
     "agenthub.apiUrl": "http://localhost:3002",
     "agenthub.apiKey": "",
     "agenthub.autoSecurityScan": true,
     "agenthub.showStatusBar": true
   }
   ```

### **Features Available in VSCode:**

#### **🖱️ Right-Click Context Menu:**
- **Generate Tests for This File** - Create comprehensive test suites
- **Security Analysis for This File** - Scan for vulnerabilities  
- **Generate Documentation for This File** - Create code docs

#### **⌨️ Command Palette** (`Ctrl+Shift+P`):
- `AgentHub: Generate Tests`
- `AgentHub: Security Analysis`
- `AgentHub: Analyze Failure`
- `AgentHub: Generate Documentation`
- `AgentHub: List Available Agents`
- `AgentHub: Configure AgentHub`

#### **📊 Status Bar Integration:**
- Real-time connection status to platform
- Operation counter
- Quick access to output panel

#### **🌳 Side Panel Views:**
- **Available Agents** - Browse platform agents
- **Recent Operations** - Track usage history

---

## 🖥️ **CLI Tool Integration**

### **Installation & Setup**

#### **Global Installation:**
```bash
# Navigate to CLI directory
cd agent-hub-cli

# Install dependencies and build
npm install
npm run build

# Link globally for development
npm link

# Or install globally (when published)
npm install -g @agenthub/cli
```

### **Configuration**
```bash
# Interactive setup
agent config setup

# Set API URL to local platform
agent config set --api-url http://localhost:3002

# Test connection
agent config test
```

### **CLI Commands Available:**

#### **🚀 Project Management:**
```bash
# Initialize AgentHub in project
agent init

# View project status
agent status
```

#### **🧪 Testing:**
```bash
# Generate tests for entire project
agent test

# Generate tests for specific file
agent test src/utils.ts

# Run generated tests
agent test --run
```

#### **🔒 Security:**
```bash
# Security scan entire project
agent scan

# Scan specific file
agent scan src/auth.ts

# Scan with specific security agent
agent scan --agent security-scanner-v2
```

#### **📚 Documentation:**
```bash
# Generate documentation
agent docs

# Generate for specific file
agent docs src/api.ts
```

#### **🤖 Agent Management:**
```bash
# List available agents
agent list

# Get agent details
agent info test-generator

# Execute custom agent
agent run custom-agent --input "data"
```

---

## 🔗 **Platform Integration Points**

### **Backend API Endpoints** (Already Available):
- `GET /api/v1/agents` - List agents for VSCode/CLI
- `POST /api/v1/agents/{id}/execute` - Execute agents from tools
- `GET /api/v1/bedrock/models` - Model information for tools
- `GET /health` - Connection testing

### **Configuration Sync:**
Both tools automatically connect to:
- **API URL**: `http://localhost:3002`
- **Bedrock Models**: Available through platform
- **Agent Registry**: Shared agent catalog

---

## 🎯 **Developer Workflow Integration**

### **Typical Dev Workflow:**

1. **Start Platform:**
   ```bash
   # Start local platform
   start-local.bat
   ```

2. **Open Project in VSCode:**
   - VSCode extension automatically connects
   - Status bar shows "AgentHub Connected"
   - Right-click menus available on code files

3. **CLI Usage:**
   ```bash
   # Initialize project
   agent init

   # Generate tests while coding
   agent test src/newFeature.ts

   # Security scan before commit
   agent scan
   ```

4. **IDE Integration:**
   - Right-click → "Generate Tests for This File"
   - Command Palette → "AgentHub: Security Analysis"
   - Auto-scan on file save (configurable)

### **QE Team Workflow:**

1. **Test Generation:**
   ```bash
   # Generate comprehensive test suites
   agent test --framework jest
   agent test --framework cypress
   ```

2. **Security Testing:**
   ```bash
   # Security analysis
   agent scan --type security
   ```

3. **VSCode Integration:**
   - Right-click test files → "Generate Additional Tests"
   - Security issues appear as VSCode diagnostics
   - Auto-documentation generation

---

## 🚀 **Quick Setup Guide**

### **1. Install VSCode Extension:**
```bash
cd agenthub-vscode-extension
code --install-extension agenthub-1.0.0.vsix
```

### **2. Install CLI Tool:**
```bash
cd agent-hub-cli
npm install && npm run build && npm link
```

### **3. Configure Both Tools:**
```bash
# CLI configuration
agent config set --api-url http://localhost:3002

# VSCode: Settings → AgentHub → API URL: http://localhost:3002
```

### **4. Test Integration:**
```bash
# Test CLI
agent list

# Test VSCode: Ctrl+Shift+P → "AgentHub: List Available Agents"
```

---

## 🔧 **Troubleshooting**

### **Connection Issues:**
1. Ensure platform is running: `http://localhost:3002/health`
2. Check API URL in both tools
3. Verify no firewall blocking localhost connections

### **VSCode Extension Issues:**
1. Check VSCode Developer Console (`Help → Toggle Developer Tools`)
2. Verify extension is enabled in Extensions panel
3. Reload VSCode window (`Ctrl+Shift+P → "Reload Window"`)

### **CLI Issues:**
1. Check global installation: `which agent`
2. Verify Node.js version: `node --version` (requires 16+)
3. Test connection: `agent config test`

---

## 📈 **Benefits for Development Teams**

### **For Developers:**
- ✅ **Stay in IDE** - No context switching to web platform
- ✅ **Right-click convenience** - Instant agent access
- ✅ **Terminal integration** - CLI for automation scripts
- ✅ **Auto-scanning** - Continuous security and quality checks

### **For QE Teams:**
- ✅ **Test generation** - Automated test suite creation
- ✅ **Security scanning** - Built-in vulnerability detection
- ✅ **Documentation** - Auto-generated test documentation
- ✅ **CI/CD integration** - CLI commands in build pipelines

### **For Teams:**
- ✅ **Consistent tooling** - Same agents across IDE, CLI, and web
- ✅ **Shared configuration** - Team-wide agent preferences
- ✅ **Integrated workflow** - Seamless development experience
- ✅ **Real-time collaboration** - Shared agent results and insights

The developer tools create a **unified development experience** where AI agents are seamlessly integrated into existing workflows! 🎉