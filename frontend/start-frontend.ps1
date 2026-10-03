# Start Frontend Server from frontend directory
Write-Host "Starting NL2SQL Frontend (Vite + React)..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot"
npm run dev
