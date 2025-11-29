#!/usr/bin/env node

/**
 * Run Test Library Migrations
 * Creates the test_library, test_runs, test_results, and test_versions tables
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../data/agent-hub.db');

const migrations = [
  '20241121_create_test_library.sql',
  '20241121_create_test_runs.sql',
  '20241121_create_test_results.sql',
  '20241121_create_test_versions.sql'
];

async function runMigrations() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error connecting to database:', err);
      process.exit(1);
    }
    console.log('✅ Connected to database');
  });

  for (const migrationFile of migrations) {
    const filepath = path.join(__dirname, migrationFile);
    
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  Migration file not found: ${migrationFile}`);
      continue;
    }

    const sql = fs.readFileSync(filepath, 'utf8');
    
    await new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) {
          console.error(`❌ Error running ${migrationFile}:`, err);
          reject(err);
        } else {
          console.log(`✅ Applied migration: ${migrationFile}`);
          resolve();
        }
      });
    });
  }

  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('✅ All migrations completed successfully!');
    }
  });
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
