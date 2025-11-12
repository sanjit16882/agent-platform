-- Rollback Migration: 002_create_test_runs_table
-- Description: Drop test_runs table and related indexes
-- Date: 2025-11-10

-- Drop indexes
DROP INDEX IF EXISTS idx_test_runs_environment;
DROP INDEX IF EXISTS idx_test_runs_end_time;
DROP INDEX IF EXISTS idx_test_runs_start_time;
DROP INDEX IF EXISTS idx_test_runs_status;
DROP INDEX IF EXISTS idx_test_runs_suite_id;
DROP INDEX IF EXISTS idx_test_runs_agent_id;

-- Drop table
DROP TABLE IF EXISTS test_runs;
