# MCP Navigation Structure - Visual Guide

## New Developer Tools Menu Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Tools ▼                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📚 Documentation                                            │
│  ├─ API Documentation                                        │
│  └─ Integration Guide                                        │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔌 MCP (Model Context Protocol)                            │
│  ├─ 🔧 Manage MCP Servers [NEW]  ← NEW PAGE                │
│  ├─ 🐳 MCP Dashboard             ← RELOCATED                │
│  └─ 🔌 MCP Test & Integration                               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔗 Integration & Testing                                    │
│  ├─ Platform Integration                                     │
│  └─ Enterprise Integration                                   │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🛠️ Development Tools                                        │
│  ├─ CLI & IDE Integration                                    │
│  ├─ SDKs & Libraries                                         │
│  ├─ Webhooks & Events                                        │
│  └─ API Key Management                                       │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🚀 Extensions                                               │
│  └─ Get VS Code Extension                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## MCP Section Details

### 🔧 Manage MCP Servers [NEW]
**URL:** `/mcp-management`  
**Badge:** NEW (Primary)

**Purpose:**
- Configure new MCP servers
- Manage server-agent configurations
- Export configuration files
- Onboard servers to AgentHub

**Key Features:**
- Server templates
- Configuration management
- Secrets handling
- Documentation

### 🐳 MCP Dashboard [RELOCATED]
**URL:** `/real-mcp-dashboard`  
**Status:** Moved from standalone to Developer Tools

**Purpose:**
- Test MCP servers
- Execute MCP tools
- View execution history
- Monitor server responses

**Key Features:**
- Tool executor
- Real-time testing
- Execution history
- Server interaction

### 🔌 MCP Test & Integration
**URL:** `/mcp-test`  
**Badge:** NEW (Success)

**Purpose:**
- Integration testing
- MCP protocol testing
- Server validation
- Tool verification

## Page Relationships

```
┌──────────────────────────────────────────────────────────┐
│                  MCP Ecosystem                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Manage MCP Servers                                   │
│     └─ Configure & Onboard                               │
│        ├─ Add servers                                     │
│        ├─ Set up configuration                            │
│        ├─ Manage secrets                                  │
│        └─ Export config files                             │
│                                                           │
│  2. MCP Dashboard                                         │
│     └─ Test & Interact                                    │
│        ├─ Execute tools                                   │
│        ├─ View results                                    │
│        ├─ Monitor servers                                 │
│        └─ Debug issues                                    │
│                                                           │
│  3. MCP Test & Integration                                │
│     └─ Validate & Verify                                  │
│        ├─ Integration tests                               │
│        ├─ Protocol validation                             │
│        ├─ Server health checks                            │
│        └─ Tool verification                               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## User Journey

### Journey 1: New User Onboarding
```
Start
  │
  ├─ Navigate to Developer Tools
  │
  ├─ Click "Manage MCP Servers"
  │
  ├─ Review Overview & Quick Start
  │
  ├─ Browse Server Templates
  │
  ├─ Add Server (Use Template)
  │
  ├─ Configure Agent Settings
  │
  ├─ Add API Keys (Secrets)
  │
  ├─ Export Configuration Files
  │
  ├─ Test in MCP Dashboard
  │
  └─ Deploy Agent
```

### Journey 2: Testing Existing Server
```
Start
  │
  ├─ Navigate to Developer Tools
  │
  ├─ Click "MCP Dashboard"
  │
  ├─ Select Server
  │
  ├─ Choose Tool
  │
  ├─ Enter Arguments
  │
  ├─ Execute Tool
  │
  ├─ View Results
  │
  └─ Debug if Needed
```

### Journey 3: Adding Custom Server
```
Start
  │
  ├─ Navigate to Developer Tools
  │
  ├─ Click "Manage MCP Servers"
  │
  ├─ Click "Add MCP Server"
  │
  ├─ Fill Server Details
  │   ├─ Server ID
  │   ├─ Server Name
  │   ├─ Command
  │   ├─ Arguments
  │   └─ Configuration
  │
  ├─ Add to Configuration
  │
  ├─ Configure Secrets (if needed)
  │
  ├─ Export Configuration
  │
  ├─ Test in MCP Dashboard
  │
  └─ Integrate with Agent
```

## Access Patterns

### Quick Access
```
Main Navigation Bar
  └─ Developer Tools (Dropdown)
      └─ MCP Section (3 items)
          ├─ Manage MCP Servers (Primary action)
          ├─ MCP Dashboard (Testing)
          └─ MCP Test & Integration (Validation)
```

### Direct URLs
- Management: `https://agenthub.com/mcp-management`
- Dashboard: `https://agenthub.com/real-mcp-dashboard`
- Testing: `https://agenthub.com/mcp-test`

## Visual Indicators

### Badges
- **NEW** (Primary Blue) - Recently added features
- **NEW** (Success Green) - Existing features with updates

### Icons
- 🔧 - Configuration/Management
- 🐳 - Docker/Containers
- 🔌 - Integration/Connection
- 📚 - Documentation
- 🔗 - Integration
- 🛠️ - Development Tools
- 🚀 - Extensions

## Before vs After

### Before
```
Developer Tools
├── Documentation
│   ├── API Documentation
│   └── Integration Guide
├── Integration & Testing
│   ├── MCP Test & Integration [NEW]
│   ├── Platform Integration
│   └── Enterprise Integration
├── Development Tools
│   ├── CLI & IDE Integration
│   ├── SDKs & Libraries
│   ├── Webhooks & Events
│   └── API Key Management
└── Extensions
    └── Get VS Code Extension

[MCP Dashboard was standalone, not in menu]
```

### After
```
Developer Tools
├── Documentation
│   ├── API Documentation
│   └── Integration Guide
├── MCP (Model Context Protocol)  ← NEW SECTION
│   ├── Manage MCP Servers [NEW]  ← NEW PAGE
│   ├── MCP Dashboard             ← RELOCATED
│   └── MCP Test & Integration
├── Integration & Testing
│   ├── Platform Integration
│   └── Enterprise Integration
├── Development Tools
│   ├── CLI & IDE Integration
│   ├── SDKs & Libraries
│   ├── Webhooks & Events
│   └── API Key Management
└── Extensions
    └── Get VS Code Extension
```

## Benefits of New Structure

### Organization
✅ All MCP-related tools grouped together  
✅ Clear hierarchy and relationships  
✅ Logical progression (Manage → Test → Integrate)

### Discoverability
✅ Dedicated MCP section  
✅ Clear labels and icons  
✅ NEW badges for attention  
✅ Descriptive menu items

### User Experience
✅ Intuitive navigation flow  
✅ Related tools co-located  
✅ Easy access from main menu  
✅ Consistent with platform structure

## Conclusion

The new navigation structure provides:
- **Better Organization** - MCP tools grouped logically
- **Improved Discoverability** - Clear section and labels
- **Enhanced Workflow** - Natural progression through tasks
- **Professional Appearance** - Consistent with platform design

Users can now easily find and access all MCP-related functionality from a single, well-organized section in the Developer Tools menu.
