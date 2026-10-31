$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$mysqlData = "C:\ProgramData\MySQL\MySQL Server 8.0\Data"
$initFile = "S:\NL_SQL\NLSQL-Converter\reset_mysql.sql"

Write-Host "=== MySQL Password Reset Script ===" -ForegroundColor Cyan
Write-Host "This script will reset MySQL root password to: Admin@1234" -ForegroundColor Yellow
Write-Host "And set readonly_user password to: Readonly@1234" -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop MySQL
Write-Host "Step 1: Stopping MySQL service..." -ForegroundColor Green
net stop MySQL80 2>&1
Start-Sleep -Seconds 3

# Step 2: Start MySQL with init file (no password required)
Write-Host "Step 2: Starting MySQL with init file to reset passwords..." -ForegroundColor Green
$mysqldPath = Join-Path $mysqlBin "mysqld.exe"
$proc = Start-Process -FilePath $mysqldPath -ArgumentList "--init-file=`"$initFile`" --console" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 10

# Step 3: Stop the init instance
Write-Host "Step 3: Stopping init instance..." -ForegroundColor Green
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Step 4: Start MySQL normally
Write-Host "Step 4: Starting MySQL normally..." -ForegroundColor Green
net start MySQL80 2>&1
Start-Sleep -Seconds 5

# Step 5: Test new password
Write-Host "Step 5: Testing new root password..." -ForegroundColor Green
$result = & "$mysqlBin\mysql.exe" -u root -pAdmin@1234 -e "SELECT 'ROOT OK' AS status;" 2>&1
Write-Host $result

$result2 = & "$mysqlBin\mysql.exe" -u readonly_user -pReadonly@1234 -e "SHOW DATABASES;" 2>&1
Write-Host "readonly_user test:" $result2

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "Root password: Admin@1234" -ForegroundColor Yellow
Write-Host "readonly_user password: Readonly@1234" -ForegroundColor Yellow
