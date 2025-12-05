# Requirements Document: Agent Testing Knowledge Integration & Dynamic Test Suggestion

## Introduction

This feature enhances the Agent Testing workflow with two major capabilities:

1. **Knowledge Integration**: Adds Vector DB and MCP (Model Context Protocol) integration, enabling users to test agents with RAG (Retrieval-Augmented Generation) and external tool capabilities.

2. **Dynamic Test Suggestion System**: Implements an intelligent, metadata-driven test recommendation system that displays relevant CORE tests based on agent category and type, while ensuring independence and reliability for hallucination testing.

## Glossary

- **Vector DB**: Vector database used for semantic search and retrieval-augmented generation (RAG)
- **MCP**: Model Context Protocol - a system for integrating external tools and data sources with AI agents
- **RAG**: Retrieval-Augmented Generation - technique where relevant documents are retrieved and provided as context to the LLM
- **Knowledge Base**: A collection of documents indexed in a Vector DB for semantic search
- **Test Execution Mode**: The configuration determining how tests are executed (LLM only, RAG+LLM, MCP+LLM, or Full-stack)
- **Knowledge Source**: The origin of information used to answer a query (vector_db, mcp, llm, or hybrid)
- **Agent Testing Workflow**: The 9-step process users follow to test AI agents (Step 1: Select Agent, Step 2: Select Models, Step 2.5: Configure Knowledge Sources, Step 3: Select Tests, Step 4: Custom Tests, Step 5: Provide Input, Step 6: Review, Step 7: Execute, Step 8: Results, Step 9: Insights)
- **Agent Category**: The primary domain classification of an agent selected during agent creation (e.g., QE, DevOps, Security, Development)
- **Agent Type**: The specific sub-classification within a category selected during agent creation (e.g., "Test Case Creation" within QE category)
- **CORE Tests**: Predefined, metadata-driven tests that are independent of LLM output, ensuring unbiased evaluation
- **Test Metadata**: The mapping table that associates agent categories and types with recommended CORE tests
- **LLM-Suggested Tests**: Optional additional tests suggested by an LLM based on agent characteristics (advisory only, requires review)
- **Test Library**: The complete collection of available tests in the system

## Requirements

### Requirement 1: Knowledge Source Configuration Step

**User Story:** As a QA engineer, I want to configure Vector DB and MCP settings for agent testing, so that I can test agents with their integrated knowledge bases and tools.

#### Acceptance Criteria

1. WHEN a user reaches the knowledge configuration step THEN the system SHALL display options to enable Vector DB and MCP integration
2. WHEN Vector DB is enabled THEN the system SHALL display available knowledge bases for selection
3. WHEN Vector DB is enabled THEN the system SHALL allow configuration of retrieval parameters including topK and minimum similarity threshold
4. WHEN MCP is enabled THEN the system SHALL display available MCP servers for selection
5. WHEN the user configures knowledge sources THEN the system SHALL display a preview showing the execution flow and performance impact
6. WHEN the user has not configured any knowledge sources THEN the system SHALL allow skipping this step to proceed with LLM-only testing

### Requirement 2: Agent Configuration Auto-Population

**User Story:** As a QA engineer, I want the agent's existing Vector DB and MCP configurations to automatically populate in the testing workflow, so that I can test with production settings by default.

#### Acceptance Criteria

1. WHEN an agent with Vector DB configuration is selected THEN the system SHALL automatically populate the Vector DB settings as defaults
2. WHEN an agent with MCP configuration is selected THEN the system SHALL automatically populate the MCP server selections as defaults
3. WHEN the knowledge configuration step loads with agent defaults THEN the system SHALL display these settings as pre-selected
4. WHEN agent defaults are populated THEN the system SHALL allow users to proceed with testing using these defaults without modification
5. WHEN agent defaults are populated THEN the system SHALL allow users to optionally modify settings for testing purposes
6. WHEN the agent has no Vector DB or MCP configured THEN the system SHALL display empty configuration options allowing manual setup for testing

### Requirement 3: Test Execution with Knowledge Sources

**User Story:** As a QA engineer, I want tests to execute using the configured knowledge sources, so that I can validate agent behavior with RAG and MCP capabilities.

#### Acceptance Criteria

1. WHEN Vector DB is enabled and a test executes THEN the system SHALL search the selected knowledge bases before calling the LLM
2. WHEN Vector DB returns high-confidence results THEN the system SHALL use those results directly without calling the LLM
3. WHEN MCP is enabled and a test executes THEN the system SHALL attempt to execute relevant MCP tools
4. WHEN MCP tools provide a complete answer THEN the system SHALL use that answer without calling the LLM
5. WHEN neither Vector DB nor MCP provide sufficient answers THEN the system SHALL call the LLM with retrieved context
6. WHEN both Vector DB and MCP are disabled THEN the system SHALL execute tests using LLM only

