import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

interface StepSelectTestProps {
  selectedAgent: any;
  selectedTests: any[];
  onSelectTests: (tests: any[]) => void;
  onSamplePromptsLoaded?: (prompts: string[]) => void;
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
  onSelectTests,
  onSamplePromptsLoaded
}) => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [recommendedTests, setRecommendedTests] = useState<any[]>([]);
  const [coreTestCount, setCoreTestCount] = useState(0);
  const [agentSpecificCount, setAgentSpecificCount] = useState(0);
  const [samplePrompts, setSamplePrompts] = useState<string[]>([]);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  // Helper function to render scoring rules (handles objects)
  const renderScoringRules = (scoringRules: any): string => {
    if (!scoringRules) return 'Standard scoring applied';
    if (typeof scoringRules === 'string') return scoringRules;
    if (typeof scoringRules === 'object') return JSON.stringify(scoringRules, null, 2);
    return String(scoringRules);
  };

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedAgent && tests.length > 0) {
      filterTestsForAgent();
      loadSamplePrompts();
    }
  }, [selectedAgent, tests]);

  const loadTests = async () => {
    try {
      setLoading(true);
      // Use the correct API base URL (backend runs on port 3002)
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/testing/library/list`);
      
      if (!response.ok) {
        throw new Error(`Failed to load tests: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Tests loaded:', data);
      setTests(data.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error loading tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAgentType = (agent: any): string => {
    console.log('🔍 Detecting agent type for:', agent);
    
    // Extract agent type from agent object
    if (agent.type) {
      console.log('✅ Found agent.type:', agent.type);
      return agent.type.toLowerCase();
    }
    if (agent.category) {
      const category = agent.category.toLowerCase().replace(/\s+/g, '-');
      console.log('✅ Found agent.category:', category);
      return category;
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
    const coreTestCategories = Object.keys(CORE_TESTS);
    const coreTests = tests
      .filter(test => coreTestCategories.includes(test.category))
      .map(test => ({
        ...test,
        relevanceScore: CORE_TESTS[test.category as keyof typeof CORE_TESTS].priority,
        isCore: true,
        reason: CORE_TESTS[test.category as keyof typeof CORE_TESTS].reason,
        badge: CORE_TESTS[test.category as keyof typeof CORE_TESTS].badge,
        badgeColor: CORE_TESTS[test.category as keyof typeof CORE_TESTS].color,
        section: 'core'
      }));
    
    console.log(`✅ Found ${coreTests.length} core tests`);
    
    // STEP 2: Get Agent-Specific Tests (exclude core categories)
    const agentSpecificTests = tests
      .filter(test => !coreTestCategories.includes(test.category)) // Exclude core
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
    
    setRecommendedTests(allRecommendedTests);
    setCoreTestCount(coreTests.length);
    setAgentSpecificCount(agentSpecificTests.length);
    
    console.log(`📊 Total recommended: ${allRecommendedTests.length} (${coreTests.length} core + ${agentSpecificTests.length} specific)`);
    console.log(`📊 Category distribution:`, 
      allRecommendedTests.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );
  };

  const loadSamplePrompts = async () => {
    try {
      console.log('🔍 Loading sample prompts for agent:', selectedAgent);
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/testing/sample-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agent: selectedAgent })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load sample prompts: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Loaded sample prompts:', data);
      
      const prompts = data.data || [];
      setSamplePrompts(prompts);
      
      // Notify parent component about loaded prompts
      if (onSamplePromptsLoaded) {
        onSamplePromptsLoaded(prompts);
      }
    } catch (err: any) {
      console.error('❌ Error loading sample prompts:', err);
      // Fallback to empty array if API fails
      setSamplePrompts([]);
      if (onSamplePromptsLoaded) {
        onSamplePromptsLoaded([]);
      }
    }
  };

  const loadSamplePromptsForTests = async (tests: any[]) => {
    try {
      console.log(`🎯 Loading sample prompts for ${tests.length} selected tests`);
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_BASE_URL}/api/testing/sample-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          agent: selectedAgent,
          selectedTests: tests 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load sample prompts: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Loaded test-specific sample prompts:', data);
      
      const prompts = data.data || [];
      setSamplePrompts(prompts);
      
      // Notify parent component about loaded prompts
      if (onSamplePromptsLoaded) {
        onSamplePromptsLoaded(prompts);
      }
    } catch (err: any) {
      console.error('❌ Error loading sample prompts:', err);
      // Keep existing prompts if reload fails
    }
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
    
    // Reload sample prompts when tests change
    if (newSelectedTests.length > 0) {
      loadSamplePromptsForTests(newSelectedTests);
    }
  };

  const selectAll = () => {
    onSelectTests(filteredTests);
    if (filteredTests.length > 0) {
      loadSamplePromptsForTests(filteredTests);
    }
  };

  const clearAll = () => {
    onSelectTests([]);
    setSamplePrompts([]);
    if (onSamplePromptsLoaded) {
      onSamplePromptsLoaded([]);
    }
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
      {/* Agent-Specific Info Banner */}
      {selectedAgent && recommendedTests.length > 0 && (
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
                🎯 {recommendedTests.length} Recommended Tests for {selectedAgent.name}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.md
              }}>
                These tests are intelligently selected based on your agent's type and capabilities.
              </div>
              <div style={{
                display: 'flex',
                gap: theme.spacing.lg,
                fontSize: theme.typography.fontSize.sm
              }}>
                <div>
                  <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.danger }}>
                    {coreTestCount} Core Tests
                  </span>
                  <span style={{ color: theme.colors.textSecondary }}> (always included)</span>
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
                        Always included • Essential for all agents
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

                        {/* Badge */}
                        {test.badge && (
                          <div style={{
                            display: 'inline-block',
                            padding: `2px ${theme.spacing.xs}`,
                            backgroundColor: test.badgeColor || '#667eea',
                            color: theme.colors.white,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: '10px',
                            fontWeight: theme.typography.fontWeight.bold,
                            marginBottom: theme.spacing.xs
                          }}>
                            {test.badge}
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
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: theme.colors.white,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.md,
                  boxShadow: '0 2px 8px rgba(240, 147, 251, 0.3)'
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
                          backgroundColor: '#f5576c',
                          color: theme.colors.white,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: '10px',
                          fontWeight: theme.typography.fontWeight.bold,
                          marginBottom: theme.spacing.xs
                        }}>
                          {test.category}
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
