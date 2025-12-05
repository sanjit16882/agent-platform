/**
 * Database Helper
 * 
 * Provides database connection and query utilities for Vector DB services
 */

import * as sqlite3 from 'sqlite3';
import * as path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../agent-hub.db');

/**
 * Get database connection
 */
export function getDatabase(): sqlite3.Database {
  const db = new (sqlite3.verbose()).Database(DB_PATH);
  return db;
}

/**
 * Run a query that returns multiple rows
 */
export function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

/**
 * Run a query that returns a single row
 */
export function queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      db.close();
      if (err) reject(err);
      else resolve(row as T || null);
    });
  });
}

/**
 * Run a query that modifies data (INSERT, UPDATE, DELETE)
 */
export function execute(sql: string, params: any[] = []): Promise<{ lastID?: number; changes: number }> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      db.close();
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Run multiple queries in a transaction
 */
export function transaction(queries: Array<{ sql: string; params: any[] }>): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      for (const query of queries) {
        db.run(query.sql, query.params, (err) => {
          if (err) {
            db.run('ROLLBACK');
            db.close();
            reject(err);
            return;
          }
        });
      }
      
      db.run('COMMIT', (err) => {
        db.close();
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export default {
  getDatabase,
  queryAll,
  queryOne,
  execute,
  transaction
};
