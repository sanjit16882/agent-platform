# Bedrock Agents as Micro-Frontend Integration Strategy

## 🎯 Goal
Create a separate Bedrock Agents app that:
- Runs independently (separate codebase, separate port)
- Appears as a tab within Agent Hub UI
- Shares only UI integration (iframe/module federation)
- Reuses Agent Hub's testing framework and analytics

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Hub (Main App)                         │
│                    Port: 3000 (UI) / 3002 (API)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Navigation Tabs:                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐ ┌──────────┐    │
│  │ Home │ │Agents│ │Tests │ │ 🆕 Bedrock   │ │Analytics │    │
│  └──────┘ └──────┘ └──────┘ │   Agents     │ └──────────┘    │
│                              └──────────────┘                   │
│                                     │                           │
│                                     ▼                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  <iframe> or Module Federation                          │  │
│  │  Loads: http://localhost:3004                           │  │
│  │                                                          │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │   Bedrock Agents App (Embedded)                   │ │  │
│  │  │   - Quick Builder                                 │ │  │
│  │  │   - Core Builder                                  │ │  │
│  │  │   - Knowledge Bases                               │ │  │
│  │  │   - Action Groups                                 │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Shared Services (API Calls):                                  │
│  • Testing Framework → Agent Hub API (Port 3002)               │
│  • Analytics → Agent Hub API (Port 3002)                       │
│  • Cost Management → Agent Hub API (Port 3002)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Bedrock Agents App (Separate)                      │
│              Port: 3004 (UI) / 3005 (API)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Own Services:                                                  │
│  • Bedrock Agent Management                                     │
│  • Knowledge Base Management                                    │
│  • Action Group Management                                      │
│  • AWS SDK Integration                                          │
│                                                                 │
│  Calls Agent Hub for:                                           │
│  • Testing (POST to localhost:3002/api/testing/run)            │
│  • Analytics (GET from localhost:3002/api/analytics)           │
│  • Cost Tracking (POST to localhost:3002/api/costs)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
D:/Agent Factory/
│
├── local_version/                    # EXISTING - No changes
│   ├── agent-hub-ui/                 # Port 3000
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   ├── AgentCatalog.tsx
│   │   │   │   ├── TestingDashboard.tsx
│   │   │   │   └── BedrockAgentsTab.tsx  # 🆕 NEW - Integration point
│   │   │   └── App.tsx                    # 🆕 MODIFY - Add new route
│   │   └── package.json
│   │
│   └── agent-hub-backend/            # Port 3002
│       ├── src/
│       │   ├── routes/
│       │   │   ├── testing.js        # Existing - Reuse
│       │   │   ├── analytics.js      # Existing - Reuse
│       │   │   └── costs.js          # Existing - Reuse
│       │   └── reliable-server.ts
│       └── package.json
│
└── bedrock-agents-app/               # 🆕 NEW - Separate app
    │
    ├── bedrock-ui/                   # Port 3004
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── QuickBuilder/
    │   │   │   │   ├── QuickBuilderWizard.tsx
    │   │   │   │   └── QuickBuilderForm.tsx
    │   │   │   ├── CoreBuilder/
    │   │   │   │   ├── CoreBuilderWizard.tsx
    │   │   │   │   ├── KnowledgeBaseConfig.tsx
    │   │   │   │   └── ActionGroupConfig.tsx
    │   │   │   └── shared/
    │   │   │       ├── BedrockAgentCard.tsx
    │   │   │       └── BedrockAgentList.tsx
    │   │   ├── pages/
    │   │   │   ├── BedrockDashboard.tsx
    │   │   │   ├── QuickBuilderPage.tsx
    │   │   │   ├── CoreBuilderPage.tsx
    │   │   │   └── KnowledgeBasePage.tsx
    │   │   ├── services/
    │   │   │   ├── bedrockAgentService.ts
    │   │   │   ├── knowledgeBaseService.ts
    │   │   │   └── agentHubIntegration.ts  # Calls Agent Hub APIs
    │   │   ├── App.tsx
    │   │   └── index.tsx
    │   ├── package.json
    │   └── .env
    │
    └── bedrock-backend/              # Port 3005
        ├── src/
        │   ├── routes/
        │   │   ├── bedrockAgents.ts
        │   │   ├── knowledgeBases.ts
        │   │   └── actionGroups.ts
        │   ├── services/
        │   │   ├── bedrockAgentService.ts
        │   │   ├── knowledgeBaseService.ts
        │   │   └── agentHubClient.ts      # HTTP client for Agent Hub
        │   └── server.ts
        ├── package.json
        └── .env
