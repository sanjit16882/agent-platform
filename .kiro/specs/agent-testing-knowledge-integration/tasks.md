# Implementation Plan: Agent Testing Knowledge Integration

## Task List

- [x] 1. Update data models and interfaces



  - Create KnowledgeConfig interface in types
  - Extend TestResult interface with knowledge source fields
  - Update WorkflowState interface to include knowledgeConfig
  - _Requirements: 1.1, 4.1, 6.5_




- [ ] 2. Implement backend service methods
  - [ ] 2.1 Add executeTestWithKnowledge() to testExecutionService
    - Implement Vector DB search logic
    - Implement MCP tool execution logic
    - Implement LLM fallback with context
    - Add knowledge source tracking
    - Add latency tracking for each source
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3_

  - [ ] 2.2 Write property test for knowledge source priority
    - **Property 2: Knowledge Source Priority**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [ ] 2.3 Write property test for latency tracking
    - **Property 4: Latency Tracking Accuracy**
    - **Validates: Requirements 4.2, 4.3, 5.4**

  - [ ] 2.4 Add error handling for knowledge source failures
    - Implement graceful degradation for Vector DB failures
    - Implement graceful degradation for MCP failures
    - Add error logging
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 2.5 Write unit tests for executeTestWithKnowledge()
    - Test Vector DB high-confidence path
    - Test MCP success path


    - Test LLM fallback path
    - Test hybrid path
    - Test error handling

- [ ] 3. Create KnowledgeSourcePreview component
  - [ ] 3.1 Implement preview component
    - Display execution flow diagram
    - Show estimated latency impact
    - Show estimated cost impact
    - Display selected knowledge bases count
    - Display selected MCP servers count
    - _Requirements: 5.1, 5.2, 5.3_



  - [ ] 3.2 Write unit tests for KnowledgeSourcePreview
    - Test preview rendering with different configs
    - Test latency calculation
    - Test cost calculation


- [ ] 4. Create StepConfigureKnowledge component
  - [ ] 4.1 Implement main component structure
    - Create component with props interface
    - Implement state management
    - Add Vector DB toggle
    - Add MCP toggle
    - _Requirements: 1.1_

  - [ ] 4.2 Implement agent config auto-population
    - Load agent's Vector DB config on mount

    - Load agent's MCP config on mount
    - Pre-select knowledge bases from agent config
    - Pre-select MCP servers from agent config
    - Track if user modified defaults
    - _Requirements: 2.1, 2.2, 2.3, 2.4_


  - [ ] 4.3 Write property test for configuration auto-population
    - **Property 1: Configuration Auto-Population**
    - **Validates: Requirements 2.1, 2.2, 2.3**


  - [ ] 4.4 Implement Vector DB configuration UI
    - Add knowledge base multi-select
    - Add topK slider (1-10)
    - Add minSimilarity slider (0.0-1.0)


    - Show selected knowledge base details
    - _Requirements: 1.2, 1.3_

  - [ ] 4.5 Implement MCP configuration UI
    - Add MCP server multi-select
    - Show selected server capabilities
    - _Requirements: 1.4_

  - [ ] 4.6 Integrate KnowledgeSourcePreview
    - Pass config to preview component
    - Calculate and display impact estimates
    - _Requirements: 1.5, 5.1, 5.2, 5.3_

  - [x] 4.7 Add navigation controls


    - Implement Skip button
    - Implement Back button
    - Implement Continue button
    - Handle state preservation
    - _Requirements: 1.6, 6.4_


  - [ ] 4.8 Write unit tests for StepConfigureKnowledge
    - Test auto-population
    - Test toggle functionality
    - Test knowledge base selection
    - Test MCP server selection
    - Test skip functionality
    - Test state preservation

- [ ] 5. Update DDTFWorkflow component
  - [ ] 5.1 Add knowledge configuration step to workflow
    - Add Step 2.5 to STEPS array
    - Update step numbering
    - Add renderStep case for knowledge configuration
    - Pass agent config to StepConfigureKnowledge


    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Update workflow state management


    - Add knowledgeConfig to WorkflowState
    - Implement state save/restore for knowledge config
    - Handle skip step logic
    - _Requirements: 6.3, 6.5_

  - [ ] 5.3 Write property test for state preservation
    - **Property 6: State Preservation**
    - **Validates: Requirements 6.3**

  - [ ] 5.4 Write integration test for workflow
    - Test complete workflow with knowledge sources


    - Test workflow with skip
    - Test navigation backward/forward

