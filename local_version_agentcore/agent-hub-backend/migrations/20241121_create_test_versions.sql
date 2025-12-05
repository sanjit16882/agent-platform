-- Migration: Create test_versions table
-- Purpose: Track version history of test definitions
-- Date: 2024-11-21

CREATE TABLE IF NOT EXISTS test_versions (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  changes TEXT, -- JSON: { "field": "input_content", "old": "...", "new": "..." }
  change_type TEXT CHECK(change_type IN ('created', 'updated', 'deleted')),
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (test_id) REFERENCES test_library(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_versions_test_id ON test_versions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_versions_version_number ON test_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_test_versions_created_at ON test_versions(created_at DESC);

-- Unique constraint: one version number per test
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_versions_unique ON test_versions(test_id, version_number);

-- Trigger to auto-increment version number
CREATE TRIGGER IF NOT EXISTS auto_increment_version
BEFORE INSERT ON test_versions
BEGIN
  SELECT CASE
    WHEN NEW.version_number IS NULL THEN
      COALESCE((SELECT MAX(version_number) FROM test_versions WHERE test_id = NEW.test_id), 0) + 1
    ELSE
      NEW.version_number
  END INTO NEW.version_number;
END;

-- View for latest version of each test
CREATE VIEW IF NOT EXISTS test_latest_versions AS
SELECT 
  tv.*,
  tl.name as test_name,
  tl.category as test_category
FROM test_versions tv
INNER JOIN test_library tl ON tv.test_id = tl.id
WHERE tv.version_number = (
  SELECT MAX(version_number) 
  FROM test_versions 
  WHERE test_id = tv.test_id
);
