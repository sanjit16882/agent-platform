# Agent Hub Platform

A comprehensive AI agent management platform with real-time learning analytics, intelligent routing, and enterprise-grade features.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- AWS credentials (optional, for AWS features)

### Installation & Setup

```bash
# 1. Install backend dependencies
cd agent-hub-backend
npm install

# 2. Install frontend dependencies
cd ../agent-hub-ui
npm install

# 3. Start the platform
# Terminal 1 - Backend
cd agent-hub-backend
node comprehensive-server.js

# Terminal 2 - Frontend
cd agent-hub-ui
npm start
```

### Access Points
- **Frontend UI:** http://localhost:3001
- **Backend API:** http://localhost:3002
- **Learning Dashboard:** http://localhost:3001/learning

---

## 📦 Project Structure

```
agent-hub-platform/
├── agent-hub-backend/          # Backend API server
│   ├── services/               # Core services
│   │   ├── learningAnalyticsService.js  # 🔒 Learning analytics
│   │   ├── dynamicAgentExecutor.js      # Agent execution
│   │   └── ...
│   ├── comprehensive-server.js # Main server (🔒 learning endpoints)
│   ├── seed-learning-data.js   # Sample data generator
│   └── data/                   # Runtime data storage
│
├── agent-hub-ui/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContinuousLearningDashboard.tsx  # 🔒 Analytics UI
│   │   │   ├── AgentCatalog.tsx
│   │   │   └── ...
│   │   ├── services/           # API clients
│   │   └── config/             # Configuration
│   └── public/
│
├── backups/                    # File backups
├── LEARNING_ANALYTICS_GUIDE.md # 📚 Learning system docs
└── README.md                   # This file
```

---

## ✨ Key Features

### 1. Learning Analytics System 🔒
**Status:** LOCKED & PRODUCTION READY

Real-time tracking and analytics for all agent interactions:
- Automatic interaction tracking
- User profile management
- AI-generated insights
- Acceptance rate monitoring
- Learning velocity metrics

**See:** [LEARNING_ANALYTICS_GUIDE.md](LEARNING_ANALYTICS_GUIDE.md) for complete documentation.

### 2. Agent Management
- Create, deploy, and manage AI agents
- Dynamic agent execution
- Version control
- S3 storage integration

### 3. Intelligent Routing
- Semantic query analysis
- Intent detection
- Agent recommendation
- Context-aware routing

### 4. Enterprise Features
- API key management
- Role-based access control
- Security compliance
- Audit logging

### 5. Integration Hub
- GitHub integration
- MCP (Model Context Protocol) support
- Webhook support
- REST API

---

## 🔌 API Endpoints

### Core Endpoints
```
GET  /health                                    # Health check
GET  /api/v1/agents                            # List all agents
POST /api/v1/agents/:agentId/execute           # Execute agent
GET  /api/v1/agents/s3                         # S3 agents
```

### Learning Analytics Endpoints 🔒
```
GET  /api/intelligence/learning-analytics       # Platform metrics
GET  /api/intelligence/learning/profile/:userId # User profile
POST /api/intelligence/learning/optimize        # Optimize profile
GET  /api/intelligence/learning/export          # Export data
```

### Intelligence Endpoints
```
POST /api/intelligence/analyze-query-dynamic    # Query analysis
```

**Full API documentation:** See [LEARNING_ANALYTICS_GUIDE.md](LEARNING_ANALYTICS_GUIDE.md)

---

## 📊 Learning Analytics

The platform includes a comprehensive learning analytics system that automatically tracks:

- **User Interactions:** Every agent execution is logged
- **Acceptance Rates:** Track which suggestions users accept
- **Learning Progress:** Monitor user growth over time
- **AI Insights:** Automatic recommendations based on patterns

### Generate Sample Data
```bash
cd agent-hub-backend
node seed-learning-data.js
```

This creates 150 sample interactions across 5 users for testing.

---

## 🔒 Protected Files

The following files are **LOCKED** and should not be modified without review:

```
✅ agent-hub-backend/services/learningAnalyticsService.js
✅ agent-hub-backend/comprehensive-server.js (learning endpoints)
✅ agent-hub-ui/src/components/ContinuousLearningDashboard.tsx
```

