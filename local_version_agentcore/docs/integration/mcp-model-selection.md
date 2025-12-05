# MCP Model Selection - Visual Guide 🎨

## Overview
This guide shows the updated UI for MCP server configuration with AWS Bedrock model selection.

---

## 1. MCP Management Page - Add Server Modal

### Before (Old)
```
┌─────────────────────────────────────────┐
│ ➕ Add MCP Server                       │
├─────────────────────────────────────────┤
│                                         │
│ Server ID: [fetch____________]          │
│ Server Name: [Fetch Server___]          │
│                                         │
│ Command: [uvx ▼]                        │
│ Arguments: [mcp-server-fetch]           │
│                                         │
│ Timeout: [30000]  Retry: [3]            │
│                                         │
│ [ ] Disabled                            │
│                                         │
│         [Cancel]  [Add Server]          │
└─────────────────────────────────────────┘
```

### After (New) ⭐
```
┌─────────────────────────────────────────┐
│ ➕ Add MCP Server                       │
├─────────────────────────────────────────┤
│                                         │
│ Server ID: [fetch____________]          │
│ Server Name: [Fetch Server___]          │
│                                         │
│ Command: [uvx ▼]                        │
│ Arguments: [mcp-server-fetch]           │
│                                         │
│ ⭐ AWS Bedrock Model *                  │
│ [Claude 3 Haiku - Anthropic (Cost-e▼]  │
│ This model will be used when agents     │
│ select this MCP server                  │
│                                         │
│ Timeout: [30000]  Retry: [3]            │
│                                         │
│ [ ] Disabled                            │
│                                         │
│         [Cancel]  [Add Server]          │
└─────────────────────────────────────────┘
```

**Key Changes:**
- ✅ New "AWS Bedrock Model" dropdown
- ✅ Shows model name, provider, and description
- ✅ Required field (marked with *)
- ✅ Help text explaining usage

---

## 2. MCP Management Page - Configured Servers List

### Before (Old)
```
┌─────────────────────────────────────────┐
│ 📋 Configured Servers                   │
├─────────────────────────────────────────┤
│                                         │
│ • Fetch Server                 [Active] │
│   uvx mcp-server-fetch                  │
│                                         │
│ • GitHub Server                [Active] │
│   npx -y @modelcontextprotocol/...     │
│                                         │
└─────────────────────────────────────────┘
```

### After (New) ⭐
```
┌─────────────────────────────────────────┐
│ 📋 Configured Servers                   │
├─────────────────────────────────────────┤
│                                         │
│ • Fetch Server                 [Active] │
│   uvx mcp-server-fetch                  │
│   Model: Claude 3 Haiku ⭐              │
│                                         │
│ • GitHub Server                [Active] │
│   npx -y @modelcontextprotocol/...     │
│   Model: Claude 3.5 Sonnet ⭐           │
│                                         │
└─────────────────────────────────────────┘
```

**Key Changes:**
- ✅ Model name displayed for each server
- ✅ Blue text to highlight model info
- ✅ Clear association between server and model

---

## 3. Hybrid Agent Builder - Model Selection

### Scenario A: No MCP Server Selected
```
┌─────────────────────────────────────────┐
│ Agent Configuration                     │
├─────────────────────────────────────────┤
│                                         │
│ Default AI Model                        │
│ [Claude 3 Haiku - 200,000 tokens ▼]    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Claude 3 Haiku          [Available] │ │
│ │ Cost-effective for most tasks       │ │
│ │ Max Tokens: 200,000 | Temp: 0.1     │ │
│ │ Best for: Quick tasks, Cost opt...  │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Scenario B: MCP Server Selected ⭐
```
┌─────────────────────────────────────────┐
│ Agent Configuration                     │
├─────────────────────────────────────────┤
│                                         │
│ Default AI Model                        │
│ [Claude 3 Haiku - 200,000 tokens ▼] 🔒 │
│ (Dropdown is disabled/grayed out)      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ℹ️ Model Selection Disabled         │ │
│ │                                     │ │
│ │ Model is configured through the     │ │
│ │ selected MCP server. Go to the MCP  │ │
│ │ Integration tab to change servers.  │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Key Changes:**
- ✅ Model dropdown disabled when MCP selected
- ✅ Info alert explaining why disabled
- ✅ Link to MCP Integration tab

