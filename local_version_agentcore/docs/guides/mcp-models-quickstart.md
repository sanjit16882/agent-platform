# Quick Start: MCP with AWS Bedrock Models

## 🚀 Get Started in 3 Steps

### Step 1: Configure MCP Server (2 minutes)
1. Go to http://localhost:3000/mcp-management
2. Click **"Add MCP Server"**
3. Fill in:
   - Server ID: `fetch`
   - Server Name: `Fetch Server`
   - Command: `uvx`
   - Arguments: `mcp-server-fetch`
   - **AWS Bedrock Model:** Select `Claude 3 Haiku`
4. Click **"Add Server"**

✅ Done! Your MCP server is configured with a model.

---

### Step 2: Create Agent with MCP (3 minutes)
1. Go to http://localhost:3000/hybrid-agent-builder
2. Enter agent name: `My First MCP Agent`
3. Add some components (click templates)
4. Go to **"MCP Integration"** tab
5. Toggle **"Enabled"**
6. Select **"Fetch Server"**
7. Notice: Model dropdown is now disabled ✅
8. Click **"Save Agent"**

✅ Done! Your agent uses the MCP server's model.

---

### Step 3: Edit Agent (Optional, 1 minute)
1. Go to agent catalog
2. Click **"Edit"** on your agent
3. See **"MCP Server"** dropdown
4. Change server or select "None"
5. Click **"Save"**

✅ Done! You can change MCP configuration anytime.

---

## 📋 Available AWS Bedrock Models

| Model | Provider | Best For | Cost |
|-------|----------|----------|------|
| Claude 3 Haiku | Anthropic | Quick tasks, cost optimization | $0.25/1M |
| Claude 3.5 Sonnet | Anthropic | Complex reasoning, high quality | $3.00/1M |
| Claude 3 Opus | Anthropic | Most capable, research | $15.00/1M |
| Titan Text Express | Amazon | Budget-friendly, simple tasks | $0.80/1M |
| Titan Text Lite | Amazon | Ultra low cost, high volume | $0.30/1M |
| Claude 3 Sonnet | Anthropic | Balanced, general purpose | $3.00/1M |

---

## 🎯 Key Concepts

### What is MCP?
Model Context Protocol - A way to give agents access to external tools (files, databases, APIs, etc.)

### Why Configure Models with MCP Servers?
- **Consistency:** All agents using a server use the same model
- **Simplicity:** Configure once, use everywhere
- **Control:** Change model in one place, affects all agents

### When is Model Dropdown Disabled?
When you select an MCP server, the model is automatically set from that server's configuration.

---

## 💡 Pro Tips

### Tip 1: Start with Claude 3 Haiku
It's cost-effective and works great for most tasks.

### Tip 2: Use Different Servers for Different Models
```
Fetch Server → Claude 3 Haiku (fast, cheap)
GitHub Server → Claude 3.5 Sonnet (complex reasoning)
Database Server → Titan Text Express (budget-friendly)
```

### Tip 3: Test Before Production
Use the "Test MCP Servers" button to verify everything works.

### Tip 4: Monitor Costs
Check model costs in the dropdown - they vary significantly!

---

## 🔧 Troubleshooting

### Problem: Models not loading
**Solution:** Check backend is running on localhost:4002

### Problem: Can't select model
**Solution:** Make sure you're in the "Add MCP Server" modal

### Problem: Model dropdown won't disable
**Solution:** Ensure MCP server is selected in MCP Integration tab

### Problem: Server not showing model
**Solution:** Refresh the page or re-add the server

---

## 📞 Need Help?

1. Check the full documentation: `MCP_INTEGRATION_IMPLEMENTATION_COMPLETE.md`
2. See visual guide: `MCP_MODEL_SELECTION_VISUAL_GUIDE.md`
3. Review implementation: `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist

Before you start:
- [ ] Backend running on localhost:4002
- [ ] Frontend running on localhost:3000
- [ ] Browser open to http://localhost:3000

After Step 1:
- [ ] MCP server appears in "Configured Servers" list
- [ ] Model name is visible under server

After Step 2:
- [ ] Agent created successfully
- [ ] Model dropdown was disabled
- [ ] Info alert explained why

After Step 3:
- [ ] Can edit agent
- [ ] Can change MCP server
- [ ] Changes save correctly

---

## 🎉 You're Ready!

You now know how to:
- ✅ Configure MCP servers with AWS Bedrock models
- ✅ Create agents that use MCP servers
- ✅ Edit agent MCP configurations
- ✅ Understand when model selection is disabled

**Happy building!** 🚀

---

**Quick Start Version:** 1.0  
**Last Updated:** November 8, 2025  
**Estimated Time:** 6 minutes total
