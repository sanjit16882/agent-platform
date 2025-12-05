-- Rollback Migration: Drop document_chunks table
-- Description: Removes document_chunks table
-- Author: System
-- Date: 2024-11-30

-- Drop indexes
DROP INDEX IF EXISTS idx_chunk_doc_id;
DROP INDEX IF EXISTS idx_chunk_kb_id;
DROP INDEX IF EXISTS idx_chunk_embedding;
DROP INDEX IF EXISTS idx_chunk_vector_id;

-- Drop table
DROP TABLE IF EXISTS document_chunks;
