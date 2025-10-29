const AWS = require('aws-sdk');

class BedrockService {
  constructor() {
    this.bedrock = new AWS.BedrockRuntime({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    // Model configurations optimized for cost and performance
    this.models = {
      // Cost-effective for most tasks
      'haiku': {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        maxTokens: 2000,
        temperature: 0.1,
        costPer1MTokens: { input: 0.25, output: 1.25 }
      },
      
      // Balanced for complex tasks
      'sonnet': {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        maxTokens: 4000,
        temperature: 0.1,
        costPer1MTokens: { input: 3.00, output: 15.00 }
      },
      
      // Budget option
      'titan': {
        modelId: 'amazon.titan-text-express-v1',
        maxTokens: 3000,
        temperature: 0.1,
        costPer1MTokens: { input: 0.80, output: 0.80 }
      }
    };
    
    // Agent-to-model mapping for cost optimization
    this.agentModelMap = {
      'test-generator': 'haiku',
      'security-scanner': 'sonnet',
      'code-quality': 'haiku',
      'documentation-generator': 'titan',
      'failure-analyzer': 'sonnet',
      'nlp-processor': 'haiku'
    };
  }

  async callBedrock(agentType, prompt, context = {}) {
    const modelConfig = this.models[this.agentModelMap[agentType]] || this.models['haiku'];
    
    try {
      let requestBody;
      
      if (modelConfig.modelId.includes('anthropic')) {
        // Claude models
        requestBody = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
          messages: [
            {
              role: "user",
              content: this.buildPrompt(agentType, prompt, context)
            }
          ]
        };
      } else if (modelConfig.modelId.includes('titan')) {
        // Titan models
        requestBody = {
          inputText: this.buildPrompt(agentType, prompt, context),
          textGenerationConfig: {
            maxTokenCount: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
            topP: 0.9
          }
        };
      }

      const response = await this.bedrock.invokeModel({
        modelId: modelConfig.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      }).promise();

      const responseBody = JSON.parse(response.body.toString());
      
      let content;
      if (modelConfig.modelId.includes('anthropic')) {
        content = responseBody.content[0].text;
      } else if (modelConfig.modelId.includes('titan')) {
        content = responseBody.results[0].outputText;
      }

      return {
        success: true,
        content: content,
        usage: responseBody.usage || { input_tokens: 0, output_tokens: 0 },
        model: modelConfig.modelId,
        cost: this.calculateCost(responseBody.usage || { input_tokens: 100, output_tokens: 200 }, modelConfig)
      };

    } catch (error) {
      console.error('Bedrock API error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse(agentType, prompt, context)
      };
    }
  }

  buildPrompt(agentType, userPrompt, context) {
    const prompts = {
      'test-generator': `You are an expert test generation assistant. Generate comprehensive unit tests for the provided code.

Code to test:
${userPrompt}

Context: ${JSON.stringify(context)}

Requirements:
1. Generate tests in ${context.framework || 'Jest'} format
2. Include happy path scenarios
3. Add edge cases and error conditions
4. Include input validation tests
5. Ensure good test coverage

Return ONLY the test code, no explanations:`,

      'security-scanner': `You are a security analysis expert. Analyze the provided code for security vulnerabilities.

Code to analyze:
${userPrompt}

Context: ${JSON.stringify(context)}

Look for these security issues:
1. SQL injection vulnerabilities
2. XSS (Cross-site scripting) risks
3. Authentication/authorization flaws
4. Input validation problems
5. Hardcoded secrets or credentials
6. Insecure data handling

Return a JSON array of security issues in this exact format:
[
  {
    "severity": "high|medium|low|critical",
    "title": "Brief issue title",
    "description": "Detailed description",
    "file": "filename",
    "line": 42,
    "suggestion": "How to fix this issue"
  }
]`,

      'code-quality': `You are a code quality expert. Analyze the provided code for quality issues and improvements.

Code to analyze:
${userPrompt}

Context: ${JSON.stringify(context)}

Analyze for:
1. Code complexity and maintainability
2. Best practices adherence
3. Performance optimization opportunities
4. Design pattern improvements
5. Code organization and structure

Return a JSON object with this format:
{
  "analysis": {
    "complexity_score": 1-10,
    "maintainability_index": 1-100,
    "issues_found": 3
  },
  "suggestions": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2"
  ]
}`,

      'documentation-generator': `You are a documentation expert. Generate comprehensive documentation for the provided code.

Code to document:
${userPrompt}

Context: ${JSON.stringify(context)}

Generate documentation that includes:
1. Overview of the code's purpose
2. Function/class descriptions
3. Parameter documentation
4. Return value descriptions
5. Usage examples
6. Error conditions

Return in Markdown format:`,

      'failure-analyzer': `You are a debugging expert. Analyze the provided error and suggest solutions.

Error/Issue:
${userPrompt}

Context: ${JSON.stringify(context)}

Provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Specific fix suggestions
4. Prevention strategies

Return a JSON object with this format:
{
  "analysis": {
    "root_cause": "Detailed root cause explanation",
    "confidence": 0.95,
    "affected_files": ["file1.js", "file2.js"]
  },
  "suggestions": [
    "Step 1: Specific action to take",
    "Step 2: Another specific action"
  ],
  "generated_code": "// Fixed code example if applicable"
}`,

      'nlp-processor': `You are a natural language processing expert for agent creation. Analyze the user's description and extract structured information for agent creation.

User Description:
${userPrompt}

Context: ${JSON.stringify(context)}

Extract and return a JSON object with this exact structure:
{
  "intent": {
    "action": "create-agent",
    "confidence": 0.95,
    "domain": "extracted domain"
  },
  "entities": [
    {"type": "technology", "value": "extracted tech"},
    {"type": "task", "value": "main task"}
  ],
  "agentConfig": {
    "name": "Generated Agent Name",
    "description": "Clear description",
    "category": "automation|analysis|integration|monitoring",
    "complexity": "simple|medium|complex",
    "estimatedTime": "5-10 minutes"
  },
  "components": [
    {
      "type": "llm|rpa|selenium|api|custom",
      "name": "Component Name",
      "description": "What this component does"
    }
  ],
  "businessValue": "Clear business value statement"
}`
    };

    return prompts[agentType] || `Analyze this: ${userPrompt}`;
  }

  getFallbackResponse(agentType, prompt, context) {
    // Fallback to mock responses if Bedrock fails
    const fallbacks = {
      'test-generator': {
        test_cases: `// Generated tests for ${context.file_path || 'code'}
describe('Tests', () => {
  test('should handle valid input', () => {
    expect(true).toBe(true);
  });
});`,
        analysis: { coverage_estimate: '85%', test_count: 1 }
      },
      
      'security-scanner': {
        security_issues: [{
          severity: 'medium',
          title: 'Analysis unavailable',
          description: 'Bedrock service unavailable, using fallback',
          file: context.file_path || 'unknown',
          line: 1,
          suggestion: 'Retry when service is available'
        }]
      },
      
      'nlp-processor': {
        intent: { action: 'create-agent', confidence: 0.8 },
        entities: [{ type: 'task', value: 'automation' }],
        agentConfig: {
          name: 'Generated Agent',
          description: 'Agent created from description',
          category: 'automation',
          complexity: 'medium'
        }
      }
    };
    
    return fallbacks[agentType] || { message: 'Fallback response - Bedrock unavailable' };
  }

  calculateCost(usage, modelConfig) {
    const inputCost = (usage.input_tokens / 1000000) * modelConfig.costPer1MTokens.input;
    const outputCost = (usage.output_tokens / 1000000) * modelConfig.costPer1MTokens.output;
    return {
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: inputCost + outputCost,
      tokens_used: usage.input_tokens + usage.output_tokens
    };
  }

  async testConnection() {
    try {
      const response = await this.callBedrock('nlp-processor', 'Test connection', {});
      return {
        success: response.success,
        model: response.model,
        message: response.success ? 'Bedrock connection successful' : 'Bedrock connection failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Bedrock connection failed'
      };
    }
  }
}

module.exports = new BedrockService();