/**
 * Deployment Readiness Service
 * Assesses whether code is ready for deployment based on
 * code analysis and test results
 */

class DeploymentReadinessService {
  /**
   * Assess deployment readiness
   * @param {Object} codeAnalysis - Code analysis results
   * @param {Object} ddtfResults - DDTF test results
   * @returns {Object} Deployment readiness assessment
   */
  assess(codeAnalysis, ddtfResults) {
    console.log('🔍 Assessing deployment readiness...');
    
    // Calculate pass rate
    const passRate = this.calculatePassRate(ddtfResults);
    
    // Count issues by severity
    const criticalIssues = this.countCriticalIssues(codeAnalysis, ddtfResults);
    const highIssues = this.countHighIssues(codeAnalysis, ddtfResults);
    const mediumIssues = this.countMediumIssues(codeAnalysis, ddtfResults);
    
    // Determine deployment status
    const status = this.determineStatus(passRate, criticalIssues, highIssues);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      status,
      passRate,
      criticalIssues,
      highIssues,
      codeAnalysis,
      ddtfResults
    );
    
    // Identify blockers
    const blockers = this.identifyBlockers(criticalIssues, ddtfResults, codeAnalysis);
    
    const assessment = {
      status: status,
      passRate: passRate,
      criticalIssues: criticalIssues,
      highIssues: highIssues,
      mediumIssues: mediumIssues,
      recommendations: recommendations,
      blockers: blockers,
      summary: this.generateSummary(status, passRate, criticalIssues, highIssues)
    };
    
    console.log(`  → Status: ${status}`);
    console.log(`  → Pass Rate: ${passRate}%`);
    console.log(`  → Critical Issues: ${criticalIssues}`);
    console.log(`  → High Issues: ${highIssues}`);
    
