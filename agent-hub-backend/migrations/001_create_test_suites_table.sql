-- Migration: 001_create_test_suites_table
-- Description: Create test_suites table for storing universal and custom test suites
-- Date: 2025-11-10

-- Create test_suites table
CREATE TABLE IF NOT EXISTS test_suites (
  id VARCHAR(255) PRIMARY KEY,
  suite_type VARCHAR(50) NOT NULL CHECK (suite_type IN ('universal', 'custom')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  agent_id VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  test_definitions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  -- Foreign key constraint (agent_id can be NULL for universal suites)
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_suites_suite_type ON test_suites(suite_type);
CREATE INDEX IF NOT EXISTS idx_test_suites_agent_id ON test_suites(agent_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_enabled ON test_suites(enabled);
CREATE INDEX IF NOT EXISTS idx_test_suites_created_at ON test_suites(created_at);

-- Add comment
COMMENT ON TABLE test_suites IS 'Stores test suite definitions for agent testing framework';
COMMENT ON COLUMN test_suites.suite_type IS 'Type of suite: universal (applies to all agents) or custom (agent-specific)';
COMMENT ON COLUMN test_suites.agent_id IS 'Associated agent ID for custom suites, NULL for universal suites';
COMMENT ON COLUMN test_suites.test_definitions IS 'JSON array of test case definitions';
