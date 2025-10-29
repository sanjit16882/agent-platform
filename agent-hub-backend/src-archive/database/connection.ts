import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

/**
 * Initialize database connection and create tables
 */
export async function initializeDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) {
    return db;
  }

  try {
    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), 'data');
    const fs = require('fs');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open database connection
    const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || join(dataDir, 'agenthub.db');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    await db.exec('PRAGMA journal_mode = WAL');
    
    // Set reasonable timeout
    await db.exec('PRAGMA busy_timeout = 30000');

    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    await db.exec(schema);

    logger.info('Database initialized successfully', { path: dbPath });
    
    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database connection (initialize if needed)
 */
export async function getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * Execute a query with parameters
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDatabase();
  return database.all<T[]>(sql, params);
}

/**
 * Execute a single query and return first result
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const database = await getDatabase();
  return database.get<T>(sql, params);
}

/**
 * Execute an insert/update/delete query
 */
export async function execute(sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> {
  const database = await getDatabase();
  return database.run(sql, params);
}

/**
 * Begin a transaction
 */
export async function beginTransaction(): Promise<void> {
  const database = await getDatabase();
  await database.exec('BEGIN TRANSACTION');
}

/**
 * Commit a transaction
 */
export async function commitTransaction(): Promise<void> {
  const database = await getDatabase();
  await database.exec('COMMIT');
}

/**
 * Rollback a transaction
 */
export async function rollbackTransaction(): Promise<void> {
  const database = await getDatabase();
  await database.exec('ROLLBACK');
}

/**
 * Execute a function within a transaction
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  await beginTransaction();
  try {
    const result = await fn();
    await commitTransaction();
    return result;
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
}