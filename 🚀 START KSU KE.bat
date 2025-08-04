@echo off
title KSU KE - Laporan Aktivitas Harian
color 0A

echo.
echo ===============================================
echo        KSU KE - Laporan Aktivitas Harian
echo ===============================================
echo.
echo Starting application...
echo.

cd /d "d:\PROJECT\laporan_aktivitas_KSUKE"

:: Stop any existing servers
taskkill /f /im node.exe >nul 2>&1

:: Install if needed
if not exist "node_modules" (
    echo Installing dependencies... Please wait...
    npm install >nul 2>&1
)

:: Start server
echo Application starting at http://localhost:3002
echo.
start npm run dev

:: Wait and open browser
timeout /t 5 /nobreak >nul
start http://localhost:3002

echo.
echo ✅ Application is running!
echo 🌐 URL: http://localhost:3002
echo.
echo Keep this window open while using the application.
echo Close this window to stop the server.
echo.

pause>nul
