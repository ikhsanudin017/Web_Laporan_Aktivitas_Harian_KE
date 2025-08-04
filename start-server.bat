@echo off
title KSU KE - Laporan Aktivitas Harian
color 0A

echo.
echo ===============================================
echo    KSU KE - Sistem Laporan Aktivitas Harian
echo ===============================================
echo.
echo Starting development server...
echo.

cd /d "d:\PROJECT\laporan_aktivitas_KSUKE"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Node modules not found. Installing dependencies...
    echo.
    npm install
    echo.
)

:: Start the development server
echo Starting Next.js development server...
echo.
echo Server will be available at: http://localhost:3002
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
