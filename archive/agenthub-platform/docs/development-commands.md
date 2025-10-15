# 🛠️ AgentHub Development Commands

## 🏠 **Local Development (Primary)**

### **Start Local Development Server:**
```bash
cd agent-hub-ui
npm start
```
- **URL**: http://localhost:3000
- **Features**: Hot reload, debugging, mock data
- **Cost**: $0 (completely free)
- **Use for**: All development work

### **Local Development Features:**
- ✅ All 38 agents work with mock data
- ✅ Upload interface (simulated)
- ✅ Real-time UI updates
- ✅ No AWS API calls (no costs)
- ✅ Fast iteration and testing

---

## 🌐 **Production Deployment (Demo Only)**

### **Deploy to AWS Production:**
```bash
# Make script executable (first time only)
chmod +x deploy-production.sh

# Deploy to AWS
./deploy-production.sh
```

### **Production Features:**
- ✅ Professional URL for demos
- ✅ Real AWS backend integration
- ✅ Impressive for investors/clients
- ✅ Global CDN performance
- ✅ SSL certificate (optional)

---

## 🔄 **Workflow Recommendations**

### **Daily Development:**
```bash
# Start local development
cd agent-hub-ui
npm start

# Make changes, test locally
# Commit to Git when ready
```

### **Before Important Demo:**
```bash
# Deploy latest version to production
./deploy-production.sh

# Test production URL
# Use production URL in demo
```

### **After Demo:**
```bash
# Continue development locally
cd agent-hub-ui
npm start

# No need to keep production running
# AWS costs are minimal anyway (~$0.79/month)
```

---

## 💰 **Cost Optimization Strategy**

### **Development Costs:**
- **Local**: $0/month (completely free)
- **Production**: ~$0.79/month (mostly DynamoDB)

### **Ultra-Low Cost Option:**
If you want to minimize production costs even further:

```bash
# Delete DynamoDB tables when not demoing (saves $0.75/month)
aws dynamodb delete-table --table-name AgentRegistry
aws dynamodb delete-table --table-name ExecutionHistory  
aws dynamodb delete-table --table-name UserProfiles

# Recreate before demos (takes 2 minutes)
cd agent-hub-cdk
cdk deploy
```

### **Recommended Approach:**
- Keep production running (~$0.79/month)
- Always ready for spontaneous demos
- Professional impression for unexpected opportunities

---

## 🎯 **Environment Switching**

### **Local Development Mode:**
- Uses `.env.local` settings
- Mock API responses
- No AWS costs
- Fast development cycle

### **Production Demo Mode:**
- Uses `.env.production` settings  
- Real AWS API integration
- Professional URL
- Impressive for demos

---

## 🚀 **Quick Commands Summary**

```bash
# Local development (daily use)
npm start                    # Start local dev server

# Production deployment (demo prep)
./deploy-production.sh       # Deploy to AWS

# Check production status
aws s3 ls                    # List S3 buckets
aws dynamodb list-tables     # Check DynamoDB tables

# Local development with hot reload
npm start                    # Back to local development
```

---

## 📱 **Demo Preparation Checklist**

### **Before Important Demo:**
- [ ] Test all features locally
- [ ] Run `./deploy-production.sh`
- [ ] Test production URL
- [ ] Bookmark production URL
- [ ] Prepare demo script

### **During Demo:**
- [ ] Use production URL (impressive AWS infrastructure)
- [ ] Show real agent execution
- [ ] Demonstrate upload interface
- [ ] Highlight enterprise features

### **After Demo:**
- [ ] Continue development locally
- [ ] Production stays live for follow-up questions
- [ ] Minimal ongoing costs (~$0.79/month)

---

## 🎉 **Best of Both Worlds**

This setup gives you:
- **Fast local development** (free, instant feedback)
- **Professional production demos** (impressive, reliable)
- **Minimal costs** (~$0.79/month for production)
- **Maximum flexibility** (develop locally, demo globally)

Perfect for your use case! 🚀