// Sample JavaScript file for testing AgentHub VS Code extension
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item, 0);
}

function validateEmail(email) {
  // Potential security issue: no input validation
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function processPayment(amount, cardNumber) {
  // Security issue: hardcoded API key
  const apiKey = "sk_test_12345";
  
  // Potential issue: no error handling
  return fetch(`/api/payment?key=${apiKey}`, {
    method: 'POST',
    body: JSON.stringify({ amount, cardNumber })
  });
}

module.exports = { calculateTotal, validateEmail, processPayment };