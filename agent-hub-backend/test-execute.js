const fetch = require('node-fetch');

async function testExecute() {
  try {
    const response = await fetch('http://localhost:3002/api/testing/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'code-reviewer',
        testIds: ['test_functional_001'],
        options: {}
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testExecute();
