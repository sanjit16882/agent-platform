# Implementation Plan - AI Agent Testing Framework

## Overview

This implementation plan breaks down the AI Agent Testing Framework into discrete, manageable coding tasks. Each task builds incrementally on previous steps, ensuring a systematic and integrated approach. The plan follows a phased implementation strategy to minimize risk and ensure backward compatibility.

## Implementation Phases

- **Phase 1**: Backend Infrastructure & Database (Tasks 1-3)
- **Phase 2**: Core Testing Services (Tasks 4-7)
- **Phase 3**: CLI Implementation (Tasks 8-9)
- **Phase 4**: Frontend Dashboard (Tasks 10-15)
- **Phase 5**: Agent Catalog Integration (Tasks 16-17)
- **Phase 6**: Analytics & Insights (Tasks 18-19)
- **Phase 7**: Testing & Deployment (Tasks 20-22)

---

## Phase 1: Backend Infrastructure & Database

### Task 1: Database Schema Setup

**Objective**: Create new database tables for testing framework without modifying existing schema

**Sub-tasks**:
- [ ] 1.1 Create migration file for test_suites table
  - Define schema with id, suite_type, name, description, agent_id, enabled, timestamps
  - Add foreign key constraint to agents table with ON DELETE CASCADE
  - Create indexes on suite_type and agent_id
  - _Requirements: 2.1, 2.2_

- [ ] 1.2 Create migration file for test_runs table
  - Define schema with id, agent_id, suite_id, status, start_time, end_time, summary (JSON)
  - Add foreign key constraints with appropriate cascade rules
  - Create indexes on agent_id, suite_id, status, start_time
  - _Requirements: 2.3, 5.1_

- [ ] 1.3 Create migration file for test_results table
  - Define schema with id, run_id, test_case_id, test_case_name, status, duration, evaluation (JSON)
  - Add foreign key constraint to test_runs with ON DELETE CASCADE
  - Create indexes on run_id, status
  - _Requirements: 2.4, 4.1_

- [ ] 1.4 Create database view for agent_testing_status
  - Aggregate test run data per agent
  - Calculate pass rates, last run dates, total runs
  - Ensure view does not modify existing tables
  - _Requirements: 8.1_

- [ ] 1.5 Write rollback migration scripts
  - Create down migrations for all tables
  - Test rollback functionality
  - Document rollback procedure
  - _Requirements: 10.1_

### Task 2: Backend Configuration & Feature Flags

**Objective**: Set up feature flags and configuration for gradual rollout

**Sub-tasks**:
- [ ] 2.1 Create feature flag configuration file
  - Define TESTING_FRAMEWORK feature flag
  - Add environment variables for rollout percentage
  - Add allowed users list configuration
  - _Requirements: 10.2_

- [ ] 2.2 Implement feature flag middleware
  - Create checkTestingFeature middleware function
  - Return 404 if feature is disabled
  - Log feature access attempts
  - _Requirements: 10.3_

- [ ] 2.3 Create testing service configuration
  - Define timeout settings
  - Configure retry policies
  - Set up mock mode settings
  - _Requirements: 2.5, 3.1_

- [ ] 2.4 Add health check endpoints
  - Implement /health endpoint for testing service
  - Implement /ready endpoint for readiness probe
  - Include database connection check
  - _Requirements: 10.4_

### Task 3: Mock Layer Implementation

**Objective**: Create mock layer for simulating external dependencies

**Sub-tasks**:
- [ ] 3.1 Create MockRegistry class
  - Implement register, unregister, findMatch, clear methods
  - Store mock definitions in memory
  - Support request matching by endpoint and method
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 Create mock definition loader
  - Load mock definitions from JSON files in mocks directory
  - Validate mock definition schema
  - Support hot-reloading of mock files
  - _Requirements: 3.3_

- [ ] 3.3 Implement request interceptor middleware
  - Intercept API calls during test execution
  - Match requests against mock registry
  - Return hardcoded responses with simulated latency
  - Fall back to real service if no mock found
  - _Requirements: 3.4, 3.5_

- [ ] 3.4 Create sample mock definitions
  - Create bedrock-mocks.json with sample LLM responses
  - Create mcp-mocks.json with sample MCP server responses
  - Include various response scenarios (success, error, timeout)
  - _Requirements: 3.1_

---

## Phase 2: Core Testing Services

