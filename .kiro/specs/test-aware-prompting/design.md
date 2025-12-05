# Design Document

## Overview

This design enhances the Agent Testing platform's prompt construction to be "test-aware" by incorporating test metadata into the system prompts sent to AI models. The enhancement ensures that AI models receive clear, test-specific instructions about expected output formats and behaviors, resulting in meaningful and appropriate responses for each test type.

The design maintains backward compatibility with existing tests while adding a new layer of test-specific context to prompts. It introduces a test metadata parser, output format mapper, and enhanced prompt builder that work together to create contextually appropriate prompts.

## Architecture

### Current Architecture

```
User Input → StepExecute (UI)
              ↓
         testingRoutes.js (API)
              ↓
         testExecutionService.js
              ↓ prepareTestInput()
              ↓ invokeAgent()
              ↓
         bedrockService.js
              ↓ buildPrompt(agentType, userPrompt, context)
              ↓
         AWS Bedrock (AI Model)
```

### Enhanced Architecture

```
User Input → StepExecute (UI)
              ↓
         testingRoutes.js (API)
              ↓
         testExecutionService.js
              ↓ prepareTestInput()
              ↓ invokeAgent() [ENHANCED: passes test metadata]
              ↓
         bedrockService.js
              ↓ buildPrompt(agentType, userPrompt, context, testMetadata) [NEW PARAM]
              ↓ parseTestMetadata(testMetadata) [NEW METHOD]
              ↓ inferOutputFormat(testCategory, testMetadata) [NEW METHOD]
              ↓ buildTestAwarePrompt() [NEW METHOD]
              ↓
         AWS Bedrock (AI Model)
```

## Components and Interfaces

### 1. Enhanced Test Execution Service

**File**: `local_version/agent-hub-backend/services/testExecutionService.js`

**Changes**:
- Modify `invokeAgent()` method to pass test metadata to bedrockService
- Add test metadata to context object

**New Interface**:
```javascript
async invokeAgent(agentId, input, options, testMetadata = null) {
  // ... existing code ...
  
  const context = {
    test_mode: true,
    agent_id: agentId,
    model_id: options.modelId,
    intent: intent,
    test_metadata: testMetadata, // NEW: pass test metadata
    ...options.context
  };
  
  const response = await bedrockService.callBedrock(
    agentType,
    typeof input === 'string' ? input : JSON.stringify(input),
    context
  );
  
  return response;
}
```

**Modified Call Site** in `executeTest()`:
```javascript
// Pass test metadata to invokeAgent
const agentResponse = await this.invokeAgent(agentId, input, options, test);
```

### 2. Enhanced Bedrock Service

**File**: `local_version/agent-hub-backend/src/services/bedrockService.js`

**New Methods**:

#### parseTestMetadata(testMetadata)
Extracts relevant information from test metadata for prompt construction.

```javascript
parseTestMetadata(testMetadata) {
  if (!testMetadata) return null;
  
  return {
    testName: testMetadata.name,
    testCategory: testMetadata.category,
    expectedBehavior: testMetadata.expected_behavior,
    scoringRules: testMetadata.scoring_rules,
    inputFormat: testMetadata.input_format,
    outputFormat: testMetadata.output_format, // NEW field
    samplePrompts: testMetadata.sample_prompts
  };
}
```

#### inferOutputFormat(testCategory, testMetadata)
Determines the expected output format based on test category and metadata.

```javascript
inferOutputFormat(testCategory, testMetadata) {
  // Explicit output_format in metadata takes precedence
  if (testMetadata?.output_format) {
    return testMetadata.output_format;
  }
  
  // Infer from test category
  const categoryFormatMap = {
    'development_documentation': 'markdown',
    'development_code_generation': 'code',
    'development_code_review': 'analysis',
    'development_bug_fixing': 'code',
    'qe_test_case_creation': 'structured_text',
    'qe_defect_reporting': 'structured_text',
    'security_vulnerability': 'json',
    'security_audit': 'json',
    'devops_cicd': 'yaml',
    'devops_iac': 'code'
  };
  
  return categoryFormatMap[testCategory] || 'plain_text';
}
```

#### buildTestAwarePrompt(agentType, userPrompt, context, parsedMetadata)
Constructs a test-aware prompt by combining agent-type prompts with test-specific context.

```javascript
buildTestAwarePrompt(agentType, userPrompt, context, parsedMetadata) {
  // Get base prompt from existing logic
  const basePrompt = this.buildPrompt(agentType, userPrompt, context);
  
  if (!parsedMetadata) {
    return basePrompt; // Backward compatible
  }
  
  // Determine output format
  const outputFormat = this.inferOutputFormat(
    parsedMetadata.testCategory, 
    parsedMetadata
  );
  
  // Build test-specific instructions
  const testInstructions = this.buildTestInstructions(
    parsedMetadata, 
    outputFormat
  );
  
  // Combine base prompt with test-specific instructions
  return `${basePrompt}

