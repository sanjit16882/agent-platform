/**
 * Code Analysis Service
 * Analyzes code input to detect type, language, complexity, and issues
 */

class CodeAnalysisService {
  constructor(bedrockService) {
    this.bedrockService = bedrockService;
  }

  /**
   * Analyze code input
   * @param {string} code - Source code to analyze
   * @returns {Object} Analysis results
   */
  async analyzeCode(code) {
    console.log('🔍 Starting code analysis...');
    
    // Step 1: Pre-analysis (detect input characteristics)
    const inputAnalysis = this.analyzeInput(code);
    console.log('📊 Input analysis:', inputAnalysis);
    
    // Step 2: Quality analysis (find issues and metrics)
    const qualityAnalysis = await this.analyzeQuality(code, inputAnalysis);
    console.log('✅ Quality analysis complete');
    
    // Step 3: Security analysis
    const securityAnalysis = await this.analyzeSecurity(code, inputAnalysis);
    console.log('🔒 Security analysis complete');
    
    // Step 4: Generate recommendations
    const recommendations = this.generateRecommendations(qualityAnalysis, securityAnalysis);
    
    return {
      inputAnalysis,
      qualityScore: qualityAnalysis.score,
      grade: this.calculateGrade(qualityAnalysis.score),
      metrics: qualityAnalysis.metrics,
      issues: qualityAnalysis.issues,
      security: securityAnalysis,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze input characteristics
   */
  analyzeInput(code) {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const linesOfCode = lines.length;
    
    // Detect language
    const language = this.detectLanguage(code);
    
    // Detect type
    const type = this.detectInputType(code);
    
    // Count functions and classes
    const functions = this.countFunctions(code);
    const classes = this.countClasses(code);
    
    // Detect features
    const hasAsync = this.detectAsync(code);
    const hasErrorHandling = this.detectErrorHandling(code);
    const hasDatabaseCalls = this.detectDatabaseCalls(code);
    const hasLogging = this.detectLogging(code);
    const hasValidation = this.detectValidation(code);
    
    // Extract dependencies
    const dependencies = this.extractDependencies(code);
    
    // Calculate complexity
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    const complexity = this.assessComplexity(linesOfCode, functions, cyclomaticComplexity);
    
    return {
      type,
      language,
      complexity,
      linesOfCode,
      functions,
      classes,
      hasAsync,
      hasErrorHandling,
      hasDatabaseCalls,
      hasLogging,
      hasValidation,
      dependencies,
      cyclomaticComplexity
    };
  }

  /**
   * Detect programming language
   */
  detectLanguage(code) {
    // JavaScript/TypeScript patterns
    if (code.match(/\b(const|let|var|function|class|async|await|=>)\b/)) {
      if (code.match(/:\s*(string|number|boolean|any|void|interface|type)\b/)) {
        return 'typescript';
      }
      return 'javascript';
    }
    
    // Python patterns
    if (code.match(/\b(def|class|import|from|if __name__|print)\b/)) {
      return 'python';
    }
    
    // Java patterns
    if (code.match(/\b(public|private|protected|class|interface|void|static)\b/)) {
      return 'java';
    }
    
    // Go patterns
    if (code.match(/\b(func|package|import|type|struct|interface)\b/)) {
      return 'go';
    }
    
    return 'unknown';
  }

  /**
   * Detect input type
   */
  detectInputType(code) {
    const hasClass = /\bclass\s+\w+/.test(code);
    const hasMultipleFunctions = (code.match(/\bfunction\s+\w+/g) || []).length > 1 ||
                                  (code.match(/\bdef\s+\w+/g) || []).length > 1;
    const hasExports = /\b(module\.exports|export\s+(default|const|class|function))\b/.test(code);
    const hasImports = /\b(require\(|import\s+.*\s+from)\b/.test(code);
    
    if (hasClass) {
      return 'class';
    }
    
    if (hasMultipleFunctions || hasExports) {
      return 'module';
    }
    
    if (hasImports) {
      return 'file';
    }
    
    return 'function';
  }

  /**
   * Count functions
   */
  countFunctions(code) {
    const jsMatches = code.match(/\bfunction\s+\w+/g) || [];
    const arrowMatches = code.match(/\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
    const pyMatches = code.match(/\bdef\s+\w+/g) || [];
    return jsMatches.length + arrowMatches.length + pyMatches.length;
  }

  /**
   * Count classes
   */
  countClasses(code) {
    const matches = code.match(/\bclass\s+\w+/g) || [];
    return matches.length;
  }

  /**
   * Detect async operations
   */
  detectAsync(code) {
    return /\b(async|await|Promise|\.then\(|\.catch\()\b/.test(code);
  }

  /**
   * Detect error handling
   */
  detectErrorHandling(code) {
    return /\b(try|catch|throw|throws|except|raise)\b/.test(code);
  }

  /**
   * Detect database calls
   */
  detectDatabaseCalls(code) {
    return /\b(db\.|database\.|findById|findOne|find\(|query\(|execute\(|\.save\(|\.update\(|\.delete\()\b/.test(code);
  }

  /**
   * Detect logging
   */
  detectLogging(code) {
    return /\b(console\.log|logger\.|log\.|print\(|println\()\b/.test(code);
  }

  /**
   * Detect validation
   */
  detectValidation(code) {
    return /\b(validate|typeof|instanceof|isNaN|isFinite|assert)\b/.test(code);
  }

  /**
   * Extract dependencies
   */
  extractDependencies(code) {
    const deps = [];
    
    // JavaScript require
    const requireMatches = code.matchAll(/require\(['"]([^'"]+)['"]\)/g);
    for (const match of requireMatches) {
      deps.push({ name: match[1], type: match[1].startsWith('.') ? 'internal' : 'external' });
    }
    
    // JavaScript import
    const importMatches = code.matchAll(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      deps.push({ name: match[1], type: match[1].startsWith('.') ? 'internal' : 'external' });
    }
    
    // Python import
    const pyImportMatches = code.matchAll(/(?:from\s+(\S+)\s+)?import\s+(\S+)/g);
    for (const match of pyImportMatches) {
      const name = match[1] || match[2];
      deps.push({ name, type: name.startsWith('.') ? 'internal' : 'external' });
    }
    
    return deps;
  }

  /**
   * Calculate cyclomatic complexity
   */
  calculateCyclomaticComplexity(code) {
    // Count decision points
    const ifMatches = (code.match(/\bif\s*\(/g) || []).length;
    const forMatches = (code.match(/\bfor\s*\(/g) || []).length;
    const whileMatches = (code.match(/\bwhile\s*\(/g) || []).length;
    const caseMatches = (code.match(/\bcase\s+/g) || []).length;
    const catchMatches = (code.match(/\bcatch\s*\(/g) || []).length;
    const ternaryMatches = (code.match(/\?[^:]+:/g) || []).length;
    const andOrMatches = (code.match(/(\&\&|\|\|)/g) || []).length;
    
    // Cyclomatic complexity = decision points + 1
    return 1 + ifMatches + forMatches + whileMatches + caseMatches + catchMatches + ternaryMatches + andOrMatches;
  }

  /**
   * Assess overall complexity
   */
  assessComplexity(linesOfCode, functions, cyclomaticComplexity) {
    if (linesOfCode <= 20 && functions <= 1 && cyclomaticComplexity <= 5) {
      return 'simple';
    }
    if (linesOfCode <= 100 && functions <= 5 && cyclomaticComplexity <= 15) {
      return 'medium';
    }
    return 'complex';
  }

  /**
   * Analyze code quality using AI
   */
  async analyzeQuality(code, inputAnalysis) {
    const prompt = `Analyze this ${inputAnalysis.language} code for quality issues:

\`\`\`${inputAnalysis.language}
${code}
\`\`\`

Input Analysis:
- Type: ${inputAnalysis.type}
- Complexity: ${inputAnalysis.complexity}
- Lines of Code: ${inputAnalysis.linesOfCode}
- Functions: ${inputAnalysis.functions}
- Has Error Handling: ${inputAnalysis.hasErrorHandling}
- Has Validation: ${inputAnalysis.hasValidation}

Identify issues in this JSON format:
{
  "score": <0-100>,
  "metrics": {
    "maintainabilityIndex": <0-100>,
    "commentRatio": <0-1>
  },
  "issues": [
    {
      "id": "ISS-001",
      "severity": "critical|high|medium|low",
      "category": "validation|error-handling|security|performance|maintainability",
      "title": "Brief title",
      "description": "What's wrong",
      "location": "Line X or function name",
      "impact": "What could happen",
      "suggestedFix": "Code example to fix it",
      "estimatedEffort": "X minutes"
    }
  ]
}

Focus on:
1. Missing input validation
2. Missing error handling
3. Magic numbers/strings
4. Code smells
5. Best practice violations

Return ONLY valid JSON.`;

    try {
      const response = await this.bedrockService.callBedrock(
        'code-analysis',
        prompt,
        { model_id: 'anthropic.claude-3-sonnet-20240229-v1:0' }
      );

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    }

    // Fallback: basic static analysis
    return this.performStaticAnalysis(code, inputAnalysis);
  }

  /**
   * Perform basic static analysis (fallback)
   */
  performStaticAnalysis(code, inputAnalysis) {
    const issues = [];
    let score = 100;

    // Check for input validation
    if (!inputAnalysis.hasValidation) {
      issues.push({
        id: 'ISS-001',
        severity: 'critical',
        category: 'validation',
        title: 'Missing Input Validation',
        description: 'No input validation detected',
        location: 'Function parameters',
        impact: 'Can cause runtime errors with invalid inputs',
        suggestedFix: 'Add type checking and validation for all parameters',
        estimatedEffort: '30 minutes'
      });
      score -= 20;
    }

    // Check for error handling
    if (!inputAnalysis.hasErrorHandling) {
      issues.push({
        id: 'ISS-002',
        severity: 'high',
        category: 'error-handling',
        title: 'No Error Handling',
        description: 'No try-catch or error handling detected',
        location: 'Function body',
        impact: 'Errors will crash the application',
        suggestedFix: 'Wrap code in try-catch blocks',
        estimatedEffort: '20 minutes'
      });
      score -= 15;
    }

    // Check for magic numbers
    const magicNumbers = code.match(/\b\d+\.?\d*\b/g) || [];
    if (magicNumbers.length > 2) {
      issues.push({
        id: 'ISS-003',
        severity: 'medium',
        category: 'maintainability',
        title: 'Magic Numbers Detected',
        description: `Found ${magicNumbers.length} numeric literals`,
        location: 'Throughout code',
        impact: 'Hard to maintain and understand',
        suggestedFix: 'Extract numbers to named constants',
        estimatedEffort: '15 minutes'
      });
      score -= 10;
    }

    // Check for comments
    const commentLines = (code.match(/\/\/|\/\*|\*\/|#/g) || []).length;
    const commentRatio = commentLines / inputAnalysis.linesOfCode;
    if (commentRatio < 0.1) {
      issues.push({
        id: 'ISS-004',
        severity: 'low',
        category: 'maintainability',
        title: 'Insufficient Documentation',
        description: 'Code lacks comments and documentation',
        location: 'Throughout code',
        impact: 'Hard for others to understand',
        suggestedFix: 'Add JSDoc/docstring comments',
        estimatedEffort: '10 minutes'
      });
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      metrics: {
        maintainabilityIndex: score,
        commentRatio
      },
      issues
    };
  }

  /**
   * Analyze security
   */
  async analyzeSecurity(code, inputAnalysis) {
    const vulnerabilities = [];
    let score = 100;

    // Check for SQL injection risks
    if (code.match(/query\s*\([^)]*\+[^)]*\)|execute\s*\([^)]*\+[^)]*\)/)) {
      vulnerabilities.push({
        type: 'sql-injection',
        severity: 'critical',
        description: 'Potential SQL injection vulnerability detected',
        location: 'Database query construction'
      });
      score -= 30;
    }

    // Check for eval usage
    if (code.match(/\beval\s*\(/)) {
      vulnerabilities.push({
        type: 'code-injection',
        severity: 'critical',
        description: 'Use of eval() detected - security risk',
        location: 'eval() call'
      });
      score -= 30;
    }

    // Check for hardcoded credentials
    if (code.match(/(password|secret|api[_-]?key|token)\s*=\s*['"][^'"]+['"]/i)) {
      vulnerabilities.push({
        type: 'hardcoded-credentials',
        severity: 'high',
        description: 'Hardcoded credentials detected',
        location: 'Variable assignment'
      });
      score -= 20;
    }

    return {
      score: Math.max(0, score),
      vulnerabilities,
      recommendations: vulnerabilities.length > 0 
        ? ['Fix security vulnerabilities before deployment']
        : ['No major security issues detected']
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(qualityAnalysis, securityAnalysis) {
    const recommendations = [];

    // Critical issues first
    const criticalIssues = qualityAnalysis.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Fix ${criticalIssues.length} critical issue(s) before deployment`);
    }

    // Security issues
    if (securityAnalysis.vulnerabilities.length > 0) {
      recommendations.push(`Address ${securityAnalysis.vulnerabilities.length} security vulnerability(ies)`);
    }

    // Quality improvements
    if (qualityAnalysis.score < 70) {
      recommendations.push('Improve code quality (current score: ' + qualityAnalysis.score + '/100)');
    }

    // General recommendations
    if (qualityAnalysis.metrics.commentRatio < 0.1) {
      recommendations.push('Add documentation and comments');
    }

    if (recommendations.length === 0) {
      recommendations.push('Code quality is good - ready for testing');
    }

    return recommendations;
  }

  /**
   * Calculate grade from score
   */
  calculateGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

module.exports = CodeAnalysisService;
