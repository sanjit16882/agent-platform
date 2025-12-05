# Bedrock Agents Standalone Application - Complete Plan

## Executive Summary
Create a **completely separate application** for AWS Bedrock Agents (Core & Quick) that:
- ✅ Runs independently from current Agent Factory
- ✅ Zero impact on existing codebase
- ✅ Similar UI/UX for consistency
- ✅ Can be deployed separately
- ✅ Optional integration points for future
- ✅ Proof of concept without risk

---

## Architecture Overview

### Separate Application Structure
```
agent-factory/                    # Your current app (untouched)
├── local_version/
│   ├── agent-hub-ui/            # Current React app
│   └── agent-hub-backend/       # Current Node.js backend

bedrock-agents-app/              # NEW standalone app
├── bedrock-ui/                  # New React app (port 3004)
├── bedrock-backend/             # New Node.js backend (port 3005)
├── shared-components/           # Optional: Reusable UI components
└── docs/
```

### Key Principles
1. **Complete Isolation** - No shared dependencies with current app
2. **Independent Deployment** - Can deploy/update separately
3. **Consistent UX** - Similar look and feel
4. **Optional Bridge** - Can integrate later if desired
5. **Risk-Free** - Current app continues unchanged

---

## Application Structure

### 1. Bedrock Agents UI (bedrock-ui/)

#### Technology Stack
```json
{
  "framework": "React 18 + TypeScript",
  "styling": "Same theme as Agent Factory (Bootstrap/custom)",
  "state": "React Context + Hooks",
  "routing": "React Router v6",
  "api": "Axios",
  "port": "3004"
}
```

#### Page Structure
```
bedrock-ui/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx              # Main dashboard
│   │   ├── AgentCatalog.tsx           # List of Bedrock agents
│   │   ├── AgentBuilder/
│   │   │   ├── QuickAgentBuilder.tsx  # Simple 5-min setup
│   │   │   └── CoreAgentBuilder.tsx   # Advanced configuration
│   │   ├── AgentDetails.tsx           # Agent details & metrics
│   │   ├── KnowledgeBaseManager.tsx   # Manage knowledge bases
│   │   ├── ActionGroupBuilder.tsx     # Configure action groups
│   │   ├── AgentTesting.tsx           # Test agents
│   │   └── Analytics.tsx              # Performance analytics
│   │
│   ├── components/
│   │   ├── AgentCard.tsx
│   │   ├── BedrockModelSelector.tsx
│   │   ├── KnowledgeBaseSelector.tsx
│   │   ├── ActionGroupForm.tsx
│   │   ├── GuardrailSelector.tsx
│   │   └── SessionViewer.tsx
│   │
│   ├── services/
│   │   ├── bedrockAgentService.ts     # AWS Bedrock Agents API
│   │   ├── knowledgeBaseService.ts    # Knowledge Base operations
│   │   └── analyticsService.ts        # Metrics and monitoring
│   │
│   ├── types/
│   │   ├── bedrockAgent.ts
│   │   └── knowledgeBase.ts
│   │
│   └── styles/
│       └── theme.ts                    # Match Agent Factory theme
```

### 2. Bedrock Agents Backend (bedrock-backend/)

