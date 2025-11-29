const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/agent-hub.db');
const db = new sqlite3.Database(DB_PATH);

db.all("SELECT category, COUNT(*) as count FROM test_library GROUP BY category", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('\n📊 Test Library Summary:\n');
    let total = 0;
    rows.forEach(row => {
      console.log(`  ${row.category.padEnd(20)} : ${row.count} tests`);
      total += row.count;
    });
    console.log(`  ${'─'.repeat(20)}   ${'─'.repeat(10)}`);
    console.log(`  ${'TOTAL'.padEnd(20)} : ${total} tests\n`);
  }
  db.close();
});
