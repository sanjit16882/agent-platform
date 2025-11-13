-- Migration: Create knowledge_bases table
-- Description: Stores vector database knowledge bases (indexes)
-- Author: System
-- Date: 2024-11-12

CREATE TABLE IF NOT EXISTS knowledge_bases (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(50) NOT NULL DEFAULT 'opensearch',
    index_name VARCHAR(255) NOT NULL,
    document_count INTEGER DEFAULT 0,
    size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    metadata JSON,
    
    -- Indexes for performance
    INDEX idx_kb_name (name),
    INDEX idx_kb_provider (provider),
    INDEX idx_kb_created_at (created_at),
    
    -- Unique constraint on index_name per provider
    UNIQUE KEY unique_index_per_provider (provider, index_name)
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_knowledge_bases_updated_at
    BEFORE UPDATE ON knowledge_bases
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;

-- Insert comment for documentation
ALTER TABLE knowledge_bases COMMENT = 'Stores vector database knowledge bases for RAG functionality';
