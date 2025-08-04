# 🚀 ENVIRONMENT VARIABLES UNTUK VERCEL DASHBOARD

## Copy dan paste ke Vercel Dashboard → Settings → Environment Variables:

# ===================================
# REQUIRED ENVIRONMENT VARIABLES  
# ===================================

# Database Connection (PILIH SALAH SATU):
# Option 1: PlanetScale (MySQL) - RECOMMENDED
DATABASE_URL="mysql://username:password@host/ksuke-reports?sslaccept=strict&connect_timeout=300&pool_timeout=300&timeout=300"

# Option 2: Neon (PostgreSQL)  
# DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Option 3: Supabase (PostgreSQL)
# DATABASE_URL="postgresql://postgres:password@host:5432/postgres"

# Security Secrets (GENERATED OTOMATIS)
JWT_SECRET="b2e377237fc3ef383659e64443c671122ed1e1e229f98fa0fa6a355828ac8b78"
NEXTAUTH_SECRET="854c6760ec0cf13e5f4cedd461c1ccc974b7898a30d7ac949244ddcfbf5bd2a2"

# Application URL (GANTI DENGAN URL VERCEL ANDA)
NEXTAUTH_URL="https://your-app-name.vercel.app"

# Environment
NODE_ENV="production"

# ===================================
# CARA SET DI VERCEL DASHBOARD:
# ===================================

1. Buka https://vercel.com/dashboard
2. Pilih project Anda  
3. Klik "Settings" tab
4. Klik "Environment Variables" di sidebar
5. Add variable satu per satu:

   Name: DATABASE_URL
   Value: [paste database connection string]
   Environment: Production, Preview, Development

   Name: JWT_SECRET  
   Value: b2e377237fc3ef383659e64443c671122ed1e1e229f98fa0fa6a355828ac8b78
   Environment: Production, Preview, Development

   Name: NEXTAUTH_SECRET
   Value: 854c6760ec0cf13e5f4cedd461c1ccc974b7898a30d7ac949244ddcfbf5bd2a2
   Environment: Production, Preview, Development

   Name: NEXTAUTH_URL
   Value: https://your-app-name.vercel.app
   Environment: Production, Preview, Development

   Name: NODE_ENV
   Value: production
   Environment: Production

6. Klik "Save" untuk setiap variable
7. Re-deploy aplikasi

# ===================================
# VERIFIKASI DEPLOYMENT:
# ===================================

Setelah set environment variables dan re-deploy:

✅ Test login di aplikasi
✅ Test create report 
✅ Test export Excel
✅ Cek database apakah data tersimpan

# ===================================
# TROUBLESHOOTING:
# ===================================

❌ Error: "Database connection failed"
→ Cek DATABASE_URL sudah benar
→ Pastikan database cloud sudah running
→ Test koneksi dengan: npx prisma db push

❌ Error: "Invalid JWT secret"  
→ Pastikan JWT_SECRET di-set di Vercel
→ Re-deploy setelah set environment variables

❌ Error: "Cannot save data"
→ Pastikan database schema sudah di-push
→ Run: npx prisma db push dengan DATABASE_URL cloud
→ Cek permission database cloud

❌ Error: "Export failed"
→ Pastikan semua dependencies ter-install
→ Cek apakah XLSX library compatible di Vercel
→ Test locally dengan: npm run build

# ===================================
# BACKUP & RESTORE DATA:
# ===================================

# Export data dari SQLite lokal
npx prisma db seed

# Import data ke cloud database
npx prisma db push

# Database migration
npx prisma migrate deploy
