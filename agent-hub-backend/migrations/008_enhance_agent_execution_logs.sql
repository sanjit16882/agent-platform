-- Migration: Enhance agent_execution_logs table
-- Description: Add Vector DB and execution mode tracking fields
-- Author: System
-- Date: 2024-11-12

-- Check if agent_execution_logs table exists, if not create it
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_ms INTEGER,
    input_text TEXT,
    output_text TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ael_agent_id (agent_id),
    INDEX idx_ael_execution_id (execution_id),
    INDEX idx_ael_status (status),
    INDEX idx_ael_started_at (started_at)
);

-- Add new columns for Vector DB and execution mode tracking
ALTER TABLE agent_execution_logs
ADD COLUMN IF NOT EXISTS execution_mode VARCHAR(50) DEFAULT 'bedrock-only' COMMENT 'Execution mode: bedrock-only, rag, mcp, full-stack',
ADD COLUMN IF NOT EXISTS documents_retrieved INTEGER DEFAULT 0 COMMENT 'Number of documents retrieved from Vector DB',
ADD COLUMN IF NOT EXISTS tools_invoked INTEGER DEFAULT 0 COMMENT 'Number of MCP tools invoked',
ADD COLUMN IF NOT EXISTS llm_cost DECIMAL(10,6) DEFAULT 0.000000 COMMENT 'Cost for LLM calls in USD',
ADD COLUMN IF NOT EXISTS vector_db_cost DECIMAL(10,6) DEFAULT 0.000000 COMMENT 'Cost for Vector DB operations in USD',
ADD COLUMN IF NOT EXISTS mcp_cost DECIMAL(10,6) DEFAULT 0.000000 COMMENT 'Cost for MCP tool calls in USD',
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,6) DEFAULT 0.000000 COMMENT 'Total execution cost in USD',
ADD COLUMN IF NOT EXISTS llm_latency_ms INTEGER DEFAULT 0 COMMENT 'LLM call latency in milliseconds',
ADD COLUMN IF NOT EXISTS vector_db_latency_ms INTEGER DEFAULT 0 COMMENT 'Vector DB search latency in milliseconds',
ADD COLUMN IF NOT EXISTS mcp_latency_ms INTEGER DEFAULT 0 COMMENT 'MCP tool call latency in milliseconds',
ADD COLUMN IF NOT EXISTS metadata JSON COMMENT 'Additional execution metadata';

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ael_execution_mode ON agent_execution_logs(execution_mode);
CREATE INDEX IF NOT EXISTS idx_ael_total_cost ON agent_execution_logs(total_cost);

-- Insert comment for documentation
ALTER TABLE agent_execution_logs COMMENT = 'Enhanced execution logs with Vector DB and MCP tracking';