---

## 4. Edit Agent Modal - MCP Configuration

### Full Modal View ⭐
```
┌─────────────────────────────────────────────────────┐
│ Edit Agent                                      [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Agent Name *                                        │
│ [Web Scraper Agent_________________________]        │
│                                                     │
│ Description                                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Scrapes websites and extracts data              │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ⭐ MCP Server (Optional)                            │
│ [Fetch Server (Claude 3 Haiku) ▼]                  │
│ Select an MCP server to use its configured model,  │
│ or leave empty to select a model manually.         │
│                                                     │
│ AI Model                                            │
│ [Claude 3 Haiku - 200,000 tokens ▼] 🔒             │
│ (Disabled because MCP server selected)             │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ℹ️ Model Selection Disabled                     │ │
│ │                                                 │ │
│ │ Model is configured through the selected MCP    │ │
│ │ server. Change the MCP server selection above   │ │
│ │ to use a different model.                       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│                              [Cancel]  [Save]       │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ MCP Server dropdown at top
- ✅ Shows server name and model in dropdown
- ✅ Model dropdown below (disabled if MCP selected)
- ✅ Clear info alert explaining behavior
- ✅ Link to MCP Management if no servers configured

---

## 5. MCP Integration Tab - Agent Builder

### Tab View
```
┌─────────────────────────────────────────────────────┐
│ [Design] [Components] [Test & Validate] [MCP] [FAQ]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔌 MCP Integration (Optional)    [Enabled ✓]   │ │
│ ├─────────────────────────────────────────────────┤ │
│ │                                                 │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ ℹ️ Auto-detected MCP needs!                 │ │ │
│ │ │                                             │ │ │
│ │ │ Based on your agent description, we         │ │ │
│ │ │ recommend these MCP servers:                │ │ │
│ │ │                                             │ │ │
│ │ │ [Fetch Server] [GitHub Server]              │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │                                                 │ │
│ │ Select which MCP servers your agent should      │ │
│ │ have access to. These provide external tools    │ │
│ │ and data sources.                               │ │
│ │                                                 │ │
│ │ ┌──────────────────┐  ┌──────────────────┐     │ │
│ │ │ 🗂️ Fetch Server  │  │ 🌿 GitHub Server │     │ │
│ │ │                  │  │                  │     │ │
│ │ │ [Selected ✓] ☑️  │  │ [Available]   ☐  │     │ │
│ │ │                  │  │                  │     │ │
│ │ │ HTTP fetch and   │  │ GitHub API       │     │ │
│ │ │ web scraping     │  │ integration      │     │ │
│ │ │                  │  │                  │     │ │
│ │ │ Tools: fetch,    │  │ Tools: create,   │     │ │
│ │ │ scrape, +2 more  │  │ search, +5 more  │     │ │
│ │ │                  │  │                  │     │ │
│ │ │ Model: Claude 3  │  │ Model: Claude    │     │ │
│ │ │ Haiku ⭐         │  │ 3.5 Sonnet ⭐    │     │ │
│ │ └──────────────────┘  └──────────────────┘     │ │
│ │                                                 │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ ✅ MCP Integration Configured!              │ │ │
│ │ │                                             │ │ │
│ │ │ Your agent will have access to 1 MCP        │ │ │
│ │ │ server with the following capabilities:     │ │ │
│ │ │                                             │ │ │
│ │ │ [🗂️ Fetch Server]                           │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │                                                 │ │
│ │ [🔧 Test MCP Servers]      [🔄 Refresh Status] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Enable/disable toggle
- ✅ Auto-detection of recommended servers
- ✅ Server cards with model information
- ✅ Visual selection state
- ✅ Success confirmation
- ✅ Quick links to test and refresh

---

## 6. Model Dropdown States

