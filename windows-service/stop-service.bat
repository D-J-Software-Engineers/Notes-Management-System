@echo off
REM Stop the Windows Service

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script must be run as Administrator!
    pause
    exit /b 1
)

echo Stopping NotesManagementServer service...
call node windows-service\service-manager.js stop

if %errorLevel% equ 0 (
    echo Service stopped successfully
) else (
    echo Failed to stop service
)

pause
