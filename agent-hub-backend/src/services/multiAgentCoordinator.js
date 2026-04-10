/**
 * Multi-Agent Coordinator Service
 * Orchestrates collaboration between Code Analysis, Testing, Documentation, and Monitoring agents
 */

class MultiAgentCoordinator {
  constructor(bedrockService, s3AgentService) {
    this.bedrockService = bedrockService;
    this.s3AgentService = s3AgentService;
    this.workflows = new Map();
    
    // Load code analysis service
    const CodeAnalysisService = require('./codeAnalysisService');
    this.codeAnalysisService = new CodeAnalysisService(bedrockService);
    console.log('✅ Code Analysis Service loaded');
    
    // Load testing services
    try {
      const TestGenerationService = require('./testGenerationService');
      const TestExecutionEngine = require('./testExecutionEngine');
      const DDTFIntegrationService = require('./ddtfIntegrationService');
      const DeploymentReadinessService = require('./deploymentReadinessService');
      
      this.testGenerationService = new TestGenerationService(bedrockService);
      this.testExecutionEngine = new TestExecutionEngine(s3AgentService, null, bedrockService);
      this.ddtfIntegrationService = new DDTFIntegrationService(this.testExecutionEngine);
      this.deploymentReadinessService = new DeploymentReadinessService();
      
      console.log('✅ Testing services loaded (TestGeneration, DDTF, DeploymentReadiness)');
    } catch (error) {
      console.warn('⚠️ Testing services not available:', error.message);
      this.testGenerationService = null;
      this.ddtfIntegrationService = null;
      this.deploymentReadinessService = null;
    }
  }