${testInstructions}`;
}
```

#### buildTestInstructions(parsedMetadata, outputFormat)
Creates test-specific instructions based on metadata and output format.

```javascript
buildTestInstructions(parsedMetadata, outputFormat) {
  let instructions = '\n--- TEST-SPECIFIC INSTRUCTIONS ---\n';
  
  // Add test context
  instructions += `Test: ${parsedMetadata.testName}\n`;
  instructions += `Category: ${parsedMetadata.testCategory}\n\n`;
  
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
```

#### getOutputFormatInstructions(outputFormat)
Returns format-specific instructions for the AI model.

```javascript
getOutputFormatInstructions(outputFormat) {
  const formatInstructions = {
    'markdown': `
OUTPUT FORMAT REQUIREMENTS:
- Respond ONLY with markdown formatted text
- Use proper markdown syntax (headers, lists, code blocks, etc.)
- Do NOT generate executable code as the main response
- Do NOT include explanations outside of the markdown document
- If showing code examples, use markdown code blocks with language tags
- Start your response with a markdown header (#)
`,
    'code': `
OUTPUT FORMAT REQUIREMENTS:
- Respond ONLY with executable code
- Do NOT include explanations or descriptions
- Do NOT use markdown formatting
- Do NOT add text before or after the code
- Include only minimal inline comments if necessary
- The first line of your response MUST be code
`,
    'json': `
OUTPUT FORMAT REQUIREMENTS:
- Respond ONLY with valid JSON
- Do NOT include explanations before or after the JSON
- Do NOT use markdown code blocks
- Ensure the JSON is properly formatted and parseable
- Start your response with { or [
`,
    'analysis': `
OUTPUT FORMAT REQUIREMENTS:
- Provide detailed analysis and feedback
- Use clear structure with sections
- Include specific examples and recommendations
- Be thorough but concise
`,
    'structured_text': `
OUTPUT FORMAT REQUIREMENTS:
- Use clear structure with headers and sections
- Include bullet points or numbered lists where appropriate
- Be specific and actionable
`,
    'yaml': `
OUTPUT FORMAT REQUIREMENTS:
- Respond ONLY with valid YAML
- Do NOT include explanations before or after the YAML
- Do NOT use markdown code blocks
- Ensure proper YAML indentation and syntax
`,
    'plain_text': `
OUTPUT FORMAT REQUIREMENTS:
- Respond with clear, well-structured text
- Use appropriate formatting for readability
`
  };
  
  return formatInstructions[outputFormat] || formatInstructions['plain_text'];
}
```

#### getScoringCriteria(scoringRules)
Extracts key criteria from scoring rules to guide the AI model.

```javascript
getScoringCriteria(scoringRules) {
  if (!scoringRules || typeof scoringRules !== 'object') {
    return '';
  }
  
  let criteria = '\nKEY EVALUATION CRITERIA:\n';
  criteria += 'Your response will be evaluated on:\n';
  
  Object.keys(scoringRules).forEach(ruleName => {
    const rule = scoringRules[ruleName];
    if (rule.criteria) {
      criteria += `- ${ruleName}: ${rule.criteria}\n`;
    }
  });
  
  return criteria + '\n';
}
```

**Modified buildPrompt() method**:
```javascript
buildPrompt(agentType, userPrompt, context) {
  // Check if test metadata is available
  if (context.test_metadata) {
    const parsedMetadata = this.parseTestMetadata(context.test_metadata);
    return this.buildTestAwarePrompt(agentType, userPrompt, context, parsedMetadata);
  }
  
  // Existing logic for non-test executions or tests without metadata
  // ... (keep all existing code)
}
```

### 3. Test Metadata Schema Enhancement

**File**: Test library data structure (in-memory or database)

**New Field**:
```javascript
{
  id: 'test-id',
  name: 'Test Name',
  category: 'development_documentation',
  expected_behavior: 'Generate a README.md file...',
  scoring_rules: { /* existing */ },
  input_format: 'plain_text',
  output_format: 'markdown', // NEW FIELD (optional)
  sample_prompts: [ /* existing */ ]
}
```

### 4. Logging Enhancement

**File**: `local_version/agent-hub-backend/src/services/bedrockService.js`

**Enhanced Logging**:
```javascript
async callBedrock(agentType, prompt, context = {}) {
  // ... existing code ...
  
  const promptText = this.buildPrompt(agentType, prompt, context);
  
  // Enhanced logging
  if (context.test_metadata) {
    console.log(`📝 Test-Aware Prompt Construction:`);
    console.log(`   Test: ${context.test_metadata.name}`);
    console.log(`   Category: ${context.test_metadata.category}`);
    console.log(`   Output Format: ${this.inferOutputFormat(context.test_metadata.category, context.test_metadata)}`);
    console.log(`   Prompt Length: ${promptText.length} characters`);
    
    if (process.env.DEBUG_PROMPTS === 'true') {
      console.log(`   Full Prompt:\n${promptText}`);
    }
  }
  
  // ... rest of existing code ...
}
```

## Data Models

### Test Metadata Structure

```typescript
interface TestMetadata {
  id: string;
  name: string;
  category: string;
  expected_behavior: string;
  scoring_rules?: {
    [criterionName: string]: {
      weight: number;
      criteria: string;
    };
  };
  input_format: 'plain_text' | 'json' | 'multi_turn' | 'parameterized';
  output_format?: 'markdown' | 'code' | 'json' | 'analysis' | 'structured_text' | 'yaml' | 'plain_text';
  sample_prompts?: string[];
  input_content: string;
}
```

### Parsed Test Metadata

```typescript
interface ParsedTestMetadata {
  testName: string;
  testCategory: string;
  expectedBehavior: string;
  scoringRules?: object;
  inputFormat: string;
  outputFormat?: string;
  samplePrompts?: string[];
}
```

### Context Object Enhancement

```typescript
interface BedrockContext {
  test_mode: boolean;
  agent_id: string;
  model_id?: string;
  intent?: string;
  test_metadata?: TestMetadata; // NEW
  [key: string]: any;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Test metadata incorporation
*For any* test execution with test metadata, the generated prompt should include the test's expected_behavior and output format instructions
**Validates: Requirements 1.1, 1.2, 2.1**

### Property 2: Output format consistency
*For any* test with category "development_documentation", the prompt should explicitly instruct the model to respond with markdown and NOT code
**Validates: Requirements 1.3, 4.1**

### Property 3: Code generation format enforcement
*For any* test with category "development_code_generation", the prompt should explicitly instruct the model to respond with code only and NOT explanations
**Validates: Requirements 1.4, 4.2**

### Property 4: Backward compatibility preservation
*For any* test execution without test metadata, the system should use the existing agent-type based prompt without failing
**Validates: Requirements 3.1, 3.2, 2.5**

### Property 5: Scoring criteria inclusion
*For any* test with scoring_rules defined, the prompt should include the criteria from those rules as guidelines
**Validates: Requirements 1.5, 2.2**

### Property 6: Category-specific format mapping
*For any* test category, the system should map it to an appropriate output format (markdown, code, json, etc.)
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 7: Prompt logging completeness
*For any* test execution, the system should log the complete prompt sent to the AI model
**Validates: Requirements 5.1, 5.2**

### Property 8: Metadata field propagation
*For any* test with output_format specified in metadata, that format should take precedence over category-inferred format
**Validates: Requirements 6.1, 6.5**

### Property 9: Consistent prompt construction
*For any* test executed multiple times with the same metadata, the system should generate identical prompts each time
**Validates: Requirements 7.1, 7.3**

### Property 10: Batch execution consistency
*For any* batch of tests executed together, each test should receive its own test-aware prompt based on its individual metadata
**Validates: Requirements 7.4**

## Error Handling

### Missing Test Metadata
- **Scenario**: Test object doesn't include expected_behavior or other metadata fields
- **Handling**: Fall back to existing agent-type based prompts
- **Logging**: Log warning that test metadata is incomplete but continue execution

### Invalid Output Format
- **Scenario**: Test metadata specifies an unsupported output_format value
- **Handling**: Fall back to inferring format from category, or use 'plain_text' as default
- **Logging**: Log warning about invalid format and the fallback used

### Malformed Scoring Rules
- **Scenario**: scoring_rules field is not a valid object or has unexpected structure
- **Handling**: Skip scoring criteria inclusion in prompt, continue with other metadata
- **Logging**: Log warning about malformed scoring rules

### Prompt Construction Failure
- **Scenario**: Error occurs during test-aware prompt building
- **Handling**: Catch error, fall back to base prompt without test enhancements
- **Logging**: Log error with full details and stack trace, include test ID and metadata

### Context Object Missing
- **Scenario**: Context object is null or undefined in buildPrompt
- **Handling**: Treat as non-test execution, use default prompt building
- **Logging**: No special logging needed (normal operation)

## Testing Strategy

### Unit Tests

**File**: `local_version/agent-hub-backend/tests/bedrockService.test.js`

1. **Test parseTestMetadata()**
   - Valid metadata with all fields
   - Metadata with missing optional fields
   - Null/undefined metadata
   - Malformed metadata

2. **Test inferOutputFormat()**
   - Each test category maps to correct format
   - Explicit output_format takes precedence
   - Unknown category defaults to plain_text
   - Null/undefined inputs

3. **Test getOutputFormatInstructions()**
   - Each format returns appropriate instructions
   - Instructions contain format-specific keywords
   - Unknown format defaults to plain_text instructions

4. **Test buildTestInstructions()**
   - Complete metadata generates full instructions
   - Partial metadata generates partial instructions
   - Null metadata returns empty string

5. **Test getScoringCriteria()**
   - Valid scoring rules are formatted correctly
   - Empty scoring rules return empty string
   - Malformed scoring rules don't crash

6. **Test buildTestAwarePrompt()**
   - Combines base prompt with test instructions
   - Handles null metadata gracefully
   - Preserves existing prompt structure

7. **Test backward compatibility**
   - Tests without metadata use old prompts
   - Existing agent-type logic still works
   - Intent detection still functions

### Integration Tests

**File**: `local_version/agent-hub-backend/tests/testExecution.integration.test.js`

1. **Test end-to-end documentation test**
   - Execute development_documentation test
   - Verify prompt includes "markdown" instructions
   - Verify model response is markdown, not code

2. **Test end-to-end code generation test**
   - Execute development_code_generation test
   - Verify prompt includes "code only" instructions
   - Verify model response is code, not explanation

3. **Test metadata propagation**
   - Execute test with full metadata
   - Verify all metadata fields appear in prompt
   - Verify scoring criteria are included

4. **Test fallback behavior**
   - Execute test without metadata
   - Verify system uses agent-type prompt
   - Verify no errors occur

5. **Test batch execution**
   - Execute multiple tests with different categories
   - Verify each gets appropriate prompt
   - Verify no cross-contamination

### Property-Based Tests

**Framework**: fast-check (JavaScript property-based testing library)

**File**: `local_version/agent-hub-backend/tests/bedrockService.property.test.js`

1. **Property Test: Metadata incorporation**
   - Generate random test metadata
   - Build prompt with metadata
   - Verify prompt contains expected_behavior text
   - **Validates: Property 1**

2. **Property Test: Output format consistency**
   - Generate random tests with category "development_documentation"
   - Build prompts for each
   - Verify all prompts contain "markdown" and "NOT code"
   - **Validates: Property 2**

3. **Property Test: Backward compatibility**
   - Generate random agent types and user prompts
   - Build prompts without test metadata
   - Verify prompts match existing buildPrompt() output
   - **Validates: Property 4**

4. **Property Test: Format precedence**
   - Generate random tests with both category and explicit output_format
   - Build prompts
   - Verify explicit format takes precedence
   - **Validates: Property 8**

5. **Property Test: Idempotent prompt construction**
   - Generate random test metadata
   - Build prompt twice with same metadata
   - Verify both prompts are identical
   - **Validates: Property 9**

### Manual Testing Checklist

1. Run README Generation test → verify markdown output
2. Run Code Generation test → verify code output
3. Run Security Vulnerability test → verify JSON output
4. Run test without metadata → verify no errors
5. Check logs for prompt details
6. Enable DEBUG_PROMPTS=true → verify full prompt logging
7. Run batch tests → verify each gets correct prompt
8. Test model comparison → verify same prompts to all models

## Implementation Notes

### Phase 1: Core Prompt Enhancement (High Priority)
1. Add test metadata parameter to invokeAgent()
2. Implement parseTestMetadata()
3. Implement inferOutputFormat()
4. Implement getOutputFormatInstructions()
5. Implement buildTestInstructions()
6. Modify buildPrompt() to check for test_metadata
7. Implement getScoringCriteria()
8. Implement buildTestAwarePrompt()

### Phase 2: Sample Prompt Enhancement (High Priority)
9. Implement generatePromptsForTest() in samplePromptService
10. Implement inferAgentType()
11. Implement getPromptTemplatesForCategory()
12. Implement customizePromptForAgent()
13. Implement inferPrimaryLanguage()
14. Implement getRelevantCodeSample()
15. Update /api/testing/sample-prompts route to support test-aware generation

### Phase 3: Logging & Debugging (Medium Priority)
16. Add enhanced logging in bedrockService
17. Add DEBUG_PROMPTS environment variable support
18. Add prompt logging to test execution results
19. Add sample prompt generation logging

### Phase 4: Testing & Validation (High Priority)
20. Write unit tests for bedrockService methods
21. Write unit tests for samplePromptService methods
22. Write integration tests for end-to-end flows
23. Write property-based tests for correctness properties
24. Manual testing with real tests

### Rollout Strategy
- Deploy to development environment first
- Test with subset of tests (documentation, code generation)
- Monitor logs for any issues
- Gradually enable for all test categories
- Monitor test pass rates and output quality

### Performance Considerations
- Prompt construction adds minimal overhead (<10ms)
- No additional API calls required
- Caching not needed (prompts built on-demand)
- Logging can be controlled via environment variable

### Security Considerations
- Test metadata is trusted input (from test library)
- No user-provided data in test metadata
- Prompt injection not a concern (controlled environment)
- Logging should not expose sensitive data

### 5. Sample Prompt Library

**Approach**: Create a comprehensive library of 100+ pre-written, meaningful sample prompts mapped to categories, subcategories, tests, and agent types. Use intelligent filtering to display the most relevant prompts.

**Files**:
- `local_version/agent-hub-backend/data/samplePromptLibrary.json` (or database table)
- `local_version/agent-hub-backend/services/samplePromptService.js` (filtering logic)

**Problem**: Current sample prompts are generic and don't provide enough context for the model to understand what's expected.

**Solution**: Pre-written, detailed sample prompts that are:
- ✅ Meaningful and contextually rich
- ✅ 100% aligned to agent context
- ✅ Provide enough test details for model understanding
- ✅ Filtered intelligently based on agent + test combination

### Sample Prompt Library Schema

**Database Table** (or JSON structure):
```sql
CREATE TABLE sample_prompt_library (
  id TEXT PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  test_id TEXT, -- optional: specific test this applies to
  agent_type TEXT, -- e.g., 'code-review', 'documentation', 'security'
  agent_category TEXT, -- e.g., 'Development', 'QE', 'Security'
  agent_subtype TEXT, -- e.g., 'code-review', 'bug-fixing'
  language TEXT, -- e.g., 'Python', 'JavaScript', 'any'
  priority INTEGER DEFAULT 0,
  tags TEXT, -- JSON array: ["beginner", "advanced", "with-code"]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**JSON Structure** (alternative to database):
```json
{
  "id": "sp-dev-doc-001",
  "prompt_text": "Generate a comprehensive README.md for a Python data processing library. Include: installation instructions, usage examples with code snippets, API reference for main functions, and contribution guidelines. The library processes CSV files and performs data validation.",
  "category": "development_documentation",
  "subcategory": "readme_generation",
  "test_id": null,
  "agent_type": "documentation",
  "agent_category": "Development",
  "agent_subtype": null,
  "language": "Python",
  "priority": 10,
  "tags": ["detailed", "with-context", "beginner-friendly"]
}
```

### Enhanced Sample Prompt Service

**File**: `local_version/agent-hub-backend/services/samplePromptService.js`

**New Method**: `getPromptsForTest(agent, test)`

```javascript
/**
 * Get relevant sample prompts for a specific test and agent combination
 * Uses intelligent filtering on the sample prompt library
 * @param {Object} agent - The agent object
 * @param {Object} test - The test object
 * @returns {Array<string>} Array of 3-4 most relevant sample prompts
 */
async getPromptsForTest(agent, test) {
  console.log(`🎯 Filtering prompts for test: ${test.name}, agent: ${agent.name}`);
  
  // Load sample prompt library
  const allPrompts = await this.loadSamplePromptLibrary();
  
  // Extract agent characteristics
  const agentType = this.inferAgentType(agent);
  const agentCategory = agent.category;
  const agentSubtype = agent.subtype;
  const agentLanguage = this.inferPrimaryLanguage(agent);
  
  // Extract test characteristics
  const testCategory = test.category;
  const testId = test.id;
  
  console.log(`📊 Filtering criteria:`, {
    agentType,
    agentCategory,
    agentSubtype,
    agentLanguage,
    testCategory,
    testId
  });
  
  // Filter and score prompts
  const scoredPrompts = allPrompts
    .map(prompt => ({
      prompt,
      score: this.calculateRelevanceScore(prompt, {
        agentType,
        agentCategory,
        agentSubtype,
        agentLanguage,
        testCategory,
        testId
      })
    }))
    .filter(item => item.score > 0) // Only keep relevant prompts
    .sort((a, b) => b.score - a.score); // Sort by relevance
  
  console.log(`✅ Found ${scoredPrompts.length} relevant prompts`);
  
  // Return top 3-4 prompts
  return scoredPrompts
    .slice(0, 4)
    .map(item => item.prompt.prompt_text);
}
```

**New Method**: `loadSamplePromptLibrary()`

```javascript
/**
 * Load sample prompt library from JSON file or database
 * @returns {Array<Object>} Array of sample prompt objects
 */
async loadSamplePromptLibrary() {
  // Option 1: Load from JSON file
  if (!this.db) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../data/samplePromptLibrary.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  
  // Option 2: Load from database
  const query = 'SELECT * FROM sample_prompt_library ORDER BY priority DESC';
  return await this.db.all(query);
}
```

**New Method**: `calculateRelevanceScore(prompt, criteria)`

```javascript
/**
 * Calculate relevance score for a sample prompt based on agent and test criteria
 * Higher score = more relevant
 * @param {Object} prompt - Sample prompt object
 * @param {Object} criteria - Filtering criteria (agentType, testCategory, etc.)
 * @returns {number} Relevance score (0-100)
 */
calculateRelevanceScore(prompt, criteria) {
  let score = 0;
  
  // Exact test match (highest priority)
  if (prompt.test_id && prompt.test_id === criteria.testId) {
    score += 50;
  }
  
  // Category match (high priority)
  if (prompt.category === criteria.testCategory) {
    score += 30;
  }
  
  // Agent type match
  if (prompt.agent_type === criteria.agentType) {
    score += 15;
  }
  
  // Agent category match
  if (prompt.agent_category === criteria.agentCategory) {
    score += 10;
  }
  
  // Agent subtype match
  if (prompt.agent_subtype && prompt.agent_subtype === criteria.agentSubtype) {
    score += 10;
  }
  
  // Language match (or 'any' language)
  if (prompt.language === 'any' || prompt.language === criteria.agentLanguage) {
    score += 5;
  }
  
  // Priority boost from library
  score += (prompt.priority || 0);
  
  return score;
}
```

**New Method**: `inferAgentType(agent)` (unchanged)

```javascript
/**
 * Infer agent type from agent configuration
 * @param {Object} agent - The agent object
 * @returns {string} Agent type
 */
inferAgentType(agent) {
  const name = (agent.name || '').toLowerCase();
  const description = (agent.description || '').toLowerCase();
  const category = (agent.category || '').toLowerCase();
  const subtype = (agent.subtype || '').toLowerCase();
  
  // Map to agent types
  if (name.includes('code review') || subtype.includes('code-review')) {
    return 'code-review';
  }
  if (name.includes('documentation') || subtype.includes('documentation')) {
    return 'documentation';
  }
  if (name.includes('security') || category.includes('security')) {
    return 'security';
  }
  if (name.includes('test') || subtype.includes('test')) {
    return 'testing';
  }
  if (category.includes('development')) {
    return 'development';
  }
  if (category.includes('qe')) {
    return 'qe';
  }
  
  return 'general';
}
```

**New Method**: `getPromptTemplatesForCategory(category)`

```javascript
/**
 * Get prompt templates for a test category
 * @param {string} category - Test category
 * @returns {Array<string>} Array of prompt templates
 */
getPromptTemplatesForCategory(category) {
  const templates = {
    'development_documentation': [
      'Generate a comprehensive README.md for this {component} that includes installation, usage, and examples.',
      'Create API documentation for the following {component} with parameter descriptions and return values.',
      'Write inline code documentation for this {component} following best practices.',
      'Generate a user guide for this {component} that explains its purpose and how to use it.'
    ],
    
    'development_code_generation': [
      'Generate a {language} function that {task} with proper error handling.',
      'Create a {language} class that implements {functionality} following SOLID principles.',
      'Write a {language} script that {task} and includes unit tests.',
      'Implement a {language} module for {functionality} with comprehensive documentation.'
    ],
    
    'development_code_review': [
      'Review this code for potential bugs, security issues, and performance problems:\n\n{code_sample}',
      'Analyze this implementation for code quality, maintainability, and best practices:\n\n{code_sample}',
      'Check this code for edge cases, error handling, and potential improvements:\n\n{code_sample}',
      'Evaluate this code against industry standards and suggest optimizations:\n\n{code_sample}'
    ],
    
    'development_bug_fixing': [
      'This code has a bug where {issue}. Please identify and fix it:\n\n{code_sample}',
      'Debug this code that\'s producing {error}:\n\n{code_sample}',
      'Fix the logic error in this implementation:\n\n{code_sample}',
      'Resolve the issue causing {problem} in this code:\n\n{code_sample}'
    ],
    
    'qe_test_case_creation': [
      'Generate test cases for {feature} covering happy path, edge cases, and error conditions.',
      'Create a test plan for {functionality} including unit, integration, and end-to-end tests.',
      'Write test scenarios for {component} that validate all acceptance criteria.',
      'Design test cases for {feature} focusing on boundary conditions and negative testing.'
    ],
    
    'qe_defect_reporting': [
      'Analyze this test failure and create a detailed defect report:\n\n{failure_details}',
      'Generate a bug report for the issue where {problem} occurs.',
      'Create a defect report with steps to reproduce for {issue}.',
      'Document this bug with severity, impact, and reproduction steps:\n\n{bug_details}'
    ],
    
    'security_vulnerability': [
      'Scan this code for security vulnerabilities:\n\n{code_sample}',
      'Identify potential security risks in this implementation:\n\n{code_sample}',
      'Analyze this code for SQL injection, XSS, and other security issues:\n\n{code_sample}',
      'Perform a security audit on this code and report findings:\n\n{code_sample}'
    ],
    
    'security_audit': [
      'Conduct a security audit of this {component} and provide recommendations.',
      'Review this system architecture for security weaknesses:\n\n{architecture}',
      'Analyze this authentication implementation for security flaws:\n\n{code_sample}',
      'Evaluate this API for security best practices and vulnerabilities.'
    ],
    
    'devops_cicd': [
      'Generate a CI/CD pipeline configuration for {project} using {tool}.',
      'Create a deployment workflow for {application} with automated testing.',
      'Design a build pipeline that includes linting, testing, and deployment stages.',
      'Write a CI configuration for {project} that runs on {platform}.'
    ],
    
    'devops_iac': [
      'Generate Terraform configuration for {infrastructure}.',
      'Create a CloudFormation template for {resources}.',
      'Write infrastructure as code for {environment} using {tool}.',
      'Design IaC for {system} with proper resource organization and naming.'
    ]
  };
  
  return templates[category] || [
    `Test the ${category} capability with a relevant example.`,
    `Evaluate ${category} functionality with appropriate input.`,
    `Demonstrate ${category} behavior with a realistic scenario.`
  ];
}
```

**New Method**: `customizePromptForAgent(template, agent, outputFormat)`

```javascript
/**
 * Customize a prompt template for a specific agent
 * @param {string} template - Prompt template with placeholders
 * @param {Object} agent - Agent object
 * @param {string} outputFormat - Expected output format
 * @returns {string} Customized prompt
 */
customizePromptForAgent(template, agent, outputFormat) {
  let prompt = template;
  
  // Replace placeholders
  prompt = prompt.replace(/{component}/g, 'component');
  prompt = prompt.replace(/{language}/g, this.inferPrimaryLanguage(agent));
  prompt = prompt.replace(/{task}/g, 'performs a specific operation');
  prompt = prompt.replace(/{functionality}/g, 'the required functionality');
  prompt = prompt.replace(/{feature}/g, 'the feature');
  prompt = prompt.replace(/{tool}/g, 'GitHub Actions');
  prompt = prompt.replace(/{platform}/g, 'GitHub');
  
  // Add code samples for code-related prompts
  if (prompt.includes('{code_sample}')) {
    const codeSample = this.getRelevantCodeSample(agent);
    prompt = prompt.replace(/{code_sample}/g, codeSample);
  }
  
  // Add output format hint if needed
  if (outputFormat === 'markdown') {
    prompt += '\n\nPlease respond in markdown format.';
  } else if (outputFormat === 'code') {
    prompt += '\n\nPlease respond with code only, no explanations.';
  }
  
  return prompt;
}
```

**New Method**: `inferPrimaryLanguage(agent)`

```javascript
/**
 * Infer the primary programming language from agent configuration
 * @param {Object} agent - Agent object
 * @returns {string} Programming language
 */
inferPrimaryLanguage(agent) {
  const description = (agent.description || '').toLowerCase();
  const name = (agent.name || '').toLowerCase();
  
  if (description.includes('python') || name.includes('python')) return 'Python';
  if (description.includes('javascript') || name.includes('javascript')) return 'JavaScript';
  if (description.includes('typescript') || name.includes('typescript')) return 'TypeScript';
  if (description.includes('java') || name.includes('java')) return 'Java';
  if (description.includes('go') || name.includes('go')) return 'Go';
  if (description.includes('rust') || name.includes('rust')) return 'Rust';
  
  return 'JavaScript'; // Default
}
```

**New Method**: `getRelevantCodeSample(agent)`

```javascript
/**
 * Get a relevant code sample based on agent type
 * @param {Object} agent - Agent object
 * @returns {string} Code sample
 */
getRelevantCodeSample(agent) {
  const language = this.inferPrimaryLanguage(agent);
  
  const samples = {
    'Python': `def calculate_total(items):
    total = 0
    for item in items:
        total += item['price']
    return total`,
    
    'JavaScript': `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}`,
    
    'TypeScript': `function calculateTotal(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  return total;
}`
  };
  
  return samples[language] || samples['JavaScript'];
}
```

**Modified API Route**: Update `/api/testing/sample-prompts` to use test-aware generation

```javascript
router.get('/sample-prompts', async (req, res) => {
  try {
    const { agentId, testIds } = req.query;
    
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'agentId is required'
      });
    }
    
    const agent = await agentService.getAgentById(agentId);
    
    let prompts;
    
    if (testIds && testIds.length > 0) {
      // NEW: Generate test-aware prompts
      const tests = await Promise.all(
        testIds.map(id => testLibraryService.getTestById(id))
      );
      
      // Generate prompts for each test
      const testPrompts = tests.map(test => ({
        testId: test.id,
        testName: test.name,
        prompts: samplePromptService.generatePromptsForTest(agent, test)
      }));
      
      // Return prompts grouped by test
      prompts = testPrompts;
    } else {
      // Fallback to agent-based prompts
      prompts = samplePromptService.generateSamplePrompts(agent);
    }
    
    res.json({
      success: true,
      data: prompts
    });
    
  } catch (error) {
    console.error('Error generating sample prompts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

## Correctness Properties (Updated)

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Test metadata incorporation
*For any* test execution with test metadata, the generated prompt should include the test's expected_behavior and output format instructions
**Validates: Requirements 1.1, 1.2, 2.1**

### Property 2: Output format consistency
*For any* test with category "development_documentation", the prompt should explicitly instruct the model to respond with markdown and NOT code
**Validates: Requirements 1.3, 4.1**

### Property 3: Code generation format enforcement
*For any* test with category "development_code_generation", the prompt should explicitly instruct the model to respond with code only and NOT explanations
**Validates: Requirements 1.4, 4.2**

### Property 4: Backward compatibility preservation
*For any* test execution without test metadata, the system should use the existing agent-type based prompt without failing
**Validates: Requirements 3.1, 3.2, 2.5**

### Property 5: Scoring criteria inclusion
*For any* test with scoring_rules defined, the prompt should include the criteria from those rules as guidelines
**Validates: Requirements 1.5, 2.2**

### Property 6: Category-specific format mapping
*For any* test category, the system should map it to an appropriate output format (markdown, code, json, etc.)
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 7: Prompt logging completeness
*For any* test execution, the system should log the complete prompt sent to the AI model
**Validates: Requirements 5.1, 5.2**

### Property 8: Metadata field propagation
*For any* test with output_format specified in metadata, that format should take precedence over category-inferred format
**Validates: Requirements 6.1, 6.5**

### Property 9: Consistent prompt construction
*For any* test executed multiple times with the same metadata, the system should generate identical prompts each time
**Validates: Requirements 7.1, 7.3**

### Property 10: Batch execution consistency
*For any* batch of tests executed together, each test should receive its own test-aware prompt based on its individual metadata
**Validates: Requirements 7.4**

### Property 11: Sample prompt relevance
*For any* test with category "development_documentation", the generated sample prompts should request documentation generation and NOT code generation
**Validates: Requirements 8.2, 8.3, 9.3**

### Property 12: Sample prompt agent awareness
*For any* agent and test combination, the generated sample prompts should consider both the agent's capabilities and the test's category
**Validates: Requirements 8.5, 9.1, 9.2**

### Property 13: Sample prompt code inclusion
*For any* test with category "development_code_review", the generated sample prompts should include code snippets to review
**Validates: Requirements 9.4**

### Property 14: Sample prompt extensibility
*For any* new test category without explicit templates, the system should generate default prompts using the test's expected_behavior or category name
**Validates: Requirements 10.1, 10.3, 10.4**

## Future Enhancements

1. **Dynamic Format Detection**: Analyze test input to suggest output format
2. **Prompt Templates**: Allow custom prompt templates per test category
3. **Multi-language Support**: Format instructions in different languages
4. **Prompt Optimization**: A/B test different prompt structures
5. **Feedback Loop**: Use test results to improve prompts over time
6. **UI Prompt Preview**: Show users the prompt before execution
7. **Prompt History**: Store and compare prompts across test runs
8. **Custom Instructions**: Allow users to add custom instructions per test
9. **Sample Prompt Learning**: Use successful test executions to improve sample prompt generation
10. **Context-Aware Code Samples**: Generate code samples based on agent's actual codebase context
