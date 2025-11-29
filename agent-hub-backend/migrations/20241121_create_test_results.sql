-- Migration: Create test_results table
-- Purpose: Store individual test results within a test run
-- Date: 2024-11-21

CREATE TABLE IF NOT EXISTS test_results (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  test_category TEXT NOT NULL,
  input_used TEXT NOT NULL, -- The actual input sent to the agent
  expected_output TEXT,
  actual_output TEXT,
  passed BOOLEAN,
  score REAL,
  explanation TEXT,
  duration INTEGER, -- milliseconds for this specific test
  tokens_used INTEGER,
  cost REAL, -- Cost in USD for this test
  metadata TEXT, -- JSON: additional test-specific data
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES test_runs(run_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_passed ON test_results(passed);
CREATE INDEX IF NOT EXISTS idx_test_results_category ON test_results(test_category);
CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp DESC);

-- View for quick test result summaries
CREATE VIEW IF NOT EXISTS test_results_summary AS
SELECT 
  run_id,
  COUNT(*) as total_tests,
  SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_tests,
  SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) as failed_tests,
  ROUND(AVG(score), 2) as avg_score,
  SUM(duration) as total_duration,
  SUM(tokens_used) as total_tokens,
  SUM(cost) as total_cost
FROM test_results
GROUP BY run_id;
