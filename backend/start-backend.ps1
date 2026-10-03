# Start Backend Server from backend directory
Write-Host "Starting NL2SQL Backend (FastAPI + MongoDB)..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot"
& ".\venv\Scripts\python.exe" run.py
