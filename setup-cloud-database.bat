@echo off
echo 🚀 SETUP DATABASE CLOUD UNTUK VERCEL DEPLOYMENT
echo ================================================
echo.

echo Pilih database cloud provider:
echo 1) PlanetScale (MySQL) - Recommended
echo 2) Neon (PostgreSQL)
echo 3) Supabase (PostgreSQL)
echo.

set /p choice="Pilih opsi (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🌟 SETUP PLANETSCALE ^(MySQL^)
    echo =============================
    echo.
    echo 1. Buka https://planetscale.com dan daftar ^(gratis^)
    echo 2. Create database dengan nama: ksuke-reports
    echo 3. Pilih region: ap-southeast-1 ^(Singapore^)
    echo 4. Klik 'Connect' -^> 'Prisma' untuk get connection string
    echo.
    echo Connection string format:
    echo mysql://username:password@host/ksuke-reports?sslaccept=strict
    echo.
    
    echo Updating Prisma schema untuk MySQL...
    echo // This is your Prisma schema file. > prisma\schema.prisma
    echo // learn more about it in the docs: https://pris.ly/d/prisma-schema >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo generator client { >> prisma\schema.prisma
    echo   provider = "prisma-client-js" >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo datasource db { >> prisma\schema.prisma
    echo   provider = "mysql" >> prisma\schema.prisma
    echo   url      = env^("DATABASE_URL"^) >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo model User { >> prisma\schema.prisma
    echo   id       String   @id @default^(cuid^(^)^) >> prisma\schema.prisma
    echo   email    String   @unique >> prisma\schema.prisma
    echo   name     String >> prisma\schema.prisma
    echo   role     String >> prisma\schema.prisma
    echo   password String >> prisma\schema.prisma
    echo   reports  Report[] >> prisma\schema.prisma
    echo   createdAt DateTime @default^(now^(^)^) >> prisma\schema.prisma
    echo   updatedAt DateTime @updatedAt >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo model Report { >> prisma\schema.prisma
    echo   id         String   @id @default^(cuid^(^)^) >> prisma\schema.prisma
    echo   userId     String >> prisma\schema.prisma
    echo   date       DateTime >> prisma\schema.prisma
    echo   reportData Json >> prisma\schema.prisma
    echo   createdAt  DateTime @default^(now^(^)^) >> prisma\schema.prisma
    echo   updatedAt  DateTime @updatedAt >> prisma\schema.prisma
    echo   user       User     @relation^(fields: [userId], references: [id], onDelete: Cascade^) >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo   @@index^([userId]^) >> prisma\schema.prisma
    echo   @@index^([date]^) >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    
    echo ✅ Prisma schema updated untuk MySQL ^(PlanetScale^)
    
) else if "%choice%"=="2" (
    echo.
    echo 🐘 SETUP NEON ^(PostgreSQL^)
    echo ==========================
    echo.
    echo 1. Buka https://neon.tech dan daftar ^(gratis^)
    echo 2. Create project dengan nama: ksuke-reports
    echo 3. Copy connection string dari dashboard
    echo.
    echo Connection string format:
    echo postgresql://username:password@host/database?sslmode=require
    echo.
    
    echo Updating Prisma schema untuk PostgreSQL...
    echo // This is your Prisma schema file. > prisma\schema.prisma
    echo // learn more about it in the docs: https://pris.ly/d/prisma-schema >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo generator client { >> prisma\schema.prisma
    echo   provider = "prisma-client-js" >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo datasource db { >> prisma\schema.prisma
    echo   provider = "postgresql" >> prisma\schema.prisma
    echo   url      = env^("DATABASE_URL"^) >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo model User { >> prisma\schema.prisma
    echo   id       String   @id @default^(cuid^(^)^) >> prisma\schema.prisma
    echo   email    String   @unique >> prisma\schema.prisma
    echo   name     String >> prisma\schema.prisma
    echo   role     String >> prisma\schema.prisma
    echo   password String >> prisma\schema.prisma
    echo   reports  Report[] >> prisma\schema.prisma
    echo   createdAt DateTime @default^(now^(^)^) >> prisma\schema.prisma
    echo   updatedAt DateTime @updatedAt >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo model Report { >> prisma\schema.prisma
    echo   id         String   @id @default^(cuid^(^)^) >> prisma\schema.prisma
    echo   userId     String >> prisma\schema.prisma
    echo   date       DateTime >> prisma\schema.prisma
    echo   reportData Json >> prisma\schema.prisma
    echo   createdAt  DateTime @default^(now^(^)^) >> prisma\schema.prisma
    echo   updatedAt  DateTime @updatedAt >> prisma\schema.prisma
    echo   user       User     @relation^(fields: [userId], references: [id], onDelete: Cascade^) >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo   @@index^([userId]^) >> prisma\schema.prisma
    echo   @@index^([date]^) >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    
    echo ✅ Prisma schema updated untuk PostgreSQL ^(Neon^)
    
) else if "%choice%"=="3" (
    echo.
    echo ⚡ SETUP SUPABASE ^(PostgreSQL^)
    echo =============================
    echo.
    echo 1. Buka https://supabase.com dan daftar ^(gratis^)
    echo 2. Create new project: ksuke-reports
    echo 3. Di Settings -^> Database, copy connection string
    echo.
    echo Connection string format:
    echo postgresql://postgres:password@host:5432/postgres
    echo.
    
    echo Updating Prisma schema untuk PostgreSQL...
    echo // This is your Prisma schema file. > prisma\schema.prisma
    echo // learn more about it in the docs: https://pris.ly/d/prisma-schema >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo generator client { >> prisma\schema.prisma
    echo   provider = "prisma-client-js" >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo datasource db { >> prisma\schema.prisma
    echo   provider = "postgresql" >> prisma\schema.prisma
    echo   url      = env^("DATABASE_URL"^) >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo model User { >> prisma\schema.prisma
    echo   id       String   @id @default^(cuid^(^)^) >> prisma\schema.prisma
    echo   email    String   @unique >> prisma\schema.prisma
    echo   name     String >> prisma\schema.prisma
    echo   role     String >> prisma\schema.prisma
    echo   password String >> prisma\schema.prisma
    echo   reports  Report[] >> prisma\schema.prisma
    echo   createdAt DateTime @default^(now^(^)^) >> prisma\schema.prisma
    echo   updatedAt DateTime @updatedAt >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo model Report { >> prisma\schema.prisma
    echo   id         String   @id @default^(cuid^(^)^) >> prisma\schema.prisma
    echo   userId     String >> prisma\schema.prisma
    echo   date       DateTime >> prisma\schema.prisma
    echo   reportData Json >> prisma\schema.prisma
    echo   createdAt  DateTime @default^(now^(^)^) >> prisma\schema.prisma
    echo   updatedAt  DateTime @updatedAt >> prisma\schema.prisma
    echo   user       User     @relation^(fields: [userId], references: [id], onDelete: Cascade^) >> prisma\schema.prisma
    echo. >> prisma\schema.prisma
    echo   @@index^([userId]^) >> prisma\schema.prisma
    echo   @@index^([date]^) >> prisma\schema.prisma
    echo } >> prisma\schema.prisma
    
    echo ✅ Prisma schema updated untuk PostgreSQL ^(Supabase^)
    
) else (
    echo Pilihan tidak valid!
    pause
    exit /b 1
)

echo.
echo 🔐 GENERATE SECURE SECRETS:
echo ==========================
echo.

for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%i
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set NEXTAUTH_SECRET=%%i

echo JWT_SECRET="%JWT_SECRET%"
echo NEXTAUTH_SECRET="%NEXTAUTH_SECRET%"

echo.
echo 📝 ENVIRONMENT VARIABLES UNTUK VERCEL:
echo =====================================
echo.
echo Copy dan paste ke Vercel Dashboard -^> Settings -^> Environment Variables:
echo.
echo DATABASE_URL="[paste your cloud database connection string here]"
echo JWT_SECRET="%JWT_SECRET%"
echo NEXTAUTH_SECRET="%NEXTAUTH_SECRET%"
echo NEXTAUTH_URL="https://your-app-name.vercel.app"
echo NODE_ENV="production"
echo.

echo 📋 LANGKAH SELANJUTNYA:
echo ======================
echo.
echo 1. Set DATABASE_URL dengan connection string dari cloud database
echo 2. Set semua environment variables di Vercel Dashboard
echo 3. Run: npm run build ^(test build locally^)
echo 4. Run: npx prisma db push ^(deploy schema ke cloud database^)
echo 5. Re-deploy di Vercel
echo.
echo ✅ Setelah itu, aplikasi akan bisa menyimpan data dan export Excel!
echo.

pause
