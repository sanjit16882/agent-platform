const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'agent-hub.db');
const migrationPath = path.join(__dirname, 'migrations', '010_add_test_methodology.sql');

const db = new sqlite3.Database(dbPath);

const sql = fs.readFileSync(migrationPath, 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Migration 010_add_test_methodology.sql applied successfully');
  
  // Verify the changes
  db.all(`SELECT id, name, test_methodology FROM test_library WHERE test_methodology IS NOT NULL LIMIT 5`, (err, rows) => {
    if (err) {
      console.error('❌ Verification failed:', err.message);
    } else {
      console.log('\n✅ Verified - Sample tests with methodology:');
      rows.forEach(row => {
        console.log(`  - ${row.name}: ${row.test_methodology.substring(0, 80)}...`);
      });
    }
    
    db.close();
  });
});
