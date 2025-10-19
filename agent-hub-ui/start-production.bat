
@echo off
echo Starting AgentHub Production Server...
echo.
echo 🌐 AgentHub will be available at:
echo    Local:   http://localhost:3000
echo    Network: http://your-ip:3000
echo.
echo 📊 Features Available:
echo    - Real-time Progress Tracking with WebSocket Simulation
echo    - Professional Analytics Dashboard ($1.25M ROI Metrics)
echo    - Syntax Highlighting for Generated Code (10+ Languages)
echo    - Export System (PDF, Excel, Word Reports)
echo    - Interactive Agent Performance Tables
echo    - Executive Business Intelligence Dashboard
echo    - Professional Code Display with Copy Functionality
echo    - Streaming Output with Live Progress Updates
echo.
echo Press Ctrl+C to stop the server
echo.
serve -s build -l 3000
