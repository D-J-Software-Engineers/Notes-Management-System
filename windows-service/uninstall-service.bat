@echo off
REM Uninstall the Windows Service

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script must be run as Administrator!
    pause
    exit /b 1
)

echo.
echo WARNING: This will uninstall the NotesManagementServer service
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" (
    echo Uninstall cancelled
    pause
    exit /b 0
)

echo Uninstalling service...
call node windows-service\service-manager.js uninstall

if %errorLevel% equ 0 (
    echo Service uninstalled successfully
) else (
    echo Failed to uninstall service
)

pause
