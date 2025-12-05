-- Rollback Migration: Drop agent_vector_config table
-- Description: Removes agent_vector_config table and related objects
-- Author: System
-- Date: 2024-11-12

-- Drop trigger first
DROP TRIGGER IF EXISTS update_agent_vector_config_updated_at;

-- Drop table
DROP TABLE IF EXISTS agent_vector_config;
