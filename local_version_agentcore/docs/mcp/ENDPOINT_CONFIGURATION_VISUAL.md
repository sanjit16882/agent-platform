# MCP Server Endpoint Configuration - Visual Guide

## Server Endpoint Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server Endpoints                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📁 File System Server                                          │
│     └─ http://localhost:4002/mcp-health/filesystem              │
│        [MOCK ENDPOINT - Demo Only]                              │
│                                                                  │
│  🗄️  Database Server                                            │
│     └─ http://localhost:4002/mcp-health/database                │
│        [MOCK ENDPOINT - Demo Only]                              │
│                                                                  │
│  🌿 Git Server                                                   │
│     └─ http://localhost:4002/mcp-health/git                     │
│        [MOCK ENDPOINT - Demo Only]                              │
│                                                                  │
│  🐙 GitHub Server                                               │
│     └─ https://api.github.com                                   │
│        [✅ REAL ENDPOINT - Production API]                      │
│                                                                  │
│  📧 Office365 Server                                            │
│     └─ http://localhost:4002/mcp-health/office365               │
│        [MOCK ENDPOINT - Placeholder]                            │
│                                                                  │
│  📋 Jira Server                                                  │
│     └─ http://localhost:4002/mcp-health/jira                    │
│        [MOCK ENDPOINT - Placeholder]                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Endpoint Types

### 🟢 Real Endpoint (Production)
```
┌──────────────────────────────────────┐
│  🐙 GitHub Server                   │
├──────────────────────────────────────┤
│  Endpoint: https://api.github.com   │
│  Type: REAL API                      │
│  Status: Production Ready            │
│  Auth: GitHub Token Required         │
│                                      │
│  Capabilities:                       │
│  ✓ Create Issues                     │
│  ✓ Create Pull Requests              │
│  ✓ Manage Repositories               │
│  ✓ Add Comments                      │
│  ✓ Create Labels                     │
└──────────────────────────────────────┘
```

### 🔵 Mock Endpoints (Demonstration)
```
┌──────────────────────────────────────────────────┐
│  📁 File System | 🗄️ Database | 🌿 Git          │
├──────────────────────────────────────────────────┤
│  Endpoint: http://localhost:4002/mcp-health/*   │
│  Type: MOCK/DEMO                                 │
│  Status: For Demonstration                       │
│  Auth: Not Required                              │
│                                                  │
│  Purpose:                                        │
│  • Demonstrate MCP functionality                 │
│  • Safe testing environment                      │
│  • No real data access                           │
└──────────────────────────────────────────────────┘
```

### ⚪ Placeholder Endpoints (Future)
```
┌──────────────────────────────────────────────────┐
│  📧 Office365 | 📋 Jira                          │
├──────────────────────────────────────────────────┤
│  Endpoint: http://localhost:4002/mcp-health/*   │
│  Type: PLACEHOLDER                               │
│  Status: Inactive                                │
│  Auth: Will be required when activated           │
│                                                  │
│  Future:                                         │
│  • Will connect to real APIs                     │
│  • Requires proper authentication                │
│  • Currently inactive                            │
└──────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Agent Builder & Hybrid Builder (Identical Flow)

```
┌─────────────────┐
│  User Interface │
│  (Agent/Hybrid) │
└────────┬────────┘
         │
         │ Uses MCPAgentCreationStep
         ▼
┌─────────────────────────────────┐
│  MCPAgentCreationStep Component │
└────────┬────────────────────────┘
         │
         │ Calls getRealDockerServers()
         ▼
┌─────────────────────────────────┐
│  realMCPService                 │
│  (Single Source of Truth)       │
└────────┬────────────────────────┘
         │
         │ Returns Server List
         ▼
┌─────────────────────────────────────────────────┐
│  Server Configurations                          │
├─────────────────────────────────────────────────┤
│  📁 filesystem → localhost:4002 (mock)          │
│  🗄️  database  → localhost:4002 (mock)          │
│  🌿 git        → localhost:4002 (mock)          │
│  🐙 github     → api.github.com (REAL) ✅       │
│  📧 office365  → localhost:4002 (mock)          │
│  📋 jira       → localhost:4002 (mock)          │
└─────────────────────────────────────────────────┘
```

## Configuration Consistency

### Both Pages Use Same Service

```
Agent Builder Page          Hybrid Builder Page
       │                           │
       │                           │
       └───────────┬───────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  realMCPService     │
         │  (Shared Service)   │
         └─────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Identical Server   │
         │  Configurations     │
         └─────────────────────┘
