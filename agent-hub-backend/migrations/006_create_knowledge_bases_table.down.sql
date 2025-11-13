-- Rollback Migration: Drop knowledge_bases table
-- Description: Removes knowledge_bases table and related objects
-- Author: System
-- Date: 2024-11-12

-- Drop trigger first
DROP TRIGGER IF EXISTS update_knowledge_bases_updated_at;

-- Drop table
DROP TABLE IF EXISTS knowledge_bases;
