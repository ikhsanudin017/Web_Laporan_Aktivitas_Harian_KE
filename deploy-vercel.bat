@echo off
echo ================================================
echo DEPLOY TO VERCEL - Laporan Aktivitas KSUKE
echo ================================================
echo.

echo [1/5] Checking Vercel CLI...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
) else (
    echo Vercel CLI found!
)

echo.
echo [2/5] Building application...
npm run build
if errorlevel 1 (
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo [3/5] Running linter...
npm run lint
if errorlevel 1 (
    echo Linting failed! Please fix the issues above.
    pause
    exit /b 1
)

echo.
echo [4/5] Deploying to Vercel...
vercel --prod

echo.
echo [5/5] Deployment complete!
echo.
echo Remember to set these environment variables in Vercel Dashboard:
echo - DATABASE_URL
echo - JWT_SECRET  
echo - NEXTAUTH_SECRET
echo - NEXTAUTH_URL
echo.
echo Check DEPLOYMENT.md for detailed instructions.
echo.
pause
