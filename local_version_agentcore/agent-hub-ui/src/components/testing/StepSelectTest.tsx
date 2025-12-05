import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

interface StepSelectTestProps {
  selectedAgent: any;
  selectedTests: any[];
  onSelectTests: (tests: any[]) => void;
}

// Core tests that ALWAYS appear for ALL agents
const CORE_TESTS = {
  hallucination: {
    priority: 10,
    reason: 'Ensures accuracy and truthfulness',
    badge: 'CORE',
    color: '#667eea' // Purple
  },
  safety: {
    priority: 10,
    reason: 'Ensures safe and appropriate responses',
    badge: 'CORE',
    color: '#667eea' // Purple
  },
  functional: {
    priority: 10,
    reason: 'Validates basic task completion',
    badge: 'CORE',
    color: '#667eea' // Purple
  },
  intent_detection: {
    priority: 9,
    reason: 'Validates understanding of user goals',
    badge: 'RECOMMENDED',
    color: theme.colors.success
  },
  emotional: {
    priority: 8,
    reason: 'Ensures appropriate emotional responses',
    badge: 'RECOMMENDED',
    color: theme.colors.success
  }
};

const StepSelectTest: React.FC<StepSelectTestProps> = ({
  selectedAgent,
  selectedTests,
  onSelectTests
}) => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [recommendedTests, setRecommendedTests] = useState<any[]>([]);
  const [coreTestCount, setCoreTestCount] = useState(0);
  const [agentSpecificCount, setAgentSpecificCount] = useState(0);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  // Helper function to render scoring rules (handles objects)
  const renderScoringRules = (scoringRules: any): string => {
    if (!scoringRules) return 'Standard scoring applied';
    if (typeof scoringRules === 'string') return scoringRules;
    if (typeof scoringRules === 'object') return JSON.stringify(scoringRules, null, 2);
    return String(scoringRules);
  };

  // Helper function to get category badge color
  const getCategoryBadgeColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'tool_usage': '#06b6d4',      // Cyan/Teal
      'rag_grounding': '#06b6d4',   // Cyan/Teal
      'monitoring': '#06b6d4',      // Cyan/Teal
      'adversarial': '#06b6d4',     // Cyan/Teal
      'multi_turn': '#06b6d4',      // Cyan/Teal
      'hallucination': '#667eea',   // Purple (core)
      'safety': '#667eea',          // Purple (core)
      'functional': '#667eea',      // Purple (core)
      'intent_detection': '#667eea',// Purple (core)
      'emotional': '#667eea'        // Purple (core)
    };
    return categoryColors[category] || '#06b6d4'; // Default to cyan for agent-specific
  };

  // Load CORE tests from API based on agent category and sub-type
  const loadCoreTestsFromAPI = async (category: string, agentSubType: string): Promise<any[]> => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';
      console.log(`🎯 Loading CORE tests from API for ${category} - ${agentSubType}`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/testing/relevant-tests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent: {
              category: category,
              agentSubType: agentSubType
            }
          })
        }
      );
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to load CORE tests from API: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log('✅ CORE tests loaded from API:', data);
      return data.data?.coreTests || [];
    } catch (err) {
      console.error('❌ Error loading CORE tests from API:', err);
      return [];
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadTests(); // Reload tests when agent changes
    }
  }, [selectedAgent]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';
      
      // If agent is selected, get relevant tests based on category
      if (selectedAgent) {
        console.log('🎯 Loading relevant tests for agent:', selectedAgent);
        
        // Check if agent has Phase 2 category and sub-type
        const { category, agentSubType } = getAgentCategoryAndType(selectedAgent);
        
        if (category && agentSubType) {
          console.log('✅ Agent has category/sub-type, loading CORE tests from API');
          
          // Load CORE tests from API
          const coreTestsFromAPI = await loadCoreTestsFromAPI(category, agentSubType);
          
          // Load all tests for agent-specific recommendations
          const allTestsResponse = await fetch(`${API_BASE_URL}/api/testing/library/list`);
          const allTestsData = await allTestsResponse.json();
          const allTests = allTestsData.data || [];
          
          // Mark CORE tests from API
          const coreTestIds = coreTestsFromAPI.map((t: any) => t.id);
          const testsWithFlags = allTests.map((test: any) => ({
            ...test,
            isCore: coreTestIds.includes(test.id),
            isCoreFromAPI: coreTestIds.includes(test.id), // New flag for API-based CORE tests
            section: coreTestIds.includes(test.id) ? 'core' : 'agent-specific'
          }));
          
          setTests(testsWithFlags);
          
          // Apply intelligent filtering to get only relevant agent-specific tests
          const agentType = getAgentType(selectedAgent);
          console.log(`🎯 Applying intelligent filtering for agent type: ${agentType}`);
          
          const filteredResults = applyIntelligentFiltering(testsWithFlags, agentType);
          
          setRecommendedTests(filteredResults.allTests);
          setCoreTestCount(filteredResults.coreTests.length);
          setAgentSpecificCount(filteredResults.agentSpecificTests.length);
          
          console.log(`✅ Loaded ${filteredResults.coreTests.length} CORE tests from API + ${filteredResults.agentSpecificTests.length} agent-specific tests (filtered from ${testsWithFlags.length} total)`);
        } else {
          console.log('⚠️ Agent missing category/sub-type, using fallback logic');
          
          // Fallback to existing logic for uncategorized agents
          const response = await fetch(`${API_BASE_URL}/api/testing/relevant-tests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agent: selectedAgent })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to load relevant tests: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('✅ Relevant tests loaded (fallback):', data);
          
          // Set tests with core/additional flags
          const allTests = data.data.allTests || [];
          const coreTestIds = (data.data.coreTests || []).map((t: any) => t.id);
          
          // If no tests found, load all tests from library and apply intelligent filtering
          if (allTests.length === 0) {
            console.log('⚠️ No relevant tests found, loading all tests and applying intelligent filtering');
            const libraryResponse = await fetch(`${API_BASE_URL}/api/testing/library/list`);
            
            if (!libraryResponse.ok) {
              throw new Error(`Failed to load test library: ${libraryResponse.status} ${libraryResponse.statusText}`);
            }
            
            const libraryData = await libraryResponse.json();
            console.log('✅ All tests loaded from library:', libraryData);
            
            // Store all tests temporarily for filtering
            const allLibraryTests = libraryData.data || [];
            setTests(allLibraryTests);
            
            // Apply intelligent filtering based on agent type
            const agentType = getAgentType(selectedAgent);
            console.log(`🎯 Applying intelligent filtering for agent type: ${agentType}`);
            
            // Get filtered and prioritized tests
            const filteredResults = applyIntelligentFiltering(allLibraryTests, agentType);
            
            setRecommendedTests(filteredResults.allTests);
            setCoreTestCount(filteredResults.coreTests.length);
            setAgentSpecificCount(filteredResults.agentSpecificTests.length);
            
            console.log(`✅ Intelligent filtering applied: ${filteredResults.coreTests.length} core + ${filteredResults.agentSpecificTests.length} agent-specific tests`);
          } else {
            const testsWithFlags = allTests.map((test: any) => ({
              ...test,
              isCore: coreTestIds.includes(test.id),
              isCoreFromAPI: false, // Not from API
              section: coreTestIds.includes(test.id) ? 'core' : 'agent-specific'
            }));
            
            setTests(testsWithFlags);
            setRecommendedTests(testsWithFlags);
            setCoreTestCount(data.data.coreTests?.length || 0);
            setAgentSpecificCount(data.data.additionalTests?.length || 0);
          }
        }
      } else {
        // No agent selected, load all tests
        const response = await fetch(`${API_BASE_URL}/api/testing/library/list`);
        
        if (!response.ok) {
          throw new Error(`Failed to load tests: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ All tests loaded:', data);
        setTests(data.data || []);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error loading tests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get agent category and sub-type from Phase 2 fields
  const getAgentCategoryAndType = (agent: any): { category: string | null, agentSubType: string | null } => {
    return {
      category: agent.category || null,
      agentSubType: agent.agentSubType || agent.agent_sub_type || null
    };
  };

  // Apply intelligent filtering to tests based on agent type
  const applyIntelligentFiltering = (tests: any[], agentType: string) => {
    // Define relevant test categories per agent type with priority scores
    // These map to actual test categories in the database (e.g., development_code_review, qe_test_case_creation)
    const agentTestMapping: Record<string, Record<string, number>> = {
      // Development - Code Review
      'code-review': {
        'development_code_review': 10,
        'development_bug_fixing': 9,
        'development_documentation': 7,
        'automated_testing_framework': 6,
        'security_testing_testgen': 5
      },
      // Development - Code Generation
      'code-generation': {
        'development_code_generation': 10,
        'development_documentation': 8,
        'automated_testing_script': 7,
        'development_bug_fixing': 6
      },
      // Development - Bug Fixing
      'bug-fixing': {
        'development_bug_fixing': 10,
        'development_code_review': 9,
        'automated_testing_framework': 7,
        'qe_defect_reporting': 6
      },
      // Development - Documentation
      'documentation': {
        'development_documentation': 10,
        'development_code_review': 8,
        'business_analysis_requirements': 7
      },
      // QE - Test Case Creation
      'test-case-creation': {
        'qe_test_case_creation': 10,
        'automated_testing_framework': 8,
        'qe_defect_reporting': 6
      },
      // QE - Defect Reporting
      'defect-reporting': {
        'qe_defect_reporting': 10,
        'qe_test_case_creation': 8,
        'development_bug_fixing': 7
      },
      // QE - Test Automation
      'test-automation': {
        'qe_test_automation': 10,
        'automated_testing_script': 9,
        'automated_testing_framework': 8,
        'qe_test_case_creation': 6
      },
      // QE - API Testing
      'api-testing': {
        'qe_api_testing': 10,
        'automated_testing_framework': 8,
        'devops_cicd': 6
      },
      // DevOps - CI/CD Pipeline
      'ci/cd-pipeline': {
        'devops_cicd': 10,
        'devops_container': 8,
        'automated_testing_framework': 7,
        'devops_iac': 6
      },
      // DevOps - Infrastructure as Code
      'infrastructure-as-code': {
        'devops_iac': 10,
        'devops_cicd': 8,
        'devops_container': 7,
        'security_audit': 5
      },
      // DevOps - Container Management
      'container-management': {
        'devops_container': 10,
        'devops_iac': 8,
        'devops_cicd': 7,
        'sre_monitoring': 6
      },
      // Security - Vulnerability Assessment
      'vulnerability-assessment': {
        'security_vulnerability': 10,
        'security_audit': 9,
        'security_testing_pentest': 8,
        'development_code_review': 6
      },
      // Security - Security Audit
      'security-audit': {
        'security_audit': 10,
        'security_vulnerability': 9,
        'security_threat': 8,
        'devops_iac': 6
      },
      // Security - Threat Modeling
      'threat-modeling': {
        'security_threat': 10,
        'security_audit': 9,
        'security_vulnerability': 8
      },
      // Security Testing - Penetration Testing
      'penetration-testing': {
        'security_testing_pentest': 10,
        'security_vulnerability': 9,
        'security_audit': 8
      },
      // Security Testing - Test Generation
      'test-generation': {
        'security_testing_testgen': 10,
        'automated_testing_framework': 9,
        'qe_test_case_creation': 8
      },
      // Automated Testing - Framework
      'framework': {
        'automated_testing_framework': 10,
        'automated_testing_script': 9,
        'qe_test_automation': 8
      },
      // Automated Testing - Script
      'script': {
        'automated_testing_script': 10,
        'automated_testing_framework': 9,
        'qe_test_automation': 8
      },
      // Business Analysis - Requirements
      'requirements': {
        'business_analysis_requirements': 10,
        'business_analysis_user_story': 9,
        'product_management_prioritization': 7
      },
      // Business Analysis - User Story
      'user-story': {
        'business_analysis_user_story': 10,
        'business_analysis_requirements': 9,
        'qe_test_case_creation': 7
      },
      // Business Analysis - Process
      'process': {
        'business_analysis_process': 10,
        'business_analysis_requirements': 8,
        'project_management_planning': 7
      },
      // Product Management - Prioritization
      'prioritization': {
        'product_management_prioritization': 10,
        'product_management_roadmap': 9,
        'business_analysis_requirements': 7
      },
      // Product Management - Roadmap
      'roadmap': {
        'product_management_roadmap': 10,
        'product_management_prioritization': 9,
        'product_management_market': 8
      },
      // Product Management - Market
      'market': {
        'product_management_market': 10,
        'product_management_roadmap': 8,
        'business_analysis_requirements': 6
      },
      // Project Management - Planning
      'planning': {
        'project_management_planning': 10,
        'project_management_risk': 8,
        'business_analysis_requirements': 7
      },
      // Project Management - Risk
      'risk': {
        'project_management_risk': 10,
        'project_management_planning': 9,
        'project_management_status': 7
      },
      // Project Management - Status
      'status': {
        'project_management_status': 10,
        'project_management_planning': 8,
        'project_management_risk': 7
      },
      // Production Support - Incident
      'incident': {
        'production_support_incident': 10,
        'production_support_rca': 9,
        'sre_incident_response': 8,
        'sre_monitoring': 7
      },
      // Production Support - RCA
      'rca': {
        'production_support_rca': 10,
        'production_support_incident': 9,
        'production_support_troubleshoot': 8
      },
      // Production Support - Troubleshoot
      'troubleshoot': {
        'production_support_troubleshoot': 10,
        'production_support_rca': 9,
        'production_support_incident': 8,
        'sre_monitoring': 7
      },
      // SRE - Monitoring
      'monitoring': {
        'sre_monitoring': 10,
        'sre_incident_response': 9,
        'production_support_incident': 7,
        'devops_cicd': 6
      },
      // SRE - Capacity
      'capacity': {
        'sre_capacity': 10,
        'sre_monitoring': 9,
        'sre_reliability': 8
      },
      // SRE - Incident Response
      'incident-response': {
        'sre_incident_response': 10,
        'sre_monitoring': 9,
        'production_support_incident': 8,
        'production_support_rca': 7
      },
      // SRE - Reliability
      'reliability': {
        'sre_reliability': 10,
        'sre_monitoring': 9,
        'sre_capacity': 8,
        'sre_incident_response': 7
      },
      // Fallback for unknown types
      'general': {
        'development_code_review': 7,
        'qe_test_case_creation': 7,
        'automated_testing_framework': 6,
        'security_audit': 5,
        'devops_cicd': 5
      }
    };

    const priorityMap = agentTestMapping[agentType] || agentTestMapping['general'];
    console.log(`🔍 DEBUG: Agent type: ${agentType}, Priority map categories:`, Object.keys(priorityMap));
    
    // STEP 1: Get Core Tests (Always included)
    // First check if tests already have isCore flag from API (Phase 2)
    console.log(`🔍 DEBUG: Total tests passed to filter: ${tests.length}`);
    console.log(`🔍 DEBUG: Sample test flags:`, tests.slice(0, 3).map(t => ({ 
      id: t.id, 
      name: t.name, 
      isCore: t.isCore, 
      isCoreFromAPI: t.isCoreFromAPI 
    })));
    
    const coreTestsFromAPI = tests.filter(test => test.isCore === true || test.isCoreFromAPI === true);
    console.log(`🔍 DEBUG: Found ${coreTestsFromAPI.length} tests with isCore flag`);
    
    if (coreTestsFromAPI.length > 0) {
      // Use API-provided core tests
      console.log(`✅ Using ${coreTestsFromAPI.length} CORE tests from API`);
      var coreTests = coreTestsFromAPI.map(test => ({
        ...test,
        section: 'core'
      }));
    } else {
      // Fallback to hardcoded core test categories (Phase 1)
      const coreTestCategories = Object.keys(CORE_TESTS);
      
      // Exclude code-specific tests from core (they should be agent-specific)
      const isCodeSpecificTest = (test: any): boolean => {
        const name = test.name?.toLowerCase() || '';
        return name.includes('code generation') || 
               name.includes('python') || 
               name.includes('javascript') ||
               name.includes('java ') ||
               name.includes('c++') ||
               name.includes('programming');
      };
      
      var coreTests = tests
        .filter(test => coreTestCategories.includes(test.category) && !isCodeSpecificTest(test))
        .map(test => ({
          ...test,
          relevanceScore: CORE_TESTS[test.category as keyof typeof CORE_TESTS].priority,
          isCore: true,
          reason: CORE_TESTS[test.category as keyof typeof CORE_TESTS].reason,
          badge: CORE_TESTS[test.category as keyof typeof CORE_TESTS].badge,
          badgeColor: CORE_TESTS[test.category as keyof typeof CORE_TESTS].color,
          section: 'core'
        }));
      
      console.log(`✅ Using ${coreTests.length} core tests from fallback logic`);
    }
    
    // STEP 2: Get Agent-Specific Tests (exclude core tests)
    const nonCoreTests = tests.filter(test => {
      // Exclude if already marked as core
      if (test.isCore === true || test.isCoreFromAPI === true) return false;
      return true;
    });
    
    console.log(`🔍 DEBUG: Non-core tests: ${nonCoreTests.length}`);
    console.log(`🔍 DEBUG: Sample non-core test categories:`, nonCoreTests.slice(0, 5).map(t => ({ id: t.id, category: t.category, subtype: t.subtype })));
    
    const testsWithScores = nonCoreTests.map(test => {
      // Create composite key: category_subtype (e.g., "Development" + "code-review" = "development_code_review")
      // Replace spaces and hyphens with underscores to match priority map keys
      const compositeKey = test.category && test.subtype 
        ? `${test.category.toLowerCase()}_${test.subtype.toLowerCase().replace(/[\s-]+/g, '_')}`
        : test.category?.toLowerCase() || '';
      
      return {
        ...test,
        relevanceScore: priorityMap[compositeKey] || 0,
        isCore: false,
        section: 'agent-specific',
        _debugKey: compositeKey // For debugging
      };
    });
    
    const relevantTests = testsWithScores.filter(test => test.relevanceScore > 0);
    console.log(`🔍 DEBUG: Tests with relevance score > 0: ${relevantTests.length}`);
    if (relevantTests.length > 0) {
      console.log(`🔍 DEBUG: Sample relevant tests:`, relevantTests.slice(0, 3).map(t => ({ 
        name: t.name, 
        key: t._debugKey, 
        score: t.relevanceScore 
      })));
    } else if (testsWithScores.length > 0) {
      console.log(`🔍 DEBUG: No matches found. Sample test keys:`, testsWithScores.slice(0, 5).map(t => t._debugKey));
    }
    
    const agentSpecificTests = relevantTests
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by priority
      .slice(0, 15); // Top 15 agent-specific tests
    
    console.log(`✅ Found ${agentSpecificTests.length} agent-specific tests for ${agentType}`);
    if (agentSpecificTests.length > 0) {
      console.log(`🔍 DEBUG: Top agent-specific tests:`, agentSpecificTests.slice(0, 3).map(t => ({ 
        name: t.name, 
        category: t.category, 
        score: t.relevanceScore 
      })));
    }
    
    // STEP 3: Combine: core + agent-specific
    const allRecommendedTests = [...coreTests, ...agentSpecificTests];
    
    console.log(`📊 Total recommended: ${allRecommendedTests.length} (${coreTests.length} core + ${agentSpecificTests.length} specific)`);
    
    // Return the results for the caller
    return {
      coreTests,
      agentSpecificTests,
      allTests: allRecommendedTests
    };
  };

  const getAgentType = (agent: any): string => {
    console.log('🔍 Detecting agent type for:', agent);
    
    // First, try to use Phase 2 fields
    const { category, agentSubType } = getAgentCategoryAndType(agent);
    if (category && agentSubType) {
      console.log('✅ Found Phase 2 fields:', { category, agentSubType });
      return agentSubType.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Fallback to old detection logic
    if (agent.type) {
      console.log('✅ Found agent.type:', agent.type);
      return agent.type.toLowerCase();
    }
    if (agent.category) {
      const categoryType = agent.category.toLowerCase().replace(/\s+/g, '-');
      console.log('✅ Found agent.category:', categoryType);
      return categoryType;
    }
    if (agent.name) {
      const name = agent.name.toLowerCase();
      console.log('🔍 Checking agent.name:', name);
      
      // Performance/Monitoring agents
      if (name.includes('performance') || name.includes('monitor') || name.includes('observability')) {
        console.log('✅ Matched monitoring');
        return 'monitoring';
      }
      
      // Code-related agents
      if (name.includes('code') || name.includes('review')) {
        console.log('✅ Matched code-review');
        return 'code-review';
      }
      
      // Security agents
      if (name.includes('security') || name.includes('scan') || name.includes('vulnerability')) {
        console.log('✅ Matched security-scan');
        return 'security-scan';
      }
      
      // E2E/QA Testing agents (more specific match first)
      if (name.includes('e2e') || name.includes('end to end') || name.includes('qa') || name.includes('quality assurance')) {
        console.log('✅ Matched qa-tester');
        return 'qa-tester';
      }
      
      // API/Testing agents
      if (name.includes('api') || name.includes('test')) {
        console.log('✅ Matched api-tester');
        return 'api-tester';
      }
      
      // Data agents
      if (name.includes('data') || name.includes('valid') || name.includes('etl')) {
        console.log('✅ Matched data-validator');
        return 'data-validator';
      }
      
      // Customer service agents
      if (name.includes('customer') || name.includes('support') || name.includes('service')) {
        console.log('✅ Matched customer-service');
        return 'customer-service';
      }
      
      // Analytics agents
      if (name.includes('analytic') || name.includes('insight') || name.includes('report')) {
        console.log('✅ Matched analytics');
        return 'analytics';
      }
      
      // Automation agents
      if (name.includes('automat') || name.includes('workflow') || name.includes('orchestrat')) {
        console.log('✅ Matched automation');
        return 'automation';
      }
    }
    console.log('⚠️ No match found, defaulting to general. Agent:', agent.name || agent.id);
    return 'general';
  };

  const filterTestsForAgent = () => {
    const agentType = getAgentType(selectedAgent);
    console.log(`🎯 Agent type detected: ${agentType}`);
    
    // Define relevant test categories per agent type with priority scores
    // NOTE: Core tests are NOT included here - they're added separately
    const agentTestMapping: Record<string, Record<string, number>> = {
      'monitoring': {
        'monitoring': 10,        // Monitoring-specific tests (highest priority!)
        'tool_usage': 9,         // Needs to call monitoring APIs
        'rag_grounding': 7,      // Must stay grounded in actual data
        'adversarial': 4,        // Lower priority
        'multi_turn': 3          // Less relevant
      },
      'code-review': {
        'tool_usage': 9,
        'rag_grounding': 8,
        'adversarial': 6,
        'multi_turn': 5
      },
      'production': {
        'tool_usage': 8,
        'adversarial': 7,
        'rag_grounding': 6,
        'multi_turn': 5
      },
      'security-scan': {
        'adversarial': 10,
        'tool_usage': 6,
        'rag_grounding': 5,
        'monitoring': 4
      },
      'api-tester': {
        'tool_usage': 10,
        'adversarial': 5,
        'rag_grounding': 4,
        'monitoring': 3
      },
      'qa-tester': {
        'adversarial': 8,        // Test edge cases and failures
        'multi_turn': 7,         // Test conversation flows
        'monitoring': 5,         // May monitor test results
        'tool_usage': 4,         // Lower priority unless agent uses tools
        'rag_grounding': 3       // Lower priority unless agent uses RAG
      },
      'data-validator': {
        'rag_grounding': 10,
        'tool_usage': 7,
        'adversarial': 5,
        'monitoring': 3
      },
      'customer-service': {
        'multi_turn': 10,        // Conversations are multi-turn
        'rag_grounding': 8,      // Must use knowledge base
        'tool_usage': 7,         // May use CRM tools
        'adversarial': 6         // Handle difficult customers
      },
      'analytics': {
        'rag_grounding': 10,     // Must base on actual data
        'tool_usage': 9,         // May need to query databases
        'monitoring': 6,         // May monitor metrics
        'adversarial': 4
      },
      'automation': {
        'tool_usage': 10,        // Heavy tool usage
        'adversarial': 7,        // Resist malicious commands
        'monitoring': 6,         // May monitor workflows
        'multi_turn': 5
      },
      'general': {
        'tool_usage': 7,
        'rag_grounding': 7,
        'multi_turn': 6,
        'adversarial': 5,
        'monitoring': 3
      }
    };

    const priorityMap = agentTestMapping[agentType] || agentTestMapping['general'];
    
    // STEP 1: Get Core Tests (Always included)
    // First check if tests already have isCore flag from API (Phase 2)
    console.log(`🔍 DEBUG: Total tests passed to filter: ${tests.length}`);
    console.log(`🔍 DEBUG: Sample test flags:`, tests.slice(0, 3).map(t => ({ 
      id: t.id, 
      name: t.name, 
      isCore: t.isCore, 
      isCoreFromAPI: t.isCoreFromAPI 
    })));
    
    const coreTestsFromAPI = tests.filter(test => test.isCore === true || test.isCoreFromAPI === true);
    console.log(`🔍 DEBUG: Found ${coreTestsFromAPI.length} tests with isCore flag`);
    
    if (coreTestsFromAPI.length > 0) {
      // Use API-provided core tests
      console.log(`✅ Using ${coreTestsFromAPI.length} CORE tests from API`);
      var coreTests = coreTestsFromAPI.map(test => ({
        ...test,
        section: 'core'
      }));
    } else {
      // Fallback to hardcoded core test categories (Phase 1)
      const coreTestCategories = Object.keys(CORE_TESTS);
      
      // Exclude code-specific tests from core (they should be agent-specific)
      const isCodeSpecificTest = (test: any): boolean => {
        const name = test.name?.toLowerCase() || '';
        return name.includes('code generation') || 
               name.includes('python') || 
               name.includes('javascript') ||
               name.includes('java ') ||
               name.includes('c++') ||
               name.includes('programming');
      };
      
      var coreTests = tests
        .filter(test => coreTestCategories.includes(test.category) && !isCodeSpecificTest(test))
        .map(test => ({
          ...test,
          relevanceScore: CORE_TESTS[test.category as keyof typeof CORE_TESTS].priority,
          isCore: true,
          reason: CORE_TESTS[test.category as keyof typeof CORE_TESTS].reason,
          badge: CORE_TESTS[test.category as keyof typeof CORE_TESTS].badge,
          badgeColor: CORE_TESTS[test.category as keyof typeof CORE_TESTS].color,
          section: 'core'
        }));
      
      console.log(`✅ Using ${coreTests.length} core tests from fallback logic`);
    }
    
    // STEP 2: Get Agent-Specific Tests (exclude core tests)
    const agentSpecificTests = tests
      .filter(test => {
        // Exclude if already marked as core
        if (test.isCore === true || test.isCoreFromAPI === true) return false;
        return true;
      })
      .map(test => ({
        ...test,
        relevanceScore: priorityMap[test.category] || 0,
        isCore: false,
        section: 'agent-specific'
      }))
      .filter(test => test.relevanceScore > 0) // Only relevant tests
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by priority
      .slice(0, 15); // Top 15 agent-specific tests
    
    console.log(`✅ Found ${agentSpecificTests.length} agent-specific tests for ${agentType}`);
    
    // STEP 3: Combine: core + agent-specific
    const allRecommendedTests = [...coreTests, ...agentSpecificTests];
    
    console.log(`📊 Total recommended: ${allRecommendedTests.length} (${coreTests.length} core + ${agentSpecificTests.length} specific)`);
    
    // Return the results for the caller
    return {
      coreTests,
      agentSpecificTests,
      allTests: allRecommendedTests
    };
    console.log(`📊 Category distribution:`, 
      allRecommendedTests.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );
  };

  const toggleTest = (test: any) => {
    const isSelected = selectedTests.some(t => t.id === test.id);
    let newSelectedTests;
    if (isSelected) {
      newSelectedTests = selectedTests.filter(t => t.id !== test.id);
    } else {
      newSelectedTests = [...selectedTests, test];
    }
    onSelectTests(newSelectedTests);
  };

  const selectAll = () => {
    onSelectTests(filteredTests);
  };

  const clearAll = () => {
    onSelectTests([]);
  };

  // Use recommended tests if agent is selected, otherwise show all
  const baseTests = recommendedTests.length > 0 ? recommendedTests : tests;
  
  const filteredTests = baseTests.filter(test => {
    if (filterType !== 'all' && test.type !== filterType) return false;
    if (filterCategory !== 'all' && test.category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            Loading tests...
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div style={{
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.dangerLight,
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: theme.borderRadius.md,
            textAlign: 'center'
          }}>
            <div style={{ color: theme.colors.danger }}>⚠ Error: {error}</div>
            <Button variant="outline-danger" onClick={loadTests} style={{ marginTop: theme.spacing.md }}>
              Retry
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Warning Banner for Uncategorized Agents */}
      {selectedAgent && !selectedAgent.category && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Body>
            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.warningLight,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.warning}`
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.warning,
                marginBottom: theme.spacing.sm
              }}>
                ⚠️ Agent Not Categorized
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.md
              }}>
                This agent doesn't have a category assigned. We're showing general test recommendations based on AI analysis.
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary
              }}>
                💡 <strong>Tip:</strong> Edit your agent and select a category to get more accurate CORE test recommendations!
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Agent-Specific Info Banner */}
      {selectedAgent && selectedAgent.category && recommendedTests.length > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Body>
            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.successLight,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.success}`
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.success,
                marginBottom: theme.spacing.sm
              }}>
                ✅ {recommendedTests.length} Recommended Tests for {selectedAgent.name}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.md
              }}>
                These tests are intelligently selected based on your agent's category: <strong>{selectedAgent.category}</strong>
                {selectedAgent.agentSubType && ` - ${selectedAgent.agentSubType}`}
              </div>
              <div style={{
                display: 'flex',
                gap: theme.spacing.lg,
                fontSize: theme.typography.fontSize.sm
              }}>
                <div>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: '#10b981' }}>
                    {coreTestCount} CORE Tests
                  </span>
                  <span style={{ color: theme.colors.textSecondary }}> (from test metadata)</span>
                </div>
                <div>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.primary }}>
                    {agentSpecificCount} Agent-Specific Tests
                  </span>
                  <span style={{ color: theme.colors.textSecondary }}> (recommended for this type)</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Fallback Info Banner for Uncategorized Agents */}
      {selectedAgent && !selectedAgent.category && recommendedTests.length > 0 && (
        <Card style={{ marginBottom: theme.spacing.xl }}>
          <Card.Body>
            <div style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.primaryLight,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.primary}`
            }}>
              <div style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.primary,
                marginBottom: theme.spacing.sm
              }}>
                🤖 {recommendedTests.length} AI-Recommended Tests for {selectedAgent.name}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.md
              }}>
                These tests are selected by AI based on your agent's name and description.
              </div>
              <div style={{
                display: 'flex',
                gap: theme.spacing.lg,
                fontSize: theme.typography.fontSize.sm
              }}>
                <div>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: '#f59e0b' }}>
                    {coreTestCount} LLM Tests
                  </span>
                  <span style={{ color: theme.colors.textSecondary }}> (AI-recommended)</span>
                </div>
                <div>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.primary }}>
                    {agentSpecificCount} Agent-Specific Tests
                  </span>
                  <span style={{ color: theme.colors.textSecondary }}> (recommended for this type)</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}



      <Card>
        <Card.Header>
          <Card.Title>Select Tests to Run</Card.Title>
          <Card.Text>
            {recommendedTests.length > 0 
              ? `${recommendedTests.length} tests recommended for ${selectedAgent?.name}`
              : 'Choose one or more tests from the library'
            }
          </Card.Text>
        </Card.Header>

        <Card.Body>
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.xl,
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.xs,
              color: theme.colors.textSecondary
            }}>
              Test Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm
              }}
            >
              <option value="all">All Types</option>
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="template">Template</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.sm,
              marginBottom: theme.spacing.xs,
              color: theme.colors.textSecondary
            }}>
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm
              }}
            >
              <option value="all">All Categories</option>
              <option value="hallucination">Hallucination</option>
              <option value="functional">Functional</option>
              <option value="tool_usage">Tool Usage</option>
              <option value="emotional">Emotional</option>
              <option value="safety">Safety</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
            <Button variant="outline-primary" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedTests.length > 0 && (
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.successLight,
            border: `1px solid ${theme.colors.success}`,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.xl
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.success
            }}>
              ✓ {selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}



        {/* Test List - Redesigned with Sticky Headers */}
        {filteredTests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl'],
            color: theme.colors.textSecondary
          }}>
            No tests found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {/* Core Tests Section */}
            {recommendedTests.length > 0 && filteredTests.some((t: any) => t.isCore) && (
              <div>
                {/* Sticky Section Header */}
                <div style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: theme.colors.white,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.md,
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.bold,
                        marginBottom: theme.spacing.xs
                      }}>
                        ⭐ Core Tests ({filteredTests.filter((t: any) => t.isCore).length})
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        opacity: 0.9
                      }}>
                        {selectedAgent?.category && selectedAgent?.agentSubType
                          ? `Recommended for ${selectedAgent.category} - ${selectedAgent.agentSubType}`
                          : 'Always included • Essential for all agents'
                        }
                      </div>
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize['2xl'],
                      fontWeight: theme.typography.fontWeight.bold
                    }}>
                      CORE
                    </div>
                  </div>
                </div>

                {/* Compact Test Cards */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.xl
                }}>
                  {filteredTests.filter((t: any) => t.isCore).map((test) => {
                    const isSelected = selectedTests.some(t => t.id === test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggleTest(test)}
                        style={{
                          border: `2px solid ${isSelected ? theme.colors.success : theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          backgroundColor: isSelected ? theme.colors.successLight : theme.colors.white,
                          padding: theme.spacing.md,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: theme.spacing.sm,
                            right: theme.spacing.sm,
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: theme.colors.success,
                            color: theme.colors.white,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.bold
                          }}>
                            ✓
                          </div>
                        )}

                        {/* Test Name */}
                        <div style={{
                          fontSize: theme.typography.fontSize.base,
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.textPrimary,
                          marginBottom: theme.spacing.xs,
                          paddingRight: '30px'
                        }}>
                          {test.name}
                        </div>

                        {/* Badge - Green for API CORE, Yellow for LLM */}
                        {test.isCore && (
                          <div style={{
                            display: 'inline-block',
                            padding: `2px ${theme.spacing.xs}`,
                            backgroundColor: test.isCoreFromAPI ? '#10b981' : '#f59e0b',
                            color: theme.colors.white,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: '10px',
                            fontWeight: theme.typography.fontWeight.bold,
                            marginBottom: theme.spacing.xs
                          }}
                          title={test.isCoreFromAPI ? 'CORE test from test metadata' : 'Recommended by AI'}
                          >
                            {test.isCoreFromAPI ? 'CORE' : 'LLM'}
                          </div>
                        )}

                        {/* Reason */}
                        {test.reason && (
                          <div style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.textSecondary,
                            fontStyle: 'italic',
                            marginBottom: theme.spacing.sm
                          }}>
                            💡 {test.reason}
                          </div>
                        )}

                        {/* Expand Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTest(expandedTest === test.id ? null : test.id);
                          }}
                          style={{
                            marginTop: theme.spacing.sm,
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: 'transparent',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.xs,
                            cursor: 'pointer',
                            color: theme.colors.primary,
                            width: '100%'
                          }}
                        >
                          {expandedTest === test.id ? '▼ Hide Details' : '▶ View Details'}
                        </button>
                        
                        {/* Expanded Test Methodology Section */}
                        {expandedTest === test.id && (
                          <div style={{
                            padding: theme.spacing.lg,
                            borderTop: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.backgroundSecondary
                          }}>
                            <div style={{
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.semibold,
                              color: theme.colors.textPrimary,
                              marginBottom: theme.spacing.md
                            }}>
                              🔬 Testing Methodology
                            </div>
                            
                            {/* Expected Behavior */}
                            <div style={{ marginBottom: theme.spacing.md }}>
                              <div style={{
                                fontSize: theme.typography.fontSize.xs,
                                fontWeight: theme.typography.fontWeight.semibold,
                                color: theme.colors.textSecondary,
                                marginBottom: theme.spacing.xs
                              }}>
                                Expected Behavior:
                              </div>
                              <div style={{
                                fontSize: theme.typography.fontSize.sm,
                                color: theme.colors.textPrimary,
                                padding: theme.spacing.sm,
                                backgroundColor: theme.colors.white,
                                borderRadius: theme.borderRadius.sm,
                                border: `1px solid ${theme.colors.border}`
                              }}>
                                {test.expected_behavior || 'Not specified'}
                              </div>
                            </div>
                            
                            {/* Scoring Rules */}
                            <div style={{ marginBottom: theme.spacing.md }}>
                              <div style={{
                                fontSize: theme.typography.fontSize.xs,
                                fontWeight: theme.typography.fontWeight.semibold,
                                color: theme.colors.textSecondary,
                                marginBottom: theme.spacing.xs
                              }}>
                                Scoring Rules:
                              </div>
                              <div style={{
                                fontSize: theme.typography.fontSize.sm,
                                color: theme.colors.textPrimary,
                                padding: theme.spacing.sm,
                                backgroundColor: theme.colors.white,
                                borderRadius: theme.borderRadius.sm,
                                border: `1px solid ${theme.colors.border}`,
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {renderScoringRules(test.scoring_rules)}
                              </div>
                            </div>
                            
                            {/* Input Content Preview */}
                            {test.input_content && (
                              <div>
                                <div style={{
                                  fontSize: theme.typography.fontSize.xs,
                                  fontWeight: theme.typography.fontWeight.semibold,
                                  color: theme.colors.textSecondary,
                                  marginBottom: theme.spacing.xs
                                }}>
                                  Sample Input:
                                </div>
                                <div style={{
                                  fontSize: theme.typography.fontSize.sm,
                                  color: theme.colors.textPrimary,
                                  padding: theme.spacing.sm,
                                  backgroundColor: theme.colors.white,
                                  borderRadius: theme.borderRadius.sm,
                                  border: `1px solid ${theme.colors.border}`,
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  maxHeight: '150px',
                                  overflowY: 'auto'
                                }}>
                                  {test.input_content}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agent-Specific Tests Section */}
            {recommendedTests.length > 0 && filteredTests.some((t: any) => !t.isCore) && (
              <div>
                {/* Sticky Section Header */}
                <div style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  color: theme.colors.white,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.md,
                  boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.bold,
                        marginBottom: theme.spacing.xs
                      }}>
                        🎯 {getAgentType(selectedAgent).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Tests ({filteredTests.filter((t: any) => !t.isCore).length})
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        opacity: 0.9
                      }}>
                        Recommended for this agent type
                      </div>
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.bold
                    }}>
                      SPECIFIC
                    </div>
                  </div>
                </div>

                {/* Compact Test Cards */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.xl
                }}>
                  {filteredTests.filter((t: any) => !t.isCore).map((test) => {
                    const isSelected = selectedTests.some(t => t.id === test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggleTest(test)}
                        style={{
                          border: `2px solid ${isSelected ? theme.colors.success : theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          backgroundColor: isSelected ? theme.colors.successLight : theme.colors.white,
                          padding: theme.spacing.md,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: theme.spacing.sm,
                            right: theme.spacing.sm,
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: theme.colors.success,
                            color: theme.colors.white,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.bold
                          }}>
                            ✓
                          </div>
                        )}

                        {/* Test Name */}
                        <div style={{
                          fontSize: theme.typography.fontSize.base,
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.textPrimary,
                          marginBottom: theme.spacing.xs,
                          paddingRight: '30px'
                        }}>
                          {test.name}
                        </div>

                        {/* Category Badge */}
                        <div style={{
                          display: 'inline-block',
                          padding: `2px ${theme.spacing.xs}`,
                          backgroundColor: getCategoryBadgeColor(test.category),
                          color: theme.colors.white,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: '10px',
                          fontWeight: theme.typography.fontWeight.bold,
                          marginBottom: theme.spacing.xs,
                          textTransform: 'uppercase'
                        }}>
                          {test.category.replace(/_/g, ' ')}
                        </div>

                        {/* Description */}
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary,
                          marginBottom: theme.spacing.sm,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {test.description || 'No description'}
                        </div>

                        {/* Expand Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTest(expandedTest === test.id ? null : test.id);
                          }}
                          style={{
                            marginTop: theme.spacing.sm,
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: 'transparent',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.xs,
                            cursor: 'pointer',
                            color: theme.colors.primary,
                            width: '100%'
                          }}
                        >
                          {expandedTest === test.id ? '▼ Hide Details' : '▶ View Details'}
                        </button>
                        
                        {/* Expanded Test Methodology Section */}
                        {expandedTest === test.id && (
                          <div style={{
                            padding: theme.spacing.lg,
                            borderTop: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.backgroundSecondary
                          }}>
                            <div style={{
                              fontSize: theme.typography.fontSize.sm,
                              fontWeight: theme.typography.fontWeight.semibold,
                              color: theme.colors.textPrimary,
                              marginBottom: theme.spacing.md
                            }}>
                              🔬 Testing Methodology
                            </div>
                            
                            {/* Expected Behavior */}
                            <div style={{ marginBottom: theme.spacing.md }}>
                              <div style={{
                                fontSize: theme.typography.fontSize.xs,
                                fontWeight: theme.typography.fontWeight.semibold,
                                color: theme.colors.textSecondary,
                                marginBottom: theme.spacing.xs
                              }}>
                                Expected Behavior:
                              </div>
                              <div style={{
                                fontSize: theme.typography.fontSize.sm,
                                color: theme.colors.textPrimary,
                                padding: theme.spacing.sm,
                                backgroundColor: theme.colors.white,
                                borderRadius: theme.borderRadius.sm,
                                border: `1px solid ${theme.colors.border}`
                              }}>
                                {test.expected_behavior || 'Not specified'}
                              </div>
                            </div>
                            
                            {/* Scoring Rules */}
                            <div style={{ marginBottom: theme.spacing.md }}>
                              <div style={{
                                fontSize: theme.typography.fontSize.xs,
                                fontWeight: theme.typography.fontWeight.semibold,
                                color: theme.colors.textSecondary,
                                marginBottom: theme.spacing.xs
                              }}>
                                Scoring Rules:
                              </div>
                              <div style={{
                                fontSize: theme.typography.fontSize.sm,
                                color: theme.colors.textPrimary,
                                padding: theme.spacing.sm,
                                backgroundColor: theme.colors.white,
                                borderRadius: theme.borderRadius.sm,
                                border: `1px solid ${theme.colors.border}`,
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {renderScoringRules(test.scoring_rules)}
                              </div>
                            </div>
                            
                            {/* Input Content Preview */}
                            {test.input_content && (
                              <div>
                                <div style={{
                                  fontSize: theme.typography.fontSize.xs,
                                  fontWeight: theme.typography.fontWeight.semibold,
                                  color: theme.colors.textSecondary,
                                  marginBottom: theme.spacing.xs
                                }}>
                                  Sample Input:
                                </div>
                                <div style={{
                                  fontSize: theme.typography.fontSize.sm,
                                  color: theme.colors.textPrimary,
                                  padding: theme.spacing.sm,
                                  backgroundColor: theme.colors.white,
                                  borderRadius: theme.borderRadius.sm,
                                  border: `1px solid ${theme.colors.border}`,
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  maxHeight: '150px',
                                  overflowY: 'auto'
                                }}>
                                  {test.input_content}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Tests Message */}
            {recommendedTests.length > 0 && (
              <Card style={{
                backgroundColor: theme.colors.infoLight,
                border: `1px solid ${theme.colors.info}`
              }}>
                <Card.Body>
                  <div style={{
                    textAlign: 'center',
                    padding: theme.spacing.md
                  }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.info,
                      marginBottom: theme.spacing.sm
                    }}>
                      ℹ️ Don't see the tests you need?
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary
                    }}>
                      You can add custom tests in the next step to cover specific scenarios for your agent!
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
    </div>
  );
};

export default StepSelectTest;
