# Port Configuration - AgentCore Version

## Overview

The `local_version_agentcore` uses different ports than `local_version` to allow both versions to run simultaneously without conflicts.

## Port Mapping

| Service | Local Version | AgentCore Version | Purpose |
|---------|--------------|-------------------|---------|
| Frontend UI | 3001 | **4001** | React application |
| Backend API | 3002 | **4002** | Express/Node.js server |
| Testing API | 3003 | **4003** | Testing framework endpoints |

## Access URLs

### AgentCore Version (This Version)
- **Frontend:** http://localhost:4001
- **Backend API:** http://localhost:4002
- **Health Check:** http://localhost:4002/health
- **Testing Dashboard:** http://localhost:4001/agent-testing

### Local Version (Original)
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3002
- **Health Check:** http://localhost:3002/health
- **Testing Dashboard:** http://localhost:3001/agent-testing

## Running Both Versions Simultaneously

You can now run both versions at the same time for:
- **Comparison testing** between local and AgentCore implementations
- **Migration validation** - verify features work in both versions
- **Development** - work on AgentCore features while keeping local version running
- **Demos** - show differences side-by-side

### Start Local Version
```bash
cd local_version
npm run start:backend:local  # Port 3002
npm run start:ui:local       # Port 3001
```

### Start AgentCore Version
```bash
cd local_version_agentcore
npm run start:backend:local  # Port 4002
npm run start:ui:local       # Port 4001
```

## Environment Variables

### AgentCore Version (.env files)

**Backend (.env):**
```env
PORT=4002
NODE_ENV=local
```

**Frontend (.env):**
```env
PORT=4001
REACT_APP_API_URL=http://localhost:4002
```

## Configuration Files Updated

The following files have been updated with new ports:

### Core Configuration
- `package.json` - npm scripts
- `docker-compose.local.yml` - Docker port mappings
- `config/local.json` - API endpoints
- `config/dns-config.js` - DNS configuration

### Backend
- `agent-hub-backend/.env.example`
- `agent-hub-backend/.env.local`
- `agent-hub-backend/package.json`
- All backend service files

### Frontend
- `agent-hub-ui/.env`
- `agent-hub-ui/.env.local`
- `agent-hub-ui/src/config/api.ts`
- All service files (API clients)
- All component files with hardcoded URLs

### Documentation
- All markdown files in `docs/`
- README files
- Integration guides
- Troubleshooting guides

## Verification

### Check Backend is Running
```bash
# AgentCore version
curl http://localhost:4002/health

# Local version
curl http://localhost:3002/health
```

### Check Frontend is Accessible
```bash
# AgentCore version
curl http://localhost:4001

# Local version
curl http://localhost:3001
```

## Troubleshooting

### Port Already in Use

If you get "EADDRINUSE" error:

**For AgentCore version (port 4002):**
```bash
# Windows
netstat -ano | findstr :4002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4002 | xargs kill -9
```

**For Local version (port 3002):**
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

### Wrong Port in Configuration

If you see connection errors, verify:

1. **Backend is running on correct port:**
   ```bash
   # Should show port 4002 for AgentCore
   netstat -ano | findstr :4002
   ```

2. **Frontend is configured correctly:**
   ```bash
   # Check .env file
   cat agent-hub-ui/.env | grep REACT_APP_API_URL
   # Should show: http://localhost:4002
   ```

3. **Browser is accessing correct URL:**
   - AgentCore: http://localhost:4001
   - Local: http://localhost:3001

## Future Port Updates

If you need to change ports again, use the provided script:

```bash
cd local_version_agentcore
.\update-ports.ps1
```

Then manually update the script with new port mappings before running.

## Notes

- **175 files** were updated with new port configurations
- All hardcoded URLs have been replaced
- Both versions maintain their own independent configurations
- No cross-contamination between versions

## Related Documentation

- [README_AGENTCORE.md](./README_AGENTCORE.md) - Main AgentCore documentation
- [docs/quick-start-checklist.md](./docs/quick-start-checklist.md) - Setup guide
- [docs/troubleshooting/](./docs/troubleshooting/) - Troubleshooting guides
