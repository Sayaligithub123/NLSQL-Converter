# Start Backend Server
Write-Host "Starting NL2SQL Backend (FastAPI + MongoDB)..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
& ".\venv\Scripts\python.exe" run.py
