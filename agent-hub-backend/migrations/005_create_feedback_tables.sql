-- Migration: Create Feedback Loop Tables
-- Description: Tables for storing failure patterns and recommendations
-- Version: 005
-- Date: 2025-11-10

-- Create failure_patterns table
CREATE TABLE IF NOT EXISTS failure_patterns (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  occurrences INTEGER NOT NULL DEFAULT 0,
  test_cases TEXT, -- JSON array of test case IDs
  common_features TEXT, -- JSON array of common input features
  failure_reasons TEXT, -- JSON array of failure reasons
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- prompt_modification, config_change, model_switch, validation_rule
  priority VARCHAR(50) NOT NULL, -- high, medium, low
  description TEXT NOT NULL,
  suggested_change TEXT NOT NULL,
  expected_improvement TEXT,
  affected_tests TEXT, -- JSON array of test case IDs
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, applied
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_failure_patterns_agent ON failure_patterns(agent_id);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_type ON failure_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_occurrences ON failure_patterns(occurrences DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_agent ON recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);

-- Success message
SELECT 'Migration 005: Feedback loop tables created successfully' AS status;
