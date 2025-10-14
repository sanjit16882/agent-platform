# API-First Backend Implementation Plan

## Phase 1: Core API Infrastructure (Week 1-2)

### 1.1 Enhanced API Gateway Setup
```typescript
// Enhanced CDK stack for API Gateway
export class AgentFactoryAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // API Gateway with custom domain
    const api = new apigateway.RestApi(this, 'AgentFactoryAPI', {
      restApiName: 'Agent Factory Platform API',
      description: 'Central API for Agent Factory Platform',
      domainName: {
        domainName: 'agent-factory.company.com',
        certificate: acm.Certificate.fromCertificateArn(this, 'Cert', certArn)
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
      }
    });

    // API Key for service-to-service authentication
    const apiKey = api.addApiKey('AgentFactoryAPIKey', {
      apiKeyName: 'agent-factory-api-key',
      description: 'API key for Agent Factory platform access'
    });

    // Usage plan with quotas
    const usagePlan = api.addUsagePlan('AgentFactoryUsagePlan', {
      name: 'Agent Factory Usage Plan',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000
      },
      quota: {
        limit: 100000,
        period: apigateway.Period.MONTH
      }
    });

    usagePlan.addApiKey(apiKey);
  }
}
```

### 1.2 Authentication & Authorization
```typescript
// Cognito User Pool for authentication
const userPool = new cognito.UserPool(this, 'AgentFactoryUserPool', {
  userPoolName: 'agent-factory-users',
  signInAliases: {
    email: true,
    username: true
  },
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: true
  },
  mfa: cognito.Mfa.OPTIONAL,
  mfaSecondFactor: {
    sms: true,
    otp: true
  }
});

// Cognito Authorizer for API Gateway
const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'AgentFactoryAuthorizer', {
  cognitoUserPools: [userPool],
  authorizerName: 'AgentFactoryAuthorizer'
});
```

### 1.3 Core API Endpoints
```typescript
// Agent management endpoints
const agentsResource = api.root.addResource('agents');

// GET /agents - List all agents
agentsResource.addMethod('GET', new apigateway.LambdaIntegration(listAgentsLambda), {
  authorizer: authorizer,
  requestParameters: {
    'method.request.querystring.category': false,
    'method.request.querystring.limit': false,
    'method.request.querystring.offset': false
  }
});

// POST /agents - Upload new agent
agentsResource.addMethod('POST', new apigateway.LambdaIntegration(uploadAgentLambda), {
  authorizer: authorizer,
  requestValidator: new apigateway.RequestValidator(this, 'AgentUploadValidator', {
    api: api,
    requestValidatorName: 'agent-upload-validator',
    validateRequestBody: true,
    validateRequestParameters: true
  })
});

// GET /agents/{id} - Get specific agent
const agentResource = agentsResource.addResource('{id}');
agentResource.addMethod('GET', new apigateway.LambdaIntegration(getAgentLambda), {
  authorizer: authorizer
});

// POST /agents/{id}/execute - Execute agent
const executeResource = agentResource.addResource('execute');
executeResource.addMethod('POST', new apigateway.LambdaIntegration(executeAgentLambda), {
  authorizer: authorizer
});
```

## Phase 2: SDK Development (Week 3-4)

### 2.1 Python SDK
```python
# agent_factory_sdk/client.py
import asyncio
import aiohttp
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

@dataclass
class AgentExecutionResult:
    execution_id: str
    status: str
    results: Dict[str, Any]
    cost: float
    duration_ms: int

class AgentFactoryClient:
    def __init__(self, base_url: str, api_key: str, region: str = 'us-east-1'):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.region = region
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'User-Agent': 'AgentFactory-Python-SDK/1.0.0'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def list_agents(self, category: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """List available agents"""
        params = {'limit': limit}
        if category:
            params['category'] = category
            
        async with self.session.get(f'{self.base_url}/api/v1/agents', params=params) as response:
            response.raise_for_status()
            data = await response.json()
            return data['agents']
    
    async def execute_agent(self, agent_id: str, input_data: Dict[str, Any]) -> AgentExecutionResult:
        """Execute an agent with given input"""
        payload = {
            'input': input_data,
            'metadata': {
                'client': 'python-sdk',
                'version': '1.0.0'
            }
        }
        
        async with self.session.post(
            f'{self.base_url}/api/v1/agents/{agent_id}/execute',
            json=payload
        ) as response:
            response.raise_for_status()
            data = await response.json()
            
            return AgentExecutionResult(
                execution_id=data['execution_id'],
                status=data['status'],
                results=data['results'],
                cost=data['cost'],
                duration_ms=data['duration_ms']
            )
    
    async def get_execution_status(self, execution_id: str) -> Dict[str, Any]:
        """Get execution status and results"""
        async with self.session.get(f'{self.base_url}/api/v1/executions/{execution_id}') as response:
            response.raise_for_status()
            return await response.json()

# Usage example
async def main():
    async with AgentFactoryClient(
        base_url='https://agent-factory.company.com',
        api_key='your-api-key'
    ) as client:
        
        # List QA agents
        qa_agents = await client.list_agents(category='QE')
        print(f"Found {len(qa_agents)} QA agents")
        
        # Execute test generation agent
        result = await client.execute_agent('qe-test-generator-v2', {
            'requirements': 'Test user login with MFA',
            'framework': 'cypress',
            'output_format': 'typescript'
        })
        
        print(f"Execution ID: {result.execution_id}")
        print(f"Generated {len(result.results.get('test_cases', []))} test cases")
```