- [x] 6. Update StepExecute component

  - [ ] 6.1 Add knowledge config prop
    - Accept knowledgeConfig from workflow state
    - Pass to test execution service
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 6.2 Implement execution flow display
    - Show "Searching Vector DB..." status
    - Show "Executing MCP tools..." status
    - Show "Generating LLM response..." status


    - Display results for each step
    - Show latency for each step
    - _Requirements: 5.4_

  - [ ] 6.3 Write unit tests for StepExecute updates
    - Test execution flow display
    - Test knowledge config integration

- [ ] 7. Update StepResults component
  - [ ] 7.1 Add knowledge source badges
    - Display badge for each test result
    - Show "Vector DB", "MCP", "LLM", or "Hybrid" badge
    - Style badges with appropriate colors
    - _Requirements: 7.1, 4.1_



  - [ ] 7.2 Display knowledge source metrics
    - Show retrieved documents count
    - Show MCP tools used
    - Show latency breakdown
    - _Requirements: 7.2, 7.3, 5.5_

  - [ ] 7.3 Write property test for knowledge source tracking
    - **Property 3: Knowledge Source Tracking Completeness**
    - **Validates: Requirements 4.1, 4.4**

  - [ ] 7.4 Update export functionality
    - Include knowledge source in CSV export
    - Include knowledge source in JSON export
    - Include knowledge source in HTML export
    - Include all metrics (latencies, docs, tools)
    - _Requirements: 7.4_



  - [ ] 7.5 Write property test for export completeness
    - **Property 7: Export Completeness**
    - **Validates: Requirements 7.4**

  - [x] 7.6 Write unit tests for StepResults updates

    - Test badge rendering
    - Test metrics display
    - Test export with knowledge source data

- [x] 8. Implement execution mode tracking

  - [ ] 8.1 Add execution mode detection
    - Detect LLM-only mode
    - Detect RAG mode
    - Detect MCP mode

    - Detect Full-stack mode
    - Record mode in test results
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_



  - [ ] 8.2 Write property test for execution mode consistency
    - **Property 8: Execution Mode Consistency**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

  - [ ] 8.3 Write integration tests for execution modes
    - Test LLM-only mode
    - Test RAG mode
    - Test MCP mode
    - Test Full-stack mode

- [ ] 9. Add UI polish and accessibility
  - [ ] 9.1 Add tooltips and help text
    - Add tooltip for topK parameter
    - Add tooltip for minSimilarity parameter
    - Add help text for Vector DB toggle
    - Add help text for MCP toggle


    - Add guidance for skip button

  - [ ] 9.2 Implement accessibility features
    - Add ARIA labels to all interactive elements
    - Ensure keyboard navigation works
    - Add focus indicators
    - Verify color contrast for badges

  - [ ] 9.3 Add visual indicators
    - Show "Using agent's config" badge when defaults used
    - Show "Modified" badge when user changes defaults
    - Add loading states for knowledge source operations

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Documentation and final testing
  - [ ] 11.1 Create user documentation
    - Document knowledge configuration step
    - Document execution modes
    - Document knowledge source badges
    - Add examples and screenshots

  - [ ] 11.2 Performance testing
    - Test latency with different configurations
    - Test with large knowledge bases
    - Test with multiple MCP servers
    - Verify optimization strategies

  - [ ] 11.3 End-to-end testing
    - Test complete workflow with real agents
    - Test with agents that have Vector DB configured
    - Test with agents that have MCP configured
    - Test with agents that have both
    - Test with agents that have neither

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

**Total Tasks**: 12 main tasks, 35 sub-tasks  
**Optional Tasks**: 0 (all tasks required)  
**Estimated Effort**: 2-3 weeks  
**Dependencies**: Requires existing Vector DB and MCP services
