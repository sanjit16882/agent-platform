-- Rollback Migration: Drop Feedback Loop Tables
-- Description: Remove failure patterns and recommendations tables
-- Version: 005
-- Date: 2025-11-10

-- Drop indexes
DROP INDEX IF EXISTS idx_recommendations_type;
DROP INDEX IF EXISTS idx_recommendations_status;
DROP INDEX IF EXISTS idx_recommendations_priority;
DROP INDEX IF EXISTS idx_recommendations_agent;

DROP INDEX IF EXISTS idx_failure_patterns_occurrences;
DROP INDEX IF EXISTS idx_failure_patterns_type;
DROP INDEX IF EXISTS idx_failure_patterns_agent;

-- Drop tables
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS failure_patterns;

-- Success message
SELECT 'Migration 005 rollback: Feedback loop tables dropped successfully' AS status;
