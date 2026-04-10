/**
 * Testing Agent Enhancements
 * New methods to add to MultiAgentCoordinator for enhanced Testing Agent functionality
 * 
 * INSTRUCTIONS:
 * 1. Replace the existing executeTestingAgent method in multiAgentCoordinator.js with the one below
 * 2. Add the helper methods (extractCodeAnalysis, estimateCoverage, etc.) to the class
 */

// ============================================================================
// REPLACE EXISTING executeTestingAgent METHOD WITH THIS:
// ============================================================================

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

// ============================================================================
// ADD THESE NEW HELPER METHODS TO THE CLASS:
// ============================================================================

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

module.exports = {
  // Export for reference - these should be added to MultiAgentCoordinator class
};