### State 1: Enabled (No MCP)
```
┌─────────────────────────────────────────┐
│ AI Model                                │
│ ┌─────────────────────────────────────┐ │
│ │ Claude 3 Haiku - 200,000 tokens  ▼ │ │ ← Clickable
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Claude 3 Haiku          [Available] │ │
│ │ Cost-effective for most tasks       │ │
│ │ Max Tokens: 200,000 | Temp: 0.1     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### State 2: Disabled (MCP Selected) ⭐
```
┌─────────────────────────────────────────┐
│ AI Model                                │
│ ┌─────────────────────────────────────┐ │
│ │ Claude 3 Haiku - 200,000 tokens  ▼ │ │ ← Grayed out
│ └─────────────────────────────────────┘ │
│ (Cursor: not-allowed)                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ℹ️ Model Selection Disabled         │ │
│ │                                     │ │
│ │ Model is configured through the     │ │
│ │ selected MCP server.                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 7. Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER STARTS HERE                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Configure MCP Server                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Navigate to /mcp-management                             │ │
│ │ Click "Add MCP Server"                                  │ │
│ │ Fill in: ID, Name, Command, Args                        │ │
│ │ ⭐ SELECT AWS BEDROCK MODEL ⭐                           │ │
│ │ Click "Add Server"                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Create Agent with MCP                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Navigate to Hybrid Agent Builder                        │ │
│ │ Configure agent basics                                  │ │
│ │ Add components                                          │ │
│ │ Go to "MCP Integration" tab                             │ │
│ │ Enable MCP and select server                            │ │
│ │ ⭐ MODEL DROPDOWN AUTOMATICALLY DISABLED ⭐              │ │
│ │ Save agent                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Edit Agent (Optional)                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Open agent from catalog                                 │ │
│ │ Click "Edit"                                            │ │
│ │ See MCP Server dropdown                                 │ │
│ │ Change/remove MCP server                                │ │
│ │ ⭐ MODEL UPDATES AUTOMATICALLY ⭐                        │ │
│ │ Save changes                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENT READY TO USE                       │
│              with MCP Server and Model configured           │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Color Coding & Visual Indicators

### Status Badges
```
[Active]    - Green background, white text
[Disabled]  - Gray background, white text
[Selected]  - Green background, white text
[Available] - Blue background, white text
[Offline]   - Red background, white text
```

### Icons
```
🔌 - MCP Integration
🗂️ - File System Server
🌿 - Git/GitHub Server
🗄️ - Database Server
📧 - Communication Server
⭐ - Model Information (NEW)
ℹ️ - Information Alert
✅ - Success/Confirmation
🔒 - Disabled/Locked
```

### Alert Types
```
┌─────────────────────────────────────┐
│ ℹ️ Info Alert (Blue)                │
│ Used for: Model disabled explanation│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✅ Success Alert (Green)            │
│ Used for: MCP configured success    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚠️ Warning Alert (Yellow)           │
│ Used for: Server offline warning    │
└─────────────────────────────────────┘
```

---

## 9. Responsive Design

### Desktop View (> 992px)
- 2-column layout for server cards
- Full-width modals
- Side-by-side form fields

### Tablet View (768px - 992px)
- 2-column layout for server cards
- Slightly narrower modals
- Stacked form fields

### Mobile View (< 768px)
- Single column for server cards
- Full-screen modals
- Stacked form fields
- Larger touch targets

---

## 10. Accessibility Features

### Keyboard Navigation
- ✅ Tab through all form fields
- ✅ Enter to submit forms
- ✅ Escape to close modals
- ✅ Arrow keys in dropdowns

### Screen Reader Support
- ✅ Proper ARIA labels
- ✅ Form field descriptions
- ✅ Alert announcements
- ✅ Disabled state announcements

### Visual Indicators
- ✅ Focus outlines
- ✅ Disabled state styling
- ✅ Error state highlighting
- ✅ Success confirmations

---

## Summary

The updated UI provides:
1. ✅ Clear model selection during MCP server setup
2. ✅ Visual indication of model associations
3. ✅ Automatic model assignment when MCP selected
4. ✅ Disabled state with helpful explanations
5. ✅ Consistent experience across all pages
6. ✅ Intuitive user flows
7. ✅ Accessible and responsive design

**The interface is now production-ready!** 🚀
