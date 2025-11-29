-- Migration: Create test_runs table
-- Purpose: Store test execution runs with overall results
-- Date: 2024-11-21

CREATE TABLE IF NOT EXISTS test_runs (
  run_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  test_suite_name TEXT NOT NULL,
  version TEXT NOT NULL,
  model_id TEXT, -- Which LLM model was tested
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  overall_score REAL,
  scores TEXT, -- JSON: { "hallucination": 95, "factuality": 98, "emotion": 91, ... }
  summary TEXT, -- JSON: { "total": 20, "passed": 18, "failed": 2, "warnings": 0, "pass_rate": 90 }
  status TEXT DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed', 'cancelled')),
  duration INTEGER, -- milliseconds
  error_message TEXT,
  metadata TEXT, -- JSON: additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_runs_agent_id ON test_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_timestamp ON test_runs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_version ON test_runs(version);

-- Trigger to update completed_at when status changes to completed
CREATE TRIGGER IF NOT EXISTS update_test_run_completed_at
AFTER UPDATE OF status ON test_runs
WHEN NEW.status = 'completed'
BEGIN
  UPDATE test_runs SET completed_at = CURRENT_TIMESTAMP WHERE run_id = NEW.run_id;
END;