### Task 4: Test Suite Service

**Objective**: Implement service for managing test suites (universal and custom)

**Sub-tasks**:
- [ ] 4.1 Create TestSuiteService class
  - Implement getAllSuites, getSuiteById, createSuite, updateSuite, deleteSuite methods
  - Add validation for suite_type (universal or custom)
  - Ensure universal suites cannot be deleted
  - _Requirements: 2.1, 2.2_

- [ ] 4.2 Implement test case parser
  - Parse YAML test case definitions
  - Parse JSON test case definitions
  - Validate test case schema
  - Return structured TestCase objects
  - _Requirements: 2.3_

- [ ] 4.3 Create universal test suite loader
  - Load universal test suites from tests/universal directory
  - Auto-register universal suites on service startup
  - Support suite enable/disable functionality
  - _Requirements: 2.1_

- [ ] 4.4 Implement custom test suite CRUD operations
  - Create custom suite with agent association
  - Update custom suite tests
  - Delete custom suite (agent-specific only)
  - List custom suites by agent
  - _Requirements: 2.2_

### Task 5: Test Runner Service

**Objective**: Implement core test execution orchestration

**Sub-tasks**:
- [ ] 5.1 Create TestRunnerService class
  - Implement runTests method with agent ID and configuration
  - Support sequential and parallel test execution
  - Manage test lifecycle (queued, running, completed, failed)
  - _Requirements: 5.1, 5.2_

- [ ] 5.2 Implement test execution engine
  - Execute individual test cases against agents
  - Capture input, output, and execution metadata
  - Handle timeouts and retries
  - Support sandbox mode execution
  - _Requirements: 5.3, 9.1_

- [ ] 5.3 Create test result collector
  - Aggregate test results from multiple test cases
  - Calculate summary statistics (pass rate, duration, cost)
  - Store results in test_results table
  - _Requirements: 2.4, 4.1_

- [ ] 5.4 Implement test run status tracking
  - Update test run status in real-time
  - Support status queries by run ID
  - Emit progress events for live updates
  - _Requirements: 5.2_

### Task 6: Evaluation Engine

**Objective**: Implement metrics calculation and scoring for test outputs

**Sub-tasks**:
- [ ] 6.1 Create Evaluator class
  - Implement evaluate method accepting test case and actual output
  - Calculate accuracy metrics (exact match, substring match, pattern match)
  - Calculate quality metrics (coherence, relevance, completeness)
  - _Requirements: 4.1, 4.2_

- [ ] 6.2 Implement accuracy metric calculators
  - exactMatch: Compare expected vs actual output
  - substringMatch: Check if expected strings are present
  - patternMatch: Validate against regex patterns
  - _Requirements: 4.1_

- [ ] 6.3 Implement quality metric calculators
  - coherenceScore: Use string similarity algorithms
  - relevanceScore: Keyword matching and scoring
  - completenessScore: Check for expected elements
  - _Requirements: 4.2_

- [ ] 6.4 Implement performance metric calculators
  - responseTime: Measure execution duration
  - tokenUsage: Count input and output tokens
  - costEstimation: Calculate based on token usage and model pricing
  - _Requirements: 4.3_

- [ ] 6.5 Implement AI-specific metric calculators (optional)
  - BLEU score for translation tasks
  - ROUGE score for summarization tasks
  - Semantic similarity using embeddings
  - _Requirements: 4.4_

- [ ] 6.6 Create overall score computation
  - Combine accuracy, quality, and performance metrics
  - Apply tolerance thresholds
  - Determine pass/fail status
  - _Requirements: 4.1_

### Task 7: Feedback Loop Service

**Objective**: Implement pattern analysis and recommendation generation

**Sub-tasks**:
- [ ] 7.1 Create PatternAnalyzer class
  - Implement analyzeFailures method
  - Cluster similar failures by reason
  - Extract common input features
  - Identify failure patterns
  - _Requirements: 7.1, 7.2_

- [ ] 7.2 Create RecommendationEngine class
  - Implement generateRecommendations method
  - Analyze failure patterns for frequent issues
  - Generate prompt modification suggestions
  - Generate config change recommendations
  - _Requirements: 7.3, 7.4_

- [ ] 7.3 Implement feedback data storage
  - Store failure patterns in database
  - Track recommendation acceptance/rejection
  - Maintain feedback history per agent
  - _Requirements: 7.5_

