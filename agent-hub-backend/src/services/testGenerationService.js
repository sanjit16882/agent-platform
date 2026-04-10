/**
 * Test Generation Service
 * Generates context-aware, executable test cases based on code analysis
 */

class TestGenerationService {
  constructor(bedrockService) {
    this.bedrockService = bedrockService;
  }

  /**
   * Generate test cases based on code and context
   * @param {string} code - Source code to test
   * @param {Object} codeAnalysis - Code analysis results
   * @param {Object} options - Generation options
   * @returns {Array<TestCase>} Generated test cases
   */
  async generateTestCases(code, codeAnalysis, options = {}) {
    console.log('🧪 Generating test cases...');
    
    // Determine test count based on complexity
    const testCount = this.determineTestCount(codeAnalysis.inputAnalysis.complexity);
    console.log(`  → Complexity: ${codeAnalysis.inputAnalysis.complexity}`);
    console.log(`  → Target test count: ${testCount.min}-${testCount.max}`);
    
    // Build test requirements based on code features
    const requirements = this.buildTestRequirements(codeAnalysis);
    console.log(`  → Requirements: ${requirements.join(', ')}`);
    
    // Generate test cases using AI
    const testCases = await this.generateTestCasesWithAI(
      code,
      codeAnalysis,
      testCount,
      requirements,
      options
    );
    
    console.log(`✅ Generated ${testCases.length} test cases`);
    return testCases;
  }

  /**
   * Determine test count based on complexity
   * @param {string} complexity - 'simple', 'medium', 'complex'
   * @returns {Object} Min and max test count
   */
  determineTestCount(complexity) {
    switch (complexity) {
      case 'simple':
        return { min: 3, max: 5 };
      case 'medium':
        return { min: 8, max: 12 };
      case 'complex':
        return { min: 15, max: 20 };
      default:
        return { min: 5, max: 8 };
    }
  }

  /**
   * Build test requirements based on code features
   * @param {Object} codeAnalysis - Code analysis results
   * @returns {Array<string>} Test requirements
   */
  buildTestRequirements(codeAnalysis) {
    const requirements = ['Happy path scenarios', 'Edge cases'];
    
    if (codeAnalysis.inputAnalysis.hasAsync) {
      requirements.push('Async operation tests');
    }
    
    if (codeAnalysis.inputAnalysis.hasDatabaseCalls) {
      requirements.push('Database mock tests');
    }
    
    if (codeAnalysis.inputAnalysis.hasErrorHandling) {
      requirements.push('Error handling tests');
    } else {
      requirements.push('Error condition tests');
    }
    
    if (!codeAnalysis.inputAnalysis.hasValidation) {
      requirements.push('Input validation tests');
    }
    
    return requirements;
  }

  /**
   * Generate test cases using AI
   * @param {string} code - Source code
   * @param {Object} codeAnalysis - Code analysis
   * @param {Object} testCount - Min/max test count
   * @param {Array<string>} requirements - Test requirements
   * @param {Object} options - Options
   * @returns {Array<TestCase>} Generated test cases
   */
  async generateTestCasesWithAI(code, codeAnalysis, testCount, requirements, options) {
    const language = options.language || codeAnalysis.inputAnalysis.language || 'javascript';
    const framework = this.selectTestFramework(language);
    
    const prompt = this.buildTestGenerationPrompt(
      code,
      codeAnalysis,
      testCount,
      requirements,
      language,
      framework
    );
    
    try {
      const response = await this.bedrockService.callBedrock(
        'test-generator',
        prompt,
        { model_id: 'anthropic.claude-3-sonnet-20240229-v1:0' }
      );
      
      if (!response.success) {
        throw new Error('AI test generation failed');
      }
      
      // Parse test cases from response
      const testCases = this.parseTestCases(response.content, language, framework);
      
      // Validate test cases
      const validTestCases = testCases.filter(tc => this.validateTestCase(tc));
      
      if (validTestCases.length === 0) {
        throw new Error('No valid test cases generated');
      }
      
      return validTestCases;
      
    } catch (error) {
      console.warn('AI test generation failed, using fallback:', error.message);
      return this.generateFallbackTests(code, codeAnalysis, testCount.min);
    }
  }

