-- Migration: Create agent_vector_config table
-- Description: Stores Vector DB configuration for agents
-- Author: System
-- Date: 2024-11-12

CREATE TABLE IF NOT EXISTS agent_vector_config (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    provider VARCHAR(50) NOT NULL DEFAULT 'opensearch',
    knowledge_base_ids JSON NOT NULL DEFAULT '[]',
    top_k INTEGER DEFAULT 5,
    min_similarity DECIMAL(3,2) DEFAULT 0.70,
    max_tokens INTEGER DEFAULT 2000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to agents table (assuming it exists)
    -- FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_avc_agent_id (agent_id),
    INDEX idx_avc_enabled (enabled),
    INDEX idx_avc_provider (provider),
    
    -- Unique constraint: one config per agent
    UNIQUE KEY unique_agent_config (agent_id)
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_agent_vector_config_updated_at
    BEFORE UPDATE ON agent_vector_config
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;

-- Insert comment for documentation
ALTER TABLE agent_vector_config COMMENT = 'Stores Vector DB (RAG) configuration for agents';
