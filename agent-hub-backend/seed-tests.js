const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/agent-hub.db');
const SQL_FILE = path.join(__dirname, 'migrations/seed-comprehensive-tests.sql');

const db = new sqlite3.Database(DB_PATH);
const sql = fs.readFileSync(SQL_FILE, 'utf8');

// Split by semicolon and execute each statement
const statements = sql.split(';').filter(s => s.trim().length > 0);

let completed = 0;
statements.forEach((statement, index) => {
  db.run(statement, (err) => {
    if (err && !err.message.includes('no such table: sqlite_')) {
      console.error(`Error in statement ${index + 1}:`, err.message);
    }
    completed++;
    if (completed === statements.length) {
      console.log('✅ Comprehensive test suite loaded successfully!');
      db.close();
    }
  });
});
