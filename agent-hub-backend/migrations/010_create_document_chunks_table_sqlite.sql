-- Migration: Create document_chunks table (SQLite version)
-- Description: Stores chunked versions of documents for vector search
-- Author: System
-- Date: 2024-11-30

CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    knowledge_base_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    start_index INTEGER,
    end_index INTEGER,
    embedding_generated INTEGER DEFAULT 0,  -- 0=false, 1=true
    vector_db_id TEXT,  -- ID in the vector database (ChromaDB, OpenSearch, etc.)
    created_at TEXT DEFAULT (datetime('now')),
    metadata TEXT,
    
    -- Foreign keys
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    
    -- Unique constraint: one chunk per document+index
    UNIQUE(document_id, chunk_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunk_doc_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunk_kb_id ON document_chunks(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_chunk_embedding ON document_chunks(embedding_generated);
CREATE INDEX IF NOT EXISTS idx_chunk_vector_id ON document_chunks(vector_db_id);
