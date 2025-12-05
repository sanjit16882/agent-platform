// Bedrock Model Configuration for AgentHub
// Optimized for 30-minute daily usage

const AWS = require('aws-sdk');

// Configure AWS SDK to use automatic region from Lambda environment
const region = process.env.AWS_REGION || 'us-east-1';

AWS.config.update({
  region: region
});

const bedrock = new AWS.BedrockRuntime({ 
  region: region
});

// Model configurations optimized for cost and performance
const MODELS = {
  // Cost-effective option
  'haiku': {
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    maxTokens: 2000,
    temperature: 0.1,
    costPer1MTokens: { input: 0.25, output: 1.25 },
    bestFor: ['test-generation', 'code-analysis', 'documentation']
  },
  
  // Balanced option (recommended)
  'sonnet': {
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    maxTokens: 4000,
    temperature: 0.1,
    costPer1MTokens: { input: 3.00, output: 15.00 },
    bestFor: ['security-analysis', 'complex-debugging', 'architecture-review']
  },
  
  // Budget option
  'titan': {
    modelId: 'amazon.titan-text-express-v1',
    maxTokens: 3000,
    temperature: 0.1,
    costPer1MTokens: { input: 0.80, output: 0.80 },
    bestFor: ['simple-tasks', 'basic-documentation']
  }
};

// Agent-to-model mapping for cost optimization
const AGENT_MODEL_MAP = {
  'test-generator': 'haiku',      // Fast, cost-effective
  'security-scanner': 'sonnet',   // Needs accuracy
  'code-quality': 'haiku',        // Good balance
  'documentation-generator': 'titan', // Simple task
  'failure-analyzer': 'sonnet'    // Needs reasoning
};

async function callBedrock(agentId, prompt, context = {}) {
  const modelConfig = MODELS[AGENT_MODEL_MAP[agentId]] || MODELS['haiku'];
  
  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: modelConfig.maxTokens,
    temperature: modelConfig.temperature,
    messages: [
      {
        role: "user",
        content: buildPrompt(agentId, prompt, context)
      }
    ]
  };

  try {
    const response = await bedrock.invokeModel({
      modelId: modelConfig.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    }).promise();

    const responseBody = JSON.parse(response.body.toString());
    return {
      success: true,
      content: responseBody.content[0].text,
      usage: responseBody.usage,
      model: modelConfig.modelId
    };

  } catch (error) {
    console.error('Bedrock API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function buildPrompt(agentId, userPrompt, context) {
  const prompts = {
    'test-generator': `
You are a test generation expert. Generate comprehensive unit tests for the provided code.

Code to test:
${userPrompt}

Context: ${JSON.stringify(context)}

Generate tests that include:
1. Happy path scenarios
2. Edge cases
3. Error conditions
4. Input validation

Return only the test code in ${context.framework || 'Jest'} format.`,

    'security-scanner': `
You are a security analysis expert. Analyze the provided code for security vulnerabilities.

Code to analyze:
${userPrompt}

Context: ${JSON.stringify(context)}

Look for:
1. SQL injection risks
2. XSS vulnerabilities  
3. Authentication issues
4. Input validation problems
5. Hardcoded secrets

Return a JSON array of security issues with severity, description, and fix suggestions.`,

    'code-quality': `
You are a code quality expert. Analyze the provided code for quality issues and improvements.

Code to analyze:
${userPrompt}

Context: ${JSON.stringify(context)}

Analyze for:
1. Code complexity
2. Best practices
3. Performance issues
4. Maintainability
5. Design patterns

Return suggestions for improvement with specific examples.`,

    'documentation-generator': `
You are a documentation expert. Generate comprehensive documentation for the provided code.

Code to document:
${userPrompt}

Context: ${JSON.stringify(context)}

Generate:
1. Function/class descriptions
2. Parameter documentation
3. Return value descriptions
4. Usage examples
5. Error conditions

Return in Markdown format.`,

    'failure-analyzer': `
You are a debugging expert. Analyze the provided error and suggest solutions.

Error/Issue:
${userPrompt}

Context: ${JSON.stringify(context)}

Provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Specific fix suggestions
4. Prevention strategies

Return actionable debugging steps and solutions.`
  };

  return prompts[agentId] || `Analyze this: ${userPrompt}`;
}

module.exports = {
  callBedrock,
  MODELS,
  AGENT_MODEL_MAP
};