- [ ] 7.4 Create recommendation prioritization
  - Assign priority based on failure frequency
  - Calculate expected improvement impact
  - Rank recommendations by potential value
  - _Requirements: 7.3_

---

## Phase 3: CLI Implementation

### Task 8: CLI Core Commands

**Objective**: Implement command-line interface for test execution

**Sub-tasks**:
- [ ] 8.1 Set up CLI project structure
  - Create agent-hub-cli/commands/test.js
  - Configure Commander.js for command parsing
  - Set up logging utility
  - _Requirements: 1.1_

- [ ] 8.2 Implement `agenthub test` command
  - Accept --agent, --case, --suite, --sandbox, --versions flags
  - Validate command arguments
  - Call backend testing API
  - Display progress and results
  - _Requirements: 1.1, 1.2_

- [ ] 8.3 Implement test output formatting
  - Create console formatter for test results
  - Support JSON output format
  - Support JUnit XML output format
  - Color-code pass/fail status
  - _Requirements: 1.3_

- [ ] 8.4 Implement `agenthub test --list` command
  - List all available agents
  - List all test suites
  - Display test counts and last run info
  - _Requirements: 1.4_

### Task 9: CLI Reporting & Configuration

**Objective**: Implement report generation and configuration management

**Sub-tasks**:
- [ ] 9.1 Implement `agenthub test --report` command
  - Generate test execution report
  - Include summary statistics
  - Include detailed test results
  - Support multiple output formats
  - _Requirements: 1.5_

- [ ] 9.2 Implement `agenthub config --validate` command
  - Validate test case YAML/JSON files
  - Check for schema errors
  - Report validation issues
  - _Requirements: 1.6_

- [ ] 9.3 Create CLI error handling
  - Handle network errors gracefully
  - Display user-friendly error messages
  - Provide troubleshooting hints
  - _Requirements: 1.7_

---

## Phase 4: Frontend Dashboard

### Task 10: Testing Dashboard Main Layout

**Objective**: Create main testing dashboard with navigation and routing

**Sub-tasks**:
- [ ] 10.1 Create AgentTestingMain component
  - Set up React Router for sub-routes
  - Create navigation tabs (Overview, Suites, Results, Metrics, Insights, Versions, Governance)
  - Implement layout with header and content area
  - _Requirements: 6.1_

- [ ] 10.2 Add Agent Testing route to main app
  - Update AppRoutes.tsx with /agent-testing route
  - Add route protection if needed
  - Ensure no conflicts with existing routes
  - _Requirements: 6.1_

- [ ] 10.3 Update main navigation bar
  - Add "Agent Testing" link to Navbar.tsx
  - Add ENTERPRISE badge
  - Position at top level (same as Dashboard, Agents, Marketplace)
  - _Requirements: 6.1_

- [ ] 10.4 Create feature flag check for UI
  - Check if testing feature is enabled
  - Hide testing UI elements if disabled
  - Show graceful message if feature unavailable
  - _Requirements: 10.2_

### Task 11: Testing Overview Dashboard

**Objective**: Create landing page with REAL data metrics and quick actions

**Sub-tasks**:
- [ ] 11.1 Create TestingOverview component with REAL data
  - Display summary cards with REAL data (no mock data)
  - Fetch real agent count from GET /api/v1/agents/s3
  - Calculate real test coverage from actual test runs
  - Show real pass rate from test_results table
  - Display real tests executed today count
  - Show quality distribution chart with real data
  - Display test execution trend chart with real performance data
  - _Requirements: 6.1, 18.1_

- [ ] 11.2 Implement REAL data API integration
  - Fetch real agent count from /api/v1/agents/s3
  - Fetch real test run history from /api/testing/runs
  - Fetch real performance trends from /api/testing/performance-trends
  - Fetch real coverage stats from /api/testing/coverage
  - Calculate real metrics from actual test executions
  - Display loading states
  - Handle errors gracefully
  - Remove all mock/hardcoded data
  - _Requirements: 18.1_

- [ ] 11.3 Create quick action buttons with real functionality
  - "Run Universal Tests on All Agents" button (functional)
  - "View Recent Test Runs" button (functional)
  - "Create Custom Test Suite" button (functional)
  - Connect buttons to actual backend APIs
  - Show progress indicators during execution
  - _Requirements: 6.1_

