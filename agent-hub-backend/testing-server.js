/**
 * Testing Framework Server
 * Standalone server for testing services
 */

const express = require('express');
const cors = require('cors');
const testingRoutes = require('./routes/testingRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', testingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'testing-framework' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Testing Framework Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

module.exports = app;
