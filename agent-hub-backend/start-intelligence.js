#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Agent Hub with Intelligence Layer...\n');

// Start the backend server (port 3002) - Production agents + Intelligence Layer
console.log('📡 Starting Backend Server (Port 3002)...');
const backendServer = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3002' }
});

// Start the UI development server (port 3001)
setTimeout(() => {
  console.log('\n🎨 Starting UI Development Server (Port 3001)...');
  const uiServer = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../agent-hub-ui'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '3001' }
  });

  uiServer.on('error', (error) => {
    console.error('❌ UI server error:', error);
  });
}, 2000);

backendServer.on('error', (error) => {
  console.error('❌ Backend server error:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backendServer.kill();
  process.exit(0);
});

console.log(`
🌟 Agent Hub Intelligence Platform Starting...

📊 Services:
  • Backend API (Intelligence + Agents): http://localhost:3002
  • Frontend UI:                        http://localhost:3001

🧠 Intelligence Features:
  • Smart Agent Routing
  • Adaptive Reasoning  
  • Continuous Learning
  • Real-time Feedback

⚡ Ready for real agent execution!
`);