  /**
   * Execute multi-agent workflow
   * @param {Object} task - Initial task
   * @param {string} task.type - Task type (e.g., 'code-review', 'feature-deployment')
   * @param {string} task.input - Task input (code, description, etc.)
   * @param {Array} task.agentSequence - Array of agent IDs in execution order
   * @returns {Object} Workflow result
   */
  async executeWorkflow(task) {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 Starting workflow ${workflowId}`);
    console.log(`📋 Task type: ${task.type}`);
    console.log(`🤖 Agent sequence: ${task.agentSequence.join(' → ')}`);

    const workflow = {
      id: workflowId,
      type: task.type,
      status: 'running',
      startTime: new Date().toISOString(),
      agents: task.agentSequence,
      results: [],
      currentStep: 0
    };

    this.workflows.set(workflowId, workflow);

    try {
      let context = {
        input: task.input,
        metadata: task.metadata || {}
      };

      // Execute agents sequentially
      for (let i = 0; i < task.agentSequence.length; i++) {
        const agentId = task.agentSequence[i];
        
        console.log(`\n🤖 Step ${i + 1}/${task.agentSequence.length}: Executing ${agentId}`);
        
        workflow.currentStep = i + 1;
        
        const agentResult = await this.executeAgent(agentId, context, workflow);
        
        workflow.results.push(agentResult);
        
        // Pass output to next agent as input
        context = {
          input: agentResult.output,
          previousResults: workflow.results,
          metadata: {
            ...context.metadata,
            [`${agentId}_completed`]: true
          }
        };

        console.log(`✅ ${agentId} completed`);
      }

      workflow.status = 'completed';
      workflow.endTime = new Date().toISOString();
      workflow.duration = new Date(workflow.endTime) - new Date(workflow.startTime);

      console.log(`\n✅ Workflow ${workflowId} completed in ${workflow.duration}ms`);

      return {
        success: true,
        workflowId,
        results: workflow.results,
        summary: this.generateSummary(workflow)
      };

    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.endTime = new Date().toISOString();

      console.error(`❌ Workflow ${workflowId} failed:`, error);

      return {
        success: false,
        workflowId,
        error: error.message,
        results: workflow.results
      };
    }
  }

  /**
   * Execute a single agent
   */
  async executeAgent(agentId, context, workflow) {
    const startTime = Date.now();

    try {
      // Get agent configuration
      let agent;
      try {
        agent = await this.s3AgentService.getAgentById(agentId);
        
        // S3 service returns null for 404, not an error
        if (!agent) {
          console.warn(`⚠️ Agent ${agentId} not found in S3, using default configuration`);
          agent = this.getDefaultAgent(agentId);
        }
      } catch (error) {
        console.warn(`⚠️ Error fetching agent ${agentId} from S3, using default configuration:`, error.message);
        agent = this.getDefaultAgent(agentId);
      }
      
      if (!agent) {
        throw new Error(`Agent ${agentId} not found and no default available`);
      }

      // Determine service type based on capabilities or name
      const serviceType = this.determineServiceType(agent);
      console.log(`🔍 Agent "${agent.name}" → Service Type: ${serviceType}`);

      // Route to appropriate service
      switch (serviceType) {
        case 'code-analysis':
          console.log(`🔍 Using Code Analysis Service`);
          return await this.executeCodeAnalysisAgent(agent, context, workflow, startTime);
        
        case 'testing':
          if (this.testGenerationService && this.ddtfIntegrationService) {
            console.log(`🧪 Using Enhanced Testing Service (TestGen + DDTF + Deployment)`);
            return await this.executeTestingAgent(agent, context, workflow, startTime);
          }
          break;
        
        case 'documentation':
          console.log(`📚 Using Documentation Service`);
          return await this.executeDocumentationAgent(agent, context, workflow, startTime);
        
        case 'monitoring':
          console.log(`📊 Using Monitoring Service`);
          return await this.executeMonitoringAgent(agent, context, workflow, startTime);
        
        default:
          console.log(`🤖 Using Generic Agent Execution`);
          break;
      }

      // Regular agent execution via Bedrock
      const prompt = this.prepareAgentPrompt(agent, context, workflow);

      const response = await this.bedrockService.callBedrock(
        agent.category || 'general-qa',
        prompt,
        {
          model_id: agent.model || 'anthropic.claude-3-sonnet-20240229-v1:0',
          ...context.metadata
        }
      );

      const duration = Date.now() - startTime;

      if (!response.success) {
        throw new Error(response.error || 'Bedrock call failed');
      }

      return {
        agentId,
        agentName: agent.name,
        status: 'success',
        output: response.content,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        agentId,
        status: 'failed',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Determine service type based on capabilities or name (flexible routing)
   */
  determineServiceType(agent) {
    // Priority 1: Explicit serviceType in agent metadata
    if (agent.serviceType) {
      console.log(`  → Using explicit serviceType: ${agent.serviceType}`);
      return agent.serviceType;
    }
    
    // Priority 2: Capabilities array
    if (agent.capabilities && Array.isArray(agent.capabilities)) {
      console.log(`  → Checking capabilities: ${agent.capabilities.join(', ')}`);
      
      if (agent.capabilities.includes('code-analysis') || 
          agent.capabilities.includes('security-scan') ||
          agent.capabilities.includes('code-review')) {
        return 'code-analysis';
      }
      
      if (agent.capabilities.includes('test-generation') || 
          agent.capabilities.includes('test-execution') ||
          agent.capabilities.includes('ddtf-testing')) {
        return 'testing';
      }
      
      if (agent.capabilities.includes('documentation') || 
          agent.capabilities.includes('report-generation')) {
        return 'documentation';
      }
      
      if (agent.capabilities.includes('monitoring-setup') || 
          agent.capabilities.includes('alert-creation')) {
        return 'monitoring';
      }
    }
    
    // Priority 3: Fallback to name-based detection (backward compatibility)
    console.log(`  → Using name-based detection (fallback)`);
    return this.detectServiceTypeByName(agent);
  }

  /**
   * Detect service type by name (fallback for backward compatibility)
   */
  detectServiceTypeByName(agent) {
    const name = agent.name?.toLowerCase() || '';
    const category = agent.category?.toLowerCase() || '';
    const instructions = agent.instructions?.toLowerCase() || '';
    
    // Code Analysis
    if (name.includes('code analysis') || 
        name.includes('code review') ||
        name.includes('quality check') ||
        category.includes('code-analysis') ||
        category.includes('code-review') ||
        instructions.includes('analyze code') ||
        instructions.includes('code quality')) {
      return 'code-analysis';
    }
    
    // Testing
    if (name.includes('test') || 
        name.includes('qa') ||
        category.includes('test') ||
        category === 'qe' ||
        instructions.includes('test case') ||
        instructions.includes('quality assurance')) {
      return 'testing';
    }
    
    // Documentation
    if (name.includes('document') || 
        name.includes('doc') ||
        category.includes('document') ||
        category === 'documentation') {
      return 'documentation';
    }
    
    // Monitoring
    if (name.includes('monitor') || 
        name.includes('observability') ||
        category.includes('monitor') ||
        category === 'monitoring') {
      return 'monitoring';
    }
    
    // Default: generic agent
    return 'generic';
  }

  /**
   * Check if agent is a Testing Agent (DEPRECATED - use determineServiceType)
   * Kept for backward compatibility
   */
  isTestingAgent(agent) {
    const name = agent.name?.toLowerCase() || '';
    const category = agent.category?.toLowerCase() || '';
    const instructions = agent.instructions?.toLowerCase() || '';
    
    return name.includes('test') || 
           name.includes('qa') ||
           category.includes('test') ||
           category === 'qe' ||
           instructions.includes('test case') ||
           instructions.includes('quality assurance');
  }

  /**
   * Execute Testing Agent using DDATF framework
   */
  
async executeTestingAgent(agent, context, workflow, startTime) {
  console.log(`🧪 Executing Testing Agent with enhanced services`);
  
  try {
    // Step 1: Extract code and code analysis context
    const code = this.extractCode(context);
    if (!code) {
      throw new Error('No code found to test');
    }
    console.log(`📝 Code to test: ${code.substring(0, 100)}...`);

    // Step 2: Get code analysis from previous agent results
    const codeAnalysis = this.extractCodeAnalysis(context);
    if (!codeAnalysis) {
      console.warn('⚠️ No code analysis found, using basic analysis');
    }

    // Step 3: Generate context-aware test cases
    console.log('🧪 Generating context-aware test cases...');
    const generatedTests = await this.testGenerationService.generateTestCases(
      code,
      codeAnalysis || { inputAnalysis: { complexity: 'medium', language: 'javascript' }, issues: [] },
      { language: codeAnalysis?.inputAnalysis?.language || 'javascript' }
    );

    // Step 4: Generate issue-driven tests
    console.log('🔍 Generating issue-driven tests...');
    const issueTests = codeAnalysis && codeAnalysis.issues 
      ? await this.testGenerationService.generateIssueTests(
          codeAnalysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high'),
          code
        )
      : [];

    // Combine all tests
    const allTests = [...generatedTests, ...issueTests];
    console.log(`✅ Generated ${allTests.length} total tests (${generatedTests.length} context-aware + ${issueTests.length} issue-driven)`);

    // Step 5: Execute DDTF tests
    console.log('🧪 Executing DDTF tests...');
    const ddtfResults = await this.ddtfIntegrationService.executeDDTF(
      agent.id,
      agent,
      allTests,
      { dimensions: ['Functional', 'Security', 'Conversational'] }
    );

    // Step 6: Assess deployment readiness
    console.log('🔍 Assessing deployment readiness...');
    const deploymentReadiness = this.deploymentReadinessService.assess(
      codeAnalysis || {},
      ddtfResults
    );

    // Step 7: Estimate coverage
    const coverage = this.estimateCoverage(allTests, code, codeAnalysis);

    const duration = Date.now() - startTime;

    // Step 8: Format structured output
    const textSummary = this.formatEnhancedTestResults(
      generatedTests,
      issueTests,
      ddtfResults,
      deploymentReadiness,
      coverage,
      context
    );

    return {
      agentId: agent.id,
      agentName: agent.name,
      status: 'success',
      output: {
        // Structured data for UI
        generatedTests: allTests.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          code: t.code,
          relatedIssue: t.relatedIssue,
          priority: t.priority
        })),
        ddtfResults: {
          overallScore: ddtfResults.overallScore,
          grade: ddtfResults.grade,
          totalTests: ddtfResults.totalTests,
          passed: ddtfResults.passed,
          failed: ddtfResults.failed,
          passRate: ddtfResults.passRate,
          dimensions: ddtfResults.dimensions,
          failedTests: ddtfResults.failedTests,
          executionMetadata: ddtfResults.executionMetadata
        },
        deploymentReadiness: {
          status: deploymentReadiness.status,
          passRate: deploymentReadiness.passRate,
          criticalIssues: deploymentReadiness.criticalIssues,
          highIssues: deploymentReadiness.highIssues,
          recommendations: deploymentReadiness.recommendations,
          blockers: deploymentReadiness.blockers,
          summary: deploymentReadiness.summary
        },
        coverage: coverage,
        // Text summary for backward compatibility
        textSummary: textSummary
      },
      duration,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Testing Agent execution failed:`, error);

