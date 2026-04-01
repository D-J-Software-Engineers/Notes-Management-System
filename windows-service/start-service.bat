@echo off
REM Start the Windows Service

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script must be run as Administrator!
    pause
    exit /b 1
)

echo Starting NotesManagementServer service...
call node windows-service\service-manager.js start

if %errorLevel% equ 0 (
    echo Service started successfully
) else (
    echo Failed to start service
)

pause
