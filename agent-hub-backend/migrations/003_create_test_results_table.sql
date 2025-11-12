-- Migration: 003_create_test_results_table
-- Description: Create test_results table for storing individual test case results
-- Date: 2025-11-10

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
  id VARCHAR(255) PRIMARY KEY,
  run_id VARCHAR(255) NOT NULL,
  test_case_id VARCHAR(255) NOT NULL,
  test_case_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'error')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL,
  input JSON,
  expected_output JSON,
  actual_output JSON,
  evaluation JSON,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON test_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_results_duration ON test_results(duration);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);

-- Add comments
COMMENT ON TABLE test_results IS 'Stores individual test case execution results';
COMMENT ON COLUMN test_results.status IS 'Result status: passed, failed, skipped, or error';
COMMENT ON COLUMN test_results.duration IS 'Test execution duration in milliseconds';
COMMENT ON COLUMN test_results.evaluation IS 'JSON object containing evaluation metrics and scores';
