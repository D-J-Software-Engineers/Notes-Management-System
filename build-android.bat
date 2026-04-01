@echo off
REM Quick Build Script for Android APK
REM This builds the Android app and generates a ready-to-install APK

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Notes Management System - Android APK Builder         ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check Node.js installation
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Capacitor is installed
where npx >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] npm/npx not found
    pause
    exit /b 1
)

echo.
echo [1/5] Configuring Android settings...
call node configure-android.js
if %errorLevel% neq 0 (
    echo Configuration failed!
    pause
    exit /b 1
)

echo [2/5] Installing Node dependencies...
call npm install --silent

echo [3/5] Building web application...
cd client
call npm install --silent
call npm run build
if %errorLevel% neq 0 (
    echo Web app build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo [4/5] Syncing Capacitor...
call npx cap sync android --no-prompt

echo [5/5] Building Android APK...
call npx cap build android

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║           Build Complete!                              ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo APK Locations:
echo - Debug: android\app\build\outputs\apk\debug\app-debug.apk
echo - Release: android\app\build\outputs\apk\release\app-release.apk
echo.
echo To install on connected device:
echo   adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo For more information, see BUILD_ANDROID_APK.md
echo.

pause
