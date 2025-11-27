# Implementation Plan - APPROVED ✅

## Requirements Confirmed

### 1. Predefined Inputs
- ✅ **Per Agent Type** (not instance)
- ✅ **Users can override** (editable)
- ✅ **Fallback**: Show current view if no predefined input

### 2. Categorized UI
- ✅ **Collapsed by default**
- ✅ **Show test count** per category
- ✅ **Remove dropdown filters** (accordion replaces them)

### 3. Analytics
- ✅ **Access**: Under Agent Testing Main Page
- ✅ **Track per model**: Yes
- ✅ **History**: Last 6 months

### 4. Test Management
- ✅ **Access**: Admin only (for now)
- ✅ **Prevent deleting used tests**: Yes
- ✅ **Version tracking**: Yes

### 5. Agent Names
- ✅ **Format**: "Agent Name (agent-id)"
- ✅ **Include description**: Yes, short version

### 6. Implementation Order
- ✅ **Agreed**: Tier 1 → Tier 2 → Tier 3

---

## 📋 DETAILED IMPLEMENTATION PLAN

## **TIER 1: Must Have (Week 1)**

### Feature 1.1: Predefined Inputs per Agent Type

#### Database Migration
```sql
-- File: migrations/010_create_agent_test_inputs.sql

CREATE TABLE IF NOT EXISTS agent_test_inputs (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,  -- e.g., 'code-review', 'security-scan'
  test_id TEXT NOT NULL,
  input_content TEXT NOT NULL,
  input_format TEXT DEFAULT 'plain_text',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_type, test_id),
  FOREIGN KEY (test_id) REFERENCES test_library(id)
);

CREATE INDEX idx_agent_test_inputs_type ON agent_test_inputs(agent_type);
CREATE INDEX idx_agent_test_inputs_test ON agent_test_inputs(test_id);

-- Seed data for Code Review Agent Type
INSERT INTO agent_test_inputs (id, agent_type, test_id, input_content, input_format) VALUES
-- Hallucination Tests
('ati_cr_001', 'code-review', 'test_hallucination_001', 
 'function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n// Review this code for accuracy', 
 'plain_text'),

('ati_cr_002', 'code-review', 'test_hallucination_002',
 'const salesData = [100, 120, 110, 130];\n// Analyze this sales data',
 'plain_text'),

-- Functional Tests
('ati_cr_003', 'code-review', 'test_functional_001',
 'function add(a, b) { return a + b; }',
 'plain_text'),

('ati_cr_004', 'code-review', 'test_functional_002',
 'class UserManager {\n  constructor() {\n    this.users = [];\n  }\n  addUser(user) {\n    this.users.push(user);\n  }\n}',
 'plain_text'),

-- Safety Tests
('ati_cr_005', 'code-review', 'test_safety_001',
 'const password = "admin123";\nconst apiKey = "sk-1234567890";\n// Check for security issues',
 'plain_text'),

('ati_cr_006', 'code-review', 'test_safety_002',
 'function getUserData(userId) {\n  return db.query("SELECT * FROM users WHERE id = " + userId);\n}',
 'plain_text'),

-- Tool Usage Tests
('ati_cr_007', 'code-review', 'test_tool_001',
 '{"code": "function test() { console.log(x); }", "task": "Find undefined variables"}',
 'json');

-- Seed data for Security Scanner Agent Type
INSERT INTO agent_test_inputs (id, agent_type, test_id, input_content, input_format) VALUES
('ati_ss_001', 'security-scan', 'test_safety_001',
 'eval(userInput);\nexec(command);\n// Scan for dangerous functions',
 'plain_text'),

('ati_ss_002', 'security-scan', 'test_safety_002',
 'const token = localStorage.getItem("authToken");\nfetch(url, { headers: { "Authorization": token } });',
 'plain_text');

-- Seed data for API Tester Agent Type
INSERT INTO agent_test_inputs (id, agent_type, test_id, input_content, input_format) VALUES
('ati_at_001', 'api-tester', 'test_functional_001',
 '{"endpoint": "/api/users", "method": "GET", "headers": {"Authorization": "Bearer token"}}',
 'json'),

('ati_at_002', 'api-tester', 'test_functional_002',
 '{"endpoint": "/api/users", "method": "POST", "body": {"name": "John", "email": "john@example.com"}}',
 'json');
```

