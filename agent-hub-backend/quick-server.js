const express = require('express');
const cors = require('cors');
const { analyzeQueryDynamically } = require('./intelligence-fix.js');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Intelligence endpoint
app.post('/api/intelligence/analyze-query-dynamic', async (req, res) => {
  try {
    const { query, userId, context } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ 
        error: 'Query is required',
        success: false 
      });
    }

    console.log('🧠 Dynamic Intelligence Analysis:', { 
      query: query.substring(0, 50) + '...', 
      userId: userId || 'anonymous',
      contextType: context?.type
    });

    const result = await analyzeQueryDynamically(query, userId, context);

    console.log('✅ Dynamic Intelligence Analysis Complete:', { 
      intent: result.analysis.intent,
      confidence: Math.round(result.analysis.confidence * 100) + '%',
      frameworks: result.analysis.frameworks.length,
      suggestions: result.suggestions.length
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Dynamic intelligence analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze query dynamically',
      success: false,
      message: error.message || 'Unknown error'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'intelligence-fix' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Intelligence Fix Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧠 Intelligence API: http://localhost:${PORT}/api/intelligence/analyze-query-dynamic`);
});