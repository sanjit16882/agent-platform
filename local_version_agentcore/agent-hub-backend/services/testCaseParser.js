/**
 * Test Case Parser
 * 
 * Parses test case definitions from YAML and JSON formats
 */

const yaml = require('js-yaml');
const fs = require('fs').promises;

class TestCaseParser {
  /**
   * Parse test case file
   * @param {string} filepath - Path to test case file
   * @returns {Promise<object>} - Parsed test suite
   */
  async parseFile(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      
      if (filepath.endsWith('.yaml') || filepath.endsWith('.yml')) {
        return this.parseYAML(content);
      } else if (filepath.endsWith('.json')) {
        return this.parseJSON(content);
      } else {
        throw new Error(`Unsupported file format: ${filepath}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse test case file: ${error.message}`);
    }
  }

  /**
   * Parse YAML content
   * @param {string} content - YAML content
   * @returns {object} - Parsed test suite
   */
  parseYAML(content) {
    try {
      const data = yaml.load(content);
      return this.validateAndNormalize(data);
    } catch (error) {
      throw new Error(`YAML parsing error: ${error.message}`);
    }
  }

  /**
   * Parse JSON content
   * @param {string} content - JSON content
   * @returns {object} - Parsed test suite
   */
  parseJSON(content) {
    try {
      const data = JSON.parse(content);
      return this.validateAndNormalize(data);
    } catch (error) {
      throw new Error(`JSON parsing error: ${error.message}`);
    }
  }

  /**
   * Validate and normalize test suite structure
   * @param {object} data - Raw parsed data
   * @returns {object} - Normalized test suite
   */
  validateAndNormalize(data) {
    // Validate required fields
    if (!data.version) {
      throw new Error('Missing required field: version');
    }

    if (!data.tests || !Array.isArray(data.tests)) {
      throw new Error('Missing or invalid field: tests (must be an array)');
    }

    // Normalize test suite
    const suite = {
      version: data.version,
      agent: data.agent || null,
      description: data.description || '',
      tests: []
    };

    // Validate and normalize each test case
    for (let i = 0; i < data.tests.length; i++) {
      try {
        const testCase = this.validateTestCase(data.tests[i], i);
        suite.tests.push(testCase);
      } catch (error) {
        throw new Error(`Test case ${i + 1}: ${error.message}`);
      }
    }

    return suite;
  }

  /**
   * Validate individual test case
   * @param {object} testCase - Test case data
   * @param {number} index - Test case index
   * @returns {object} - Validated test case
   */
  validateTestCase(testCase, index) {
    // Required fields
    if (!testCase.name) {
      throw new Error('Missing required field: name');
    }

    if (!testCase.id) {
      // Generate ID if not provided
      testCase.id = `test-${index + 1}`;
    }

    if (!testCase.input) {
      throw new Error('Missing required field: input');
    }

    // Normalize input
    const normalizedInput = this.normalizeInput(testCase.input);

    // Normalize expected output
    const normalizedExpectedOutput = this.normalizeExpectedOutput(
      testCase.expected_output || {}
    );

    // Normalize validation rules
    const normalizedValidation = this.normalizeValidation(
      testCase.validation || {}
    );

    // Normalize metadata
    const normalizedMetadata = this.normalizeMetadata(
      testCase.metadata || {}
    );

    return {
      id: testCase.id,
      name: testCase.name,
      input: normalizedInput,
      expected_output: normalizedExpectedOutput,
      validation: normalizedValidation,
      metadata: normalizedMetadata
    };
  }

  /**
   * Normalize input field
   * @param {string|object} input - Input data
   * @returns {object} - Normalized input
   */
  normalizeInput(input) {
    if (typeof input === 'string') {
      return {
        type: 'text',
        content: input
      };
    }

    if (typeof input === 'object') {
      return {
        type: input.type || 'text',
        content: input.content || '',
        variables: input.variables || {}
      };
    }

    throw new Error('Invalid input format');
  }

  /**
   * Normalize expected output field
   * @param {object} expectedOutput - Expected output data
   * @returns {object} - Normalized expected output
   */
  normalizeExpectedOutput(expectedOutput) {
    return {
      contains: expectedOutput.contains || [],
      not_contains: expectedOutput.not_contains || [],
      exact_match: expectedOutput.exact_match || null,
      pattern: expectedOutput.pattern || null,
      error_expected: expectedOutput.error_expected || false,
      error_message_contains: expectedOutput.error_message_contains || [],
      not_empty: expectedOutput.not_empty || false,
      max_response_time: expectedOutput.max_response_time || null,
      max_length: expectedOutput.max_length || null
    };
  }

  /**
   * Normalize validation rules
   * @param {object} validation - Validation rules
   * @returns {object} - Normalized validation rules
   */
  normalizeValidation(validation) {
    const normalized = {
      tolerance: validation.tolerance !== undefined ? validation.tolerance : 0.8,
      max_length: validation.max_length || null,
      min_length: validation.min_length || null,
      max_tokens: validation.max_tokens || null,
      max_cost: validation.max_cost || null,
      max_duration: validation.max_duration || null,
      max_memory_mb: validation.max_memory_mb || null
    };

    // Validate tolerance range
    if (normalized.tolerance < 0 || normalized.tolerance > 1) {
      throw new Error('tolerance must be between 0 and 1');
    }

    return normalized;
  }

  /**
   * Normalize metadata
   * @param {object} metadata - Metadata
   * @returns {object} - Normalized metadata
   */
  normalizeMetadata(metadata) {
    return {
      priority: metadata.priority || 'medium',
      tags: metadata.tags || [],
      timeout: metadata.timeout || 30000,
      concurrent_requests: metadata.concurrent_requests || 1
    };
  }

  /**
   * Validate test suite schema
   * @param {object} suite - Test suite to validate
   * @returns {object} - Validation result
   */
  validateSchema(suite) {
    const errors = [];

    // Check version
    if (!suite.version) {
      errors.push('Missing version field');
    }

    // Check tests array
    if (!suite.tests || !Array.isArray(suite.tests)) {
      errors.push('Missing or invalid tests array');
    } else {
      // Validate each test case
      suite.tests.forEach((test, index) => {
        if (!test.name) {
          errors.push(`Test ${index + 1}: Missing name`);
        }
        if (!test.id) {
          errors.push(`Test ${index + 1}: Missing id`);
        }
        if (!test.input) {
          errors.push(`Test ${index + 1}: Missing input`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert test suite to YAML string
   * @param {object} suite - Test suite
   * @returns {string} - YAML string
   */
  toYAML(suite) {
    return yaml.dump(suite, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Convert test suite to JSON string
   * @param {object} suite - Test suite
   * @returns {string} - JSON string
   */
  toJSON(suite) {
    return JSON.stringify(suite, null, 2);
  }
}

module.exports = TestCaseParser;
