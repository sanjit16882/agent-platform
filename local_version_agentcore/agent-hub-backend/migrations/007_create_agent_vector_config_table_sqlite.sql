-- Migration: Create agent_vector_config table (SQLite version)
-- Description: Stores Vector DB configuration for agents
-- Author: System
-- Date: 2024-11-30

CREATE TABLE IF NOT EXISTS agent_vector_config (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    enabled INTEGER DEFAULT 0,  -- SQLite uses INTEGER for boolean (0=false, 1=true)
    provider TEXT NOT NULL DEFAULT 'opensearch',
    knowledge_base_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array as TEXT
    top_k INTEGER DEFAULT 5,
    min_similarity REAL DEFAULT 0.70,
    max_tokens INTEGER DEFAULT 2000,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    -- Unique constraint: one config per agent
    UNIQUE(agent_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_avc_agent_id ON agent_vector_config(agent_id);
CREATE INDEX IF NOT EXISTS idx_avc_enabled ON agent_vector_config(enabled);
CREATE INDEX IF NOT EXISTS idx_avc_provider ON agent_vector_config(provider);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_agent_vector_config_updated_at
    AFTER UPDATE ON agent_vector_config
    FOR EACH ROW
BEGIN
    UPDATE agent_vector_config 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;