  /**
   * Build test generation prompt
   */
  buildTestGenerationPrompt(code, codeAnalysis, testCount, requirements, language, framework) {
    return `Generate executable ${language} test code using ${framework}.

CODE TO TEST:
\`\`\`${language}
${code}
\`\`\`

CODE ANALYSIS:
- Type: ${codeAnalysis.inputAnalysis.type}
- Language: ${codeAnalysis.inputAnalysis.language}
- Complexity: ${codeAnalysis.inputAnalysis.complexity}
- Functions: ${codeAnalysis.inputAnalysis.functions}
- Has Async: ${codeAnalysis.inputAnalysis.hasAsync}
- Has Error Handling: ${codeAnalysis.inputAnalysis.hasErrorHandling}
- Has Validation: ${codeAnalysis.inputAnalysis.hasValidation}

REQUIREMENTS:
Generate ${testCount.min}-${testCount.max} test cases covering:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

INSTRUCTIONS:
1. Generate EXECUTABLE test code (not descriptions)
2. Use ${framework} syntax
3. Include proper assertions (expect, assert, etc.)
4. Test names should be descriptive
5. Cover edge cases (null, undefined, boundary values)
6. Include error condition tests

Return ONLY valid ${framework} test code in this format:

\`\`\`${language}
test('descriptive test name', () => {
  // Arrange
  const input = ...;
  
  // Act
  const result = functionName(input);
  
  // Assert
  expect(result).toBe(expected);
});

test('another test name', () => {
  // test code
});
\`\`\`

Generate ${testCount.min}-${testCount.max} tests now:`;
  }

