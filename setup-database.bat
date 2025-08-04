@echo off
title KSU KE - Database Setup
color 0B

echo.
echo ===============================================
echo    KSU KE - Database Setup & Reset
echo ===============================================
echo.

cd /d "d:\PROJECT\laporan_aktivitas_KSUKE"

echo Generating Prisma client...
npx prisma generate

echo.
echo Pushing database schema...
npx prisma db push

echo.
echo Database setup completed!
echo.
echo Optional: Run seed data (y/n)?
set /p choice="Enter your choice: "

if /i "%choice%"=="y" (
    echo.
    echo Running database seed...
    npx prisma db seed
    echo.
    echo Seed data completed!
)

echo.
echo Database is ready for use!
echo.

pause
