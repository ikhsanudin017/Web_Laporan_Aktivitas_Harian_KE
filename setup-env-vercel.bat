@echo off
echo ================================================
echo SETUP ENVIRONMENT FOR VERCEL DEPLOYMENT
echo ================================================
echo.

echo This script will help you generate secure secrets for production.
echo.

echo [1/3] Generating JWT Secret...
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
