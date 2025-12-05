-- Migration: Add cost tracking tables
-- Description: Adds tables for tracking execution costs and token usage
-- Date: 2024-11-19

-- Test costs table
CREATE TABLE IF NOT EXISTS test_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_costs_run_id ON test_costs(run_id);
CREATE INDEX IF NOT EXISTS idx_test_costs_model_id ON test_costs(model_id);
CREATE INDEX IF NOT EXISTS idx_test_costs_created_at ON test_costs(created_at);

-- Run costs summary table (aggregated data)
CREATE TABLE IF NOT EXISTS run_costs_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL UNIQUE,
  total_cost REAL NOT NULL DEFAULT 0.0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  test_count INTEGER NOT NULL DEFAULT 0,
  average_cost_per_test REAL NOT NULL DEFAULT 0.0,
  average_tokens_per_test REAL NOT NULL DEFAULT 0.0,
  cheapest_model TEXT,
  most_expensive_model TEXT,
  cost_savings_percent REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE
);

-- Index for run costs summary
CREATE INDEX IF NOT EXISTS idx_run_costs_summary_run_id ON run_costs_summary(run_id);

-- Model costs table (per-model aggregation)
CREATE TABLE IF NOT EXISTS model_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  total_cost REAL NOT NULL DEFAULT 0.0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  test_count INTEGER NOT NULL DEFAULT 0,
  average_cost_per_test REAL NOT NULL DEFAULT 0.0,
  average_tokens_per_test REAL NOT NULL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE,
  UNIQUE(run_id, model_id)
);

-- Indexes for model costs
CREATE INDEX IF NOT EXISTS idx_model_costs_run_id ON model_costs(run_id);
CREATE INDEX IF NOT EXISTS idx_model_costs_model_id ON model_costs(model_id);

-- Add cost columns to test_results table
ALTER TABLE test_results ADD COLUMN input_tokens INTEGER DEFAULT 0;
ALTER TABLE test_results ADD COLUMN output_tokens INTEGER DEFAULT 0;
ALTER TABLE test_results ADD COLUMN total_tokens INTEGER DEFAULT 0;
ALTER TABLE test_results ADD COLUMN cost REAL DEFAULT 0.0;

-- Create view for cost analytics
CREATE VIEW IF NOT EXISTS cost_analytics AS
SELECT 
  tc.run_id,
  tc.model_id,
  COUNT(*) as test_count,
  SUM(tc.total_tokens) as total_tokens,
  AVG(tc.total_tokens) as avg_tokens_per_test,
  SUM(tc.cost) as total_cost,
  AVG(tc.cost) as avg_cost_per_test,
  MIN(tc.cost) as min_cost,
  MAX(tc.cost) as max_cost,
  MIN(tc.created_at) as first_test,
  MAX(tc.created_at) as last_test
FROM test_costs tc
GROUP BY tc.run_id, tc.model_id;

-- Create view for model comparison
CREATE VIEW IF NOT EXISTS model_cost_comparison AS
SELECT 
  run_id,
  model_id,
  total_cost,
  total_tokens,
  test_count,
  RANK() OVER (PARTITION BY run_id ORDER BY total_cost ASC) as cost_rank,
  RANK() OVER (PARTITION BY run_id ORDER BY total_tokens ASC) as token_rank
FROM model_costs;

-- Trigger to update run_costs_summary when test_costs are inserted
CREATE TRIGGER IF NOT EXISTS update_run_costs_summary_insert
AFTER INSERT ON test_costs
BEGIN
  INSERT OR REPLACE INTO run_costs_summary (
    run_id,
    total_cost,
    total_tokens,
    test_count,
    average_cost_per_test,
    average_tokens_per_test,
    updated_at
  )
  SELECT 
    NEW.run_id,
    COALESCE(SUM(cost), 0),
    COALESCE(SUM(total_tokens), 0),
    COUNT(*),
    COALESCE(AVG(cost), 0),
    COALESCE(AVG(total_tokens), 0),
    CURRENT_TIMESTAMP
  FROM test_costs
  WHERE run_id = NEW.run_id;
END;

-- Trigger to update model_costs when test_costs are inserted
CREATE TRIGGER IF NOT EXISTS update_model_costs_insert
AFTER INSERT ON test_costs
BEGIN
  INSERT OR REPLACE INTO model_costs (
    run_id,
    model_id,
    total_cost,
    total_tokens,
    test_count,
    average_cost_per_test,
    average_tokens_per_test
  )
  SELECT 
    NEW.run_id,
    NEW.model_id,
    COALESCE(SUM(cost), 0),
    COALESCE(SUM(total_tokens), 0),
    COUNT(*),
    COALESCE(AVG(cost), 0),
    COALESCE(AVG(total_tokens), 0)
  FROM test_costs
  WHERE run_id = NEW.run_id AND model_id = NEW.model_id;
END;