```

## Health Check Flow

### GitHub Server (Real Endpoint)
```
Agent/Hybrid Builder
       │
       │ Health Check Request
       ▼
┌──────────────────────┐
│  realMCPService      │
└──────────┬───────────┘
           │
           │ GET https://api.github.com
           ▼
┌──────────────────────┐
│  GitHub API          │
│  (Real Server)       │
└──────────┬───────────┘
           │
           │ 200 OK
           ▼
     Status: Active ✅
```

### Mock Servers (Local Endpoints)
```
Agent/Hybrid Builder
       │
       │ Health Check Request
       ▼
┌──────────────────────┐
│  realMCPService      │
└──────────┬───────────┘
           │
           │ GET localhost:4002/mcp-health/*
           ▼
┌──────────────────────┐
│  Backend Mock        │
│  (Local Server)      │
└──────────┬───────────┘
           │
           │ 200 OK (if running)
           ▼
     Status: Active/Inactive
```

## Security Visualization

### GitHub Server (Secure Configuration)
```
┌─────────────────────────────────────────┐
│  GitHub Server Configuration            │
├─────────────────────────────────────────┤
│                                         │
│  🔒 Token (Sensitive)                   │
│     • Marked as sensitive: true         │
│     • Not logged                        │
│     • Encrypted storage recommended     │
│                                         │
│  👤 Owner (Required)                    │
│     • Repository owner/org              │
│     • Public information                │
│                                         │
│  📦 Repo (Required)                     │
│     • Repository name                   │
│     • Public information                │
│                                         │
│  🌐 Base URL (Optional)                 │
│     • Default: api.github.com           │
│     • For GitHub Enterprise             │
│                                         │
└─────────────────────────────────────────┘
```

### Mock Servers (No Authentication)
```
┌─────────────────────────────────────────┐
│  Mock Server Configuration              │
├─────────────────────────────────────────┤
│                                         │
│  🔓 No Authentication Required          │
│     • Demo/testing only                 │
│     • Localhost access only             │
│     • No sensitive data                 │
│                                         │
│  📍 Local Endpoint                      │
│     • localhost:4002                    │
│     • Not exposed externally            │
│                                         │
└─────────────────────────────────────────┘
```

## Usage Example

### Selecting GitHub Server in UI

```
┌────────────────────────────────────────────────────┐
│  MCP Integration Tab                               │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  🐙 GitHub Server                  [✓]       │ │
│  │  ─────────────────────────────────────────── │ │
│  │  Real GitHub API integration                 │ │
│  │                                               │ │
│  │  Status: ✅ Available                        │ │
│  │  Endpoint: https://api.github.com            │ │
│  │                                               │ │
│  │  Tools: create_issue, create_pr, get_issues  │ │
│  │                                               │ │
│  │  [Configure] button available                │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  📁 File System Server             [ ]       │ │
│  │  ─────────────────────────────────────────── │ │
│  │  Mock file operations (demo)                 │ │
│  │                                               │ │
│  │  Status: 🔵 Mock/Demo                        │ │
│  │  Endpoint: localhost:4002                    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Verification Checklist

```
✅ GitHub server added to configuration
✅ GitHub endpoint set to https://api.github.com
✅ All other servers use localhost:4002
✅ Server metadata complete (name, description, tools)
✅ Security fields marked as sensitive
✅ Health check implemented for all servers
✅ Consistent across Agent Builder
✅ Consistent across Hybrid Builder
✅ Documentation complete
✅ No TypeScript errors
```

## Summary

```
╔═══════════════════════════════════════════════════════╗
║           MCP SERVER ENDPOINT VERIFICATION            ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Status: ✅ VERIFIED AND CONSISTENT                  ║
║                                                       ║
║  Real Endpoint:                                       ║
║  • GitHub → https://api.github.com                    ║
║                                                       ║
║  Mock Endpoints:                                      ║
║  • File System, Database, Git → localhost:4002        ║
║  • Office365, Jira → localhost:4002 (inactive)        ║
║                                                       ║
║  Consistency:                                         ║
║  • Agent Builder ✅                                   ║
║  • Hybrid Builder ✅                                  ║
║  • Same service, same config                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```