  /**
   * Parse test cases from AI response
   */
  parseTestCases(content, language, framework) {
    const testCases = [];
    
    // Extract code blocks
    const codeBlockRegex = /```(?:javascript|typescript|python|java)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const codeBlock = match[1].trim();
      
      // Split into individual tests
      const tests = this.splitIntoTests(codeBlock, framework);
      
      tests.forEach((testCode, index) => {
        const testName = this.extractTestName(testCode, framework);
        
        testCases.push({
          id: `test_${Date.now()}_${index}`,
          name: testName || `Test ${index + 1}`,
          category: this.categorizeTest(testCode),
          language: language,
          framework: framework,
          code: testCode,
          priority: 'medium'
        });
      });
    }
    
    return testCases;
  }

  /**
   * Split code block into individual tests
   */
  splitIntoTests(codeBlock, framework) {
    const tests = [];
    
    // JavaScript/TypeScript (Jest, Mocha)
    if (framework === 'jest' || framework === 'mocha') {
      const testRegex = /(test|it)\s*\([^)]+\)\s*\{[\s\S]*?\n\}\);?/g;
      let match;
      
      while ((match = testRegex.exec(codeBlock)) !== null) {
        tests.push(match[0]);
      }
    }
    
    // Python (pytest, unittest)
    if (framework === 'pytest' || framework === 'unittest') {
      const testRegex = /def\s+test_\w+\s*\([^)]*\):[\s\S]*?(?=\ndef\s+test_|\Z)/g;
      let match;
      
      while ((match = testRegex.exec(codeBlock)) !== null) {
        tests.push(match[0]);
      }
    }
    
    // If no tests found, return whole block as one test
    if (tests.length === 0) {
      tests.push(codeBlock);
    }
    
    return tests;
  }

  /**
   * Extract test name from test code
   */
  extractTestName(testCode, framework) {
    // JavaScript/TypeScript
    const jsMatch = testCode.match(/(?:test|it)\s*\(\s*['"]([^'"]+)['"]/);
    if (jsMatch) return jsMatch[1];
    
    // Python
    const pyMatch = testCode.match(/def\s+(test_\w+)/);
    if (pyMatch) return pyMatch[1];
    
    return null;
  }

  /**
   * Categorize test based on content
   */
  categorizeTest(testCode) {
    const lower = testCode.toLowerCase();
    
    if (lower.includes('validate') || lower.includes('invalid')) {
      return 'validation';
    }
    if (lower.includes('error') || lower.includes('throw') || lower.includes('exception')) {
      return 'error-handling';
    }
    if (lower.includes('security') || lower.includes('injection') || lower.includes('xss')) {
      return 'security';
    }
    if (lower.includes('edge') || lower.includes('boundary') || lower.includes('null')) {
      return 'edge-case';
    }
    
    return 'unit';
  }

  /**
   * Validate test case
   */
  validateTestCase(testCase) {
    if (!testCase.code || testCase.code.length < 10) {
      return false;
    }
    
    // Check for test syntax
    const hasTestSyntax = 
      testCase.code.includes('test(') ||
      testCase.code.includes('it(') ||
      testCase.code.includes('def test_');
    
    if (!hasTestSyntax) {
      return false;
    }
    
    // Check for assertions
    const hasAssertions = 
      testCase.code.includes('expect(') ||
      testCase.code.includes('assert') ||
      testCase.code.includes('assertEqual') ||
      testCase.code.includes('toBe(') ||
      testCase.code.includes('toEqual(');
    
    if (!hasAssertions) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate fallback tests (template-based)
   */
  generateFallbackTests(code, codeAnalysis, count) {
    console.log('📝 Generating fallback tests...');
    
    const tests = [];
    const language = codeAnalysis.inputAnalysis.language || 'javascript';
    const framework = this.selectTestFramework(language);
    
    // Basic happy path test
    tests.push({
      id: `test_fallback_1`,
      name: 'should execute without errors',
      category: 'unit',
      language: language,
      framework: framework,
      code: this.generateBasicTest(code, codeAnalysis, framework),
      priority: 'high'
    });
    
    // Validation test if no validation detected
    if (!codeAnalysis.inputAnalysis.hasValidation) {
      tests.push({
        id: `test_fallback_2`,
        name: 'should validate input parameters',
        category: 'validation',
        language: language,
        framework: framework,
        code: this.generateValidationTest(code, codeAnalysis, framework),
        priority: 'critical'
      });
    }
    
    // Error handling test if no error handling detected
    if (!codeAnalysis.inputAnalysis.hasErrorHandling) {
      tests.push({
        id: `test_fallback_3`,
        name: 'should handle errors gracefully',
        category: 'error-handling',
        language: language,
        framework: framework,
        code: this.generateErrorTest(code, codeAnalysis, framework),
        priority: 'high'
      });
    }
    
    return tests.slice(0, count);
  }

  /**
   * Generate basic test template
   */
  generateBasicTest(code, codeAnalysis, framework) {
    if (framework === 'jest' || framework === 'mocha') {
      return `test('should execute without errors', () => {
  // TODO: Add test implementation
  expect(true).toBe(true);
});`;
    }
    
    if (framework === 'pytest') {
      return `def test_executes_without_errors():
    # TODO: Add test implementation
    assert True`;
    }
    
    return '// Test code generation failed';
  }

  /**
   * Generate validation test template
   */
  generateValidationTest(code, codeAnalysis, framework) {
    if (framework === 'jest' || framework === 'mocha') {
      return `test('should validate input parameters', () => {
  // TODO: Add validation tests
  expect(() => functionName(null)).toThrow();
  expect(() => functionName(undefined)).toThrow();
});`;
    }
    
    if (framework === 'pytest') {
      return `def test_validates_input_parameters():
    # TODO: Add validation tests
    with pytest.raises(TypeError):
        function_name(None)`;
    }
    
    return '// Validation test generation failed';
  }

  /**
   * Generate error handling test template
   */
  generateErrorTest(code, codeAnalysis, framework) {
    if (framework === 'jest' || framework === 'mocha') {
      return `test('should handle errors gracefully', () => {
  // TODO: Add error handling tests
  expect(() => functionName('invalid')).toThrow(Error);
});`;
    }
    
    if (framework === 'pytest') {
      return `def test_handles_errors_gracefully():
    # TODO: Add error handling tests
    with pytest.raises(Exception):
        function_name('invalid')`;
    }
    
    return '// Error test generation failed';
  }

  /**
   * Select test framework based on language
   */
  selectTestFramework(language) {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return 'jest';
      case 'python':
        return 'pytest';
      case 'java':
        return 'junit';
      default:
        return 'jest';
    }
  }

  /**
   * Generate issue-driven tests
   * @param {Array<Issue>} issues - Issues from code analysis
   * @param {string} code - Source code
   * @returns {Array<TestCase>} Issue-specific test cases
   */
  async generateIssueTests(issues, code) {
    console.log(`🔍 Generating issue-driven tests for ${issues.length} issues...`);
    
    const testCases = [];
    
    for (const issue of issues) {
      try {
        const testCase = await this.generateIssueTest(issue, code);
        if (testCase) {
          testCases.push(testCase);
        }
      } catch (error) {
        console.warn(`Failed to generate test for issue ${issue.id}:`, error.message);
      }
    }
    
    console.log(`✅ Generated ${testCases.length} issue-driven tests`);
    return testCases;
  }

  /**
   * Generate test for specific issue
   */
  async generateIssueTest(issue, code) {
    const language = 'javascript'; // TODO: Get from context
    const framework = 'jest';
    
    const prompt = `Generate a test case for this code issue:

ISSUE: ${issue.title}
SEVERITY: ${issue.severity}
CATEGORY: ${issue.category}
DESCRIPTION: ${issue.description}
LOCATION: ${issue.location}
SUGGESTED FIX: ${issue.suggestedFix}

CODE:
\`\`\`javascript
${code}
\`\`\`

Generate ONE executable ${framework} test that validates the fix for this issue.
The test should FAIL with the current code and PASS after applying the suggested fix.

Return ONLY the test code:`;

    const response = await this.bedrockService.callBedrock(
      'test-generator',
      prompt,
      { model_id: 'anthropic.claude-3-haiku-20240307-v1:0' } // Use fast model
    );
    
    if (!response.success) {
      return null;
    }
    
    // Extract test code
    const codeMatch = response.content.match(/```(?:javascript|typescript)?\n([\s\S]*?)```/);
    const testCode = codeMatch ? codeMatch[1].trim() : response.content;
    
    return {
      id: `test_issue_${issue.id}`,
      name: `should fix: ${issue.title}`,
      category: issue.category,
      language: language,
      framework: framework,
      code: testCode,
      relatedIssue: issue.id,
      priority: issue.severity
    };
  }

  /**
   * Generate mocks for dependencies
   * @param {Object} codeAnalysis - Code analysis with dependencies
   * @returns {Object} Mock setup code
   */
  generateMocks(codeAnalysis) {
    const mocks = {
      database: null,
      api: null,
      fileSystem: null
    };
    
    if (codeAnalysis.inputAnalysis.hasDatabaseCalls) {
      mocks.database = this.generateDatabaseMock();
    }
    
    // Check for API calls in dependencies
    const hasApiCalls = codeAnalysis.inputAnalysis.dependencies?.some(d => 
      d.name.includes('axios') || d.name.includes('fetch') || d.name.includes('http')
    );
    
    if (hasApiCalls) {
      mocks.api = this.generateApiMock();
    }
    
    return mocks;
  }

  /**
   * Generate database mock
   */
  generateDatabaseMock() {
    return `// Database mock
const mockDb = {
  users: {
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};`;
  }

  /**
   * Generate API mock
   */
  generateApiMock() {
    return `// API mock
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};`;
  }
}

module.exports = TestGenerationService;
