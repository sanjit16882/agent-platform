-- Rollback Migration: 003_create_test_results_table
-- Description: Drop test_results table and related indexes
-- Date: 2025-11-10

-- Drop indexes
DROP INDEX IF EXISTS idx_test_results_created_at;
DROP INDEX IF EXISTS idx_test_results_duration;
DROP INDEX IF EXISTS idx_test_results_test_case_id;
DROP INDEX IF EXISTS idx_test_results_status;
DROP INDEX IF EXISTS idx_test_results_run_id;

-- Drop table
DROP TABLE IF EXISTS test_results;
