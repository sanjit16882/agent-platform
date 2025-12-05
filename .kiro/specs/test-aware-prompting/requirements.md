# Requirements Document

## Introduction

This feature enhances the Agent Testing platform to ensure AI models produce meaningful, test-appropriate outputs by incorporating test metadata into the prompt construction process. Currently, when users run tests, the AI model receives only generic agent-type prompts, leading to incorrect output formats (e.g., generating code when markdown documentation is expected). This feature will make the system "test-aware" by including test expectations, output format specifications, and behavioral guidelines in the prompts sent to the AI model.

## Glossary

- **Test Metadata**: Information about a test including name, category, expected_behavior, scoring_rules, input_format, and sample_prompts
- **System Prompt**: The instructional text sent to the AI model that guides its behavior and output format
- **Test Execution Service**: Backend service responsible for executing tests against agents
- **Bedrock Service**: Backend service that constructs prompts and communicates with AWS Bedrock AI models
- **Test Category**: Classification of tests (e.g., development_documentation, development_code_review, qe_test_case_creation)
- **Expected Behavior**: Description in test metadata of what the correct output should contain or how it should be formatted
- **Output Format**: The expected structure of the AI response (e.g., markdown, code, JSON, plain text)
- **Agent Type**: Classification of the agent being tested (e.g., code-quality, documentation-generator, security-scanner)

## Requirements

### Requirement 1

**User Story:** As a test executor, I want the AI model to understand what output format is expected for each test, so that it generates appropriate responses (markdown for documentation tests, code for code generation tests, etc.)

#### Acceptance Criteria

1. WHEN a test is executed THEN the system SHALL include the test's expected_behavior in the prompt sent to the AI model
2. WHEN a test specifies an output format in its metadata THEN the system SHALL explicitly instruct the AI model to respond in that format
3. WHEN a documentation test is executed THEN the system SHALL instruct the AI model to respond with markdown documentation and NOT code
4. WHEN a code generation test is executed THEN the system SHALL instruct the AI model to respond with executable code and NOT explanations
5. WHEN a test has scoring_rules defined THEN the system SHALL include relevant criteria from those rules in the prompt to guide the AI model

### Requirement 2

**User Story:** As a test designer, I want test metadata (expected_behavior, scoring_rules) to influence how the AI model responds, so that tests validate the correct behaviors

#### Acceptance Criteria

1. WHEN test metadata contains expected_behavior THEN the system SHALL parse this field and incorporate it into the system prompt
2. WHEN test metadata contains scoring_rules THEN the system SHALL extract key criteria and include them as guidelines in the prompt
3. WHEN test metadata contains sample_prompts THEN the system SHALL optionally use these as examples in the prompt construction
4. WHEN multiple tests with different categories are executed THEN the system SHALL generate category-appropriate prompts for each test
5. WHEN test metadata is missing or incomplete THEN the system SHALL fall back to agent-type based prompts without failing

### Requirement 3

**User Story:** As a platform maintainer, I want the prompt enhancement to be backward compatible, so that existing tests continue to work without modification

#### Acceptance Criteria

1. WHEN tests without expected_behavior metadata are executed THEN the system SHALL use existing agent-type based prompts
2. WHEN the prompt building logic is enhanced THEN all existing test execution flows SHALL continue to function unchanged
3. WHEN new test-aware prompts are generated THEN the system SHALL maintain the existing prompt structure and only add test-specific context
4. WHEN agent-type specific intent detection is active THEN the system SHALL preserve this behavior and layer test context on top
5. WHEN custom model IDs are specified THEN the system SHALL continue to support model comparison features

### Requirement 4

**User Story:** As a test executor, I want clear separation between test categories and output expectations, so that the AI model doesn't confuse different types of tasks

#### Acceptance Criteria

1. WHEN a test category is "development_documentation" THEN the system SHALL explicitly state "generate documentation in markdown format"
2. WHEN a test category is "development_code_generation" THEN the system SHALL explicitly state "generate executable code only"
3. WHEN a test category is "development_code_review" THEN the system SHALL explicitly state "provide analysis and feedback"
4. WHEN a test category is "qe_test_case_creation" THEN the system SHALL explicitly state "generate test cases"
5. WHEN a test category is "security_vulnerability" THEN the system SHALL explicitly state "identify security issues in JSON format"

