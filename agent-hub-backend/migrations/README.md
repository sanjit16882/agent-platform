# Database Migrations for Agent Testing Framework

## Overview

This directory contains SQL migration files for the Agent Testing Framework. All migrations are **additive only** and do not modify existing tables to ensure backward compatibility.

## Migration Files

### Forward Migrations (Up)
- `001_create_test_suites_table.sql` - Creates test_suites table
- `002_create_test_runs_table.sql` - Creates test_runs table
- `003_create_test_results_table.sql` - Creates test_results table
- `004_create_agent_testing_status_view.sql` - Creates aggregated view

### Rollback Migrations (Down)
- `001_create_test_suites_table_down.sql` - Drops test_suites table
- `002_create_test_runs_table_down.sql` - Drops test_runs table
- `003_create_test_results_table_down.sql` - Drops test_results table
- `004_create_agent_testing_status_view_down.sql` - Drops view

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

Migrations must be run in order:
1. test_suites (no dependencies)
2. test_runs (depends on test_suites and agents)
3. test_results (depends on test_runs)
4. agent_testing_status view (depends on all tables)

## Rollback Order

Rollbacks must be run in reverse order:
1. agent_testing_status view
2. test_results
3. test_runs
4. test_suites

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
