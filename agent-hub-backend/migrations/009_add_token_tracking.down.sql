-- Rollback: Remove token tracking columns
-- Description: Remove input_tokens and output_tokens columns
-- Author: System
-- Date: 2024-11-12

-- SQLite doesn't support DROP COLUMN directly
-- We would need to recreate the table without these columns
-- For now, this is a placeholder for documentation

-- Note: To properly rollback in SQLite, you would need to:
-- 1. Create a new table without the columns
-- 2. Copy data from old table to new table
-- 3. Drop old table
-- 4. Rename new table to old name

SELECT 'Rollback not implemented - SQLite does not support DROP COLUMN' as message;