### Requirement 5

**User Story:** As a developer, I want to see what prompts are being sent to the AI model during test execution, so that I can debug issues and understand model behavior

#### Acceptance Criteria

1. WHEN a test is executed THEN the system SHALL log the complete prompt sent to the AI model
2. WHEN test-aware prompt enhancements are applied THEN the system SHALL log which test metadata fields were incorporated
3. WHEN prompt construction fails THEN the system SHALL log detailed error information including which test and metadata caused the failure
4. WHEN debug mode is enabled THEN the system SHALL include the full prompt in the test execution response
5. WHEN viewing test results THEN the system SHALL optionally display the prompt that was used for that test execution

### Requirement 6

**User Story:** As a test designer, I want to define output format expectations in test metadata, so that the system can automatically enforce correct response formats

#### Acceptance Criteria

1. WHEN test metadata includes an "output_format" field THEN the system SHALL recognize values: "markdown", "code", "json", "plain_text"
2. WHEN output_format is "markdown" THEN the system SHALL instruct the model to use markdown syntax and NOT include code blocks unless documenting code
3. WHEN output_format is "code" THEN the system SHALL instruct the model to output only executable code without explanations
4. WHEN output_format is "json" THEN the system SHALL instruct the model to respond with valid JSON and nothing else
5. WHEN output_format is not specified THEN the system SHALL infer the format from the test category

### Requirement 7

**User Story:** As a platform user, I want consistent and predictable AI responses across all test types, so that test results are reliable and meaningful

#### Acceptance Criteria

1. WHEN the same test is executed multiple times THEN the system SHALL use the same prompt construction logic each time
2. WHEN test metadata is updated THEN the system SHALL immediately use the new metadata in subsequent test executions
3. WHEN different agents of the same type are tested THEN the system SHALL apply consistent prompt enhancements based on test metadata
4. WHEN tests are executed in batch mode THEN the system SHALL apply test-aware prompting to each test individually
5. WHEN model comparison is performed THEN the system SHALL send identical test-aware prompts to all models being compared

### Requirement 8

**User Story:** As a test executor, I want to see relevant sample prompts for each test based on the agent type and test category, so that I can provide appropriate inputs that will produce meaningful results

#### Acceptance Criteria

1. WHEN viewing a test in the test selection UI THEN the system SHALL display sample prompts that are relevant to both the test category and the agent type
2. WHEN a documentation test is selected for a code review agent THEN the system SHALL show sample prompts like "Generate README for this codebase" NOT generic prompts
3. WHEN a code generation test is selected THEN the system SHALL show sample prompts that request specific code implementations
4. WHEN a security test is selected for a security agent THEN the system SHALL show sample prompts with code snippets to analyze for vulnerabilities
5. WHEN sample prompts are generated THEN the system SHALL consider the agent's capabilities (tools, description) and the test's category

### Requirement 9

**User Story:** As a test designer, I want the sample prompt service to generate contextually appropriate prompts, so that users understand what inputs work best for each test

#### Acceptance Criteria

1. WHEN generating sample prompts for a test THEN the system SHALL use the test's category to determine the prompt template
2. WHEN generating sample prompts for a test THEN the system SHALL use the agent's type and capabilities to customize the prompt content
3. WHEN a test has category "development_documentation" THEN sample prompts SHALL request documentation generation NOT code generation
4. WHEN a test has category "development_code_review" THEN sample prompts SHALL include code snippets to review
5. WHEN a test has category "qe_test_case_creation" THEN sample prompts SHALL request test case generation for specific scenarios

### Requirement 10

**User Story:** As a platform maintainer, I want the sample prompt generation to be extensible, so that new test categories automatically get appropriate sample prompts

#### Acceptance Criteria

1. WHEN a new test category is added to the system THEN the sample prompt service SHALL provide default prompts based on category naming patterns
2. WHEN category-specific prompt templates are defined THEN the system SHALL use those templates for that category
3. WHEN no category-specific template exists THEN the system SHALL generate prompts using the test's expected_behavior field
4. WHEN generating fallback prompts THEN the system SHALL include the test name and category in the prompt text
5. WHEN the agent type changes THEN the system SHALL regenerate sample prompts to match the new agent's capabilities