- [ ] 11.4 Implement quality distribution visualization with real data
  - Calculate quality grades from actual test results
  - Create pie chart showing excellent/good/fair/poor agents (real counts)
  - Use Recharts library
  - Color-code by quality grade
  - Update dynamically based on latest test runs
  - _Requirements: 18.1_

- [ ] 11.5 Implement real performance trends visualization
  - Fetch real response times from test execution history
  - Display real token usage from test runs
  - Show real cost data calculated from actual usage
  - Display trends over 7/30/90 days from real data
  - Update charts with actual test execution metrics
  - _Requirements: 18.3, 18.4_

### Task 12: Test Suites Management

**Objective**: Create UI for viewing and managing test suites with 7 universal test categories

**Sub-tasks**:
- [ ] 12.1 Create TestSuitesList component
  - Display universal test suites section with 7 categories
  - Display custom test suites section
  - Show suite statistics (test count, pass rate, last run)
  - _Requirements: 6.2_

- [ ] 12.2 Create UniversalSuitesSection component with 7 test categories
  - **Category 1: Functional Validation** (5 test cases)
    - Prompt Output Validation
    - Intent Detection Accuracy
    - Response Format Validation
    - Multi-turn Context Handling
    - Error Handling & Fallback
  - **Category 2: Integration Testing** (3 test cases)
    - MCP / API Integration
    - Webhook / Event Handling
    - Database or Knowledge Base Connection
  - **Category 3: Conversational Behavior** (3 test cases)
    - Tone & Style Consistency
    - Coherence & Relevance
    - Hallucination Detection
  - **Category 4: Performance & Reliability** (3 test cases)
    - Response Time Benchmarking
    - Load / Stress Testing
    - Token & Cost Optimization
  - **Category 5: Regression & Version Testing** (3 test cases)
    - Behavior Drift Detection
    - Prompt Update Validation
    - Snapshot Comparison
  - **Category 6: Governance, Compliance & Safety** (3 test cases)
    - Content Moderation / Safety Checks
    - Approval Workflow Enforcement
    - Data Privacy & Policy Validation
  - **Category 7: Learning & Feedback** (3 test cases)
    - Auto-Healing Recommendation
    - Continuous Learning from Results
    - Confidence Scoring
  - Display each category as expandable card with test count
  - Add "Execute Category" button for each category
  - Show category statistics (last run, avg pass rate across all agents)
  - _Requirements: 6.2, 2.1_

- [ ] 12.3 Implement Agent Selection Interface
  - Fetch all agents dynamically from GET /api/v1/agents/s3
  - Display agent grid/list with agent name, description, icon
  - Support single or multiple agent selection
  - Show agent count (currently 15, but dynamic)
  - Auto-update when new agents are added to system
  - _Requirements: 6.2, 8.1_

- [ ] 12.4 Implement Test Execution Flow
  - **Step 1**: User selects agent(s) from dynamic list
  - **Step 2**: User selects one of 7 test categories
  - **Step 3**: User clicks "Execute" button
  - **Step 4**: System runs ALL test cases within selected category
  - **Step 5**: Display results for all executed test cases
  - Show progress indicator during execution
  - Display pass/fail status for each test case
  - _Requirements: 6.2, 5.1_

- [ ] 12.5 Create CustomSuitesSection component
  - List custom test suites grouped by agent
  - Display suite details (name, test count, pass rate, last run)
  - Add "View", "Edit", "Run", "Delete" buttons
  - _Requirements: 6.2_

- [ ] 12.6 Create TestSuiteDetail component
  - Display individual test cases in suite
  - Show test case details (input, expected output, validation rules)
  - Support inline editing for custom suites
  - _Requirements: 6.2_

- [ ] 12.7 Create CustomSuiteCreator component
  - Wizard for creating new custom test suite
  - Agent selection dropdown (dynamic from API)
  - Test case editor (YAML/JSON)
  - Validation and preview
  - _Requirements: 6.2_

### Task 13: Test Results & History

**Objective**: Create UI for viewing test results and execution history

**Sub-tasks**:
- [ ] 13.1 Create TestRunList component
  - Display table of test runs with filters
  - Show run date, agent, suite, pass rate, duration
  - Support sorting and pagination
  - _Requirements: 6.3_

