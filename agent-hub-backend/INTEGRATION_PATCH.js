/**
 * INTEGRATION PATCH
 * This file contains the enhanced executeTestingAgent method
 * Copy this method to replace the existing one in multiAgentCoordinator.js (around line 320)
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
