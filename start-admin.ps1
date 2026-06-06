Set-Location -Path "$PSScriptRoot\apps\admin-app"
Write-Host "Starting Admin App..." -ForegroundColor Red
npx expo start --offline