- [ ] 13.2 Create TestResultDetail component
  - Display detailed test result with input/output
  - Show evaluation metrics
  - Highlight failures with diff view
  - Support side-by-side comparison
  - _Requirements: 6.3_

- [ ] 13.3 Implement test result filtering
  - Filter by agent, suite, status, date range
  - Search by test name
  - Save filter preferences
  - _Requirements: 6.3_

- [ ] 13.4 Create ExportReportModal component
  - Support PDF, CSV, JSON export formats
  - Allow selection of data to export
  - Generate downloadable report
  - _Requirements: 6.3_

### Task 14: Metrics Dashboard

**Objective**: Create advanced analytics and metrics visualization

**Sub-tasks**:
- [ ] 14.1 Create MetricsCharts component
  - Display performance charts (response time trends)
  - Show pass rate trends over time
  - Render throughput metrics
  - _Requirements: 6.4, 18.3_

- [ ] 14.2 Create CostAnalysis component
  - Display cost breakdown by agent
  - Show cost trends over time
  - Display token usage statistics
  - Show cost projections and savings opportunities
  - _Requirements: 6.4, 18.4_

- [ ] 14.3 Implement time range selector
  - Support 7/30/90 day views
  - Allow custom date range selection
  - Update all charts based on selection
  - _Requirements: 18.3_

- [ ] 14.4 Create agent comparison matrix
  - Side-by-side agent metrics comparison
  - Support multi-agent selection
  - Display comparative rankings
  - _Requirements: 18.7_

### Task 15: Insights & Recommendations

**Objective**: Create UI for displaying insights and recommendations

**Sub-tasks**:
- [ ] 15.1 Create FeedbackPanel component
  - Display quality trends (improving/declining agents)
  - Show common failure patterns
  - List test coverage gaps
  - Display optimization opportunities
  - _Requirements: 6.5, 18.6_

- [ ] 15.2 Implement recommendation cards
  - Show recommendation type, priority, description
  - Display expected improvement
  - Add "Apply" and "Dismiss" buttons
  - Track recommendation status
  - _Requirements: 7.3, 7.4_

- [ ] 15.3 Create failure pattern analysis view
  - Display pattern description and affected agents
  - Show occurrence count and timeline
  - Provide suggested fixes
  - Link to affected test results
  - _Requirements: 7.1, 7.2_

---

## Phase 5: Agent Catalog Integration

### Task 16: Agent Catalog Enhancements

**Objective**: Integrate testing features into existing agent catalog

**Sub-tasks**:
- [ ] 16.1 Extend Agent interface with testing fields
  - Add testingStatus field to Agent type
  - Include lastTestRun, universalTests, customTests, overallQuality
  - Ensure backward compatibility (all fields optional)
  - _Requirements: 8.1_

- [ ] 16.2 Update AgentCard component
  - Add TestingStatusBadge display
  - Show last test run date and pass rate
  - Add "Run Tests" button
  - Wrap new features in feature flag check
  - _Requirements: 8.2_

- [ ] 16.3 Create TestingStatusBadge component
  - Display quality grade (Excellent, Good, Fair, Needs Attention, Not Tested)
  - Color-code by status
  - Show tooltip with details
  - _Requirements: 8.3_

- [ ] 16.4 Implement quick test execution from catalog
  - Add onClick handler for "Run Tests" button
  - Open QuickRunModal with agent pre-selected
  - Show progress indicator
  - Display results summary
  - _Requirements: 8.4_

### Task 17: Agent Details Modal Integration

**Objective**: Add testing tab to agent details modal

**Sub-tasks**:
- [ ] 17.1 Add Testing tab to AgentDetailsModal
  - Add new tab with "Testing" title
  - Wrap tab in feature flag check
  - Position between Configuration and Deployment tabs
  - _Requirements: 8.5_

- [ ] 17.2 Create AgentTestingTab component
  - Display quick test action buttons
  - Show test summary cards (universal, custom, overall)
  - List custom test suites for agent
  - Display recent test run history table
  - Show test coverage visualization
  - _Requirements: 8.6_

- [ ] 17.3 Implement test history table
  - Display recent test runs with date, suite, pass rate, duration
  - Add "View Results" button for each run
  - Support pagination
  - _Requirements: 8.7_

- [ ] 17.4 Create test coverage chart
  - Visualize test coverage percentage
  - Show breakdown by test type
  - Display trend over time
  - _Requirements: 8.8_