#### Technology Stack
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "language": "TypeScript",
  "aws-sdk": "@aws-sdk/client-bedrock-agent",
  "database": "PostgreSQL or DynamoDB",
  "port": "3005"
}
```

#### Service Structure
```
bedrock-backend/
├── src/
│   ├── routes/
│   │   ├── agents.ts              # CRUD for Bedrock agents
│   │   ├── knowledgeBases.ts      # KB management
│   │   ├── actionGroups.ts        # Action group config
│   │   ├── sessions.ts            # Session management
│   │   └── analytics.ts           # Metrics and monitoring
│   │
│   ├── services/
│   │   ├── BedrockAgentService.ts
│   │   │   ├── createAgent()
│   │   │   ├── updateAgent()
│   │   │   ├── deleteAgent()
│   │   │   ├── invokeAgent()
│   │   │   └── getAgentMetrics()
│   │   │
│   │   ├── KnowledgeBaseService.ts
│   │   │   ├── createKB()
│   │   │   ├── ingestDocuments()
│   │   │   └── queryKB()
│   │   │
│   │   ├── ActionGroupService.ts
│   │   │   ├── createActionGroup()
│   │   │   ├── updateOpenAPISchema()
│   │   │   └── testAction()
│   │   │
│   │   └── AnalyticsService.ts
│   │       ├── trackInvocation()
│   │       ├── calculateCosts()
│   │       └── generateReports()
│   │
│   ├── models/
│   │   ├── Agent.ts
│   │   ├── KnowledgeBase.ts
│   │   └── Session.ts
│   │
│   └── utils/
│       ├── awsConfig.ts
│       └── logger.ts
```

---

## Feature Comparison Matrix

| Feature | Current Agent Factory | New Bedrock Agents App |
|---------|----------------------|------------------------|
| **Agent Creation** | Custom code | AWS Bedrock Agents API |
| **Orchestration** | Manual | AWS automatic |
| **Knowledge Base** | Custom Vector DB | AWS Knowledge Bases |
| **Tool Integration** | MCP | Action Groups |
| **Memory** | Custom | Built-in session memory |
| **Testing** | Your framework | Similar + Bedrock metrics |
| **Analytics** | Your dashboard | Similar + AWS CloudWatch |
| **Deployment** | Your infra | Serverless (AWS) |
| **Port** | 3000/4002 | 3004/3005 |
| **Database** | Your DB | Separate DB |

---

## UI/UX Design (Matching Agent Factory)

### 1. Dashboard
```typescript
// bedrock-ui/src/pages/Dashboard.tsx
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Dashboard: React.FC = () => {
  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h1>🚀 Bedrock Agents Platform</h1>
          <p className="text-muted">
            Powered by AWS Bedrock Agents - Enterprise-grade AI orchestration
          </p>
        </Col>
      </Row>

      {/* Stats Cards - Similar to Agent Factory */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <h3>{stats.totalAgents}</h3>
              <p>Bedrock Agents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <h3>{stats.knowledgeBases}</h3>
            <p>Knowledge Bases</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <h3>{stats.invocations}</h3>
            <p>Total Invocations</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <h3>${stats.monthlyCost}</h3>
            <p>Monthly Cost</p>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col md={6}>
          <Card className="action-card">
            <Card.Body>
              <h4>⚡ Quick Agent</h4>
              <p>Create a simple Q&A agent in 5 minutes</p>
              <Button onClick={() => navigate('/builder/quick')}>
                Create Quick Agent
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="action-card">
            <Card.Body>
              <h4>🎯 Core Agent</h4>
              <p>Build advanced agents with action groups</p>
              <Button onClick={() => navigate('/builder/core')}>
                Create Core Agent
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
```

### 2. Quick Agent Builder (5-Minute Setup)
```typescript
// bedrock-ui/src/pages/AgentBuilder/QuickAgentBuilder.tsx
const QuickAgentBuilder: React.FC = () => {
  const [step, setStep] = useState(1);

  return (
    <Container>
      <h2>⚡ Quick Agent Builder</h2>
      <ProgressBar now={(step / 3) * 100} />

      {step === 1 && (
        <Card>
          <Card.Header>Step 1: Basic Information</Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label>Agent Name</Form.Label>
              <Form.Control 
                placeholder="e.g., Customer Support Bot"
                value={config.name}
                onChange={(e) => setConfig({...config, name: e.target.value})}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea"
                placeholder="What does this agent do?"
                value={config.description}
                onChange={(e) => setConfig({...config, description: e.target.value})}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Instructions</Form.Label>
              <Form.Control 
                as="textarea"
                rows={4}
                placeholder="You are a helpful customer support agent..."
                value={config.instruction}
                onChange={(e) => setConfig({...config, instruction: e.target.value})}
              />
            </Form.Group>
          </Card.Body>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Card.Header>Step 2: Select Knowledge Base</Card.Header>
          <Card.Body>
            <KnowledgeBaseSelector
              selected={config.knowledgeBaseId}
              onSelect={(id) => setConfig({...config, knowledgeBaseId: id})}
            />
            
            <Alert variant="info">
              💡 The agent will automatically search this knowledge base 
              to answer questions
            </Alert>
          </Card.Body>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <Card.Header>Step 3: Choose Model</Card.Header>
          <Card.Body>
            <BedrockModelSelector
              selected={config.model}
              onSelect={(model) => setConfig({...config, model})}
            />
            
            <Alert variant="success">
              ✅ Ready to create! Your agent will be live in seconds.
            </Alert>
          </Card.Body>
        </Card>
      )}

      <div className="d-flex justify-content-between mt-4">
        <Button 
          variant="secondary" 
          disabled={step === 1}
          onClick={() => setStep(step - 1)}
        >
          Previous
        </Button>
        
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="success" onClick={handleCreate}>
            🚀 Create Agent
          </Button>
        )}
      </div>
    </Container>
  );
};
```

### 3. Core Agent Builder (Advanced)
```typescript
// bedrock-ui/src/pages/AgentBuilder/CoreAgentBuilder.tsx
const CoreAgentBuilder: React.FC = () => {
  return (
    <Container>
      <Tabs defaultActiveKey="basic">
        <Tab eventKey="basic" title="Basic Info">
          <BasicInfoForm config={config} onChange={setConfig} />
        </Tab>

        <Tab eventKey="knowledge" title="Knowledge Bases">
          <MultiKnowledgeBaseSelector
            selected={config.knowledgeBases}
            onChange={(kbs) => setConfig({...config, knowledgeBases: kbs})}
          />
        </Tab>

        <Tab eventKey="actions" title="Action Groups">
          <ActionGroupBuilder
            actionGroups={config.actionGroups}
            onChange={(groups) => setConfig({...config, actionGroups: groups})}
          />
        </Tab>

        <Tab eventKey="memory" title="Memory & Context">
          <MemoryConfiguration
            config={config.memoryConfig}
            onChange={(mem) => setConfig({...config, memoryConfig: mem})}
          />
        </Tab>

        <Tab eventKey="guardrails" title="Guardrails">
          <GuardrailSelector
            selected={config.guardrailId}
            onSelect={(id) => setConfig({...config, guardrailId: id})}
          />
        </Tab>

        <Tab eventKey="advanced" title="Advanced">
          <AdvancedSettings config={config} onChange={setConfig} />
        </Tab>
      </Tabs>

      <div className="mt-4">
        <Button variant="success" size="lg" onClick={handleCreate}>
          Create Bedrock Agent
        </Button>
      </div>
    </Container>
  );
};
```

---

## Backend API Structure

### Agent Management Endpoints
```typescript
// bedrock-backend/src/routes/agents.ts
import express from 'express';
import { BedrockAgentService } from '../services/BedrockAgentService';