```

---

## 🔌 Integration Methods (Choose One)

### Option 1: iframe Integration (Simplest) ⭐ RECOMMENDED

**Pros**: 
- Complete isolation
- No build complexity
- Easy to deploy separately
- No version conflicts

**Cons**: 
- Slight performance overhead
- Need postMessage for communication

**Implementation**:

```typescript
// Agent Hub: src/pages/BedrockAgentsTab.tsx
import React, { useEffect, useRef } from 'react';

export const BedrockAgentsTab: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for messages from Bedrock app
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:3004') return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'TEST_AGENT':
          // Trigger test in Agent Hub
          runAgentTest(data.agentId);
          break;
        case 'VIEW_ANALYTICS':
          // Navigate to analytics
          window.location.href = `/analytics?agentId=${data.agentId}`;
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
      <iframe
        ref={iframeRef}
        src="http://localhost:3004"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Bedrock Agents"
      />
    </div>
  );
};
```

```typescript
// Agent Hub: src/App.tsx - Add route
import { BedrockAgentsTab } from './pages/BedrockAgentsTab';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AgentCatalog />} />
        <Route path="/testing" element={<TestingDashboard />} />
        <Route path="/bedrock-agents" element={<BedrockAgentsTab />} /> {/* 🆕 NEW */}
        <Route path="/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </Router>
  );
}
```

```typescript
// Bedrock App: src/services/agentHubIntegration.ts
export class AgentHubIntegration {
  private agentHubBaseUrl = 'http://localhost:3002';