**Before modifying:** Read [LEARNING_ANALYTICS_GUIDE.md](LEARNING_ANALYTICS_GUIDE.md) → Protection Rules

---

## 🧪 Testing

### Test Backend
```bash
curl http://localhost:3002/health
curl http://localhost:3002/api/intelligence/learning-analytics
```

### Test Frontend
1. Open http://localhost:3001
2. Navigate to Analytics → Continuous Learning
3. Should see real-time data

### Execute an Agent
1. Go to Agents page
2. Select any agent
3. Execute with sample inputs
4. Check learning dashboard - metrics should update

---

## 🛠️ Development

### Backend Development
```bash
cd agent-hub-backend
node comprehensive-server.js
```

### Frontend Development
```bash
cd agent-hub-ui
npm start
```

### Environment Variables
Create `.env` files in both directories:

**Backend (.env):**
```
PORT=3002
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=http://localhost:3002
```

---

## 📚 Documentation

- **[LEARNING_ANALYTICS_GUIDE.md](LEARNING_ANALYTICS_GUIDE.md)** - Complete learning analytics documentation
- **agent-hub-backend/LEARNING_ANALYTICS_README.md** - Detailed API reference
- **agent-hub-ui/MCP-UI-INTEGRATION-GUIDE.md** - MCP integration guide

---

## 🔄 Backup & Recovery

### Backups Location
```
backups/learning-analytics-2025-11-08/
```

### Restore from Backup
```bash
cp backups/learning-analytics-2025-11-08/* [destination]
```

### Restore from Git
```bash
git checkout 44860df -- [file-path]
```

---

## 🚀 Deployment

### Git Repository
```
Repository: https://github.com/sanjit16882/agent-platform.git
Branch: main
```

### Recent Commits
```
161a187 - Final deployment confirmation
b4d749e - Deployment summary
44860df - Learning Analytics implementation
```

### Push Changes
```bash
git add .
git commit -m "Your message"
git push origin main
```

---

## 🎯 Current Status

### ✅ Production Ready
- Learning analytics system
- Agent execution
- Real-time tracking
- User profiles
- AI insights

### 🔒 Locked & Protected
- Core learning analytics files
- API endpoints
- Data tracking logic

### 📊 Sample Data Available
- 5 users
- 150 interactions
- 43 feedback entries
- 80% acceptance rate

---

## 🤝 Contributing

1. Read protection guidelines in [LEARNING_ANALYTICS_GUIDE.md](LEARNING_ANALYTICS_GUIDE.md)
2. Create a backup before modifying locked files
3. Test thoroughly
4. Document your changes
5. Commit with clear messages

---

## 📞 Support

### Common Issues

**"Error Loading Learning Data"**
- Check backend is running on port 3002
- Verify data files exist in `agent-hub-backend/data/learning/`
- Run `node seed-learning-data.js` to regenerate

**"Unexpected token '<'" Error**
- Frontend is calling wrong URL
- Check `API_CONFIG.BACKEND_URL` in `agent-hub-ui/src/config/api.ts`
- Should be `http://localhost:3002`

**No Data Showing**
- Generate sample data: `node seed-learning-data.js`
- Execute some agents to create real data
- Refresh the dashboard

---

## 📈 Metrics & Analytics

Current platform metrics (sample data):
```
Total Users:         5
Active Users:        5
Total Interactions:  150
Acceptance Rate:     80%
Feedback Rate:       29%
Learning Velocity:   30 interactions/user/week
```

---

## 🎉 Features Highlights

### Automatic Tracking
Every agent execution is automatically tracked - no additional code needed!

### Real-Time Analytics
Dashboard updates with live data from actual user interactions.

### AI-Powered Insights
System generates recommendations based on usage patterns.

### User Profiles
Individual learning progress tracking with personalized recommendations.

### Data Export
Export all learning data in JSON format for analysis.

---

## 🔐 Security

- User IDs anonymized in exports
- No PII stored in learning data
- Local JSON file storage
- Data retention limits (10K interactions, 5K feedback)
- No external data transmission

---

## 📝 License

[Your License Here]

---

## 🌟 Acknowledgments

Built with:
- React
- Node.js
- Express
- Bootstrap
- AWS SDK

---

**Last Updated:** November 8, 2025  
**Version:** 1.0.0  
**Status:** 🔒 LOCKED ✅ DEPLOYED 🚀 LIVE
