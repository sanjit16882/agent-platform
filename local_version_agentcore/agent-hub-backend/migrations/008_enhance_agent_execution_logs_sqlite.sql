-- Migration: Enhance agent_execution_logs table (SQLite version)
-- Description: Add Vector DB and execution mode tracking fields
-- Author: System
-- Date: 2024-11-30

-- Check if agent_execution_logs table exists, if not create it
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    duration_ms INTEGER,
    input_text TEXT,
    output_text TEXT,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ael_agent_id ON agent_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ael_execution_id ON agent_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_ael_status ON agent_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_ael_started_at ON agent_execution_logs(started_at);

-- Add new columns for Vector DB and execution mode tracking
-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we check first

-- Add execution_mode column
ALTER TABLE agent_execution_logs ADD COLUMN execution_mode TEXT DEFAULT 'bedrock-only';

-- Add documents_retrieved column
ALTER TABLE agent_execution_logs ADD COLUMN documents_retrieved INTEGER DEFAULT 0;

-- Add tools_invoked column
ALTER TABLE agent_execution_logs ADD COLUMN tools_invoked INTEGER DEFAULT 0;

-- Add llm_cost column
ALTER TABLE agent_execution_logs ADD COLUMN llm_cost REAL DEFAULT 0.000000;

-- Add vector_db_cost column
ALTER TABLE agent_execution_logs ADD COLUMN vector_db_cost REAL DEFAULT 0.000000;

-- Add mcp_cost column
ALTER TABLE agent_execution_logs ADD COLUMN mcp_cost REAL DEFAULT 0.000000;

-- Add total_cost column
ALTER TABLE agent_execution_logs ADD COLUMN total_cost REAL DEFAULT 0.000000;

-- Add llm_latency_ms column
ALTER TABLE agent_execution_logs ADD COLUMN llm_latency_ms INTEGER DEFAULT 0;

-- Add vector_db_latency_ms column
ALTER TABLE agent_execution_logs ADD COLUMN vector_db_latency_ms INTEGER DEFAULT 0;

-- Add mcp_latency_ms column
ALTER TABLE agent_execution_logs ADD COLUMN mcp_latency_ms INTEGER DEFAULT 0;

-- Add metadata column
ALTER TABLE agent_execution_logs ADD COLUMN metadata TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ael_execution_mode ON agent_execution_logs(execution_mode);
CREATE INDEX IF NOT EXISTS idx_ael_total_cost ON agent_execution_logs(total_cost);
