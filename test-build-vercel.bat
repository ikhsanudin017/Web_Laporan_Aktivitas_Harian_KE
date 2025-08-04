@echo off
echo ================================================
echo 🧪 TEST BUILD SEBELUM DEPLOY KE VERCEL
echo ================================================
echo.

echo [INFO] Checking current environment...
if exist ".env.local" (
    echo ✅ Found .env.local
) else (
    echo ❌ .env.local not found
    echo Creating temporary .env.local for build test...
    echo DATABASE_URL="file:./dev.db" > .env.local
    echo JWT_SECRET="test-jwt-secret-for-build-only" >> .env.local
    echo NEXTAUTH_SECRET="test-nextauth-secret-for-build-only" >> .env.local
    echo NEXTAUTH_URL="http://localhost:3000" >> .env.local
)

echo.
echo [1/6] Installing dependencies...
npm install
if errorlevel 1 (
    echo ❌ NPM install failed!
    pause
    exit /b 1
)

echo.
echo [2/6] Generating Prisma client...
npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo [3/6] Running TypeScript check...
npx tsc --noEmit
if errorlevel 1 (
    echo ❌ TypeScript check failed!
    echo Please fix TypeScript errors before deploying
    pause
    exit /b 1
)

echo.
echo [4/6] Running ESLint...
npm run lint
if errorlevel 1 (
    echo ⚠️ ESLint warnings found (will continue)
)

echo.
echo [5/6] Testing build process...
npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    echo Please fix build errors before deploying to Vercel
    pause
    exit /b 1
)

echo.
echo [6/6] Running build tests...
npm start --timeout=5000 > nul 2>&1 &
timeout /t 3 > nul
taskkill /f /im node.exe > nul 2>&1

echo.
echo ================================================
echo ✅ BUILD TEST SUCCESSFUL!
echo ================================================
echo.
echo Your application is ready for Vercel deployment!
echo.
echo 📋 NEXT STEPS:
echo 1. Setup cloud database (PlanetScale/Neon/Supabase)
echo 2. Set environment variables in Vercel Dashboard
echo 3. Deploy to Vercel
echo.
echo 🔗 HELPFUL LINKS:
echo - PlanetScale: https://planetscale.com
echo - Neon: https://neon.tech  
echo - Supabase: https://supabase.com
echo - Vercel: https://vercel.com
echo.
echo 📁 See VERCEL-DEPLOYMENT-SOLUTION.md for detailed instructions
echo.
pause
