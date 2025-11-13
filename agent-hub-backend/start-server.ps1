# Start Agent Hub Backend Server
# This script kills any existing Node processes and starts the server fresh

Write-Host "🔍 Checking for existing Node processes on port 3002..." -ForegroundColor Cyan

# Kill any existing Node processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Found $($nodeProcesses.Count) Node process(es). Stopping them..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Stopped existing Node processes" -ForegroundColor Green
} else {
    Write-Host "✅ No existing Node processes found" -ForegroundColor Green
}

# Start the server
Write-Host "`n🚀 Starting Agent Hub Backend Server..." -ForegroundColor Cyan
Write-Host "📍 Location: $PSScriptRoot" -ForegroundColor Gray
Write-Host "🌐 Server will be available at: http://localhost:3002" -ForegroundColor Gray
Write-Host "`n💡 Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

node comprehensive-server.js
