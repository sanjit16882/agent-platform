
@echo off
echo Starting AgentHub Production Server...
echo.
echo 🌐 AgentHub will be available at:
echo    Local:   http://localhost:3000
echo    Network: http://your-ip:3000
echo.
echo 📊 Features Available:
echo    - Conservative ROI Calculator
echo    - CloudWatch Metrics Dashboard  
echo    - Interactive Agent Catalog
echo    - Real Integration Guide
echo    - Professional UI Polish
echo.
echo Press Ctrl+C to stop the server
echo.
serve -s build -l 3000
