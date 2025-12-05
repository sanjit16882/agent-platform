-- Migration: Create documents table (SQLite version)
-- Description: Stores documents uploaded to knowledge bases
-- Author: System
-- Date: 2024-11-30

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    knowledge_base_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    file_type TEXT,
    file_size INTEGER,
    chunk_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    metadata TEXT,
    
    -- Foreign key to knowledge_bases
    FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doc_kb_id ON documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_doc_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_doc_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_doc_file_type ON documents(file_type);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_documents_updated_at
    AFTER UPDATE ON documents
    FOR EACH ROW
BEGIN
    UPDATE documents 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;