    return {
      agentId: agent.id,
      agentName: agent.name,
      status: 'failed',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    };
  }
}

  /**
   * Extract code from context
   */
  extractCode(context) {
    // Check original input first
    if (context.input && this.looksLikeCode(context.input)) {
      return context.input;
    }

    // Check previous agent outputs
    const previousResults = context.previousResults || [];
    for (const result of previousResults) {
      if (result.output && this.looksLikeCode(result.output)) {
        return result.output;
      }
    }

    // Return original input as fallback
    return context.input;
  }

  /**
   * Check if text looks like code
   */
  looksLikeCode(text) {
    if (!text) return false;
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /class\s+\w+/,
      /def\s+\w+\s*\(/,
      /public\s+\w+/,
      /\{[\s\S]*\}/
    ];
    return codePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Generate test cases using AI
   */
  async generateTestCases(agent, code, context) {
    console.log(`🤖 Generating test cases with AI...`);
    
    const prompt = `Analyze this code and generate test cases:

${code}

Generate 3-5 test cases covering:
1. Happy path scenarios
2. Edge cases
3. Error conditions

Return ONLY a JSON array of test cases in this format:
[
  {
    "name": "Test name",
    "input": "test input",
    "expected": "expected behavior",
    "category": "functional"
  }
]`;

    const response = await this.bedrockService.callBedrock(
      'test-generator',
      prompt,
      { model_id: agent.model }
    );

    if (!response.success) {
      throw new Error('Failed to generate test cases');
    }

    // Parse JSON from response
    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse test cases, using defaults');
    }

    // Fallback test cases
    return [
      {
        name: 'Basic functionality test',
        input: code,
        expected: 'Code executes without errors',
        category: 'functional'
      }
    ];
  }

  /**
   * Run tests using DDATF framework
   */
  async runTests(agentId, testCases, code) {
    console.log(`🧪 Running ${testCases.length} tests...`);
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        // Create a test object compatible with DDATF
        const test = {
          id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: testCase.name,
          category: testCase.category || 'functional',
          input_content: testCase.input || code,
          expected_behavior: testCase.expected,
          input_format: 'plain_text',
          scoring_rules: {
            correctness: { weight: 0.6, criteria: 'Code works as expected' },
            completeness: { weight: 0.4, criteria: 'All requirements met' }
          }
        };

        // Execute test
        const result = await this.testExecutionService.executeTest(agentId, test, {
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0' // Use fast model for testing
        });

        results.push(result);
      } catch (error) {
        console.error(`Test failed: ${testCase.name}`, error);
        results.push({
          test_name: testCase.name,
          passed: false,
          score: 0,
          explanation: error.message
        });
      }
    }

    return results;
  }

  /**
   * Format test results for output
   */
  formatTestResults(testResults, context) {
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.length - passed;
    const avgScore = testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length;

    let output = `# Testing Agent Results\n\n`;
    output += `## Summary\n`;
    output += `- Total Tests: ${testResults.length}\n`;
    output += `- Passed: ${passed} ✅\n`;
    output += `- Failed: ${failed} ❌\n`;
    output += `- Average Score: ${avgScore.toFixed(1)}/100\n\n`;

    output += `## Test Details\n\n`;
    testResults.forEach((result, i) => {
      const icon = result.passed ? '✅' : '❌';
      output += `### ${icon} Test ${i + 1}: ${result.test_name}\n`;
      output += `- Score: ${result.score}/100\n`;
      output += `- Result: ${result.explanation}\n`;
      output += `- Duration: ${result.duration}ms\n\n`;
    });

    // Add context from previous agents
    const previousResults = context.previousResults || [];
    if (previousResults.length > 0) {
      output += `## Context from Previous Agents\n\n`;
      previousResults.forEach((r, i) => {
        output += `**${r.agentName}**: ${r.output.substring(0, 200)}...\n\n`;
      });
    }

    return output;
  }

  /**
   * Prepare agent-specific prompt
   */
  prepareAgentPrompt(agent, context, workflow) {
    const previousResults = context.previousResults || [];
    const isFirstAgent = previousResults.length === 0;
    
    let collaborationContext = '';
    if (!isFirstAgent) {
      collaborationContext = `\n\n=== PREVIOUS AGENT OUTPUTS (BUILD UPON THESE) ===\n`;
      previousResults.forEach((r, i) => {
        collaborationContext += `\nAgent ${i + 1}: ${r.agentName}\n`;
        collaborationContext += `Output: ${r.output}\n`;
        collaborationContext += `---\n`;
      });
      collaborationContext += `\n=== YOUR TASK ===\n`;
      collaborationContext += `Review the above outputs and provide YOUR specialized analysis as a ${agent.name}.\n`;
      collaborationContext += `Build upon what previous agents found. Add NEW insights specific to your role.\n`;
    }

    const baseInstructions = agent.instructions || `You are a ${agent.name} agent specialized in ${agent.category}.`;

    return `${baseInstructions}

=== WORKFLOW TASK ===
Task Type: ${workflow.type}

=== ORIGINAL INPUT ===
${context.input}
${collaborationContext}

=== INSTRUCTIONS ===
${isFirstAgent 
  ? 'You are the FIRST agent in this workflow. Analyze the input thoroughly and provide detailed insights.'
  : 'You are agent #' + (previousResults.length + 1) + ' in a multi-agent workflow. Review previous outputs and add YOUR unique perspective.'
}

Provide a clear, structured analysis focusing on your area of expertise.`;
  }

  /**
   * Generate workflow summary
   */
  generateSummary(workflow) {
    const totalDuration = workflow.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const successCount = workflow.results.filter(r => r.status === 'success').length;

    return {
      workflowId: workflow.id,
      type: workflow.type,
      status: workflow.status,
      totalAgents: workflow.agents.length,
      successfulAgents: successCount,
      failedAgents: workflow.agents.length - successCount,
      totalDuration: `${totalDuration}ms`,
      startTime: workflow.startTime,
      endTime: workflow.endTime,
      agentSequence: workflow.agents
    };
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * List all workflows
   */
  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Check if agent is a Code Analysis Agent
   */
  isCodeAnalysisAgent(agent) {
    const name = agent.name?.toLowerCase() || '';
    const category = agent.category?.toLowerCase() || '';
    const instructions = agent.instructions?.toLowerCase() || '';
    
    return name.includes('code analysis') || 
           name.includes('code review') ||
           category.includes('code-analysis') ||
           category.includes('code-review') ||
           instructions.includes('analyze code') ||
           instructions.includes('code quality');
  }

  /**
   * Check if agent is a Documentation Agent
   */
  isDocumentationAgent(agent) {
    const name = agent.name?.toLowerCase() || '';
    const category = agent.category?.toLowerCase() || '';
    
    return name.includes('document') || 
           name.includes('doc') ||
           category.includes('document') ||
           category === 'documentation';
  }

  /**
   * Execute Code Analysis Agent
   */
  async executeCodeAnalysisAgent(agent, context, workflow, startTime) {
    console.log(`🔍 Executing Code Analysis Agent`);
    
    try {
      const code = context.input;
      
      if (!code || !this.looksLikeCode(code)) {
        throw new Error('No valid code found to analyze');
      }

      console.log(`📝 Analyzing code (${code.length} characters)...`);

      // Use Code Analysis Service
      const analysis = await this.codeAnalysisService.analyzeCode(code);
      
      const duration = Date.now() - startTime;

      // Format output
      const output = this.formatCodeAnalysisOutput(analysis);

      return {
        agentId: agent.id,
        agentName: agent.name,
        status: 'success',
        output,
        analysis, // Include structured analysis for next agents
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Code Analysis Agent execution failed:`, error);

      return {
        agentId: agent.id,
        agentName: agent.name,
        status: 'failed',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Format code analysis output for display
   */
  formatCodeAnalysisOutput(analysis) {
    let output = `# Code Analysis Results\n\n`;
    
    // Input Analysis
    output += `## Input Analysis\n`;
    output += `- **Type:** ${analysis.inputAnalysis.type}\n`;
    output += `- **Language:** ${analysis.inputAnalysis.language}\n`;
    output += `- **Complexity:** ${analysis.inputAnalysis.complexity}\n`;
    output += `- **Lines of Code:** ${analysis.inputAnalysis.linesOfCode}\n`;
    output += `- **Functions:** ${analysis.inputAnalysis.functions}\n`;
    output += `- **Classes:** ${analysis.inputAnalysis.classes}\n`;
    output += `- **Cyclomatic Complexity:** ${analysis.inputAnalysis.cyclomaticComplexity}\n\n`;
    
    // Quality Score
    output += `## Quality Score: ${analysis.qualityScore}/100 (Grade: ${analysis.grade})\n\n`;
    
    // Metrics
    output += `## Metrics\n`;
    output += `- **Maintainability Index:** ${analysis.metrics.maintainabilityIndex}\n`;
    output += `- **Comment Ratio:** ${(analysis.metrics.commentRatio * 100).toFixed(1)}%\n\n`;
    
    // Issues
    if (analysis.issues.length > 0) {
      output += `## Issues Found (${analysis.issues.length})\n\n`;
      
      const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
      const highIssues = analysis.issues.filter(i => i.severity === 'high');
      const mediumIssues = analysis.issues.filter(i => i.severity === 'medium');
      const lowIssues = analysis.issues.filter(i => i.severity === 'low');
      
      if (criticalIssues.length > 0) {
        output += `### 🔴 Critical Issues (${criticalIssues.length})\n`;
        criticalIssues.forEach(issue => {
          output += `\n**${issue.title}**\n`;
          output += `- Location: ${issue.location}\n`;
          output += `- Impact: ${issue.impact}\n`;
          output += `- Suggested Fix:\n\`\`\`javascript\n${issue.suggestedFix}\n\`\`\`\n`;
        });
      }
      
      if (highIssues.length > 0) {
        output += `\n### ⚠️ High Priority Issues (${highIssues.length})\n`;
        highIssues.forEach(issue => {
          output += `\n**${issue.title}**\n`;
          output += `- Location: ${issue.location}\n`;
          output += `- Impact: ${issue.impact}\n`;
        });
      }
      
      if (mediumIssues.length > 0) {
        output += `\n### ℹ️ Medium Priority Issues (${mediumIssues.length})\n`;
        mediumIssues.forEach(issue => {
          output += `- ${issue.title} (${issue.location})\n`;
        });
      }
      
      if (lowIssues.length > 0) {
        output += `\n### 💡 Low Priority Issues (${lowIssues.length})\n`;
        lowIssues.forEach(issue => {
          output += `- ${issue.title}\n`;
        });
      }
    } else {
      output += `## ✅ No Issues Found\n\n`;
    }
    
    // Security
    if (analysis.security.vulnerabilities.length > 0) {
      output += `\n## 🔒 Security Issues (${analysis.security.vulnerabilities.length})\n`;
      analysis.security.vulnerabilities.forEach(vuln => {
        output += `\n**${vuln.type}** (${vuln.severity})\n`;
        output += `- ${vuln.description}\n`;
        output += `- Location: ${vuln.location}\n`;
      });
    } else {
      output += `\n## 🔒 Security: No vulnerabilities detected\n`;
    }
    
    // Recommendations
    output += `\n## 📋 Recommendations\n`;
    analysis.recommendations.forEach((rec, i) => {
      output += `${i + 1}. ${rec}\n`;
    });
    
    return output;
  }

  /**
   * Execute Documentation Agent
   */
  async executeDocumentationAgent(agent, context, workflow, startTime) {
    console.log(`📚 Executing Documentation Agent`);
    
    try {
      const code = context.input;
      const previousResults = context.previousResults || [];
      
      // Find Code Analysis and Testing results
      const codeAnalysisResult = previousResults.find(r => 
        r.agentName && r.agentName.toLowerCase().includes('code analysis')
      );
      const testingResult = previousResults.find(r => 
        r.agentName && r.agentName.toLowerCase().includes('test')
      );
      
      // Generate comprehensive documentation
      const documents = [];
      
      // Executive Summary
      const executiveSummary = await this.generateExecutiveSummary(
        code, 
        codeAnalysisResult, 
        testingResult
      );
      documents.push(executiveSummary);
      
      // Analysis Report
      if (codeAnalysisResult && codeAnalysisResult.analysis) {
        const analysisReport = this.generateAnalysisReport(codeAnalysisResult.analysis);
        documents.push(analysisReport);
      }
      
      // Test Report
      if (testingResult && testingResult.testResults) {
        const testReport = this.generateTestReport(testingResult.testResults);
        documents.push(testReport);
      }
      
      const duration = Date.now() - startTime;
      
      // Format output
      let output = `# Documentation Generated\n\n`;
      output += `Generated ${documents.length} comprehensive documents:\n\n`;
      documents.forEach(doc => {
        output += `## ${doc.name}\n`;
        output += `- Lines: ${doc.lineCount}\n`;
        output += `- Size: ${doc.size} bytes\n\n`;
        output += `### Preview:\n${doc.preview}\n\n`;
        output += `---\n\n`;
      });
      
      return {
        agentId: agent.id,
        agentName: agent.name,
        status: 'success',
        output,
        documents, // Include full documents
        duration,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Documentation Agent execution failed:`, error);

      return {
        agentId: agent.id,
        agentName: agent.name,
        status: 'failed',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(code, codeAnalysisResult, testingResult) {
    let content = `# Executive Summary\n\n`;
    content += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
    
    // Code Analysis Summary
    if (codeAnalysisResult && codeAnalysisResult.analysis) {
      const analysis = codeAnalysisResult.analysis;
      content += `## Code Quality: ${analysis.qualityScore}/100 (Grade: ${analysis.grade})\n`;
      content += `- Issues Found: ${analysis.issues.length}\n`;
      content += `- Critical Issues: ${analysis.issues.filter(i => i.severity === 'critical').length}\n`;
      content += `- Complexity: ${analysis.inputAnalysis.complexity}\n\n`;
    }
    
    // Testing Summary
    if (testingResult && testingResult.testResults) {
      const results = testingResult.testResults;
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      content += `## Testing Results: ${passed}/${total} passed (${(passed/total*100).toFixed(1)}%)\n`;
      content += `- Tests Generated: ${total}\n`;
      content += `- Tests Passed: ${passed}\n`;
      content += `- Tests Failed: ${total - passed}\n\n`;
    }
    
    // Overall Status
    const isReady = this.assessDeploymentReadiness(codeAnalysisResult, testingResult);
    content += `## Deployment Readiness: ${isReady ? '✅ READY' : '❌ NOT READY'}\n\n`;
    
    // Recommendations
    content += `## Top Recommendations\n`;
    if (codeAnalysisResult && codeAnalysisResult.analysis) {
      codeAnalysisResult.analysis.recommendations.slice(0, 3).forEach((rec, i) => {
        content += `${i + 1}. ${rec}\n`;
      });
    }
    
    return {
      name: 'EXECUTIVE_SUMMARY.md',
      content,
      lineCount: content.split('\n').length,
      size: content.length,
      preview: content.substring(0, 300) + '...'
    };
  }

  /**
   * Generate analysis report
   */
  generateAnalysisReport(analysis) {
    let content = `# Detailed Code Analysis Report\n\n`;
    content += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
    
    // Metrics
    content += `## Code Quality Metrics\n`;
    content += `- Overall Score: ${analysis.qualityScore}/100\n`;
    content += `- Maintainability Index: ${analysis.metrics.maintainabilityIndex}\n`;
    content += `- Cyclomatic Complexity: ${analysis.inputAnalysis.cyclomaticComplexity}\n\n`;
    
    // Issues
    content += `## Issues Found (${analysis.issues.length})\n\n`;
    analysis.issues.forEach(issue => {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '⚠️' : 'ℹ️';
      content += `### ${icon} ${issue.severity.toUpperCase()}: ${issue.title}\n`;
      content += `**Location:** ${issue.location}\n`;
      content += `**Issue:** ${issue.description}\n`;
      content += `**Impact:** ${issue.impact}\n`;
      content += `**Suggested Fix:**\n\`\`\`javascript\n${issue.suggestedFix}\n\`\`\`\n\n`;
    });
    
    return {
      name: 'ANALYSIS_REPORT.md',
      content,
      lineCount: content.split('\n').length,
      size: content.length,
      preview: content.substring(0, 300) + '...'
    };
  }

  /**
   * Generate test report
   */
  generateTestReport(testResults) {
    let content = `# Comprehensive Testing Report\n\n`;
    
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    
    content += `## Test Execution Summary\n`;
    content += `- Total Tests: ${total}\n`;
    content += `- Passed: ${passed} (${(passed/total*100).toFixed(1)}%)\n`;
    content += `- Failed: ${total - passed}\n\n`;
    
    content += `## Test Details\n\n`;
    testResults.forEach((result, i) => {
      const icon = result.passed ? '✅' : '❌';
      content += `### ${icon} Test ${i + 1}: ${result.test_name}\n`;
      content += `- Score: ${result.score}/100\n`;
      content += `- Result: ${result.explanation}\n`;
      content += `- Duration: ${result.duration}ms\n\n`;
    });
    
    return {
      name: 'TEST_REPORT.md',
      content,
      lineCount: content.split('\n').length,
      size: content.length,
      preview: content.substring(0, 300) + '...'
    };
  }

  /**
   * Extract code analysis from previous agent results
   */
  extractCodeAnalysis(context) {
    const previousResults = context.previousResults || [];
    
    // Look for Code Analysis Agent result
    for (const result of previousResults) {
      if (result.agentName && result.agentName.toLowerCase().includes('code analysis')) {
        // Check if output has structured analysis
        if (result.output && typeof result.output === 'object' && result.output.inputAnalysis) {
          return result.output;
        }
      }
    }
    
    return null;
  }

  /**
   * Estimate test coverage
   */
  estimateCoverage(tests, code, codeAnalysis) {
    const lines = code.split('\n').length;
    const functions = codeAnalysis?.inputAnalysis?.functions || 1;
    
    // Rough estimation based on test count
    const testCount = tests.length;
    const estimatedLineCoverage = Math.min(95, 40 + (testCount * 5));
    const estimatedBranchCoverage = Math.min(90, 30 + (testCount * 4));
    const estimatedFunctionCoverage = Math.min(100, (testCount / functions) * 100);
    
    return {
      estimated: true,
      lines: Math.round(estimatedLineCoverage),
      branches: Math.round(estimatedBranchCoverage),
      functions: Math.round(estimatedFunctionCoverage),
      uncoveredPaths: this.identifyUncoveredPaths(tests, codeAnalysis)
    };
  }

  /**
   * Identify uncovered code paths
   */
  identifyUncoveredPaths(tests, codeAnalysis) {
    const uncovered = [];
    
    if (!codeAnalysis || !codeAnalysis.inputAnalysis) {
      return uncovered;
    }
    
    // Check for missing error handling tests
    if (!codeAnalysis.inputAnalysis.hasErrorHandling) {
      const hasErrorTest = tests.some(t => t.category === 'error-handling');
      if (!hasErrorTest) {
        uncovered.push('Error handling paths not covered');
      }
    }
    
    // Check for missing validation tests
    if (!codeAnalysis.inputAnalysis.hasValidation) {
      const hasValidationTest = tests.some(t => t.category === 'validation');
      if (!hasValidationTest) {
        uncovered.push('Input validation paths not covered');
      }
    }
    
    // Check for missing async tests
    if (codeAnalysis.inputAnalysis.hasAsync) {
      const hasAsyncTest = tests.some(t => t.code && t.code.includes('async'));
      if (!hasAsyncTest) {
        uncovered.push('Async operation paths not fully covered');
      }
    }
    
    return uncovered;
  }

  /**
   * Format enhanced test results (text summary for backward compatibility)
   */
  formatEnhancedTestResults(generatedTests, issueTests, ddtfResults, deploymentReadiness, coverage, context) {
    let output = `# 🧪 Testing Agent Results\n\n`;
    
    // Deployment Status
    output += `## 🚀 Deployment Readiness: ${deploymentReadiness.status}\n\n`;
    output += `${deploymentReadiness.summary}\n\n`;
    
    // DDTF Summary
    output += `## 📊 DDTF Test Results\n\n`;
    output += `- **Overall Score**: ${ddtfResults.overallScore}/100 (Grade: ${ddtfResults.grade})\n`;
    output += `- **Tests**: ${ddtfResults.passed}/${ddtfResults.totalTests} passed (${ddtfResults.passRate}%)\n`;
    output += `- **Status**: ${ddtfResults.failed === 0 ? '✅ All tests passed' : `⚠️ ${ddtfResults.failed} test(s) failed`}\n\n`;
    
    // Dimension Breakdown
    output += `### Dimension Breakdown\n\n`;
    ddtfResults.dimensions.forEach(dim => {
      const icon = dim.score >= 90 ? '✅' : dim.score >= 70 ? '⚠️' : '❌';
      output += `${icon} **${dim.name}**: ${dim.score}/100 (${dim.passed}/${dim.total} passed)\n`;
    });
    output += `\n`;
    
    // Generated Tests
    output += `## 🧪 Generated Test Cases\n\n`;
    output += `- **Context-Aware Tests**: ${generatedTests.length}\n`;
    output += `- **Issue-Driven Tests**: ${issueTests.length}\n`;
    output += `- **Total**: ${generatedTests.length + issueTests.length}\n\n`;
    
    // Coverage
    output += `## 📈 Estimated Coverage\n\n`;
    output += `- **Lines**: ${coverage.lines}%\n`;
    output += `- **Branches**: ${coverage.branches}%\n`;
    output += `- **Functions**: ${coverage.functions}%\n`;
    if (coverage.uncoveredPaths.length > 0) {
      output += `\n**Uncovered Paths**:\n`;
      coverage.uncoveredPaths.forEach(path => {
        output += `- ${path}\n`;
      });
    }
    output += `\n`;
    
    // Failed Tests
    if (ddtfResults.failedTests.length > 0) {
      output += `## ❌ Failed Tests (${ddtfResults.failedTests.length})\n\n`;
      ddtfResults.failedTests.forEach((test, i) => {
        output += `### ${i + 1}. ${test.name}\n`;
        output += `- **Dimension**: ${test.dimension}\n`;
        output += `- **Severity**: ${test.severity}\n`;
        output += `- **Expected**: ${test.expected}\n`;
        output += `- **Actual**: ${test.actual.substring(0, 100)}...\n`;
        output += `- **Recommendation**: ${test.recommendation}\n\n`;
      });
    }
    
    // Recommendations
    output += `## 💡 Recommendations\n\n`;
    deploymentReadiness.recommendations.forEach(rec => {
      output += `- ${rec}\n`;
    });
    output += `\n`;
    
    // Blockers
    if (deploymentReadiness.blockers.length > 0) {
      output += `## 🚫 Deployment Blockers\n\n`;
      deploymentReadiness.blockers.forEach(blocker => {
        output += `### ${blocker.title}\n`;
        output += `- **Type**: ${blocker.type}\n`;
        output += `- **Severity**: ${blocker.severity}\n`;
        output += `- **Description**: ${blocker.description}\n`;
        output += `- **Fix**: \`${blocker.fix}\`\n\n`;
      });
    }
    
    return output;
  }

  /**
   * Assess deployment readiness
   */
  assessDeploymentReadiness(codeAnalysisResult, testingResult) {
    let ready = true;
    
    // Check code analysis
    if (codeAnalysisResult && codeAnalysisResult.analysis) {
      const criticalIssues = codeAnalysisResult.analysis.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        ready = false;
      }
      if (codeAnalysisResult.analysis.qualityScore < 60) {
        ready = false;
      }
    }
    
    // Check testing
    if (testingResult && testingResult.testResults) {
      const passed = testingResult.testResults.filter(r => r.passed).length;
      const total = testingResult.testResults.length;
      if (passed / total < 0.8) { // Less than 80% pass rate
        ready = false;
      }
    }
    
    return ready;
  }

  /**
   * Execute Monitoring Agent
   */
  async executeMonitoringAgent(agent, context, workflow, startTime) {
    console.log(`📊 Executing Monitoring Agent`);
    
    try {
      const previousResults = context.previousResults || [];
      console.log(`📊 Previous results count: ${previousResults.length}`);
      
      // Extract relevant data from previous agents
      const codeAnalysisResult = previousResults.find(r => 
        r.agentName && r.agentName.toLowerCase().includes('code analysis')
      );
      const testingResult = previousResults.find(r => 
        r.agentName && r.agentName.toLowerCase().includes('test')
      );
      const deploymentReadiness = testingResult?.output?.deploymentReadiness;
      
      console.log(`📊 Found code analysis: ${!!codeAnalysisResult}`);
      console.log(`📊 Found testing result: ${!!testingResult}`);
      
      // Generate monitoring configuration
      console.log(`📊 Generating metrics...`);
      const metrics = this.generateMetrics(codeAnalysisResult, testingResult);
      console.log(`📊 Generated ${metrics.length} metrics`);
      
      console.log(`📊 Generating alerts...`);
      const alerts = this.generateAlerts(codeAnalysisResult, testingResult);
      console.log(`📊 Generated ${alerts.length} alerts`);
      
      console.log(`📊 Generating dashboards...`);
      const dashboards = this.generateDashboards(codeAnalysisResult, testingResult);
      console.log(`📊 Generated ${dashboards.length} dashboards`);
      
      console.log(`📊 Generating logging config...`);
      const logging = this.generateLoggingConfig(codeAnalysisResult);
      console.log(`📊 Generated logging config`);
      
      const monitoringConfig = {
        metrics,
        alerts,
        dashboards,
        logging
      };
      
      const duration = Date.now() - startTime;
      
      // Format output
      console.log(`📊 Formatting output...`);
      const output = this.formatMonitoringOutput(monitoringConfig, deploymentReadiness);
      console.log(`📊 Output length: ${output.length} characters`);
      
      const result = {
        agentId: agent.id,
        agentName: agent.name,
        status: 'success',
        output,
        monitoringConfig, // Include structured config
        duration,
        timestamp: new Date().toISOString()
      };
      
      console.log(`📊 Monitoring agent result:`, JSON.stringify(result, null, 2).substring(0, 500));
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Monitoring Agent execution failed:`, error);
      console.error(`❌ Error stack:`, error.stack);

      return {
        agentId: agent.id,
        agentName: agent.name,
        status: 'failed',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate metrics configuration
   */
  generateMetrics(codeAnalysisResult, testingResult) {
    const metrics = [
      {
        name: 'response_time',
        type: 'histogram',
        description: 'API response time in milliseconds',
        thresholds: { warning: 500, critical: 1000 }
      },
      {
        name: 'error_rate',
        type: 'counter',
        description: 'Number of errors per minute',
        thresholds: { warning: 5, critical: 10 }
      },
      {
        name: 'request_count',
        type: 'counter',
        description: 'Total number of requests',
        thresholds: {}
      }
    ];
    
    // Add code quality metrics if available
    if (codeAnalysisResult?.analysis) {
      metrics.push({
        name: 'code_quality_score',
        type: 'gauge',
        description: 'Code quality score from analysis',
        currentValue: codeAnalysisResult.analysis.qualityScore,
        thresholds: { warning: 70, critical: 60 }
      });
    }
    
    // Add test coverage metrics if available
    if (testingResult?.output?.coverage) {
      metrics.push({
        name: 'test_coverage',
        type: 'gauge',
        description: 'Test coverage percentage',
        currentValue: testingResult.output.coverage.lines,
        thresholds: { warning: 70, critical: 50 }
      });
    }
    
    return metrics;
  }

  /**
   * Generate alerts configuration
   */
  generateAlerts(codeAnalysisResult, testingResult) {
    const alerts = [
      {
        name: 'High Error Rate',
        condition: 'error_rate > 10',
        severity: 'critical',
        action: 'Send notification to on-call team'
      },
      {
        name: 'Slow Response Time',
        condition: 'response_time > 1000ms',
        severity: 'warning',
        action: 'Log and monitor'
      }
    ];
    
    // Add code quality alerts
    if (codeAnalysisResult?.analysis) {
      const criticalIssues = codeAnalysisResult.analysis.issues.filter(i => i.severity === 'critical').length;
      if (criticalIssues > 0) {
        alerts.push({
          name: 'Critical Code Issues Detected',
          condition: `${criticalIssues} critical issues found`,
          severity: 'critical',
          action: 'Review and fix before deployment'
        });
      }
    }
    
    // Add test failure alerts
    if (testingResult?.output?.ddtfResults) {
      const failedTests = testingResult.output.ddtfResults.failed;
      if (failedTests > 0) {
        alerts.push({
          name: 'Test Failures Detected',
          condition: `${failedTests} tests failed`,
          severity: 'warning',
          action: 'Review failed tests and fix issues'
        });
      }
    }
    
    return alerts;
  }

  /**
   * Generate dashboards configuration
   */
  generateDashboards(codeAnalysisResult, testingResult) {
    return [
      {
        name: 'Application Health',
        panels: [
          { title: 'Response Time', metric: 'response_time', type: 'line' },
          { title: 'Error Rate', metric: 'error_rate', type: 'line' },
          { title: 'Request Count', metric: 'request_count', type: 'counter' }
        ]
      },
      {
        name: 'Code Quality',
        panels: [
          { title: 'Quality Score', metric: 'code_quality_score', type: 'gauge' },
          { title: 'Test Coverage', metric: 'test_coverage', type: 'gauge' },
          { title: 'Issues by Severity', metric: 'issues', type: 'pie' }
        ]
      }
    ];
  }

  /**
   * Generate logging configuration
   */
  generateLoggingConfig(codeAnalysisResult) {
    const config = {
      level: 'info',
      format: 'json',
      outputs: ['console', 'file'],
      retention: '30 days'
    };
    
    // Increase logging for complex code
    if (codeAnalysisResult?.analysis?.inputAnalysis?.complexity === 'high') {
      config.level = 'debug';
      config.additionalContext = ['function_name', 'execution_time', 'input_params'];
    }
    
    return config;
  }

  /**
   * Format monitoring output
   */
  formatMonitoringOutput(config, deploymentReadiness) {
    let output = `# 📊 Monitoring Configuration\n\n`;
    
    // Deployment Status
    if (deploymentReadiness) {
      output += `## 🚀 Deployment Status: ${deploymentReadiness.status}\n\n`;
    }
    
    // Metrics
    output += `## 📈 Metrics (${config.metrics.length})\n\n`;
    config.metrics.forEach(metric => {
      output += `### ${metric.name}\n`;
      output += `- **Type**: ${metric.type}\n`;
      output += `- **Description**: ${metric.description}\n`;
      if (metric.currentValue !== undefined) {
        output += `- **Current Value**: ${metric.currentValue}\n`;
      }
      if (metric.thresholds.warning || metric.thresholds.critical) {
        output += `- **Thresholds**: Warning: ${metric.thresholds.warning || 'N/A'}, Critical: ${metric.thresholds.critical || 'N/A'}\n`;
      }
      output += `\n`;
    });
    
    // Alerts
    output += `## 🚨 Alerts (${config.alerts.length})\n\n`;
    config.alerts.forEach((alert, i) => {
      const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
      output += `${i + 1}. ${icon} **${alert.name}** (${alert.severity})\n`;
      output += `   - Condition: ${alert.condition}\n`;
      output += `   - Action: ${alert.action}\n\n`;
    });
    
    // Dashboards
    output += `## 📊 Dashboards (${config.dashboards.length})\n\n`;
    config.dashboards.forEach(dashboard => {
      output += `### ${dashboard.name}\n`;
      dashboard.panels.forEach(panel => {
        output += `- ${panel.title} (${panel.type})\n`;
      });
      output += `\n`;
    });
    
    // Logging
    output += `## 📝 Logging Configuration\n\n`;
    output += `- **Level**: ${config.logging.level}\n`;
    output += `- **Format**: ${config.logging.format}\n`;
    output += `- **Outputs**: ${config.logging.outputs.join(', ')}\n`;
    output += `- **Retention**: ${config.logging.retention}\n`;
    if (config.logging.additionalContext) {
      output += `- **Additional Context**: ${config.logging.additionalContext.join(', ')}\n`;
    }
    output += `\n`;
    
    // Recommendations
    output += `## 💡 Recommendations\n\n`;
    output += `1. Set up CloudWatch or similar monitoring service\n`;
    output += `2. Configure alerts to notify the team of critical issues\n`;
    output += `3. Review dashboards regularly to identify trends\n`;
    output += `4. Adjust thresholds based on actual performance data\n`;
    output += `5. Implement structured logging for better debugging\n`;
    
    return output;
  }

  /**
   * Generate metrics configuration
   */
  generateMetrics(codeAnalysisResult, testingResult) {
    const metrics = [
      {
        name: 'response_time',
        type: 'histogram',
        description: 'API response time in milliseconds',
        thresholds: { warning: 500, critical: 1000 }
      },
      {
        name: 'error_rate',
        type: 'counter',
        description: 'Number of errors per minute',
        thresholds: { warning: 5, critical: 10 }
      },
      {
        name: 'request_count',
        type: 'counter',
        description: 'Total number of requests',
        thresholds: {}
      }
    ];
    
    // Add code quality metrics if available
    if (codeAnalysisResult?.analysis) {
      metrics.push({
        name: 'code_quality_score',
        type: 'gauge',
        description: 'Code quality score from analysis',
        currentValue: codeAnalysisResult.analysis.qualityScore,
        thresholds: { warning: 70, critical: 60 }
      });
    }
    
    // Add test coverage metrics if available
    if (testingResult?.output?.coverage) {
      metrics.push({
        name: 'test_coverage',
        type: 'gauge',
        description: 'Test coverage percentage',
        currentValue: testingResult.output.coverage.lines,
        thresholds: { warning: 70, critical: 50 }
      });
    }
    
    return metrics;
  }

  /**
   * Generate alerts configuration
   */
  generateAlerts(codeAnalysisResult, testingResult) {
    const alerts = [
      {
        name: 'High Error Rate',
        condition: 'error_rate > 10',
        severity: 'critical',
        action: 'Send notification to on-call team'
      },
      {
        name: 'Slow Response Time',
        condition: 'response_time > 1000ms',
        severity: 'warning',
        action: 'Log and monitor'
      }
    ];
    
    // Add code quality alerts
    if (codeAnalysisResult?.analysis) {
      const criticalIssues = codeAnalysisResult.analysis.issues.filter(i => i.severity === 'critical').length;
      if (criticalIssues > 0) {
        alerts.push({
          name: 'Critical Code Issues Detected',
          condition: `${criticalIssues} critical issues found`,
          severity: 'critical',
          action: 'Review and fix before deployment'
        });
      }
    }
    
    // Add test failure alerts
    if (testingResult?.output?.ddtfResults) {
      const failedTests = testingResult.output.ddtfResults.failed;
      if (failedTests > 0) {
        alerts.push({
          name: 'Test Failures Detected',
          condition: `${failedTests} tests failed`,
          severity: 'warning',
          action: 'Review failed tests and fix issues'
        });
      }
    }
    
    return alerts;
  }

  /**
   * Generate dashboards configuration
   */
  generateDashboards(codeAnalysisResult, testingResult) {
    return [
      {
        name: 'Application Health',
        panels: [
          { title: 'Response Time', metric: 'response_time', type: 'line' },
          { title: 'Error Rate', metric: 'error_rate', type: 'line' },
          { title: 'Request Count', metric: 'request_count', type: 'counter' }
        ]
      },
      {
        name: 'Code Quality',
        panels: [
          { title: 'Quality Score', metric: 'code_quality_score', type: 'gauge' },
          { title: 'Test Coverage', metric: 'test_coverage', type: 'gauge' },
          { title: 'Issues by Severity', metric: 'issues', type: 'pie' }
        ]
      }
    ];
  }

  /**
   * Generate logging configuration
   */
  generateLoggingConfig(codeAnalysisResult) {
    const config = {
      level: 'info',
      format: 'json',
      outputs: ['console', 'file'],
      retention: '30 days'
    };
    
    // Increase logging for complex code
    if (codeAnalysisResult?.analysis?.inputAnalysis?.complexity === 'high') {
      config.level = 'debug';
      config.additionalContext = ['function_name', 'execution_time', 'input_params'];
    }
    
    return config;
  }

  /**
   * Format monitoring output
   */
  formatMonitoringOutput(config, deploymentReadiness) {
    let output = `# 📊 Monitoring Configuration\n\n`;
    
    // Deployment Status
    if (deploymentReadiness) {
      output += `## 🚀 Deployment Status: ${deploymentReadiness.status}\n\n`;
    }
    
    // Metrics
    output += `## 📈 Metrics (${config.metrics.length})\n\n`;
    config.metrics.forEach(metric => {
      output += `### ${metric.name}\n`;
      output += `- **Type**: ${metric.type}\n`;
      output += `- **Description**: ${metric.description}\n`;
      if (metric.currentValue !== undefined) {
        output += `- **Current Value**: ${metric.currentValue}\n`;
      }
      if (metric.thresholds.warning || metric.thresholds.critical) {
        output += `- **Thresholds**: Warning: ${metric.thresholds.warning || 'N/A'}, Critical: ${metric.thresholds.critical || 'N/A'}\n`;
      }
      output += `\n`;
    });
    
    // Alerts
    output += `## 🚨 Alerts (${config.alerts.length})\n\n`;
    config.alerts.forEach((alert, i) => {
      const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
      output += `${i + 1}. ${icon} **${alert.name}** (${alert.severity})\n`;
      output += `   - Condition: ${alert.condition}\n`;
      output += `   - Action: ${alert.action}\n\n`;
    });
    
    // Dashboards
    output += `## 📊 Dashboards (${config.dashboards.length})\n\n`;
    config.dashboards.forEach(dashboard => {
      output += `### ${dashboard.name}\n`;
      dashboard.panels.forEach(panel => {
        output += `- ${panel.title} (${panel.type})\n`;
      });
      output += `\n`;
    });
    
    // Logging
    output += `## 📝 Logging Configuration\n\n`;
    output += `- **Level**: ${config.logging.level}\n`;
    output += `- **Format**: ${config.logging.format}\n`;
    output += `- **Outputs**: ${config.logging.outputs.join(', ')}\n`;
    output += `- **Retention**: ${config.logging.retention}\n`;
    if (config.logging.additionalContext) {
      output += `- **Additional Context**: ${config.logging.additionalContext.join(', ')}\n`;
    }
    output += `\n`;
    
    // Recommendations
    output += `## 💡 Recommendations\n\n`;
    output += `1. Set up CloudWatch or similar monitoring service\n`;
    output += `2. Configure alerts to notify the team of critical issues\n`;
    output += `3. Review dashboards regularly to identify trends\n`;
    output += `4. Adjust thresholds based on actual performance data\n`;
    output += `5. Implement structured logging for better debugging\n`;
    
    return output;
  }
  /**
   * Get default agent configuration if not found in S3
   */
  getDefaultAgent(agentId) {
    const defaultAgents = {
      'code-analysis-agent': {
        id: 'code-analysis-agent',
        name: 'Code Analysis Agent',
        category: 'code-analysis',
        capabilities: ['code-analysis', 'security-scan'],
        instructions: 'Analyze code quality, detect issues, and provide recommendations',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      },
      'testing-agent': {
        id: 'testing-agent',
        name: 'Testing Agent (Enhanced)',
        category: 'testing',
        capabilities: ['test-generation', 'test-execution', 'ddtf-testing'],
        instructions: 'Generate context-aware tests, execute DDTF, and assess deployment readiness',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      },
      'documentation-agent': {
        id: 'documentation-agent',
        name: 'Documentation Agent',
        category: 'documentation',
        capabilities: ['documentation', 'report-generation'],
        instructions: 'Generate comprehensive documentation and reports',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      },
      'monitoring-agent': {
        id: 'monitoring-agent',
        name: 'Monitoring Agent',
        category: 'monitoring',
        capabilities: ['monitoring-setup', 'alert-creation'],
        instructions: 'Set up monitoring and alerting configurations',
        model: 'anthropic.claude-3-sonnet-20240229-v1:0'
      }
    };

    return defaultAgents[agentId] || null;
  }
}

module.exports = MultiAgentCoordinator;
