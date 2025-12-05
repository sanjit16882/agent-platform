-- Rollback: Remove cost tracking tables
-- Description: Removes cost tracking tables and views
-- Date: 2024-11-19

-- Drop triggers
DROP TRIGGER IF EXISTS update_run_costs_summary_insert;
DROP TRIGGER IF EXISTS update_model_costs_insert;

-- Drop views
DROP VIEW IF EXISTS cost_analytics;
DROP VIEW IF EXISTS model_cost_comparison;

-- Drop tables
DROP TABLE IF EXISTS model_costs;
DROP TABLE IF EXISTS run_costs_summary;
DROP TABLE IF EXISTS test_costs;

-- Remove columns from test_results (SQLite doesn't support DROP COLUMN easily)
-- Note: In production, you would need to recreate the table without these columns
-- For now, we'll leave them as they don't break anything
