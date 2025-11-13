-- Migration: Add token tracking to agent_execution_logs
-- Description: Add input_tokens and output_tokens columns for cost calculation
-- Author: System
-- Date: 2024-11-12

-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we need to check first
-- Add input_tokens column
ALTER TABLE agent_execution_logs ADD COLUMN input_tokens INTEGER DEFAULT 0;

-- Add output_tokens column  
ALTER TABLE agent_execution_logs ADD COLUMN output_tokens INTEGER DEFAULT 0;

-- Create index for token-based queries
CREATE INDEX IF NOT EXISTS idx_ael_tokens ON agent_execution_logs(input_tokens, output_tokens);
