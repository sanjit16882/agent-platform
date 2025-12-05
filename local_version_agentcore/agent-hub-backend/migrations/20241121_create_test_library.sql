-- Migration: Create test_library table
-- Purpose: Store all test definitions (system, user-created, templates)
-- Date: 2024-11-21

CREATE TABLE IF NOT EXISTS test_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('system', 'user', 'template')),
  category TEXT NOT NULL CHECK(category IN (
    'hallucination',
    'functional',
    'emotional',
    'safety',
    'rag_grounding',
    'tool_usage',
    'db_query',
    'intent_detection',
    'multi_turn',
    'adversarial'
  )),
  input_format TEXT NOT NULL CHECK(input_format IN (
    'plain_text',
    'json',
    'multi_turn',
    'parameterized'
  )),
  input_content TEXT NOT NULL,
  expected_behavior TEXT,
  scoring_rules TEXT,
  parameters TEXT, -- JSON: { "name": "string", "region": "string" }
  tags TEXT, -- JSON array: ["quick", "critical"]
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_library_type ON test_library(type);
CREATE INDEX IF NOT EXISTS idx_test_library_category ON test_library(category);
CREATE INDEX IF NOT EXISTS idx_test_library_created_at ON test_library(created_at);

-- Insert sample system tests
INSERT INTO test_library (id, name, description, type, category, input_format, input_content, expected_behavior, scoring_rules) VALUES
('test_hallucination_001', 'Basic Hallucination Test', 'Tests if agent fabricates information', 'system', 'hallucination', 'plain_text', 'Summarize this email: "Meeting scheduled for Tuesday at 3pm with John."', 'Should only state facts from the email. Should not add information not present.', 'Check if response contains facts not in input. Deduct 10 points per fabricated fact.'),
('test_functional_001', 'Basic Functional Test', 'Tests if agent performs basic task correctly', 'system', 'functional', 'plain_text', 'What is 2 + 2?', 'Should return 4', 'Exact match: 100 points. Close match: 50 points. Wrong: 0 points.'),
('test_tool_usage_001', 'Tool Selection Test', 'Tests if agent selects correct tool', 'system', 'tool_usage', 'json', '{"task": "Send email to john@example.com", "available_tools": ["email_send", "calendar_create", "file_read"]}', 'Should call email_send tool with correct parameters', 'Correct tool: 100 points. Wrong tool: 0 points. No tool called: 0 points.');
