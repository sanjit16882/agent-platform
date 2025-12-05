function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item, 0);
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

module.exports = { calculateTotal, validateEmail };