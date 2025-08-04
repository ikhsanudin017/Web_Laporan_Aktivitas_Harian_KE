@echo off
title KSU KE - Full Installation
color 0D

echo.
echo ================================================
echo    KSU KE - Complete Installation & Setup
echo ================================================
echo.
echo This will install all dependencies and setup the database.
echo.
echo Continue? (y/n)
set /p confirm="Enter your choice: "

if /i not "%confirm%"=="y" (
    echo Installation cancelled.
    pause
    exit /b
)

cd /d "d:\PROJECT\laporan_aktivitas_KSUKE"

echo.
echo Step 1/4: Installing Node.js dependencies...
echo ================================================
npm install

if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2/4: Generating Prisma client...
echo ================================================
npx prisma generate

echo.
echo Step 3/4: Setting up database...
echo ================================================
npx prisma db push

echo.
echo Step 4/4: Installing additional tools...
echo ================================================
npm audit fix --silent

echo.
echo ================================================
echo    Installation Complete!
echo ================================================
echo.
echo Your KSU KE application is ready to use!
echo.
echo To start the application:
echo   - Development: Double-click start-server.bat
echo   - Production:  Double-click start-production.bat
echo.
echo Application will be available at: http://localhost:3002
echo.

pause
