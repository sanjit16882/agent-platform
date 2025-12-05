# How to Access MCP Test Page - Quick Guide

## 🎯 **MCP Test Page is Now Available!**

I've added the MCP test page to your UI. Here's how to access it:

### **Method 1: Navigation Menu (Recommended)**
1. **Start your UI**: `npm start` (if not already running)
2. **Navigate to your app**: http://localhost:4001 (your configured UI port)
3. **Click "Developer Tools"** in the top navigation menu
4. **Select "🖥️ MCP Test & Integration"** from the dropdown
5. **You'll be taken to**: http://localhost:4001/mcp-test

### **Method 2: Dashboard Button**
1. **Go to your main Dashboard**: http://localhost:4001
2. **Scroll down to "MCP Server Testing" section**
3. **Click the green "🖥️ MCP Test & Integration" button**
4. **You'll be taken to the MCP test page**

### **Method 3: Direct URL**
- **Navigate directly to**: http://localhost:4001/mcp-test

## 🧪 **What You Can Test on the MCP Page**

### **Tab 1: MCP Overview**
- View MCP system status
- Learn about MCP capabilities
- See benefits of database, file, and git access

### **Tab 2: API Tests**
- Test MCP system status endpoint
- Test MCP servers list endpoint
- Test available servers endpoint
- See real API responses

### **Tab 3: Server Management**
- Add new MCP servers
- Configure existing servers
- Test server connections
- Manage server settings

### **Tab 4: Create Agent with MCP**
- **Complete agent creation workflow with MCP**
- **Step-by-step MCP configuration**
- **Test agent creation with MCP enabled**

## 🚀 **Quick Test Workflow**

### **1. Check MCP Status**
```
http://localhost:4001 → Dashboard → MCP Server Testing → "🖥️ MCP Test & Integration"
OR
http://localhost:4001 → Developer Tools → "🖥️ MCP Test & Integration"
```

### **2. Test API Endpoints**
```
MCP Test Page → "API Tests" tab → "Run MCP API Tests"
```

### **3. Create MCP-Enabled Agent**
```
MCP Test Page → "Create Agent with MCP" tab → Follow the workflow
```

### **4. Verify Agent Creation**
```
Check that agent was created with MCP configuration:
- Agent should have mcpConfig in S3
- Can execute with MCP enhancement
- Falls back to standard execution if needed
```

## 📋 **Expected Results**

### **MCP Status Should Show:**
```
✅ MCP System: Enabled
✅ Servers: 0/1 connected (database server available)
✅ Fallback: Available (zero risk)
```

### **API Tests Should Show:**
```
✅ MCP System Status - Status: 200
✅ MCP Servers List - Found 1 MCP servers  
✅ Available MCP Servers - Found 0 available servers
```

### **Agent Creation Should:**
```
✅ Allow enabling MCP enhancement
✅ Show available MCP servers
✅ Save agent with MCP configuration
✅ Provide configuration summary
```

## 🔧 **Troubleshooting**

### **If MCP Test Page Doesn't Load:**
1. Check that backend server is running on port 4002
2. Verify no TypeScript compilation errors in UI
3. Check browser console for JavaScript errors
4. Ensure all MCP components are properly imported

### **If API Tests Fail:**
1. Verify backend server is running: http://localhost:4002/health
2. Check API key is working: `sk-agenthub-system-internal-frontend-key`
3. Test MCP endpoints directly with curl
4. Check server logs for MCP initialization errors

### **If Agent Creation Fails:**
1. Check that S3 storage is working
2. Verify MCP configuration is valid
3. Check agent creation API endpoint
4. Review browser network tab for API errors

## 🎉 **You're Ready to Test!**

The MCP test page is now fully integrated into your UI and accessible through multiple methods. You can:

1. **Test MCP system status and APIs**
2. **Create agents with MCP configuration**
3. **Manage MCP servers**
4. **See real-time MCP functionality**

Start with the **Dashboard → MCP Server Testing → "🖥️ MCP Test & Integration"** button for the easiest access!