-- Rollback Migration: Remove Vector DB enhancements from agent_execution_logs
-- Description: Removes new columns added for Vector DB and execution mode tracking
-- Author: System
-- Date: 2024-11-12

-- Drop indexes for new columns
DROP INDEX IF EXISTS idx_ael_execution_mode ON agent_execution_logs;
DROP INDEX IF EXISTS idx_ael_total_cost ON agent_execution_logs;

-- Remove new columns
ALTER TABLE agent_execution_logs
DROP COLUMN IF EXISTS execution_mode,
DROP COLUMN IF EXISTS documents_retrieved,
DROP COLUMN IF EXISTS tools_invoked,
DROP COLUMN IF EXISTS llm_cost,
DROP COLUMN IF EXISTS vector_db_cost,
DROP COLUMN IF EXISTS mcp_cost,
DROP COLUMN IF EXISTS total_cost,
DROP COLUMN IF EXISTS llm_latency_ms,
DROP COLUMN IF EXISTS vector_db_latency_ms,
DROP COLUMN IF EXISTS mcp_latency_ms,
DROP COLUMN IF EXISTS metadata;
