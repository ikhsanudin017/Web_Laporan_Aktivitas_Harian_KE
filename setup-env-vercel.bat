@echo off
echo 🚨 FIX VERCEL INTERNAL SERVER ERROR
echo ===================================
echo.

echo Masalah utama: Environment variables belum di-set di Vercel Dashboard
echo.

echo 🔧 STEP 1: SETUP DATABASE CLOUD
echo ================================
echo.
echo Pilih database cloud provider:
echo 1) PlanetScale ^(MySQL^) - Recommended untuk production
echo 2) Neon ^(PostgreSQL^) - Good alternative  
echo 3) Supabase ^(PostgreSQL^) - Feature-rich option
echo.

set /p dbChoice="Pilih database ^(1-3^): "

if "%dbChoice%"=="1" (
    echo.
    echo 🌟 PLANETSCALE SETUP:
    echo 1. Buka https://planetscale.com
    echo 2. Daftar gratis
    echo 3. Create database: ksuke-reports
    echo 4. Region: ap-southeast-1 ^(Singapore^)
    echo 5. Klik Connect -^> Prisma -^> Copy connection string
    echo.
    echo Format: mysql://username:password@host.mysql.psdb.cloud/ksuke-reports?ssl={...}
    echo.
    set dbProvider=mysql
) else if "%dbChoice%"=="2" (
    echo.
    echo 🐘 NEON SETUP:
    echo 1. Buka https://neon.tech
    echo 2. Daftar gratis
    echo 3. Create project: ksuke-reports
    echo 4. Copy connection string dari dashboard
    echo.
    echo Format: postgresql://username:password@host.neon.tech/database?sslmode=require
    echo.
    set dbProvider=postgresql
) else if "%dbChoice%"=="3" (
    echo.
    echo ⚡ SUPABASE SETUP:
    echo 1. Buka https://supabase.com
    echo 2. Daftar gratis
    echo 3. Create project: ksuke-reports
    echo 4. Settings -^> Database -^> Copy connection string
    echo.
    echo Format: postgresql://postgres:password@db.host.supabase.co:5432/postgres
    echo.
    set dbProvider=postgresql
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo 🔐 STEP 2: GENERATE SECURE SECRETS
echo ==================================
echo You can use this JWT_SECRET in Vercel:
powershell -Command "[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))"
echo.

echo [2/3] Generating NextAuth Secret...
echo You can use this NEXTAUTH_SECRET in Vercel:
powershell -Command "[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))"
echo.

echo [3/3] Environment Variables to set in Vercel:
echo.
echo DATABASE_URL=file:./prod.db
echo JWT_SECRET=[use generated secret above]
echo NEXTAUTH_SECRET=[use generated secret above] 
echo NEXTAUTH_URL=https://your-app-name.vercel.app
echo NODE_ENV=production
echo.

echo Copy these values and paste them in Vercel Dashboard:
echo 1. Go to your project in Vercel
echo 2. Click Settings
echo 3. Click Environment Variables
echo 4. Add each variable
echo.

echo For production database, consider using:
echo - PostgreSQL (recommended)
echo - PlanetScale (MySQL)
echo - Supabase (PostgreSQL)
echo.

pause
