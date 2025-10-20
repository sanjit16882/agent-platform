@echo off
echo ========================================
echo    AgentHub Development Environment
echo ========================================
echo.
echo Starting Backend Server (Port 3002)...
echo.

cd agent-hub-backend
start "AgentHub Backend" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Server (Port 3001)...
echo.

cd ..\agent-hub-ui
start "AgentHub Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    Servers Starting...
echo ========================================
echo.
echo Backend:  http://localhost:3002
echo Frontend: http://localhost:3001
echo API Docs: http://localhost:3002/api/docs
echo NLP Test: http://localhost:3002/api/v1/nlp/test
echo.
echo Press any key to close this window...
pause > nul