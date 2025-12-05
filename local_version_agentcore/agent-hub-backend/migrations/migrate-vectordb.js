#!/usr/bin/env node

/**
 * Vector DB Migration Runner
 * 
 * Runs Vector DB specific migrations (006, 007, 008)
 * 
 * Usage:
 *   node migrate-vectordb.js up    - Run all Vector DB migrations
 *   node migrate-vectordb.js down  - Rollback all Vector DB migrations
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database configuration
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../agent-hub.db');
const MIGRATIONS_DIR = __dirname;

// Vector DB Migration files in order (SQLite versions)
const VECTOR_DB_MIGRATIONS = [
  '006_create_knowledge_bases_table_sqlite',
  '007_create_agent_vector_config_table_sqlite',
  '008_enhance_agent_execution_logs_sqlite',
  '009_create_documents_table_sqlite',
  '010_create_document_chunks_table_sqlite'
];

console.log('🚀 Vector DB Migration Runner');
console.log('📂 Database:', DB_PATH);
console.log('📁 Migrations:', MIGRATIONS_DIR);
console.log('');

class VectorDBMigrationRunner {
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
          console.log(`✅ Connected to database: ${this.dbPath}`);
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
          console.log('✅ Migrations tracking table ready');
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
    const suffix = direction === 'down' ? '.down' : '';
    const filename = `${migrationName}${suffix}.sql`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  Migration file not found: ${filename} (skipping)`);
      return;
    }

    const sql = fs.readFileSync(filepath, 'utf8');
    
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(new Error(`Failed to run ${filename}: ${err.message}`));
        } else {
          if (direction === 'up') {
            this.db.run(
              'INSERT OR IGNORE INTO migrations (name) VALUES (?)',
              [migrationName],
              (err) => {
                if (err) reject(err);
                else {
                  console.log(`✅ Applied migration: ${migrationName}`);
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
                  console.log(`✅ Rolled back migration: ${migrationName}`);
                  resolve();
                }
              }
            );
          }
        }
      });
    });
  }

  async migrateUp() {
    const applied = await this.getAppliedMigrations();
    const pending = VECTOR_DB_MIGRATIONS.filter(m => !applied.includes(m));

    if (pending.length === 0) {
      console.log('✅ All Vector DB migrations already applied');
      return;
    }

    console.log(`\n📦 Applying ${pending.length} Vector DB migration(s)...\n`);

    for (const migration of pending) {
      await this.runMigration(migration, 'up');
    }

    console.log('\n🎉 All Vector DB migrations applied successfully!\n');
  }

  async migrateDown() {
    const applied = await this.getAppliedMigrations();
    const toRollback = VECTOR_DB_MIGRATIONS
      .filter(m => applied.includes(m))
      .reverse();

    if (toRollback.length === 0) {
      console.log('✅ No Vector DB migrations to rollback');
      return;
    }

    console.log(`\n🔄 Rolling back ${toRollback.length} Vector DB migration(s)...\n`);

    for (const migration of toRollback) {
      await this.runMigration(migration, 'down');
    }

    console.log('\n✅ All Vector DB migrations rolled back successfully\n');
  }

  async listTables() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.name));
        }
      );
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const direction = args[0]; // 'up' or 'down'

  if (!direction || !['up', 'down'].includes(direction)) {
    console.error('❌ Usage: node migrate-vectordb.js [up|down]');
    console.error('');
    console.error('Examples:');
    console.error('  node migrate-vectordb.js up    - Apply Vector DB migrations');
    console.error('  node migrate-vectordb.js down  - Rollback Vector DB migrations');
    process.exit(1);
  }

  const runner = new VectorDBMigrationRunner(DB_PATH);

  try {
    await runner.connect();
    await runner.createMigrationsTable();

    if (direction === 'up') {
      await runner.migrateUp();
    } else {
      await runner.migrateDown();
    }

    // Show current tables
    console.log('📊 Current database tables:');
    const tables = await runner.listTables();
    tables.forEach(table => console.log(`   - ${table}`));
    console.log('');

    await runner.close();
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    await runner.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = VectorDBMigrationRunner;
