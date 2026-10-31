# Run this as Administrator!
$myIni = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$initFile = "S:\NL_SQL\NLSQL-Converter\reset_mysql.sql"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MySQL Password Reset Tool v2" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: Please run as Administrator!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "[1/5] Stopping MySQL service..." -ForegroundColor Yellow
net stop MySQL80
Start-Sleep -Seconds 4

Write-Host "[2/5] Adding init-file to my.ini..." -ForegroundColor Yellow
$content = Get-Content $myIni -Raw
# Remove any existing init_file line and add new one under [mysqld]
$content = $content -replace "(?m)^\s*init[_-]file\s*=.*$", ""
$content = $content -replace "(\[mysqld\])", "`$1`nini_file=`"$initFile`""
# Use correct key name
$content = $content -replace "ini_file=", "init_file="
Set-Content $myIni $content -Encoding UTF8
Write-Host "init_file added to my.ini"

Write-Host "[3/5] Starting MySQL (will run init file)..." -ForegroundColor Yellow
net start MySQL80
Start-Sleep -Seconds 8

Write-Host "[4/5] Removing init-file from my.ini..." -ForegroundColor Yellow
$content = Get-Content $myIni -Raw
$content = $content -replace "(?m)^\s*init[_-]file\s*=.*\r?\n?", ""
Set-Content $myIni $content -Encoding UTF8
Write-Host "init_file removed from my.ini"

Write-Host "[5/5] Restarting MySQL cleanly..." -ForegroundColor Yellow
net stop MySQL80
Start-Sleep -Seconds 4
net start MySQL80
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Testing passwords..." -ForegroundColor Yellow
$t1 = & "$mysqlBin\mysql.exe" -u root "-pAdmin@1234" -e "SELECT 'ROOT_OK';" 2>&1
if (($t1 -join '') -match 'ROOT_OK') {
    Write-Host "root -> SUCCESS" -ForegroundColor Green
} else {
    Write-Host "root -> FAILED: $($t1 -join ' ')" -ForegroundColor Red
}

$t2 = & "$mysqlBin\mysql.exe" -u readonly_user "-pReadonly@1234" -e "SELECT 'READONLY_OK';" 2>&1
if (($t2 -join '') -match 'READONLY_OK') {
    Write-Host "readonly_user -> SUCCESS" -ForegroundColor Green
} else {
    Write-Host "readonly_user -> FAILED: $($t2 -join ' ')" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Root password     : Admin@1234" -ForegroundColor Yellow
Write-Host "  readonly_user pwd : Readonly@1234" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Read-Host "Press Enter to close"
