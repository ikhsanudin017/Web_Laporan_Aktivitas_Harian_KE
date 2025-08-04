@echo off
title KSU KE - Open Browser
color 0C

echo.
echo ===============================================
echo    KSU KE - Opening Application in Browser
echo ===============================================
echo.

:: Wait a moment for server to start
timeout /t 3 /nobreak >nul

:: Try to open in different browsers
echo Opening application in your default browser...
echo URL: http://localhost:3002
echo.

start http://localhost:3002

:: Alternative browsers
echo.
echo If the browser doesn't open automatically, try:
echo   Chrome:  start chrome http://localhost:3002
echo   Edge:    start msedge http://localhost:3002
echo   Firefox: start firefox http://localhost:3002
echo.

pause