const router = express.Router();
const agentService = new BedrockAgentService();

// Create Quick Agent
router.post('/quick', async (req, res) => {
  try {
    const { name, description, instruction, knowledgeBaseId, model } = req.body;
    
    // Create agent in AWS Bedrock
    const agent = await agentService.createQuickAgent({
      agentName: name,
      description,
      instruction,
      foundationModel: model,
      knowledgeBaseId
    });
    
    // Store in local database
    await db.agents.create({
      bedrockAgentId: agent.agentId,
      name,
      type: 'quick',
      config: agent
    });
    
    res.json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Core Agent
router.post('/core', async (req, res) => {
  try {
    const config = req.body;
    
    // Create agent with full configuration
    const agent = await agentService.createCoreAgent(config);
    
    // Create action groups
    for (const actionGroup of config.actionGroups) {
      await agentService.createActionGroup(agent.agentId, actionGroup);
    }
    
    // Associate knowledge bases
    for (const kb of config.knowledgeBases) {
      await agentService.associateKnowledgeBase(agent.agentId, kb.id);
    }
    
    res.json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Invoke Agent
router.post('/:agentId/invoke', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { input, sessionId } = req.body;
    
    const response = await agentService.invokeAgent(agentId, input, sessionId);
    
    // Track analytics
    await analyticsService.trackInvocation({
      agentId,
      sessionId,
      input,
      response,
      timestamp: new Date()
    });
    
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Agent Details
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const agent = await agentService.getAgent(agentId);
    const metrics = await analyticsService.getAgentMetrics(agentId);
    
    res.json({ success: true, agent, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List All Agents
router.get('/', async (req, res) => {
  try {
    const agents = await agentService.listAgents();
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### Bedrock Agent Service Implementation
```typescript
// bedrock-backend/src/services/BedrockAgentService.ts
import { 
  BedrockAgentClient,
  CreateAgentCommand,
  CreateAgentActionGroupCommand,
  AssociateAgentKnowledgeBaseCommand,
  PrepareAgentCommand
} from '@aws-sdk/client-bedrock-agent';

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from '@aws-sdk/client-bedrock-agent-runtime';

export class BedrockAgentService {
  private client: BedrockAgentClient;
  private runtimeClient: BedrockAgentRuntimeClient;

  constructor() {
    this.client = new BedrockAgentClient({ region: 'us-east-1' });
    this.runtimeClient = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
  }

  async createQuickAgent(config: QuickAgentConfig) {
    // Create agent
    const createCommand = new CreateAgentCommand({
      agentName: config.agentName,
      description: config.description,
      instruction: config.instruction,
      foundationModel: config.foundationModel,
      agentResourceRoleArn: process.env.BEDROCK_AGENT_ROLE_ARN
    });

    const agent = await this.client.send(createCommand);

    // Associate knowledge base
    if (config.knowledgeBaseId) {
      await this.associateKnowledgeBase(
        agent.agent.agentId,
        config.knowledgeBaseId
      );
    }

    // Prepare agent (required before invocation)
    await this.prepareAgent(agent.agent.agentId);

    return agent.agent;
  }

  async createCoreAgent(config: CoreAgentConfig) {
    // Create agent with full configuration
    const createCommand = new CreateAgentCommand({
      agentName: config.agentName,
      description: config.description,
      instruction: config.instruction,
      foundationModel: config.foundationModel,
      agentResourceRoleArn: process.env.BEDROCK_AGENT_ROLE_ARN,
      idleSessionTTLInSeconds: config.sessionTTL || 600,
      guardrailConfiguration: config.guardrailId ? {
        guardrailIdentifier: config.guardrailId,
        guardrailVersion: 'DRAFT'
      } : undefined
    });

    const agent = await this.client.send(createCommand);
    return agent.agent;
  }

  async createActionGroup(agentId: string, actionGroup: ActionGroupConfig) {
    const command = new CreateAgentActionGroupCommand({
      agentId,
      agentVersion: 'DRAFT',
      actionGroupName: actionGroup.name,
      description: actionGroup.description,
      actionGroupExecutor: {
        lambda: actionGroup.lambdaArn
      },
      apiSchema: {
        payload: JSON.stringify(actionGroup.openApiSchema)
      }
    });

    return await this.client.send(command);
  }

  async associateKnowledgeBase(agentId: string, knowledgeBaseId: string) {
    const command = new AssociateAgentKnowledgeBaseCommand({
      agentId,
      agentVersion: 'DRAFT',
      knowledgeBaseId,
      description: 'Associated knowledge base'
    });

    return await this.client.send(command);
  }

  async prepareAgent(agentId: string) {
    const command = new PrepareAgentCommand({
      agentId
    });

    return await this.client.send(command);
  }

  async invokeAgent(agentId: string, input: string, sessionId: string) {
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId: 'TSTALIASID', // Use test alias or create production alias
      sessionId,
      inputText: input
    });

    const response = await this.runtimeClient.send(command);
    
    // Parse streaming response
    const completion = await this.parseAgentResponse(response);
    
    return {
      output: completion.text,
      trace: completion.trace,
      sessionId: response.sessionId
    };
  }

  private async parseAgentResponse(response: any) {
    let text = '';
    const trace = [];

    for await (const event of response.completion) {
      if (event.chunk) {
        text += new TextDecoder().decode(event.chunk.bytes);
      }
      if (event.trace) {
        trace.push(event.trace);
      }
    }

    return { text, trace };
  }

  async listAgents() {
    // List from local database (faster than AWS API)
    const agents = await db.agents.findAll({
      where: { type: ['quick', 'core'] }
    });

    return agents;
  }

  async getAgent(agentId: string) {
    const agent = await db.agents.findOne({
      where: { bedrockAgentId: agentId }
    });

    return agent;
  }
}
```

---

## Deployment Strategy

### Option 1: Separate Servers (Recommended for POC)
```bash
# Terminal 1: Current Agent Factory
cd agent-factory/local_version/agent-hub-backend
npm start  # Runs on port 4002

cd agent-factory/local_version/agent-hub-ui
npm start  # Runs on port 3000

# Terminal 2: New Bedrock Agents App
cd bedrock-agents-app/bedrock-backend
npm start  # Runs on port 3005

cd bedrock-agents-app/bedrock-ui
npm start  # Runs on port 3004
```

### Option 2: Docker Compose (Production)
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Current Agent Factory (untouched)
  agent-factory-ui:
    build: ./agent-factory/local_version/agent-hub-ui
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:4002

  agent-factory-backend:
    build: ./agent-factory/local_version/agent-hub-backend
    ports:
      - "4002:4002"
    environment:
      - NODE_ENV=production

  # New Bedrock Agents App
  bedrock-ui:
    build: ./bedrock-agents-app/bedrock-ui
    ports:
      - "3004:3004"
    environment:
      - REACT_APP_API_URL=http://localhost:3005

  bedrock-backend:
    build: ./bedrock-agents-app/bedrock-backend
    ports:
      - "3005:3005"
    environment:
      - AWS_REGION=us-east-1
      - BEDROCK_AGENT_ROLE_ARN=${BEDROCK_AGENT_ROLE_ARN}
```

### Option 3: AWS Deployment
```bash
# Agent Factory (current)
- Frontend: S3 + CloudFront (current setup)
- Backend: EC2/ECS (current setup)

# Bedrock Agents App (new)
- Frontend: S3 + CloudFront (separate bucket)
- Backend: Lambda + API Gateway (serverless)
- Database: DynamoDB or RDS (separate)
```

---

## Optional Integration Points (Future)

### 1. Shared Authentication
```typescript
// Both apps can use same auth service
const authService = {
  baseUrl: 'https://auth.yourdomain.com',
  validateToken: async (token) => { /* ... */ }
};
```

### 2. Cross-App Navigation
```typescript
// Add link in Agent Factory to Bedrock Agents App
<Nav.Link href="http://localhost:3004">
  🚀 Try Bedrock Agents (Beta)
</Nav.Link>

// Add link in Bedrock Agents App to Agent Factory
<Nav.Link href="http://localhost:3000">
  ← Back to Agent Factory
</Nav.Link>
```

### 3. Shared Analytics (Optional)
```typescript
// Both apps can send metrics to same analytics service
const analyticsService = {
  track: (event, data) => {
    fetch('https://analytics.yourdomain.com/track', {
      method: 'POST',
      body: JSON.stringify({ event, data, app: 'bedrock-agents' })
    });
  }
};
```

---

## Development Roadmap

### Week 1: Setup & Infrastructure
- [ ] Create new repository/folder structure
- [ ] Setup React app (bedrock-ui)
- [ ] Setup Node.js backend (bedrock-backend)
- [ ] Configure AWS SDK and credentials
- [ ] Setup database (PostgreSQL/DynamoDB)

### Week 2: Core Functionality
- [ ] Implement BedrockAgentService
- [ ] Create Quick Agent Builder UI
- [ ] Implement agent creation API
- [ ] Test agent invocation
- [ ] Basic agent listing

### Week 3: Advanced Features
- [ ] Core Agent Builder UI
- [ ] Action Group configuration
- [ ] Knowledge Base integration
- [ ] Session management
- [ ] Agent testing interface

### Week 4: Analytics & Polish
- [ ] Analytics dashboard
- [ ] Cost tracking
- [ ] Performance metrics
- [ ] UI polish (match Agent Factory theme)
- [ ] Documentation

### Week 5: Testing & Deployment
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security review
- [ ] Deploy to staging
- [ ] User acceptance testing

---

## Cost Estimate

### Development Costs
- **Setup & Infrastructure**: 40 hours
- **Core Functionality**: 80 hours
- **Advanced Features**: 100 hours
- **Analytics & Polish**: 60 hours
- **Testing & Deployment**: 40 hours
- **Total**: ~320 hours (~8 weeks with 1 developer)

### AWS Costs (Monthly)
- **Bedrock Agents**: $0.00070 per request (~$70 for 100K requests)
- **Knowledge Bases**: $0.10 per GB storage + $0.002 per query
- **Lambda**: $0.20 per 1M requests
- **DynamoDB**: $1.25 per million writes
- **S3**: $0.023 per GB
- **Estimated Total**: $100-300/month for moderate usage

---

## Success Metrics

### Technical Metrics
- [ ] Agent creation time < 2 minutes (Quick)
- [ ] Agent creation time < 10 minutes (Core)
- [ ] Agent response time < 3 seconds
- [ ] 99.9% uptime
- [ ] Zero impact on current Agent Factory

### Business Metrics
- [ ] 10+ agents created in first month
- [ ] 1000+ agent invocations
- [ ] 80% user satisfaction
- [ ] 50% reduction in development time vs custom agents
- [ ] Clear ROI demonstration

---

## Risk Mitigation

### Risk 1: AWS Bedrock Agents Limitations
**Mitigation**: Start with POC, test thoroughly, keep custom Agent Factory as fallback

### Risk 2: Cost Overruns
**Mitigation**: Implement cost tracking from day 1, set AWS budgets and alarms

### Risk 3: User Confusion (Two Apps)
**Mitigation**: Clear branding, documentation, and navigation between apps

### Risk 4: Maintenance Burden
**Mitigation**: Serverless architecture, automated deployments, good documentation

---

## Conclusion

**This approach gives you:**
1. ✅ **Zero Risk** - Current app completely untouched
2. ✅ **Fast POC** - Can build and test in 4-8 weeks
3. ✅ **Easy Comparison** - Run both apps side-by-side
4. ✅ **Flexibility** - Can integrate later or keep separate
5. ✅ **Learning** - Understand Bedrock Agents without commitment

**Recommended Next Steps:**
1. Create new folder structure
2. Build Quick Agent Builder (Week 1-2)
3. Test with 2-3 real use cases
4. Compare with current Agent Factory
5. Decide: Keep separate, integrate, or sunset one

**This is the safest way to evaluate Bedrock Agents without any risk to your production system!**
