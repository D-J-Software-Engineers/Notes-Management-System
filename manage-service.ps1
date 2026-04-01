#!/usr/bin/env powershell

<#
.SYNOPSIS
    PowerShell Service Manager for Notes Management System Server
    
.DESCRIPTION
    Provides easy management of the Windows Service for the Node.js server
    
.EXAMPLE
    .\manage-service.ps1 install
    .\manage-service.ps1 start
    .\manage-service.ps1 stop
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('Install', 'Start', 'Stop', 'Restart', 'Status', 'Uninstall', 'Configure')]
    [string]$Action
)

function Test-AdminPrivilege {
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object System.Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Show-Header {
    Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Notes Management System - Service Manager        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Show-Usage {
    Write-Host "Usage: .\manage-service.ps1 [Action]" -ForegroundColor Yellow
    Write-Host "`nAvailable Actions:" -ForegroundColor Yellow
    Write-Host "  install     - Install the service (requires admin)" -ForegroundColor White
    Write-Host "  start       - Start the service (requires admin)" -ForegroundColor White
    Write-Host "  stop        - Stop the service (requires admin)" -ForegroundColor White
    Write-Host "  restart     - Restart the service (requires admin)" -ForegroundColor White
    Write-Host "  status      - Display service status" -ForegroundColor White
    Write-Host "  uninstall   - Remove the service (requires admin)" -ForegroundColor White
    Write-Host "  configure   - Set server IP for Android app" -ForegroundColor White
    Write-Host "`nExamples:" -ForegroundColor Yellow
    Write-Host "  .\manage-service.ps1 install`n" -ForegroundColor Gray
}

function Check-AdminRequired {
    if (-not (Test-AdminPrivilege)) {
        Write-Host "❌ Error: This action requires Administrator privileges!" -ForegroundColor Red
        Write-Host "`nPlease run PowerShell as Administrator and try again.`n" -ForegroundColor Yellow
        exit 1
    }
}

function Install-Service {
    Check-AdminRequired
    Write-Host "Installing Windows Service..." -ForegroundColor Cyan
    
    try {
        node windows-service/service-manager.js install
        Write-Host "✅ Service installed successfully!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install service: $_`n" -ForegroundColor Red
        exit 1
    }
}

function Start-ServerService {
    Check-AdminRequired
    Write-Host "Starting service..." -ForegroundColor Cyan
    
    try {
        node windows-service/service-manager.js start
        Write-Host "✅ Service started successfully!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start service: $_`n" -ForegroundColor Red
        exit 1
    }
}

function Stop-ServerService {
    Check-AdminRequired
    Write-Host "Stopping service..." -ForegroundColor Cyan
    
    try {
        node windows-service/service-manager.js stop
        Write-Host "✅ Service stopped successfully!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to stop service: $_`n" -ForegroundColor Red
        exit 1
    }
}

function Restart-ServerService {
    Check-AdminRequired
    Stop-ServerService
    Start-Time -Seconds 2
    Start-ServerService
}

function Show-ServiceStatus {
    Write-Host "Checking service status..." -ForegroundColor Cyan
    
    try {
        node windows-service/service-manager.js status
    } catch {
        Write-Host "❌ Failed to check status: $_`n" -ForegroundColor Red
        exit 1
    }
}

function Uninstall-Service {
    Check-AdminRequired
    Write-Host "Preparing to uninstall service..." -ForegroundColor Yellow
    $confirm = Read-Host "`nAre you sure? (yes/no)"
    
    if ($confirm -ne 'yes') {
        Write-Host "Cancelled.`n" -ForegroundColor Gray
        return
    }
    
    try {
        node windows-service/service-manager.js uninstall
        Write-Host "✅ Service uninstalled successfully!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to uninstall service: $_`n" -ForegroundColor Red
        exit 1
    }
}

function Configure-AndroidApp {
    Write-Host "Configuring Android app for local server connection..." -ForegroundColor Cyan
    Write-Host "`nEnter your Windows server IP address (or press Enter to auto-detect):" -ForegroundColor Yellow
    $ip = Read-Host "Server IP"
    
    try {
        if ($ip) {
            node configure-android.js --ip=$ip
        } else {
            node configure-android.js
        }
        Write-Host "✅ Configuration complete!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Configuration failed: $_`n" -ForegroundColor Red
        exit 1
    }
}

# Main execution
Show-Header

switch ($Action.ToLower()) {
    'install' {
        Install-Service
        break
    }
    'start' {
        Start-ServerService
        break
    }
    'stop' {
        Stop-ServerService
        break
    }
    'restart' {
        Restart-ServerService
        break
    }
    'status' {
        Show-ServiceStatus
        break
    }
    'uninstall' {
        Uninstall-Service
        break
    }
    'configure' {
        Configure-AndroidApp
        break
    }
    default {
        Show-Usage
        exit 1
    }
}
