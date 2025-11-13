# Database Migrations

## Overview

This directory contains SQL migration files for the Agent Hub platform. All migrations are designed to be **backward compatible** and include rollback scripts.

## Migration Files

### Agent Testing Framework (001-005)

#### Forward Migrations (Up)
- `001_create_test_suites_table.sql` - Creates test_suites table
- `002_create_test_runs_table.sql` - Creates test_runs table
- `003_create_test_results_table.sql` - Creates test_results table
- `004_create_agent_testing_status_view.sql` - Creates aggregated view
- `005_create_feedback_tables.sql` - Creates feedback and recommendations tables

#### Rollback Migrations (Down)
- `001_create_test_suites_table_down.sql` - Drops test_suites table
- `002_create_test_runs_table_down.sql` - Drops test_runs table
- `003_create_test_results_table_down.sql` - Drops test_results table
- `004_create_agent_testing_status_view_down.sql` - Drops view
- `005_create_feedback_tables.down.sql` - Drops feedback tables

### Modular Agent Builder - Vector DB (006-008)

#### Forward Migrations (Up)
- `006_create_knowledge_bases_table.sql` - Creates knowledge_bases table for Vector DB indexes
- `007_create_agent_vector_config_table.sql` - Creates agent_vector_config table for RAG configuration
- `008_enhance_agent_execution_logs.sql` - Enhances execution logs with Vector DB and cost tracking

#### Rollback Migrations (Down)
- `006_create_knowledge_bases_table.down.sql` - Drops knowledge_bases table
- `007_create_agent_vector_config_table.down.sql` - Drops agent_vector_config table
- `008_enhance_agent_execution_logs.down.sql` - Removes Vector DB enhancements from execution logs

## Running Migrations

### Apply All Migrations
```bash
node migrations/migrate.js up
```

### Rollback All Migrations
```bash
node migrations/migrate.js down
```

### Apply Specific Migration
```bash
node migrations/migrate.js up 001
```

### Rollback Specific Migration
```bash
node migrations/migrate.js down 001
```

## Migration Order

### Agent Testing Framework (001-005)
Migrations must be run in order:
1. test_suites (no dependencies)
2. test_runs (depends on test_suites and agents)
3. test_results (depends on test_runs)
4. agent_testing_status view (depends on all tables)
5. feedback_tables (depends on test_runs)

### Modular Agent Builder (006-008)
Migrations must be run in order:
1. knowledge_bases (no dependencies)
2. agent_vector_config (depends on agents table)
3. agent_execution_logs enhancements (modifies existing table)

## Rollback Order

### Agent Testing Framework
Rollbacks must be run in reverse order:
1. feedback_tables
2. agent_testing_status view
3. test_results
4. test_runs
5. test_suites

### Modular Agent Builder
Rollbacks must be run in reverse order:
1. agent_execution_logs enhancements
2. agent_vector_config
3. knowledge_bases

## Important Notes

- **No Existing Tables Modified**: All migrations only create new tables
- **Foreign Keys**: Proper CASCADE rules ensure data integrity
- **Indexes**: Performance indexes created for common queries
- **Backward Compatible**: Existing functionality unaffected
- **Rollback Safe**: All migrations have corresponding down scripts

## Testing Migrations

Before running in production:
1. Test in development environment
2. Verify rollback works correctly
3. Check no impact on existing functionality
4. Monitor database performance after migration