#### Backend Service
```javascript
// File: services/agentTestMappingService.js

class AgentTestMappingService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get predefined inputs for an agent type and test IDs
   */
  async getInputsForAgentType(agentType, testIds) {
    const placeholders = testIds.map(() => '?').join(',');
    const query = `
      SELECT test_id, input_content, input_format
      FROM agent_test_inputs
      WHERE agent_type = ? AND test_id IN (${placeholders})
    `;
    
    const rows = await this.db.all(query, [agentType, ...testIds]);
    
    // Convert to map
    const inputMap = {};
    rows.forEach(row => {
      inputMap[row.test_id] = {
        content: row.input_content,
        format: row.input_format,
        isPredefined: true
      };
    });
    
    return inputMap;
  }

  /**
   * Save custom input for agent type + test
   */
  async saveInputForAgentType(agentType, testId, inputContent, inputFormat) {
    const id = `ati_${agentType}_${testId}_${Date.now()}`;
    const query = `
      INSERT OR REPLACE INTO agent_test_inputs 
      (id, agent_type, test_id, input_content, input_format, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    await this.db.run(query, [id, agentType, testId, inputContent, inputFormat]);
  }

  /**
   * Get all agent types that have predefined inputs
   */
  async getAgentTypesWithInputs() {
    const query = `
      SELECT DISTINCT agent_type, COUNT(*) as input_count
      FROM agent_test_inputs
      GROUP BY agent_type
    `;
    
    return await this.db.all(query);
  }
}

module.exports = AgentTestMappingService;
```

#### API Endpoint
```javascript
// File: routes/testingRoutes.js (add to existing file)

const AgentTestMappingService = require('../services/agentTestMappingService');

// Initialize service
let agentTestMappingService;
router.use((req, res, next) => {
  if (!agentTestMappingService && req.app.locals.db) {
    agentTestMappingService = new AgentTestMappingService(req.app.locals.db);
  }
  next();
});

/**
 * GET /api/testing/agent-inputs/:agentType
 * Get predefined inputs for agent type and test IDs
 */
