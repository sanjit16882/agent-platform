// Script to generate real learning data from actual agent usage
// Run this after using agents to populate the learning dashboard

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data/learning');

console.log('📊 Generating real learning data...\n');

// This script will be populated automatically as you use agents
// For now, it just ensures the data structure is ready

const files = {
  'interactions.json': [],
  'feedback.json': [],
  'user-profiles.json': {},
  'ab-tests.json': {}
};

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create empty files if they don't exist
Object.entries(files).forEach(([filename, defaultData]) => {
  const filepath = path.join(dataDir, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
    console.log(`✅ Created ${filename}`);
  } else {
    console.log(`✓ ${filename} already exists`);
  }
});

console.log('\n✅ Learning data structure is ready!');
console.log('\n📝 To populate with real data:');
console.log('   1. Use agents through the UI');
console.log('   2. Execute agents via API');
console.log('   3. Provide feedback and ratings');
console.log('   4. Data will be automatically tracked\n');
