-- Migration: Create knowledge_bases table (SQLite version)
-- Description: Stores vector database knowledge bases (indexes)
-- Author: System
-- Date: 2024-11-30

CREATE TABLE IF NOT EXISTS knowledge_bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL DEFAULT 'opensearch',
    index_name TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    size_bytes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    metadata TEXT,
    
    -- Unique constraint on index_name per provider
    UNIQUE(provider, index_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kb_name ON knowledge_bases(name);
CREATE INDEX IF NOT EXISTS idx_kb_provider ON knowledge_bases(provider);
CREATE INDEX IF NOT EXISTS idx_kb_created_at ON knowledge_bases(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_knowledge_bases_updated_at
    AFTER UPDATE ON knowledge_bases
    FOR EACH ROW
BEGIN
    UPDATE knowledge_bases 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;
