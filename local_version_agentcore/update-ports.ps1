# Update ports for AgentCore version
# 3001 -> 4001 (Frontend)
# 3002 -> 4002 (Backend)
# 3003 -> 4003 (Testing API)

Write-Host "Updating ports in local_version_agentcore..." -ForegroundColor Cyan

$files = @(
    "README.md",
    "package.json",
    "config/local.json",
    "config/dns-config.js",
    "docker-compose.local.yml",
    "docs/**/*.md",
    "agent-hub-ui/src/**/*.{ts,tsx,js}",
    "agent-hub-backend/**/*.{js,ts,json}"
)

$replacements = @{
    "3001" = "4001"
    "3002" = "4002"
    "3003" = "4003"
}

# Get all files recursively, excluding node_modules
$allFiles = Get-ChildItem -Path . -Recurse -File -Include *.md,*.json,*.js,*.ts,*.tsx,*.yml,*.yaml,*.env* | 
    Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.git" }

$fileCount = 0
$changeCount = 0

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($content) {
        $originalContent = $content
        
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            $content = $content -replace $old, $new
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $fileCount++
            $changes = ($originalContent.Length - $content.Replace($originalContent, "").Length) / 4
            $changeCount += $changes
            Write-Host "  Updated: $($file.FullName.Replace($PWD, '.'))" -ForegroundColor Green
        }
    }
}

Write-Host "`nPort update complete!" -ForegroundColor Green
Write-Host "  Files updated: $fileCount" -ForegroundColor Yellow
Write-Host "  Total replacements: $changeCount" -ForegroundColor Yellow
Write-Host "`nNew ports:" -ForegroundColor Cyan
Write-Host "  Frontend UI: http://localhost:4001" -ForegroundColor White
Write-Host "  Backend API: http://localhost:4002" -ForegroundColor White
Write-Host "  Testing API: http://localhost:4003" -ForegroundColor White
