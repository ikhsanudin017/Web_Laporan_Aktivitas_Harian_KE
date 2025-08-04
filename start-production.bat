@echo off
title KSU KE - Quick Start
color 0E

echo.
echo ===============================================
echo    KSU KE - Quick Start (Production Mode)
echo ===============================================
echo.

cd /d "d:\PROJECT\laporan_aktivitas_KSUKE"

:: Build and start production server
echo Building application for production...
echo.
npm run build

if %errorlevel% equ 0 (
    echo.
    echo Build successful! Starting production server...
    echo.
    echo Server will be available at: http://localhost:3002
    echo.
    npm start
) else (
    echo.
    echo Build failed! Please check the errors above.
    echo.
    pause
)

pause