### Requirement 4: Knowledge Source Tracking

**User Story:** As a QA engineer, I want to know which knowledge source provided each test answer, so that I can understand how the agent is using different information sources.

#### Acceptance Criteria

1. WHEN a test completes THEN the system SHALL record which knowledge source provided the answer (vector_db, mcp, llm, or hybrid)
2. WHEN Vector DB is used THEN the system SHALL record the number of documents retrieved and the retrieval latency
3. WHEN MCP is used THEN the system SHALL record which tools were executed and the execution latency
4. WHEN the LLM is called with context THEN the system SHALL record the knowledge source as hybrid
5. WHEN test results are displayed THEN the system SHALL show knowledge source badges for each test

### Requirement 5: Performance Impact Visibility

**User Story:** As a QA engineer, I want to see the performance impact of enabling Vector DB and MCP, so that I can make informed decisions about knowledge source configuration.

#### Acceptance Criteria

1. WHEN knowledge sources are configured THEN the system SHALL calculate and display estimated latency impact
2. WHEN knowledge sources are configured THEN the system SHALL calculate and display estimated cost impact
3. WHEN the preview is displayed THEN the system SHALL show the execution flow (Vector DB → MCP → LLM)
4. WHEN test results are displayed THEN the system SHALL show actual latency for each knowledge source used
5. WHEN test results are displayed THEN the system SHALL show the total execution time broken down by source

### Requirement 6: Workflow Integration

**User Story:** As a QA engineer, I want the knowledge configuration step to fit seamlessly into the existing testing workflow, so that I can maintain a smooth testing experience.

#### Acceptance Criteria

1. WHEN the user completes model selection THEN the system SHALL navigate to the knowledge configuration step
2. WHEN the user completes knowledge configuration THEN the system SHALL navigate to test selection
3. WHEN the user navigates backward from test selection THEN the system SHALL preserve knowledge configuration state
4. WHEN the user skips knowledge configuration THEN the system SHALL proceed to test selection with LLM-only mode
5. WHEN the workflow state is saved THEN the system SHALL include knowledge configuration in the saved state

### Requirement 7: Results Display Enhancement

**User Story:** As a QA engineer, I want test results to clearly show which knowledge sources were used, so that I can analyze agent behavior across different information sources.

#### Acceptance Criteria

1. WHEN test results are displayed THEN the system SHALL show a knowledge source badge for each test (Vector DB, MCP, LLM, or Hybrid)
2. WHEN Vector DB was used THEN the system SHALL display the number of documents retrieved
3. WHEN MCP was used THEN the system SHALL display which tools were executed
4. WHEN results are exported THEN the system SHALL include knowledge source information in the export
5. WHEN viewing detailed test logs THEN the system SHALL show the complete execution flow including all knowledge sources attempted

### Requirement 8: Testing Mode Support

**User Story:** As a QA engineer, I want to test agents in different execution modes, so that I can validate behavior with and without knowledge sources.

#### Acceptance Criteria

1. WHEN Vector DB is enabled and MCP is disabled THEN the system SHALL execute tests in RAG mode (Vector DB + LLM)
2. WHEN MCP is enabled and Vector DB is disabled THEN the system SHALL execute tests in MCP mode (MCP + LLM)
3. WHEN both Vector DB and MCP are enabled THEN the system SHALL execute tests in Full-stack mode (Vector DB + MCP + LLM)
4. WHEN both Vector DB and MCP are disabled THEN the system SHALL execute tests in LLM-only mode
5. WHEN test results are saved THEN the system SHALL record which execution mode was used

### Requirement 9: Agent Category and Type Classification During Agent Creation (Non-Breaking Addition)

**User Story:** As a user creating or editing an agent, I want to optionally select a category and sub-type for my agent during the agent creation/edit process, so that the system can automatically recommend relevant tests when I test this agent later.

**Note:** This requirement adds optional fields to the existing agent creation flow. All existing agent creation functionality (name, description, model selection, Vector DB, MCP, etc.) remains completely unchanged.

#### Acceptance Criteria

