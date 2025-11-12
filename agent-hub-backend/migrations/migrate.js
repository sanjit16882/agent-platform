#!/usr/bin/env node

/**
 * Database Migration Runner for Agent Testing Framework
 * 
 * Usage:
 *   node migrate.js up          - Run all pending migrations
 *   node migrate.js down        - Rollback all migrations
 *   node migrate.js up 001      - Run specific migration
 *   node migrate.js down 001    - Rollback specific migration
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database configuration
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/agenthub.db');
const MIGRATIONS_DIR = __dirname;

// Migration files in order
const MIGRATIONS = [
  '001_create_test_suites_table',
  '002_create_test_runs_table',
  '003_create_test_results_table',
  '004_create_agent_testing_status_view'
];

class MigrationRunner {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✓ Connected to database: ${this.dbPath}`);
          resolve();
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async createMigrationsTable() {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      this.db.run(sql, (err) => {
        if (err) reject(err);
        else {
          console.log('✓ Migrations tracking table ready');
          resolve();
        }
      });
    });
  }

  async getAppliedMigrations() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT name FROM migrations ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
  }

  async runMigration(migrationName, direction = 'up') {
    const suffix = direction === 'down' ? '_down' : '';
    const filename = `${migrationName}${suffix}.sql`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }

    const sql = fs.readFileSync(filepath, 'utf8');
    
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(new Error(`Failed to run ${filename}: ${err.message}`));
        } else {
          if (direction === 'up') {
            this.db.run(
              'INSERT INTO migrations (name) VALUES (?)',
              [migrationName],
              (err) => {
                if (err) reject(err);
                else {
                  console.log(`✓ Applied migration: ${migrationName}`);
                  resolve();
                }
              }
            );
          } else {
            this.db.run(
              'DELETE FROM migrations WHERE name = ?',
              [migrationName],
              (err) => {
                if (err) reject(err);
                else {
                  console.log(`✓ Rolled back migration: ${migrationName}`);
                  resolve();
                }
              }
            );
          }
        }
      });
    });
  }

  async migrateUp(specificMigration = null) {
    const applied = await this.getAppliedMigrations();
    const pending = specificMigration 
      ? [specificMigration]
      : MIGRATIONS.filter(m => !applied.includes(m));

    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }

    console.log(`\nApplying ${pending.length} migration(s)...\n`);

    for (const migration of pending) {
      await this.runMigration(migration, 'up');
    }

    console.log('\n✓ All migrations applied successfully\n');
  }

  async migrateDown(specificMigration = null) {
    const applied = await this.getAppliedMigrations();
    const toRollback = specificMigration
      ? [specificMigration]
      : [...applied].reverse();

    if (toRollback.length === 0) {
      console.log('✓ No migrations to rollback');
      return;
    }

    console.log(`\nRolling back ${toRollback.length} migration(s)...\n`);

    for (const migration of toRollback) {
      await this.runMigration(migration, 'down');
    }

    console.log('\n✓ All migrations rolled back successfully\n');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const direction = args[0]; // 'up' or 'down'
  const specificMigration = args[1]; // optional migration name

  if (!direction || !['up', 'down'].includes(direction)) {
    console.error('Usage: node migrate.js [up|down] [migration_name]');
    process.exit(1);
  }

  const runner = new MigrationRunner(DB_PATH);

  try {
    await runner.connect();
    await runner.createMigrationsTable();

    if (direction === 'up') {
      await runner.migrateUp(specificMigration);
    } else {
      await runner.migrateDown(specificMigration);
    }

    await runner.close();
    console.log('✓ Migration process completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    await runner.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;