---

## Phase 6: Analytics & Insights

### Task 18: Analytics Data Collection

**Objective**: Implement analytics data collection and aggregation

**Sub-tasks**:
- [ ] 18.1 Create AnalyticsService class
  - Implement methods for collecting test execution metrics
  - Aggregate data by agent, suite, time period
  - Calculate summary statistics
  - _Requirements: 18.1_

- [ ] 18.2 Implement time-series data aggregation
  - Aggregate daily test execution data
  - Calculate weekly and monthly rollups
  - Store aggregated data for fast queries
  - _Requirements: 18.3_

- [ ] 18.3 Create analytics API endpoints
  - GET /api/testing/analytics/overview
  - GET /api/testing/analytics/agent/:agentId
  - GET /api/testing/analytics/trends
  - GET /api/testing/analytics/costs
  - _Requirements: 18.1, 18.3, 18.4_

- [ ] 18.4 Implement caching for analytics queries
  - Cache frequently accessed analytics data
  - Set appropriate TTL (5 minutes)
  - Invalidate cache on new test runs
  - _Requirements: 18.1_

### Task 19: Insights Generation

**Objective**: Implement automated insights and recommendations

**Sub-tasks**:
- [ ] 19.1 Create InsightsService class
  - Analyze test data for trends
  - Identify quality improvements and degradations
  - Detect failure patterns
  - Generate actionable recommendations
  - _Requirements: 18.6_

- [ ] 19.2 Implement quality trend detection
  - Compare current vs previous period metrics
  - Calculate trend direction and magnitude
  - Identify agents with significant changes
  - _Requirements: 18.6_

- [ ] 19.3 Implement coverage gap analysis
  - Identify agents without custom tests
  - Detect missing test types
  - Prioritize gaps by agent importance
  - _Requirements: 18.6_

- [ ] 19.4 Implement cost optimization analysis
  - Identify high-cost agents
  - Suggest frequency reductions for stable agents
  - Calculate potential savings
  - _Requirements: 18.4_

---

## Phase 7: Testing & Deployment

### Task 20: Backend API Routes

**Objective**: Implement all backend API endpoints for testing framework with REAL data

**Sub-tasks**:
- [ ] 20.1 Create testing routes file
  - Create agent-hub-backend/routes/testing.js
  - Apply feature flag middleware to all routes
  - Set up error handling middleware
  - Remove all mock data - use real database queries only
  - _Requirements: 2.1_

- [ ] 20.2 Implement test suite management endpoints with 7 universal categories
  - GET /api/testing/suites - Return real test suites from database
  - GET /api/testing/suites/universal - Return 7 universal categories with test cases
  - GET /api/testing/suites/custom - Return real custom suites from database
  - GET /api/testing/suites/:suiteId - Return real suite details
  - POST /api/testing/suites - Create real suite in database
  - PUT /api/testing/suites/:suiteId - Update real suite
  - DELETE /api/testing/suites/:suiteId - Delete real suite
  - PATCH /api/testing/suites/:suiteId/enable - Enable/disable real suite
  - _Requirements: 2.1, 2.2_

- [ ] 20.3 Implement test execution endpoints with real execution
  - POST /api/testing/run - Execute real tests on selected agent(s)
  - POST /api/testing/run/category - Execute all tests in selected category
  - GET /api/testing/status/:runId - Return real execution status
  - GET /api/testing/results/:runId - Return real test results from database
  - POST /api/testing/validate - Validate real test definitions
  - Store all results in test_runs and test_results tables
  - _Requirements: 5.1, 5.2_

- [ ] 20.4 Implement agent-specific testing endpoints with real data
  - GET /api/agents/:agentId/testing/status - Calculate from real test runs
  - GET /api/agents/:agentId/testing/history - Fetch real test history
  - GET /api/agents/:agentId/testing/suites - Return real suites for agent
  - POST /api/agents/:agentId/testing/run - Execute real tests on agent
  - GET /api/agents/:agentId/testing/coverage - Calculate real coverage
  - _Requirements: 8.1_

