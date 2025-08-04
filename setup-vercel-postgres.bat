@echo off
echo 🐘 VERCEL POSTGRES SETUP - AUTOMATED SCRIPT
echo ===========================================
echo.

echo ✅ KONFIGURASI SUDAH SELESAI:
echo - Prisma schema updated ke PostgreSQL
echo - Environment variables siap
echo - PostgreSQL adapter ter-install
echo - Next.js config optimized untuk Vercel Postgres
echo.

echo 🚀 LANGKAH SELANJUTNYA DI VERCEL DASHBOARD:
echo ==========================================
echo.

echo 1. Login ke https://vercel.com/dashboard
echo 2. Pilih project Anda
echo 3. Klik tab "Storage"
echo 4. Klik "Create Database"
echo 5. Pilih "Postgres"
echo 6. Database name: ksuke-postgres
echo 7. Region: Singapore ^(sin1^)
echo 8. Klik "Create"
echo.

echo 📝 VERCEL AKAN AUTO-SET ENVIRONMENT VARIABLES:
echo ===============================================
echo - DATABASE_URL
echo - DIRECT_URL  
echo - POSTGRES_URL
echo - POSTGRES_PRISMA_URL
echo - POSTGRES_URL_NON_POOLING
echo.

echo 🔧 TAMBAHAN ENVIRONMENT VARIABLES YANG PERLU DI-SET:
echo ===================================================
echo.

for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%i
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set NEXTAUTH_SECRET=%%i

echo Copy dan paste ke Vercel Dashboard -^> Settings -^> Environment Variables:
echo.
echo ==========================================
echo JWT_SECRET
echo Value: %JWT_SECRET%
echo Environment: Production, Preview, Development
echo ==========================================
echo.
echo ==========================================
echo NEXTAUTH_SECRET
echo Value: %NEXTAUTH_SECRET%
echo Environment: Production, Preview, Development
echo ==========================================
echo.
echo ==========================================
echo NEXTAUTH_URL
echo Value: https://your-app-name.vercel.app
echo Environment: Production, Preview, Development
echo ==========================================
echo.
echo ==========================================
echo NODE_ENV
echo Value: production
echo Environment: Production
echo ==========================================
echo.

echo ⚡ SETELAH SETUP DATABASE DI VERCEL:
echo ==================================
echo.
echo 1. Copy DATABASE_URL dari Vercel Postgres dashboard
echo 2. Set di environment lokal untuk testing:
echo    $env:DATABASE_URL="postgresql://username:password..."
echo.
echo 3. Deploy schema ke Vercel Postgres:
echo    npx prisma db push
echo.
echo 4. Generate Prisma client:
echo    npx prisma generate
echo.
echo 5. Test build:
echo    npm run build
echo.
echo 6. Commit dan deploy:
echo    git add .
echo    git commit -m "Setup Vercel Postgres database"
echo    git push origin main
echo.

echo 🎯 KEUNGGULAN VERCEL POSTGRES:
echo ==============================
echo ✅ Gratis 60,000 rows ^(cukup untuk KSUKE^)
echo ✅ Terintegrasi langsung dengan Vercel
echo ✅ Auto-scaling dan backup otomatis
echo ✅ No setup complexity
echo ✅ Fast connection dari Vercel functions
echo ✅ SSL secure connection
echo.

echo 📊 LIMITS ^(FREE TIER^):
echo =======================
echo - Rows: 60,000
echo - Storage: 256 MB
echo - Concurrent connections: 20
echo - Global regions ^(termasuk Singapore^)
echo.

echo 🔍 CARA CEK DATABASE SETELAH DEPLOY:
echo ===================================
echo 1. Vercel Dashboard -^> Storage -^> Your Postgres Database
echo 2. Browse Data untuk lihat tables dan data
echo 3. Query tab untuk run SQL commands
echo 4. npx prisma studio ^(local development^)
echo.

echo ✅ HASIL AKHIR:
echo ==============
echo ✅ Database online dan persistent
echo ✅ Data tersimpan di cloud
echo ✅ Export Excel berfungsi
echo ✅ Auto-backup oleh Vercel
echo ✅ Zero maintenance
echo.

echo 📞 TROUBLESHOOTING:
echo ==================
echo - Error connection: Cek DATABASE_URL format
echo - Schema sync failed: npx prisma db push --force-reset
echo - Pool timeout: Use POSTGRES_PRISMA_URL
echo.

echo 🚀 Ready untuk production dengan Vercel Postgres!
echo.
pause