1. WHEN a user creates a new agent in the Agent Builder THEN the system SHALL display an optional section titled "Test Recommendations" with dropdowns for category and agent sub-type
2. WHEN a user selects an agent category in the Agent Builder THEN the system SHALL display a second dropdown with agent sub-types specific to that category
3. WHEN a user saves an agent without selecting category/sub-type THEN the system SHALL save the agent successfully with these fields as NULL
4. WHEN a user saves an agent with category and sub-type THEN the system SHALL store the selected values in the agent metadata
5. WHEN a user edits an existing agent without category/sub-type THEN the system SHALL display the category and sub-type dropdowns as empty/optional with a helpful message explaining their purpose
6. WHEN the Agent Builder displays the new fields THEN the system SHALL clearly indicate they are optional and used only for test recommendations
7. WHEN a user saves an agent THEN the system SHALL NOT require category/sub-type fields to be populated (they are optional)
8. WHEN the new fields are added THEN the system SHALL NOT modify or interfere with existing agent creation fields including name, description, model selection, Vector DB configuration, or MCP configuration

### Requirement 10: Metadata-Driven CORE Test Library

**User Story:** As a system administrator, I want to maintain a metadata table that maps agent categories and types to recommended CORE tests, so that the system can provide relevant, unbiased test recommendations.

#### Acceptance Criteria

1. WHEN the system initializes THEN the system SHALL load a test metadata table containing mappings of categories, agent types, and their associated CORE test IDs
2. WHEN a new category is added to the metadata THEN the system SHALL allow defining multiple agent types within that category
3. WHEN a new agent type is added THEN the system SHALL allow associating multiple CORE test IDs with that agent type
4. WHEN CORE tests are defined in metadata THEN the system SHALL ensure these tests are independent of any LLM output
5. WHEN the metadata table is updated THEN the system SHALL validate that all referenced test IDs exist in the test library

### Requirement 11: Dynamic CORE Test Display in Step 3 (Select Tests)

**User Story:** As a QA engineer, when I select an agent in Step 1 of the testing workflow, I want Step 3 (Select Tests) to automatically display CORE tests relevant to that agent's category and type, so that I can quickly select the most appropriate tests without manual searching.

#### Acceptance Criteria

1. WHEN a user completes Step 1 (Select Agent) THEN the system SHALL retrieve the selected agent's category and type from the agent metadata
2. WHEN a user reaches Step 3 (Select Tests) THEN the system SHALL query the metadata table for CORE test IDs associated with the agent's category and type
3. WHEN CORE tests are found THEN the system SHALL display them in a prominent "Recommended CORE Tests for [Agent Name]" section at the top of the test selection page
4. WHEN CORE tests are displayed THEN the system SHALL show a green "CORE" badge with each test to indicate it is metadata-driven and unbiased
5. WHEN no CORE tests are found for the agent's category/type THEN the system SHALL display a message "No specific recommendations for this agent type. Showing all available tests." and display the full test library
6. WHEN CORE tests are displayed THEN the system SHALL allow users to select or deselect individual tests
7. WHEN a user navigates back to Step 1 and selects a different agent THEN the system SHALL update the CORE test recommendations in Step 3 based on the new agent's category and type

### Requirement 12: Test Library Independence and Bias Prevention

**User Story:** As a system architect, I want to ensure that CORE tests used for hallucination and accuracy evaluation are never derived from the LLM being tested, so that test results remain unbiased and reliable.

#### Acceptance Criteria

1. WHEN CORE tests are defined in the metadata table THEN the system SHALL ensure they are predefined and stored independently of any LLM
2. WHEN a test is marked as a CORE test THEN the system SHALL prevent it from being modified or generated by LLM suggestions
3. WHEN hallucination or accuracy tests are needed THEN the system SHALL only use tests from the CORE test library
4. WHEN the system evaluates test results THEN the system SHALL log whether each test was a CORE test or LLM-suggested test
5. WHEN test metadata is updated THEN the system SHALL maintain an audit log of changes to prevent unauthorized LLM-based modifications

### Requirement 13: Optional LLM Test Suggestions (Advisory)

**User Story:** As a QA engineer, I want the option to see LLM-suggested additional tests based on my agent's characteristics, so that I can discover potentially relevant tests beyond the CORE recommendations.

#### Acceptance Criteria

1. WHEN a user is on the test selection page THEN the system SHALL display an option to "Get LLM Suggestions" for additional tests
2. WHEN a user requests LLM suggestions THEN the system SHALL send the agent's name, description, category, and type to an LLM service
3. WHEN LLM suggestions are returned THEN the system SHALL display them in a separate "LLM-Suggested Tests (Advisory)" section below CORE tests
4. WHEN LLM-suggested tests are displayed THEN the system SHALL show an "LLM Suggested" badge with a warning icon indicating these require review
5. WHEN LLM-suggested tests are displayed THEN the system SHALL include a disclaimer stating "These suggestions are advisory only and generated by AI. Review carefully before use."
6. WHEN a user selects an LLM-suggested test THEN the system SHALL mark it as "pending review" in the test execution metadata
7. WHEN LLM suggestion service fails THEN the system SHALL display an error message and continue showing CORE tests without interruption

