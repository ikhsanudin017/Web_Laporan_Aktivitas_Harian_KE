@echo off
title KSU KE - Server Control
color 0F

:menu
cls
echo.
echo ===============================================
echo    KSU KE - Server Control Panel
echo ===============================================
echo.
echo 1. Start Development Server
echo 2. Start Production Server  
echo 3. Stop All Node Processes
echo 4. Open Browser
echo 5. Setup Database
echo 6. View Server Logs
echo 7. Exit
echo.
echo ===============================================

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto dev_server
if "%choice%"=="2" goto prod_server
if "%choice%"=="3" goto stop_server
if "%choice%"=="4" goto open_browser
if "%choice%"=="5" goto setup_db
if "%choice%"=="6" goto view_logs
if "%choice%"=="7" goto exit
goto invalid

:dev_server
cls
echo Starting Development Server...
cd /d "d:\PROJECT\laporan_aktivitas_KSUKE"
call start-server.bat
goto menu

:prod_server
cls
echo Starting Production Server...
cd /d "d:\PROJECT\laporan_aktivitas_KSUKE"
call start-production.bat
goto menu

:stop_server
cls
echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo All Node.js processes stopped.
echo.
pause
goto menu

:open_browser
cls
call open-browser.bat
goto menu

:setup_db
cls
call setup-database.bat
goto menu

:view_logs
cls
echo Current running Node processes:
echo ===============================================
tasklist /fi "imagename eq node.exe" 2>nul
if %errorlevel% equ 0 (
    echo.
    echo Node.js processes are running.
) else (
    echo No Node.js processes found.
)
echo.
pause
goto menu

:invalid
cls
echo Invalid choice! Please enter 1-7.
timeout /t 2 /nobreak >nul
goto menu

:exit
echo.
echo Goodbye!
timeout /t 1 /nobreak >nul
exit