- [ ] 20.5 Implement analytics endpoints with real data calculations
  - GET /api/testing/analytics/overview - Calculate from real test_runs data
    - Real agent count from /api/v1/agents/s3
    - Real test coverage from actual test executions
    - Real pass rate from test_results table
    - Real performance trends from execution history
  - GET /api/testing/analytics/agent/:agentId - Real agent-specific metrics
  - GET /api/testing/analytics/trends - Real performance trends over time
  - GET /api/testing/analytics/costs - Real cost calculations from token usage
  - GET /api/testing/insights - Real insights from pattern analysis
  - GET /api/testing/performance-trends - Real response time and token data
  - GET /api/testing/coverage - Real coverage statistics
  - Remove all mock data and hardcoded values
  - _Requirements: 18.1, 18.3, 18.4, 18.6_

- [ ] 20.6 Implement dynamic agent list endpoint
  - GET /api/testing/agents - Fetch all agents from /api/v1/agents/s3
  - Return agent list for selection in testing UI
  - Include agent metadata (name, description, category)
  - Auto-update when new agents added to system
  - _Requirements: 8.1_

### Task 21: Integration Testing

**Objective**: Test all components and integrations

**Sub-tasks**:
- [ ] 21.1 Write backend service tests
  - Test TestSuiteService CRUD operations
  - Test TestRunnerService execution flow
  - Test Evaluator metric calculations
  - Test PatternAnalyzer and RecommendationEngine
  - _Requirements: All_

- [ ] 21.2 Write API endpoint tests
  - Test all testing API routes
  - Test error handling and validation
  - Test feature flag enforcement
  - Test authentication and authorization
  - _Requirements: All_

- [ ] 21.3 Write frontend component tests
  - Test TestingOverview rendering
  - Test TestSuitesList functionality
  - Test TestResultDetail display
  - Test AgentTestingTab integration
  - _Requirements: All_

- [ ] 21.4 Perform end-to-end testing
  - Test complete workflow: Create suite → Run tests → View results
  - Test CLI → Backend → Dashboard integration
  - Test agent catalog → Testing framework integration
  - Test error scenarios and edge cases
  - _Requirements: All_

- [ ] 21.5 Perform backward compatibility testing
  - Verify existing agent catalog functionality unchanged
  - Verify existing agent execution unchanged
  - Verify existing API endpoints unchanged
  - Test with feature flag disabled
  - _Requirements: 10.1_

### Task 22: Deployment & Monitoring

**Objective**: Deploy testing framework to production with monitoring

**Sub-tasks**:
- [ ] 22.1 Run database migrations
  - Execute migrations in staging environment
  - Verify table creation and indexes
  - Test rollback procedure
  - Execute migrations in production
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 22.2 Deploy backend services
  - Deploy testing service with feature flag OFF
  - Deploy API routes with middleware
  - Verify health check endpoints
  - Monitor for errors
  - _Requirements: 2.1, 20.1_

- [ ] 22.3 Deploy CLI updates
  - Publish new CLI version with test commands
  - Update documentation
  - Test CLI against production API
  - _Requirements: 8.1, 8.2_

- [ ] 22.4 Deploy frontend updates
  - Deploy testing dashboard components
  - Deploy agent catalog enhancements
  - Verify feature flag controls visibility
  - Test in production environment
  - _Requirements: 10.1, 16.1_

- [ ] 22.5 Enable feature for beta users
  - Set feature flag to 10% rollout
  - Monitor error rates and performance
  - Collect user feedback
  - Adjust based on findings
  - _Requirements: 10.2_

- [ ] 22.6 Full rollout
  - Set feature flag to 100% rollout
  - Monitor for 48 hours
  - Verify 99% uptime target
  - Document any issues and resolutions
  - _Requirements: 10.3_

- [ ] 22.7 Set up monitoring and alerts
  - Configure CloudWatch/Prometheus metrics
  - Set up alerts for error rate > 5%
  - Set up alerts for response time > 2s
  - Set up alerts for availability < 99%
  - Create monitoring dashboard
  - _Requirements: 10.4_

---

## Summary

**Total Tasks**: 22 main tasks with 130+ sub-tasks

**Estimated Timeline**: 6-8 weeks for full implementation

**Key Milestones**:
- Week 2: Backend infrastructure complete
- Week 4: Core services and CLI complete
- Week 6: Frontend dashboard complete
- Week 8: Full deployment and monitoring

**Success Criteria**:
- Zero breaking changes to existing functionality
- 99% uptime achieved
- All test suites functional (universal and custom)
- Agent catalog integration seamless
- Analytics and insights operational
- Feature flag rollout successful