    return assessment;
  }

  /**
   * Calculate pass rate from DDTF results
   * @param {Object} ddtfResults - DDTF results
   * @returns {number} Pass rate percentage
   */
  calculatePassRate(ddtfResults) {
    if (!ddtfResults || ddtfResults.totalTests === 0) {
      return 0;
    }
    
    return Math.round((ddtfResults.passed / ddtfResults.totalTests) * 100 * 100) / 100;
  }

  /**
   * Count critical issues
   * @param {Object} codeAnalysis - Code analysis
   * @param {Object} ddtfResults - DDTF results
   * @returns {number} Critical issue count
   */
  countCriticalIssues(codeAnalysis, ddtfResults) {
    let count = 0;
    
    // Count critical issues from code analysis
    if (codeAnalysis && codeAnalysis.issues) {
      count += codeAnalysis.issues.filter(i => i.severity === 'critical').length;
    }
    
    // Count critical failed tests from DDTF
    if (ddtfResults && ddtfResults.failedTests) {
      count += ddtfResults.failedTests.filter(t => t.severity === 'critical').length;
    }
    
    return count;
  }

  /**
   * Count high severity issues
   * @param {Object} codeAnalysis - Code analysis
   * @param {Object} ddtfResults - DDTF results
   * @returns {number} High issue count
   */
  countHighIssues(codeAnalysis, ddtfResults) {
    let count = 0;
    
    // Count high issues from code analysis
    if (codeAnalysis && codeAnalysis.issues) {
      count += codeAnalysis.issues.filter(i => i.severity === 'high').length;
    }
    
    // Count high severity failed tests from DDTF
    if (ddtfResults && ddtfResults.failedTests) {
      count += ddtfResults.failedTests.filter(t => t.severity === 'high').length;
    }
    
    return count;
  }

  /**
   * Count medium severity issues
   * @param {Object} codeAnalysis - Code analysis
   * @param {Object} ddtfResults - DDTF results
   * @returns {number} Medium issue count
   */
  countMediumIssues(codeAnalysis, ddtfResults) {
    let count = 0;
    
    // Count medium issues from code analysis
    if (codeAnalysis && codeAnalysis.issues) {
      count += codeAnalysis.issues.filter(i => i.severity === 'medium').length;
    }
    
    // Count medium severity failed tests from DDTF
    if (ddtfResults && ddtfResults.failedTests) {
      count += ddtfResults.failedTests.filter(t => t.severity === 'medium').length;
    }
    
    return count;
  }

  /**
   * Determine deployment status
   * @param {number} passRate - Test pass rate
   * @param {number} criticalIssues - Critical issue count
   * @param {number} highIssues - High issue count
   * @returns {string} Deployment status
   */
  determineStatus(passRate, criticalIssues, highIssues) {
    // Critical issues block deployment
    if (criticalIssues > 0) {
      return 'NOT_READY';
    }
    
    // Low pass rate needs improvement
    if (passRate < 80) {
      return 'NEEDS_IMPROVEMENT';
    }
    
    // High issues or moderate pass rate = ready with fixes
    if (passRate < 95 || highIssues > 0) {
      return 'READY_WITH_MINOR_FIXES';
    }
    
    // Excellent pass rate and no major issues = ready
    return 'READY';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(status, passRate, criticalIssues, highIssues, codeAnalysis, ddtfResults) {
    const recommendations = [];
    
    // Status-based recommendations
    switch (status) {
      case 'NOT_READY':
        recommendations.push(`🚫 DEPLOYMENT BLOCKED: Fix ${criticalIssues} critical issue(s) before deployment`);
        break;
      case 'NEEDS_IMPROVEMENT':
        recommendations.push(`⚠️ Improve test pass rate from ${passRate}% to at least 80%`);
        break;
      case 'READY_WITH_MINOR_FIXES':
        recommendations.push(`✅ Ready for deployment after addressing ${highIssues} high-priority issue(s)`);
        break;
      case 'READY':
        recommendations.push('✅ Code is ready for production deployment');
        break;
    }
    
    // Code quality recommendations
    if (codeAnalysis && codeAnalysis.qualityScore < 70) {
      recommendations.push(`📊 Improve code quality score from ${codeAnalysis.qualityScore}/100 to at least 70`);
    }
    
    // Test coverage recommendations
    if (passRate < 90) {
      recommendations.push(`🧪 Increase test coverage to improve pass rate (current: ${passRate}%)`);
    }
    
    // Security recommendations
    if (codeAnalysis && codeAnalysis.security && codeAnalysis.security.vulnerabilities.length > 0) {
      recommendations.push(`🔒 Address ${codeAnalysis.security.vulnerabilities.length} security vulnerability(ies)`);
    }
    
    // Failed dimension recommendations
    if (ddtfResults && ddtfResults.dimensions) {
      const failedDimensions = ddtfResults.dimensions.filter(d => d.score < 70);
      if (failedDimensions.length > 0) {
        failedDimensions.forEach(dim => {
          recommendations.push(`📉 Improve ${dim.name} dimension (current score: ${dim.score}/100)`);
        });
      }
    }
    
    // Specific issue recommendations
    if (codeAnalysis && codeAnalysis.issues) {
      const topIssues = codeAnalysis.issues
        .filter(i => i.severity === 'critical' || i.severity === 'high')
        .slice(0, 3);
      
      topIssues.forEach(issue => {
        recommendations.push(`🔧 ${issue.title}: ${issue.suggestedFix.substring(0, 60)}...`);
      });
    }
    
    return recommendations;
  }

  /**
   * Identify deployment blockers
   */
  identifyBlockers(criticalIssues, ddtfResults, codeAnalysis) {
    const blockers = [];
    
    // Critical issues are blockers
    if (criticalIssues > 0) {
      if (codeAnalysis && codeAnalysis.issues) {
        const criticalCodeIssues = codeAnalysis.issues.filter(i => i.severity === 'critical');
        criticalCodeIssues.forEach(issue => {
          blockers.push({
            type: 'code_issue',
            severity: 'critical',
            title: issue.title,
            description: issue.description,
            location: issue.location,
            fix: issue.suggestedFix
          });
        });
      }
      
      if (ddtfResults && ddtfResults.failedTests) {
        const criticalTestFailures = ddtfResults.failedTests.filter(t => t.severity === 'critical');
        criticalTestFailures.forEach(test => {
          blockers.push({
            type: 'test_failure',
            severity: 'critical',
            title: test.name,
            description: `Expected: ${test.expected}, Got: ${test.actual}`,
            dimension: test.dimension,
            fix: test.suggestedFix
          });
        });
      }
    }
    
    // Security vulnerabilities are blockers
    if (codeAnalysis && codeAnalysis.security && codeAnalysis.security.vulnerabilities.length > 0) {
      codeAnalysis.security.vulnerabilities.forEach(vuln => {
        blockers.push({
          type: 'security_vulnerability',
          severity: 'critical',
          title: vuln.title || 'Security Vulnerability',
          description: vuln.description || 'Security issue detected',
          fix: vuln.fix || 'Review and fix security issue'
        });
      });
    }
    
    return blockers;
  }

  /**
   * Generate summary text
   */
  generateSummary(status, passRate, criticalIssues, highIssues) {
    const statusMessages = {
      'READY': `✅ Code is production-ready with ${passRate}% test pass rate and no critical issues.`,
      'READY_WITH_MINOR_FIXES': `⚠️ Code is nearly ready for deployment. Address ${highIssues} high-priority issue(s) for optimal quality.`,
      'NEEDS_IMPROVEMENT': `📊 Code needs improvement. Current test pass rate is ${passRate}% (target: 80%+).`,
      'NOT_READY': `🚫 Code is NOT ready for deployment. ${criticalIssues} critical issue(s) must be fixed first.`
    };
    
    return statusMessages[status] || 'Status unknown';
  }

  /**
   * Get deployment readiness color
   * @param {string} status - Deployment status
   * @returns {string} Color code
   */
  getStatusColor(status) {
    const colors = {
      'READY': 'green',
      'READY_WITH_MINOR_FIXES': 'yellow',
      'NEEDS_IMPROVEMENT': 'orange',
      'NOT_READY': 'red'
    };
    
    return colors[status] || 'gray';
  }

  /**
   * Get deployment readiness icon
   * @param {string} status - Deployment status
   * @returns {string} Icon
   */
  getStatusIcon(status) {
    const icons = {
      'READY': '✅',
      'READY_WITH_MINOR_FIXES': '⚠️',
      'NEEDS_IMPROVEMENT': '📊',
      'NOT_READY': '🚫'
    };
    
    return icons[status] || '❓';
  }
}

module.exports = DeploymentReadinessService;
