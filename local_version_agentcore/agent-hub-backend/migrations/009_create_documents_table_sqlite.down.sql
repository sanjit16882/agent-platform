-- Rollback Migration: Drop documents table
-- Description: Removes documents table
-- Author: System
-- Date: 2024-11-30

-- Drop trigger first
DROP TRIGGER IF EXISTS update_documents_updated_at;

-- Drop indexes
DROP INDEX IF EXISTS idx_doc_kb_id;
DROP INDEX IF EXISTS idx_doc_title;
DROP INDEX IF EXISTS idx_doc_created_at;
DROP INDEX IF EXISTS idx_doc_file_type;

-- Drop table
DROP TABLE IF EXISTS documents;