### 2.2 JavaScript/TypeScript SDK
```typescript
// src/AgentFactoryClient.ts
export interface AgentExecutionOptions {
  input: Record<string, any>;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface AgentExecutionResult {
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Record<string, any>;
  cost: number;
  durationMs: number;
  createdAt: string;
  completedAt?: string;
}

export class AgentFactoryClient {
  private baseURL: string;
  private apiKey: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: {
    baseURL: string;
    apiKey: string;
    region?: string;
  }) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AgentFactory-JS-SDK/1.0.0'
    };
  }

  async listAgents(options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await fetch(`${this.baseURL}/api/v1/agents?${params}`, {
      headers: this.defaultHeaders
    });

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`);
    }

    const data = await response.json();
    return data.agents;
  }

  async executeAgent(
    agentId: string, 
    options: AgentExecutionOptions
  ): Promise<AgentExecutionResult> {
    const response = await fetch(`${this.baseURL}/api/v1/agents/${agentId}/execute`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({
        input: options.input,
        timeout: options.timeout || 300000, // 5 minutes default
        priority: options.priority || 'normal',
        metadata: {
          client: 'javascript-sdk',
          version: '1.0.0',
          ...options.metadata
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to execute agent: ${response.statusText}`);
    }

    return await response.json();
  }

  async getExecutionStatus(executionId: string): Promise<AgentExecutionResult> {
    const response = await fetch(`${this.baseURL}/api/v1/executions/${executionId}`, {
      headers: this.defaultHeaders
    });

    if (!response.ok) {
      throw new Error(`Failed to get execution status: ${response.statusText}`);
    }

    return await response.json();
  }

  // Real-time execution monitoring with WebSocket
  watchExecution(executionId: string): EventSource {
    return new EventSource(
      `${this.baseURL}/api/v1/executions/${executionId}/stream`,
      {
        headers: this.defaultHeaders
      }
    );
  }
}

// Usage example
const client = new AgentFactoryClient({
  baseURL: 'https://agent-factory.company.com',
  apiKey: process.env.AGENT_FACTORY_API_KEY!
});

// Execute QA agent
const result = await client.executeAgent('qe-test-generator-v2', {
  input: {
    requirements: 'Test checkout flow with payment processing',
    framework: 'cypress',
    outputFormat: 'typescript'
  },
  priority: 'high',
  metadata: {
    project: 'ecommerce-platform',
    team: 'qa-automation'
  }
});

console.log(`Execution started: ${result.executionId}`);

// Watch execution progress
const eventSource = client.watchExecution(result.executionId);
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(`Status: ${update.status}, Progress: ${update.progress}%`);
  
  if (update.status === 'completed') {
    console.log('Generated test cases:', update.results.testCases);
    eventSource.close();
  }
};
```

## Phase 3: Integration Patterns (Week 5-6)

### 3.1 CI/CD Integration
```yaml
# GitHub Actions Integration
name: Agent Factory Integration
on:
  pull_request:
    paths: ['src/**', 'tests/**']

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Agent Factory CLI
        run: npm install -g @company/agent-factory-cli
        
      - name: Generate API Tests
        run: |
          agent-factory execute \
            --agent-id "postman-api-tester" \
            --input-file "./api-requirements.json" \
            --output-dir "./generated-tests" \
            --format "postman-collection"
        env:
          AGENT_FACTORY_API_KEY: ${{ secrets.AGENT_FACTORY_API_KEY }}
          AGENT_FACTORY_BASE_URL: "https://agent-factory.company.com"
      
      - name: Run Generated Tests
        run: |
          newman run ./generated-tests/api-tests.json \
            --environment ./environments/staging.json \
            --reporters cli,json \
            --reporter-json-export ./test-results.json
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: ./test-results.json
```

### 3.2 Webhook Integration
```javascript
// Express.js webhook handler
const express = require('express');
const crypto = require('crypto');
const app = express();

// Webhook signature verification
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook endpoint
app.post('/webhooks/agent-factory', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-agent-factory-signature'];
  const payload = req.body;
  
  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'execution.completed':
      handleExecutionCompleted(event.data);
      break;
      
    case 'execution.failed':
      handleExecutionFailed(event.data);
      break;
      
    case 'agent.health.degraded':
      handleAgentHealthDegraded(event.data);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.status(200).json({ received: true });
});

async function handleExecutionCompleted(data) {
  const { executionId, agentId, results, metadata } = data;
  
  // Process results based on agent type
  if (agentId === 'qe-test-generator-v2') {
    // Save generated test files
    await saveGeneratedTests(results.testCases, metadata.project);
    
    // Create pull request with generated tests
    await createPullRequest({
      title: `Auto-generated tests from Agent Factory`,
      body: `Generated ${results.testCases.length} test cases`,
      files: results.generatedFiles
    });
  }
  
  // Send notification to team
  await sendSlackNotification({
    channel: '#qa-automation',
    message: `✅ Agent execution completed: ${executionId}`,
    details: {
      agent: agentId,
      duration: data.durationMs,
      cost: data.cost
    }
  });
}
```

### 3.3 Enterprise Integration Patterns
```typescript
// Enterprise Service Bus Integration
export class AgentFactoryESBAdapter {
  private esbClient: ESBClient;
  private agentClient: AgentFactoryClient;

  constructor(esbConfig: ESBConfig, agentConfig: AgentFactoryConfig) {
    this.esbClient = new ESBClient(esbConfig);
    this.agentClient = new AgentFactoryClient(agentConfig);
  }

  // Listen for enterprise events and trigger agents
  async startEventProcessing() {
    this.esbClient.subscribe('deployment.requested', async (event) => {
      // Trigger infrastructure generation agent
      const result = await this.agentClient.executeAgent('terraform-generator', {
        applicationName: event.data.applicationName,
        environment: event.data.environment,
        requirements: event.data.requirements
      });

      // Publish generated infrastructure back to ESB
      await this.esbClient.publish('infrastructure.generated', {
        deploymentId: event.data.deploymentId,
        terraformCode: result.results.terraformCode,
        executionId: result.executionId
      });
    });

    this.esbClient.subscribe('security.scan.requested', async (event) => {
      // Trigger security scanning agent
      const result = await this.agentClient.executeAgent('security-scanner-v1', {
        targetSystem: event.data.targetSystem,
        scanType: event.data.scanType,
        complianceFramework: event.data.complianceFramework
      });

      // Publish security scan results
      await this.esbClient.publish('security.scan.completed', {
        scanId: event.data.scanId,
        vulnerabilities: result.results.vulnerabilities,
        complianceStatus: result.results.complianceStatus,
        executionId: result.executionId
      });
    });
  }
}

// LDAP/Active Directory Integration
export class AgentFactoryLDAPIntegration {
  private ldapClient: LDAPClient;
  private agentClient: AgentFactoryClient;

  async syncUserPermissions() {
    // Get users from LDAP
    const users = await this.ldapClient.searchUsers({
      filter: '(memberOf=CN=AgentFactory-Users,OU=Groups,DC=company,DC=com)'
    });

    // Sync permissions with Agent Factory
    for (const user of users) {
      const groups = await this.ldapClient.getUserGroups(user.dn);
      const permissions = this.mapGroupsToPermissions(groups);
      
      await this.agentClient.updateUserPermissions(user.email, permissions);
    }
  }

  private mapGroupsToPermissions(groups: string[]): string[] {
    const permissionMap = {
      'AgentFactory-Admins': ['*'],
      'AgentFactory-QA': ['agents:execute:qe-*', 'agents:view'],
      'AgentFactory-DevOps': ['agents:execute:devops-*', 'agents:view'],
      'AgentFactory-Security': ['agents:execute:security-*', 'agents:view'],
      'AgentFactory-Developers': ['agents:execute', 'agents:view']
    };

    return groups.flatMap(group => permissionMap[group] || []);
  }
}
```

This comprehensive architecture enables your Agent Factory platform to serve as a central backend service that any application in your organization can integrate with, providing maximum flexibility and enterprise-grade capabilities!