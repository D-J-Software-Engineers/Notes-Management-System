@echo off
REM Windows Service Installation Script
REM Run this as Administrator to install the Notes Management Server as a Windows Service

echo.
echo ============================================
echo Notes Management System - Service Installer
echo ============================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Right-click on this file and select "Run as Administrator"
    pause
    exit /b 1
)

echo Installing service... This may take a moment.
call node windows-service\service-manager.js install

if %errorLevel% equ 0 (
    echo.
    echo ============================================
    echo [SUCCESS] Service installed and started!
    echo ============================================
    echo.
    echo The server is now running as a Windows Service
    echo and will automatically start on system reboot.
    echo.
    echo Service Name: NotesManagementServer
    echo Status: Running on port 5000
    echo.
    echo To manage the service:
    echo  - Start:   node windows-service/service-manager.js start
    echo  - Stop:    node windows-service/service-manager.js stop
    echo  - Uninstall: node windows-service/service-manager.js uninstall
    echo.
) else (
    echo.
    echo [ERROR] Failed to install service!
    echo.
)

pause
