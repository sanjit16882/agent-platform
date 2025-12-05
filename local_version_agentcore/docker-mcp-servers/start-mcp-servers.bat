@echo off
echo 🐳 Starting Real MCP Servers with Docker...
echo.

echo 🔍 Checking Docker installation...
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and ensure it's running
    pause
    exit /b 1
)

echo ✅ Docker is available
echo.

echo 🛑 Stopping any existing MCP containers...
docker-compose -f docker-mcp-servers/docker-compose.yml down 2>nul

echo.
echo 🚀 Starting MCP servers...
cd docker-mcp-servers
docker-compose up -d --build

echo.
echo ⏳ Waiting for servers to start...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 MCP Servers Status:
echo    • Filesystem Server: http://localhost:3010/health
echo    • Database Server:   http://localhost:3011/health  
echo    • Git Server:        http://localhost:3012/health
echo    • Office365 Server:  http://localhost:3013/health
echo.

echo 🔧 Testing server connectivity...
curl -s http://localhost:3010/health >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Filesystem Server: Running
) else (
    echo ❌ Filesystem Server: Not responding
)

curl -s http://localhost:3011/health >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Database Server: Running
) else (
    echo ❌ Database Server: Not responding
)

curl -s http://localhost:3012/health >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Git Server: Running
) else (
    echo ❌ Git Server: Not responding
)

curl -s http://localhost:3013/health >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Office365 Server: Running
) else (
    echo ❌ Office365 Server: Not responding
)

echo.
echo 🎉 Real MCP Servers are now running!
echo.
echo 📝 Next Steps:
echo    1. Update local_version backend to use these real servers
echo    2. Replace fake MCP implementation with real HTTP calls
echo    3. Test actual file operations, database queries, etc.
echo.
echo 🛑 To stop servers: docker-compose -f docker-mcp-servers/docker-compose.yml down
echo 📊 To view logs: docker-compose -f docker-mcp-servers/docker-compose.yml logs -f
echo.
pause