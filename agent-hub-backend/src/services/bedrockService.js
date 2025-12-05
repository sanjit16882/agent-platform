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
    // Allow custom model ID override for model comparison
    let modelConfig;
    if (context.model_id) {
      // Custom model ID provided - validate it's supported
      const modelId = context.model_id;
      
      // Only support Claude and Titan models for now
      if (modelId.includes('anthropic') || modelId.includes('claude')) {
        modelConfig = {
          modelId: modelId,
          maxTokens: 4000,
          temperature: 0.1,
          costPer1MTokens: { input: 3.00, output: 15.00 }
        };
      } else if (modelId.includes('titan')) {
        modelConfig = {
          modelId: modelId,
          maxTokens: 3000,
          temperature: 0.1,
          costPer1MTokens: { input: 0.80, output: 0.80 }
        };
      } else {
        // Unsupported model - fall back to Claude Haiku
        console.warn(`Unsupported model ${modelId}, falling back to Claude Haiku`);
        modelConfig = this.models['haiku'];
      }
    } else {
      // Use default model mapping
      modelConfig = this.models[this.agentModelMap[agentType]] || this.models['haiku'];
    }
    
    try {
      let requestBody;
      const promptText = this.buildPromptWithTestContext(agentType, prompt, context);
      
      if (modelConfig.modelId.includes('anthropic') || modelConfig.modelId.includes('claude')) {
        // Claude models (Anthropic)
        requestBody = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
          messages: [
            {
              role: "user",
              content: promptText
            }
          ]
        };
      } else if (modelConfig.modelId.includes('titan')) {
        // Titan models (Amazon)
        requestBody = {
          inputText: promptText,
          textGenerationConfig: {
            maxTokenCount: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
            topP: 0.9
          }
        };
      } else {
        // Should not reach here due to fallback above, but just in case
        console.error(`Unsupported model reached request building: ${modelConfig.modelId}`);
        throw new Error(`Model ${modelConfig.modelId} is not supported. Please use Claude or Titan models.`);
      }

      const response = await this.bedrock.invokeModel({
        modelId: modelConfig.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(JSON.stringify(requestBody))
      }).promise();

      const responseBody = JSON.parse(response.body.toString());
      
      let content;
      let usage = { input_tokens: 0, output_tokens: 0 };
      
      if (modelConfig.modelId.includes('anthropic') || modelConfig.modelId.includes('claude')) {
        // Claude models
        content = responseBody.content[0].text;
        usage = responseBody.usage || usage;
      } else if (modelConfig.modelId.includes('titan')) {
        // Titan models
        content = responseBody.results[0].outputText;
        usage = { 
          input_tokens: responseBody.inputTextTokenCount || 0, 
          output_tokens: responseBody.results[0].tokenCount || 0 
        };
      } else {
        // Should not reach here
        content = JSON.stringify(responseBody);
      }

      return {
        success: true,
        content: content,
        usage: usage,
        model: modelConfig.modelId,
        cost: this.calculateCost(usage, modelConfig)
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
    // Check for intent-specific prompts first
    const intent = context.intent || 'general';
    
    console.log(`📝 Building prompt - Agent Type: "${agentType}", Intent: "${intent}"`);
    
    // Intent-specific prompts for code-related agents
    if (agentType === 'code-quality' || agentType === 'general-qa') {
      if (intent === 'code_generation') {
        console.log(`✨ Using CODE GENERATION intent-aware prompt`);
        return `You are a code generation assistant. Your ONLY job is to write code.

Request:
${userPrompt}

CRITICAL RULES:
1. Write ONLY executable code - NO explanations, NO descriptions, NO analysis
2. Do NOT explain what the code does
3. Do NOT add text before or after the code
4. Do NOT use markdown code blocks (no \`\`\`)
5. Start directly with the code
6. Include only minimal inline comments if absolutely necessary
7. The first line of your response MUST be code

Example of CORRECT response:
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

Example of WRONG response:
"To calculate factorial, we can use recursion. Here's the code:
function factorial(n) { ... }
This function works by..."

NOW GENERATE THE CODE:`;
      }
      
      if (intent === 'code_explanation') {
        return `You are a code explanation assistant. Explain the code clearly and educationally.

Code to explain:
${userPrompt}

Instructions:
1. Break down the logic step-by-step
2. Explain complex concepts in simple terms
3. Highlight key patterns and techniques
4. Provide context about why certain approaches are used
5. Be clear and educational

Explain the code:`;
      }
      
      if (intent === 'bug_fixing') {
        return `You are a debugging assistant. Identify and fix bugs in the code.

Code with issue:
${userPrompt}

Instructions:
1. Identify the bug or error
2. Explain what's wrong and why
3. Provide the corrected code
4. Explain the fix

Debug and fix:`;
      }
      
      if (intent === 'optimization') {
        return `You are a code optimization assistant. Improve the performance and quality of the code.

Code to optimize:
${userPrompt}

Instructions:
1. Identify performance bottlenecks
2. Suggest optimizations
3. Provide optimized code
4. Explain the improvements

Optimize the code:`;
      }
    }
    
    // Default prompts by agent type
    const prompts = {
      'monitoring': `You are a performance monitoring and observability expert. Analyze system metrics and provide actionable insights.

Question:
${userPrompt}

Context: ${JSON.stringify(context)}

Your expertise includes:
- Interpreting CPU, memory, disk, and network metrics
- Identifying performance bottlenecks and anomalies
- Assessing system health and stability
- Recommending optimization strategies
- Detecting trends and patterns in metrics

Instructions:
1. ANALYZE the metrics, don't just repeat them
2. Provide CONTEXT for what the numbers mean (e.g., "75% CPU is approaching high utilization")
3. Identify CONCERNS or ISSUES if metrics are problematic
4. Compare metrics when relevant (e.g., "CPU is more concerning than memory")
5. Suggest ACTIONS if issues are detected
6. Use industry-standard thresholds (CPU >80% = high, >90% = critical)
7. Be concise but insightful (2-4 sentences)
8. Do NOT just quote the input back

Think like a monitoring expert:
- What do these metrics indicate?
- Are there any concerns?
- What should be done?

Answer:`,

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
}`,

      'general-qa': `You are an intelligent AI assistant with analytical capabilities. Provide thoughtful, reasoned answers based on the provided context.

Question:
${userPrompt}

Context: ${JSON.stringify(context)}

Instructions:
1. ANALYZE the data, don't just quote it back
2. Provide INSIGHTS and INTERPRETATION, not just facts
3. If asked about metrics, explain what they mean (e.g., "75% CPU is moderately high")
4. If asked to compare, provide analysis (e.g., "X is more concerning than Y because...")
5. If asked about health/status, give an assessment with reasoning
6. Use your knowledge to interpret the data meaningfully
7. Keep answers concise but insightful (2-4 sentences)
8. Do NOT just rearrange the input text
9. Do NOT return JSON unless specifically asked
10. If information is missing, say so clearly

Think step by step:
- What is being asked?
- What does the data tell us?
- What insights can I provide?
- What's the meaningful answer?

Answer:`
    };

    return prompts[agentType] || `Analyze this: ${userPrompt}`;
  }

  /**
   * Parse test metadata for prompt construction
   * @param {Object} testMetadata - Test metadata object
   * @returns {Object|null} Parsed metadata
   */
  parseTestMetadata(testMetadata) {
    if (!testMetadata) return null;
    
    return {
      testName: testMetadata.name,
      testCategory: testMetadata.category,
      testSubtype: testMetadata.subtype,
      expectedBehavior: testMetadata.expected_behavior,
      scoringRules: testMetadata.scoring_rules,
      inputFormat: testMetadata.input_format,
      outputFormat: testMetadata.output_format
    };
  }

  /**
   * Infer output format from test category and subtype
   * @param {string} category - Test category
   * @param {string} subtype - Test subtype
   * @param {Object} testMetadata - Full test metadata
   * @returns {string} Output format
   */
  inferOutputFormat(category, subtype, testMetadata) {
    // Explicit output_format in metadata takes precedence
    if (testMetadata?.output_format) {
      return testMetadata.output_format;
    }
    
    // Infer from category and subtype
    const formatKey = subtype ? `${category}_${subtype}` : category;
    
    const categoryFormatMap = {
      'Development_documentation': 'markdown',
      'Development_code-generation': 'code',
      'Development_code-review': 'analysis',
      'Development_bug-fixing': 'code',
      'Development_refactoring': 'code',
      'QE_test-case-creation': 'structured_text',
      'QE_defect-reporting': 'structured_text',
      'QE_test-automation': 'code',
      'Security_vulnerability': 'json',
      'Security_audit': 'json',
      'Security_threat-detection': 'json',
      'Security Testing_penetration-testing': 'structured_text',
      'DevOps_cicd': 'yaml',
      'DevOps_iac': 'code',
      'DevOps_container': 'code',
      'DevOps_monitoring': 'yaml',
      'SRE_monitoring': 'yaml',
      'SRE_capacity': 'structured_text',
      'Universal': 'plain_text'
    };
    
    return categoryFormatMap[formatKey] || 'plain_text';
  }

  /**
   * Get output format instructions for the AI model
   * @param {string} outputFormat - Desired output format
   * @returns {string} Format instructions
   */
  getOutputFormatInstructions(outputFormat) {
    const formatInstructions = {
      'markdown': `
OUTPUT FORMAT REQUIREMENTS:
⚠️ IMPORTANT: Respond ONLY with markdown formatted text.
⚠️ DO NOT generate executable code as the main response.
⚠️ DO NOT wrap entire response in code blocks.
- Use proper markdown syntax (headers, lists, code blocks for examples, etc.)
- If showing code examples, use markdown code blocks with language tags
- Start your response with a markdown header (#)
- Your response should be valid markdown that can be saved as a .md file
`,
      'code': `
OUTPUT FORMAT REQUIREMENTS:
⚠️ IMPORTANT: Respond ONLY with executable code.
⚠️ DO NOT include explanations or descriptions outside the code.
⚠️ DO NOT use markdown formatting.
⚠️ DO NOT add text before or after the code.
- Include only minimal inline comments if necessary
- The first line of your response MUST be code
- Your response should be valid code that can be executed directly
`,
      'json': `
OUTPUT FORMAT REQUIREMENTS:
⚠️ IMPORTANT: Respond ONLY with valid JSON.
⚠️ DO NOT include explanations before or after the JSON.
⚠️ DO NOT use markdown code blocks.
- Ensure the JSON is properly formatted and parseable
- Start your response with { or [
- Your response should be valid JSON that can be parsed directly
`,
      'analysis': `
OUTPUT FORMAT REQUIREMENTS:
- Provide detailed analysis and feedback
- Use clear structure with sections
- Include specific examples and recommendations
- Be thorough but concise
- Focus on actionable insights
`,
      'structured_text': `
OUTPUT FORMAT REQUIREMENTS:
- Use clear structure with headers and sections
- Include bullet points or numbered lists where appropriate
- Be specific and actionable
- Organize information logically
- Make it easy to scan and understand
`,
      'yaml': `
OUTPUT FORMAT REQUIREMENTS:
⚠️ IMPORTANT: Respond ONLY with valid YAML.
⚠️ DO NOT include explanations before or after the YAML.
⚠️ DO NOT use markdown code blocks.
- Ensure proper YAML indentation and syntax
- Your response should be valid YAML that can be parsed directly
`,
      'plain_text': `
OUTPUT FORMAT REQUIREMENTS:
- Respond with clear, well-structured text
- Use appropriate formatting for readability
- Be concise and direct
`
    };
    
    return formatInstructions[outputFormat] || formatInstructions['plain_text'];
  }

  /**
   * Extract scoring criteria from scoring rules
   * @param {Object|string} scoringRules - Scoring rules object or JSON string
   * @returns {string} Formatted scoring criteria
   */
  getScoringCriteria(scoringRules) {
    if (!scoringRules) return '';
    
    try {
      // Parse if it's a string
      const rules = typeof scoringRules === 'string' ? JSON.parse(scoringRules) : scoringRules;
      
      if (typeof rules !== 'object') return '';
      
      let criteria = '\nKEY EVALUATION CRITERIA:\n';
      criteria += 'Your response will be evaluated on:\n';
      
      Object.keys(rules).forEach(ruleName => {
        const rule = rules[ruleName];
        if (rule.criteria) {
          criteria += `- ${ruleName}: ${rule.criteria}\n`;
        }
      });
      
      return criteria + '\n';
    } catch (error) {
      console.warn('Failed to parse scoring rules:', error.message);
      return '';
    }
  }

  /**
   * Build test-specific instructions
   * @param {Object} parsedMetadata - Parsed test metadata
   * @param {string} outputFormat - Output format
   * @returns {string} Test instructions
   */
  buildTestInstructions(parsedMetadata, outputFormat) {
    let instructions = '\n--- TEST-SPECIFIC CONTEXT ---\n';
    
    // Add test context
    instructions += `Test: ${parsedMetadata.testName}\n`;
    instructions += `Category: ${parsedMetadata.testCategory}`;
    if (parsedMetadata.testSubtype) {
      instructions += ` / ${parsedMetadata.testSubtype}`;
    }
    instructions += '\n\n';
    
    // Add expected behavior
    if (parsedMetadata.expectedBehavior) {
      instructions += `Expected Behavior:\n${parsedMetadata.expectedBehavior}\n\n`;
    }
    
    // Add output format instructions
    instructions += this.getOutputFormatInstructions(outputFormat);
    
    // Add scoring criteria if available
    if (parsedMetadata.scoringRules) {
      instructions += this.getScoringCriteria(parsedMetadata.scoringRules);
    }
    
    return instructions;
  }

  /**
   * Build test-aware prompt by combining base prompt with test context
   * @param {string} agentType - Agent type
   * @param {string} userPrompt - User's prompt
   * @param {Object} context - Context object
   * @param {Object} parsedMetadata - Parsed test metadata
   * @returns {string} Complete test-aware prompt
   */
  buildTestAwarePrompt(agentType, userPrompt, context, parsedMetadata) {
    // Get base prompt from existing logic
    const basePrompt = this.buildPrompt(agentType, userPrompt, context);
    
    if (!parsedMetadata) {
      return basePrompt; // Backward compatible
    }
    
    // Determine output format
    const outputFormat = this.inferOutputFormat(
      parsedMetadata.testCategory,
      parsedMetadata.testSubtype,
      parsedMetadata
    );
    
    // Build test-specific instructions
    const testInstructions = this.buildTestInstructions(parsedMetadata, outputFormat);
    
    // Combine base prompt with test-specific instructions
    return `${basePrompt}

${testInstructions}`;
  }

  /**
   * Enhanced buildPrompt that checks for test metadata
   * This overrides the existing buildPrompt to add test-aware functionality
   */
  buildPromptWithTestContext(agentType, userPrompt, context) {
    // Check if test metadata is available
    if (context.test_metadata) {
      const parsedMetadata = this.parseTestMetadata(context.test_metadata);
      
      if (parsedMetadata) {
        console.log(`📝 Test-Aware Prompt Construction:`);
        console.log(`   Test: ${parsedMetadata.testName}`);
        console.log(`   Category: ${parsedMetadata.testCategory} / ${parsedMetadata.testSubtype || 'none'}`);
        
        const outputFormat = this.inferOutputFormat(
          parsedMetadata.testCategory,
          parsedMetadata.testSubtype,
          parsedMetadata
        );
        console.log(`   Output Format: ${outputFormat}`);
        
        const prompt = this.buildTestAwarePrompt(agentType, userPrompt, context, parsedMetadata);
        
        if (process.env.DEBUG_PROMPTS === 'true') {
          console.log(`   Full Prompt:\n${prompt}`);
        }
        
        return prompt;
      }
    }
    
    // Fall back to existing logic for non-test executions
    return this.buildPrompt(agentType, userPrompt, context);
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