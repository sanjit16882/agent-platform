-- Rollback Migration: 001_create_test_suites_table
-- Description: Drop test_suites table and related indexes
-- Date: 2025-11-10

-- Drop indexes
DROP INDEX IF EXISTS idx_test_suites_created_at;
DROP INDEX IF EXISTS idx_test_suites_enabled;
DROP INDEX IF EXISTS idx_test_suites_agent_id;
DROP INDEX IF EXISTS idx_test_suites_suite_type;

-- Drop table
DROP TABLE IF EXISTS test_suites;
