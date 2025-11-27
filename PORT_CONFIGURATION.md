# Port Configuration Reference

## ⚠️ IMPORTANT: Correct Ports

### Frontend (React UI):
```
Port: 3001
URL: http://localhost:3001
```

### Backend (Node.js API):
```
Port: 3002
URL: http://localhost:3002
```

---

## Common URLs

### Frontend Pages:
- Dashboard: `http://localhost:3001/`
- Agent Catalog: `http://localhost:3001/agents`
- Agent Testing: `http://localhost:3001/agent-testing`
- Test Workflow: `http://localhost:3001/agent-testing/workflow`
- Analytics: `http://localhost:3001/agent-testing/analytics`
- Version Comparison: `http://localhost:3001/agent-testing/comparison`

### Backend API Endpoints:
- Health Check: `http://localhost:3002/health`
- Agents API: `http://localhost:3002/api/v1/agents`
- Testing API: `http://localhost:3002/api/testing`
- Test Runs: `http://localhost:3002/api/testing/runs`

---

## ❌ WRONG Ports (Do Not Use):

- ❌ `http://localhost:3000` - NOT USED
- ❌ Frontend on 3000 - INCORRECT
- ❌ Backend on 3001 - INCORRECT

## ✅ CORRECT Ports:

- ✅ `http://localhost:3001` - Frontend
- ✅ `http://localhost:3002` - Backend

---

## Quick Reference Card

```
┌─────────────────────────────────────┐
│  Frontend: 3001                     │
│  Backend:  3002                     │
│                                     │
│  ❌ NOT 3000                        │
└─────────────────────────────────────┘
```

---

## Environment Variables

### Frontend (.env):
```
REACT_APP_API_URL=http://localhost:3002
PORT=3001
```

### Backend (.env):
```
PORT=3002
```

---

## Starting Servers

### Frontend:
```bash
cd local_version/agent-hub-ui
npm start
# Starts on port 3001
```

### Backend:
```bash
cd local_version/agent-hub-backend
npm start
# Starts on port 3002
```

---

## Verification

### Check Frontend is Running:
```bash
curl http://localhost:3001
# Should return HTML
```

### Check Backend is Running:
```bash
curl http://localhost:3002/health
# Should return JSON: {"status": "ok"}
```

---

## Remember:
- 🎨 **Frontend = 3001**
- 🔧 **Backend = 3002**
- ❌ **NOT 3000**
