-- Migration: 002_create_test_runs_table
-- Description: Create test_runs table for storing test execution records
-- Date: 2025-11-10

-- Create test_runs table
CREATE TABLE IF NOT EXISTS test_runs (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  agent_version VARCHAR(50),
  suite_id VARCHAR(255),
  suite_name VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  configuration JSON,
  summary JSON,
  metadata JSON,
  triggered_by VARCHAR(255),
  environment VARCHAR(50) DEFAULT 'production',
  
  -- Foreign key constraints
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
  FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_runs_agent_id ON test_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_suite_id ON test_runs(suite_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_start_time ON test_runs(start_time);
CREATE INDEX IF NOT EXISTS idx_test_runs_end_time ON test_runs(end_time);
CREATE INDEX IF NOT EXISTS idx_test_runs_environment ON test_runs(environment);

-- Add comments
COMMENT ON TABLE test_runs IS 'Stores test execution run records';
COMMENT ON COLUMN test_runs.status IS 'Current status of the test run';
COMMENT ON COLUMN test_runs.summary IS 'JSON object containing test run summary statistics';
COMMENT ON COLUMN test_runs.metadata IS 'JSON object containing additional metadata (branch, commit, etc.)';