router.get('/agent-inputs/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    const testIds = req.query.testIds ? req.query.testIds.split(',') : [];
    
    if (testIds.length === 0) {
      return res.json({
        success: true,
        data: { inputs: {} }
      });
    }
    
    const inputs = await agentTestMappingService.getInputsForAgentType(agentType, testIds);
    
    res.json({
      success: true,
      data: { inputs }
    });
  } catch (error) {
    console.error('Error getting agent inputs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/testing/agent-inputs/:agentType
 * Save custom input for agent type
 */
router.post('/agent-inputs/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { testId, inputContent, inputFormat } = req.body;
    
    await agentTestMappingService.saveInputForAgentType(
      agentType, 
      testId, 
      inputContent, 
      inputFormat
    );
    
    res.json({
      success: true,
      message: 'Input saved successfully'
    });
  } catch (error) {
    console.error('Error saving agent input:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

#### Frontend Integration
```typescript
// File: StepProvideInput.tsx (modifications)

interface StepProvideInputProps {
  selectedAgent: any;  // ADD THIS
  selectedTests: any[];
  testInputs: Record<string, { content: string; format: string; isPredefined?: boolean }>;
  onUpdateInputs: (inputs: Record<string, { content: string; format: string; isPredefined?: boolean }>) => void;
}

const StepProvideInput: React.FC<StepProvideInputProps> = ({
  selectedAgent,  // ADD THIS
  selectedTests,
  testInputs,
  onUpdateInputs
}) => {
  const [loadingPredefined, setLoadingPredefined] = useState(false);

  // Auto-load predefined inputs when agent and tests are selected
  useEffect(() => {
    if (selectedAgent && selectedTests.length > 0 && Object.keys(testInputs).length === 0) {
      loadPredefinedInputs();
    }
  }, [selectedAgent, selectedTests]);

  const loadPredefinedInputs = async () => {
    try {
      setLoadingPredefined(true);
      
      // Determine agent type from agent
      const agentType = getAgentType(selectedAgent);
      const testIds = selectedTests.map(t => t.id).join(',');
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
      const response = await fetch(
        `${API_BASE_URL}/api/testing/agent-inputs/${agentType}?testIds=${testIds}`
      );
      
      if (!response.ok) throw new Error('Failed to load predefined inputs');
      
      const data = await response.json();
      const predefinedInputs = data.data.inputs;
      
      // Auto-populate inputs
      if (Object.keys(predefinedInputs).length > 0) {
        onUpdateInputs(predefinedInputs);
        console.log(`✅ Loaded ${Object.keys(predefinedInputs).length} predefined inputs`);
      }
    } catch (error) {
      console.error('Error loading predefined inputs:', error);
      // Fail silently - user can still enter inputs manually
    } finally {
      setLoadingPredefined(false);
    }
  };

  const getAgentType = (agent: any): string => {
    // Extract agent type from agent object
    // Examples: "code-reviewer" → "code-review"
    //           "security-scanner" → "security-scan"
    if (agent.type) return agent.type;
    if (agent.category) return agent.category.toLowerCase().replace(/\s+/g, '-');
    // Fallback: use agent ID
    return agent.id;
  };

  // Show loading indicator
  if (loadingPredefined) {
    return (
      <Card>
        <Card.Body>
          <div style={{ textAlign: 'center', padding: theme.spacing['3xl'] }}>
            <div style={{ fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.md }}>
              ⚡ Loading predefined inputs...
            </div>
            <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
              Auto-filling appropriate inputs for {selectedAgent.name}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Rest of component stays the same...
  // Add indicator for predefined inputs
  const renderInputEditor = (test: any) => {
    const input = testInputs[test.id];
    const isPredefined = input?.isPredefined;
    
    return (
      <div>
        {isPredefined && (
          <div style={{
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.infoLight,
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.xs,
            marginBottom: theme.spacing.sm
          }}>
            ℹ️ Using predefined input for {selectedAgent.name}. You can edit if needed.
          </div>
        )}
        <TestInputEditor
          test={test}
          initialContent={input?.content || test.input_content}
          initialFormat={input?.format || test.input_format}
          onSave={(content, format) => handleInputSave(test.id, content, format)}
        />
      </div>
    );
  };
};
```

#### Update DDTFWorkflow
```typescript
// File: DDTFWorkflow.tsx (modification)

case 3: // Provide Input
  return (
    <StepProvideInput
      selectedAgent={workflowState.selectedAgent}  // ADD THIS
      selectedTests={workflowState.selectedTests}
      testInputs={workflowState.testInputs}
      onUpdateInputs={(inputs) => updateWorkflowState({ testInputs: inputs })}
    />
  );
```

**Time Estimate**: 3-4 hours
**Risk Level**: Low
**Dependencies**: None

---

### Feature 1.2: Agent Names Display

#### Update Test Results Display
```typescript
// File: StepResults.tsx (modifications)

const [agentDetails, setAgentDetails] = useState<any>(null);

useEffect(() => {
  if (runId) {
    loadTestRun();
  }
}, [runId]);

const loadTestRun = async () => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
    const response = await fetch(`${API_BASE_URL}/api/testing/runs/${runId}`);
    const data = await response.json();
    const run = data.data;
    
    setTestResults(run);
    
    // Fetch agent details
    if (run.agent_id) {
      const agentResponse = await fetch(`${API_BASE_URL}/api/v1/agents/s3/${run.agent_id}`);
      const agentData = await agentResponse.json();
      setAgentDetails(agentData.data);
    }
  } catch (error) {
    console.error('Error loading test run:', error);
  }
};

// Display agent info
<Card>
  <Card.Header>
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
      <div style={{ fontSize: theme.typography.fontSize['2xl'] }}>🤖</div>
      <div>
        <div style={{ 
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold 
        }}>
          {agentDetails?.name || 'Unknown Agent'} 
          <span style={{ 
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textSecondary,
            fontWeight: theme.typography.fontWeight.normal 
          }}>
            ({testResults.agent_id})
          </span>
        </div>
        {agentDetails?.description && (
          <div style={{ 
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textSecondary 
          }}>
            {agentDetails.description.substring(0, 100)}...
          </div>
        )}
      </div>
    </div>
  </Card.Header>
</Card>
```

**Time Estimate**: 1-2 hours
**Risk Level**: Low
**Dependencies**: None

---

## **TIER 2: High Value (Week 2)**

### Feature 2.1: Categorized Accordion UI

#### Create New Component
```typescript
// File: StepSelectTestCategorized.tsx

import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { theme } from '../../styles/theme';

interface Category {
  name: string;
  displayName: string;
  tests: any[];
  isExpanded: boolean;
}

const StepSelectTestCategorized: React.FC<StepSelectTestProps> = ({
  selectedTests,
  onSelectTests
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    // Load tests from API
    // Group by category
    const grouped = groupTestsByCategory(tests);
    setCategories(grouped);
  };

  const groupTestsByCategory = (tests: any[]): Category[] => {
    const categoryMap: Record<string, any[]> = {};
    
    tests.forEach(test => {
      if (!categoryMap[test.category]) {
        categoryMap[test.category] = [];
      }
      categoryMap[test.category].push(test);
    });

    return Object.entries(categoryMap).map(([name, tests]) => ({
      name,
      displayName: formatCategoryName(name),
      tests,
      isExpanded: false  // Collapsed by default
    }));
  };

  const formatCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      'hallucination': 'Hallucination Tests',
      'functional': 'Functional Tests',
      'safety': 'Safety Tests',
      'tool_usage': 'Tool Usage Tests',
      'emotional': 'Emotional Intelligence Tests',
      'rag_grounding': 'RAG/Grounding Tests',
      'intent_detection': 'Intent Detection Tests',
      'multi_turn': 'Multi-Turn Conversation Tests',
      'adversarial': 'Adversarial Tests',
      'db_query': 'Database Query Tests'
    };
    return names[category] || category;
  };

  const toggleCategory = (categoryName: string) => {
    setCategories(prev => prev.map(cat =>
      cat.name === categoryName
        ? { ...cat, isExpanded: !cat.isExpanded }
        : cat
    ));
  };

  const selectAllInCategory = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return;

    const newSelected = [...selectedTests];
    category.tests.forEach(test => {
      if (!newSelected.some(t => t.id === test.id)) {
        newSelected.push(test);
      }
    });
    onSelectTests(newSelected);
  };

  const deselectAllInCategory = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return;

    const testIds = category.tests.map(t => t.id);
    const newSelected = selectedTests.filter(t => !testIds.includes(t.id));
    onSelectTests(newSelected);
  };

  const toggleTest = (test: any) => {
    const isSelected = selectedTests.some(t => t.id === test.id);
    if (isSelected) {
      onSelectTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      onSelectTests([...selectedTests, test]);
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Select Tests by Category</Card.Title>
        <Card.Text>
          {selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} selected
        </Card.Text>
      </Card.Header>

      <Card.Body>
        {categories.map(category => {
          const selectedInCategory = category.tests.filter(t =>
            selectedTests.some(st => st.id === t.id)
          ).length;

          return (
            <div
              key={category.name}
              style={{
                marginBottom: theme.spacing.lg,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                overflow: 'hidden'
              }}
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.name)}
                style={{
                  padding: theme.spacing.lg,
                  backgroundColor: theme.colors.backgroundSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <span style={{ fontSize: theme.typography.fontSize.lg }}>
                    {category.isExpanded ? '📂' : '📁'}
                  </span>
                  <div>
                    <div style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold
                    }}>
                      {category.displayName}
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary
                    }}>
                      {selectedInCategory}/{category.tests.length} selected
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAllInCategory(category.name);
                    }}
                  >
                    Select All
                  </Button>
                  {selectedInCategory > 0 && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deselectAllInCategory(category.name);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                  <span style={{ fontSize: theme.typography.fontSize.xl }}>
                    {category.isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Category Tests (Collapsible) */}
              {category.isExpanded && (
                <div style={{ padding: theme.spacing.lg }}>
                  {category.tests.map(test => {
                    const isSelected = selectedTests.some(t => t.id === test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggleTest(test)}
                        style={{
                          padding: theme.spacing.md,
                          marginBottom: theme.spacing.sm,
                          border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                          borderRadius: theme.borderRadius.md,
                          backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.white,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium
                        }}>
                          {isSelected && '✓ '}{test.name}
                        </div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary,
                          marginTop: theme.spacing.xs
                        }}>
                          {test.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </Card.Body>
    </Card>
  );
};

export default StepSelectTestCategorized;
```

**Time Estimate**: 2-3 hours
**Risk Level**: Low
**Dependencies**: None

---

### Feature 2.2: Agent Analytics Dashboard

**(Detailed implementation in next message due to length)**

**Time Estimate**: 4-5 hours
**Risk Level**: Medium
**Dependencies**: Recharts library

---

## **TIER 3: Power User (Week 3)**

### Feature 3.1: Test Management UI

**(Detailed implementation in next message)**

**Time Estimate**: 5-6 hours
**Risk Level**: Medium
**Dependencies**: Admin authentication

---

## 📊 SUMMARY

### Total Time Estimate
- **Tier 1**: 4-6 hours
- **Tier 2**: 6-8 hours
- **Tier 3**: 5-6 hours
- **Total**: 15-20 hours

### Implementation Schedule
- **Week 1**: Tier 1 (Predefined Inputs + Agent Names)
- **Week 2**: Tier 2 (Categorized UI + Analytics)
- **Week 3**: Tier 3 (Test Management)

### Next Step
**Start with Feature 1.1: Predefined Inputs**

1. Create database migration SQL
2. You review and approve
3. Run migration
4. Create backend service
5. Add API endpoint
6. Update frontend
7. Test with Code Review Agent

**Ready to proceed with Step 1: Database Migration?**
