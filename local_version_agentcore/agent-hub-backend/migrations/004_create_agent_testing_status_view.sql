-- Migration: 004_create_agent_testing_status_view
-- Description: Create view for aggregated agent testing status
-- Date: 2025-11-10

-- Create agent_testing_status view
CREATE VIEW IF NOT EXISTS agent_testing_status AS
SELECT 
  a.agent_id,
  a.name AS agent_name,
  a.category,
  a.agent_type,
  COUNT(DISTINCT tr.id) AS total_test_runs,
  MAX(tr.end_time) AS last_test_run,
  SUM(CASE WHEN tres.status = 'passed' THEN 1 ELSE 0 END) AS total_passed,
  SUM(CASE WHEN tres.status = 'failed' THEN 1 ELSE 0 END) AS total_failed,
  SUM(CASE WHEN tres.status = 'skipped' THEN 1 ELSE 0 END) AS total_skipped,
  SUM(CASE WHEN tres.status = 'error' THEN 1 ELSE 0 END) AS total_errors,
  COUNT(tres.id) AS total_tests_executed,
  CASE 
    WHEN COUNT(tres.id) > 0 THEN 
      ROUND((SUM(CASE WHEN tres.status = 'passed' THEN 1 ELSE 0 END) * 100.0 / COUNT(tres.id)), 2)
    ELSE 0 
  END AS pass_rate,
  AVG(tres.duration) AS avg_test_duration,
  SUM(tres.duration) AS total_test_duration
FROM agents a
LEFT JOIN test_runs tr ON a.agent_id = tr.agent_id AND tr.status = 'completed'
LEFT JOIN test_results tres ON tr.id = tres.run_id
GROUP BY a.agent_id, a.name, a.category, a.agent_type;

-- Add comment
COMMENT ON VIEW agent_testing_status IS 'Aggregated view of testing status per agent';