### Requirement 14: Scalable Metadata Management

**User Story:** As a system administrator, I want an easy way to add new categories, agent types, and test mappings, so that the system can grow and adapt to new agent domains without code changes.

#### Acceptance Criteria

1. WHEN an administrator accesses the metadata management interface THEN the system SHALL display all current categories, agent types, and their test mappings
2. WHEN an administrator adds a new category THEN the system SHALL allow defining a category name and description
3. WHEN an administrator adds a new agent type THEN the system SHALL allow selecting a parent category and defining the type name and description
4. WHEN an administrator assigns tests to an agent type THEN the system SHALL display all available tests from the test library with search and filter capabilities
5. WHEN metadata changes are saved THEN the system SHALL validate the structure and immediately apply changes to the test selection workflow
6. WHEN metadata is exported THEN the system SHALL provide a JSON or CSV format for backup and version control

### Requirement 15: Backward Compatibility for Existing Agents

**User Story:** As a system administrator, I want existing agents without category/type metadata to continue functioning in the testing workflow, so that the new feature does not break current workflows.

#### Acceptance Criteria

1. WHEN a user selects an existing agent without category/type in Step 1 THEN the system SHALL allow the workflow to continue normally
2. WHEN a user reaches Step 3 (Select Tests) with an uncategorized agent THEN the system SHALL display all available tests without CORE test filtering
3. WHEN Step 3 loads for an uncategorized agent THEN the system SHALL display an info banner: "💡 This agent doesn't have a category. Add one to get personalized test recommendations!" with an "Edit Agent" button
4. WHEN a user clicks "Edit Agent" from the banner THEN the system SHALL open the agent edit modal with category/type fields highlighted
5. WHEN a user adds category/type to an existing agent and returns to testing THEN the system SHALL immediately apply CORE test recommendations in Step 3
6. WHEN an uncategorized agent is tested THEN the system SHALL log that no category-based filtering was applied in the test execution metadata

### Requirement 16: Test Selection UI Enhancements

**User Story:** As a QA engineer, I want a clear, organized test selection interface that distinguishes between CORE tests, LLM suggestions, and general tests, so that I can make informed decisions about which tests to run.

#### Acceptance Criteria

1. WHEN the test selection page loads THEN the system SHALL organize tests into three sections: "Recommended CORE Tests", "LLM-Suggested Tests (Advisory)", and "All Available Tests"
2. WHEN CORE tests are displayed THEN the system SHALL show a green "CORE" badge next to each test
3. WHEN LLM-suggested tests are displayed THEN the system SHALL show a yellow "LLM Suggested" badge with a warning icon next to each test
4. WHEN a user hovers over a CORE badge THEN the system SHALL display a tooltip explaining "Metadata-driven test, independent of LLM output"
5. WHEN a user hovers over an LLM Suggested badge THEN the system SHALL display a tooltip explaining "AI-generated suggestion, requires review"
6. WHEN tests are displayed THEN the system SHALL show test descriptions, categories, and estimated execution time
7. WHEN a user selects tests THEN the system SHALL display a summary showing the count of CORE tests vs LLM-suggested tests selected

### Requirement 17: CORE Test Library Definition

**User Story:** As a system architect, I want to define an initial set of CORE tests for each agent category, so that the system has a comprehensive foundation for test recommendations.

#### Acceptance Criteria

1. WHEN the system is initialized THEN the system SHALL include predefined CORE tests for each of the 11 agent categories (QE, DevOps, Security, Security Testing, Automated Testing, Development, Business Analysis, Product Management, Project Management, Production Support, SRE)
2. WHEN CORE tests are defined THEN the system SHALL include tests covering common dimensions: accuracy, hallucination detection, task completion, response quality, domain knowledge, edge case handling, and error handling
3. WHEN CORE tests are defined for a category THEN the system SHALL ensure at least 5-10 tests per category to provide meaningful coverage
4. WHEN CORE tests are stored THEN the system SHALL include metadata: test ID, name, description, category applicability, agent type applicability, test dimension, and expected execution time
5. WHEN the CORE test library is reviewed THEN the system SHALL allow administrators to validate that tests are appropriate for their assigned categories

---

**Status**: Requirements updated - Ready for review  
**Total Requirements**: 17  
**Total Acceptance Criteria**: 85
