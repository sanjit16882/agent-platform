#!/bin/bash

# Build script for QE Failure Analyzer Demo Agent
echo "🚀 Building QE Failure Analyzer Demo Agent..."

# Build Docker image
docker build -t qe-failure-analyzer:1.0.0 .

# Tag for demo registry (simulate)
docker tag qe-failure-analyzer:1.0.0 demo-registry.com/qe-failure-analyzer:1.0.0

echo "✅ Build complete!"
echo ""
echo "📋 Demo Details:"
echo "   Image Name: qe-failure-analyzer:1.0.0"
echo "   Registry: demo-registry.com/qe-failure-analyzer:1.0.0"
echo "   Size: ~200MB"
echo "   Ports: 8080 (HTTP API)"
echo ""
echo "🎯 For AgentHub Demo:"
echo "   1. Use Docker upload option"
echo "   2. Enter: demo-registry.com/qe-failure-analyzer:1.0.0"
echo "   3. Show validation and deployment process"
echo "   4. Demonstrate management features"
echo ""
echo "🧪 Test locally:"
echo "   docker run -p 8080:8080 qe-failure-analyzer:1.0.0"
echo "   curl http://localhost:8080/health"