  // Call Agent Hub's testing API
  async testBedrockAgent(agentId: string, testIds: string[]) {
    const response = await fetch(`${this.agentHubBaseUrl}/api/testing/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        agentType: 'bedrock',  // New type
        testIds,
      }),
    });
    return response.json();
  }

  // Send message to parent (Agent Hub)
  notifyParent(type: string, data: any) {
    if (window.parent !== window) {
      window.parent.postMessage({ type, data }, 'http://localhost:3000');
    }
  }

  // Trigger test from Bedrock app
  async triggerTest(agentId: string) {
    this.notifyParent('TEST_AGENT', { agentId });
  }

  // View analytics in Agent Hub
  viewAnalytics(agentId: string) {
    this.notifyParent('VIEW_ANALYTICS', { agentId });
  }
}
```

### Option 2: Module Federation (Advanced)

**Pros**: 
- Better performance
- Shared dependencies
- Seamless integration

**Cons**: 
- Complex webpack config
- Tighter coupling
- Version management needed

**Skip for now - Use iframe first!**

---

## 🔗 Shared Services Integration

### 1. Testing Framework Integration

```typescript
// Bedrock Backend: src/services/agentHubClient.ts
import axios from 'axios';

export class AgentHubClient {
  private baseUrl = 'http://localhost:3002';

  // Run tests using Agent Hub's testing framework
  async runTests(agentId: string, agentType: 'bedrock', testIds: string[]) {
    const response = await axios.post(`${this.baseUrl}/api/testing/run`, {
      agentId,
      agentType,
      testIds,
      // Bedrock-specific execution
      executionConfig: {
        provider: 'bedrock',
        agentAliasId: 'PROD',
      },
    });
    return response.data;
  }

  // Get test results
  async getTestResults(runId: string) {
    const response = await axios.get(`${this.baseUrl}/api/testing/runs/${runId}`);
    return response.data;
  }

  // Get available tests for agent type
  async getAvailableTests(category: string) {
    const response = await axios.get(
      `${this.baseUrl}/api/v1/test-metadata/agent-types/${category}`
    );
    return response.data;
  }
}
```

### 2. Analytics Integration

```typescript
// Bedrock Backend: src/services/agentHubClient.ts (continued)
export class AgentHubClient {
  // Track Bedrock agent execution
  async trackExecution(data: {
    agentId: string;
    agentType: 'bedrock';
    duration: number;
    cost: number;
    status: string;
    modelId: string;
  }) {
    await axios.post(`${this.baseUrl}/api/analytics/track`, data);
  }

  // Get analytics for Bedrock agent
  async getAgentAnalytics(agentId: string) {
    const response = await axios.get(
      `${this.baseUrl}/api/analytics/agent/${agentId}`
    );
    return response.data;
  }
}
```

### 3. Cost Management Integration

```typescript
// Bedrock Backend: src/services/agentHubClient.ts (continued)
export class AgentHubClient {
  // Track Bedrock costs
  async trackCost(data: {
    agentId: string;
    service: 'bedrock-agent' | 'bedrock-kb' | 'bedrock-model';
    cost: number;
    details: any;
  }) {
    await axios.post(`${this.baseUrl}/api/costs/track`, data);
  }

  // Get cost summary
  async getCostSummary(agentId: string) {
    const response = await axios.get(
      `${this.baseUrl}/api/costs/agent/${agentId}`
    );
    return response.data;
  }
}
```

---

## 🔧 Agent Hub Backend Modifications

### Extend Testing API to Support Bedrock Agents

```typescript
// Agent Hub Backend: src/routes/testing.js
router.post('/run', async (req, res) => {
  const { agentId, agentType, testIds, executionConfig } = req.body;

  if (agentType === 'bedrock') {
    // Execute Bedrock agent
    const results = await executeBedrockAgentTests(
      agentId,
      testIds,
      executionConfig
    );
    return res.json(results);
  } else {
    // Execute custom agent (existing logic)
    const results = await executeCustomAgentTests(agentId, testIds);
    return res.json(results);
  }
});

async function executeBedrockAgentTests(agentId, testIds, config) {
  const { BedrockAgentRuntimeClient, InvokeAgentCommand } = 
    require('@aws-sdk/client-bedrock-agent-runtime');
  
  const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
  
  const results = [];
  
  for (const testId of testIds) {
    const test = await getTestById(testId);
    
    // Invoke Bedrock agent
    const command = new InvokeAgentCommand({
      agentId: config.agentId,
      agentAliasId: config.agentAliasId,
      sessionId: generateSessionId(),
      inputText: test.input_used,
    });
    
    const startTime = Date.now();
    const response = await client.send(command);
    const duration = Date.now() - startTime;
    
    // Collect streaming response
    let actualOutput = '';
    for await (const event of response.completion) {
      if (event.chunk) {
        actualOutput += new TextDecoder().decode(event.chunk.bytes);
      }
    }
    
    // Evaluate using existing scoring logic
    const score = await evaluateResponse(
      test.expected_output,
      actualOutput,
      test.test_category
    );
    
    results.push({
      test_id: testId,
      test_name: test.test_name,
      passed: score >= 70,
      score,
      actual_output: actualOutput,
      duration,
      cost: calculateBedrockCost(response),
    });
  }
  
  return { results, agentType: 'bedrock' };
}
```

### Add CORS for Bedrock App

```typescript
// Agent Hub Backend: src/reliable-server.ts
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',  // Agent Hub UI
    'http://localhost:3004',  // Bedrock Agents UI
  ],
  credentials: true,
}));
```

---

## 🎨 UI Navigation Integration

### Add Bedrock Tab to Agent Hub

```typescript
// Agent Hub: src/components/Navigation.tsx
import { Link } from 'react-router-dom';

export const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <Link to="/">Home</Link>
      <Link to="/agents">Agents</Link>
      <Link to="/testing">Testing</Link>
      <Link to="/bedrock-agents" className="bedrock-tab">
        🆕 Bedrock Agents
        <span className="beta-badge">BETA</span>
      </Link>
      <Link to="/analytics">Analytics</Link>
    </nav>
  );
};
```

```css
/* Agent Hub: src/styles/navigation.css */
.bedrock-tab {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  position: relative;
}

.beta-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff6b6b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
```

---

## 📦 Deployment Configuration

### Development (Local)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Existing Agent Hub
  agent-hub-ui:
    build: ./local_version/agent-hub-ui
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3002
      - REACT_APP_BEDROCK_APP_URL=http://localhost:3004

  agent-hub-backend:
    build: ./local_version/agent-hub-backend
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - BEDROCK_APP_URL=http://localhost:3005

  # New Bedrock Agents App
  bedrock-ui:
    build: ./bedrock-agents-app/bedrock-ui
    ports:
      - "3004:3004"
    environment:
      - REACT_APP_API_URL=http://localhost:3005
      - REACT_APP_AGENT_HUB_API=http://localhost:3002

  bedrock-backend:
    build: ./bedrock-agents-app/bedrock-backend
    ports:
      - "3005:3005"
    environment:
      - PORT=3005
      - AGENT_HUB_API_URL=http://localhost:3002
      - AWS_REGION=us-east-1
```

### Production

```nginx
# nginx.conf
server {
  listen 80;
  server_name agent-factory.com;

  # Agent Hub UI
  location / {
    proxy_pass http://localhost:3000;
  }

  # Agent Hub API
  location /api/ {
    proxy_pass http://localhost:3002;
  }

  # Bedrock Agents UI (embedded)
  location /bedrock-app/ {
    proxy_pass http://localhost:3004/;
  }

  # Bedrock Agents API
  location /bedrock-api/ {
    proxy_pass http://localhost:3005/;
  }
}
```

---

## 🚀 Implementation Roadmap

### Week 1-2: Setup & Infrastructure
- [ ] Create bedrock-agents-app folder structure
- [ ] Setup React app (Port 3004)
- [ ] Setup Node.js backend (Port 3005)
- [ ] Configure AWS SDK for Bedrock
- [ ] Add BedrockAgentsTab to Agent Hub
- [ ] Test iframe integration

### Week 3-4: Quick Builder
- [ ] Build Quick Builder wizard (5 steps)
- [ ] Integrate with Bedrock Agents API
- [ ] Add Knowledge Base upload
- [ ] Test agent creation flow
- [ ] Integrate with Agent Hub testing API

### Week 5-6: Core Builder
- [ ] Build Core Builder wizard (advanced)
- [ ] Add Action Groups configuration
- [ ] Add Guardrails configuration
- [ ] Add versioning and aliases
- [ ] Test complex agent creation

### Week 7-8: Integration & Testing
- [ ] Connect to Agent Hub testing framework
- [ ] Connect to Agent Hub analytics
- [ ] Connect to Agent Hub cost tracking
- [ ] End-to-end testing
- [ ] Performance optimization

### Week 9-10: Polish & Deploy
- [ ] UI/UX improvements
- [ ] Documentation
- [ ] Docker setup
- [ ] Production deployment
- [ ] User training

---

## 💰 Cost Estimate

### Development
- **Time**: 10 weeks
- **Effort**: 1 developer full-time
- **Cost**: ~$25,000 (at $50/hr)

### Infrastructure (Monthly)
- Agent Hub: $2,195 (existing)
- Bedrock Agents App: $278
- **Total**: $2,473/month

### Savings After Migration
- Reduced Agent Hub complexity: -$917/month
- **Net Cost**: $1,556/month (29% savings!)

---

## ✅ Success Criteria

1. **Isolation**: Bedrock app runs independently
2. **Integration**: Appears seamlessly in Agent Hub
3. **Shared Services**: Uses Agent Hub's testing, analytics, costs
4. **Performance**: No noticeable lag in iframe
5. **Deployment**: Can deploy separately
6. **User Experience**: Feels like one unified app

---

## 🎯 Next Steps

1. **Approve this plan**
2. **Create bedrock-agents-app folder**
3. **Setup basic React + Node.js apps**
4. **Add iframe integration to Agent Hub**
5. **Build Quick Builder MVP**
6. **Test end-to-end flow**

Ready to start? 🚀
