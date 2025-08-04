🚨 SOLUSI INTERNAL SERVER ERROR VERCEL
===========================================

## ❌ PENYEBAB INTERNAL SERVER ERROR:

1. **Environment Variables tidak di-set di Vercel Dashboard**
2. **Database SQLite tidak compatible dengan Vercel**
3. **Missing production secrets**
4. **Vercel configuration issues**

## ✅ SOLUSI STEP-BY-STEP:

### 🔧 STEP 1: SET ENVIRONMENT VARIABLES DI VERCEL DASHBOARD

#### Cara Setting:
1. **Login ke https://vercel.com/dashboard**
2. **Pilih project Anda**
3. **Klik tab "Settings"**
4. **Klik "Environment Variables" di sidebar kiri**
5. **Add variable satu per satu:**

#### ⚠️ CRITICAL VARIABLES (WAJIB):

**Variable 1: DATABASE_URL**
```
Name: DATABASE_URL
Value: [PILIH SALAH SATU DIBAWAH]
Environment: Production, Preview, Development
```

**🌟 OPSI A: PlanetScale (MySQL) - RECOMMENDED**
```
mysql://username:password@host.mysql.psdb.cloud/ksuke-reports?ssl={"rejectUnauthorized":true}&sslaccept=strict&connect_timeout=300&pool_timeout=300&timeout=300
```

**🐘 OPSI B: Neon (PostgreSQL)**
```
postgresql://username:password@host.neon.tech/database?sslmode=require
```

**⚡ OPSI C: Supabase (PostgreSQL)**
```
postgresql://postgres:password@db.host.supabase.co:5432/postgres
```

**❌ JANGAN GUNAKAN SQLite:**
```
file:./dev.db  ← INI TIDAK AKAN WORK DI VERCEL!
```

---

**Variable 2: JWT_SECRET**
```
Name: JWT_SECRET  
Value: b2e377237fc3ef383659e64443c671122ed1e1e229f98fa0fa6a355828ac8b78
Environment: Production, Preview, Development
```

**Variable 3: NEXTAUTH_SECRET**
```
Name: NEXTAUTH_SECRET
Value: 854c6760ec0cf13e5f4cedd461c1ccc974b7898a30d7ac949244ddcfbf5bd2a2  
Environment: Production, Preview, Development
```

**Variable 4: NEXTAUTH_URL**
```
Name: NEXTAUTH_URL
Value: https://your-actual-vercel-app-name.vercel.app
Environment: Production, Preview, Development
```

**Variable 5: NODE_ENV**
```
Name: NODE_ENV
Value: production
Environment: Production
```

### 🔧 STEP 2: SETUP DATABASE CLOUD (JIKA BELUM)

#### Untuk PlanetScale (MySQL):
1. Daftar di https://planetscale.com (gratis)
2. Create database: `ksuke-reports`
3. Region: `ap-southeast-1` (Singapore)
4. Klik "Connect" → "Prisma" → Copy connection string
5. Paste ke DATABASE_URL di Vercel

#### Untuk Neon (PostgreSQL):
1. Daftar di https://neon.tech (gratis)
2. Create project: `ksuke-reports`
3. Copy connection string
4. Paste ke DATABASE_URL di Vercel

### 🔧 STEP 3: UPDATE PRISMA SCHEMA

#### Jika pakai PlanetScale (MySQL):
```bash
# Update prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

#### Jika pakai Neon/Supabase (PostgreSQL):
```bash
# Update prisma/schema.prisma  
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 🔧 STEP 4: DEPLOY DATABASE SCHEMA

```bash
# Set DATABASE_URL lokal untuk deploy schema
export DATABASE_URL="your-cloud-database-connection-string"

# Deploy schema ke cloud database
npx prisma db push

# Generate client
npx prisma generate
```

### 🔧 STEP 5: UPDATE DAN RE-DEPLOY

```bash
# Commit changes
git add .
git commit -m "Fix Vercel deployment with cloud database"
git push origin main

# Vercel akan auto-deploy
```

## 📋 CHECKLIST ENVIRONMENT VARIABLES:

- [ ] DATABASE_URL (cloud database, BUKAN SQLite)
- [ ] JWT_SECRET (32+ karakter)
- [ ] NEXTAUTH_SECRET (32+ karakter)  
- [ ] NEXTAUTH_URL (https://your-app.vercel.app)
- [ ] NODE_ENV (production)

## 🔍 TROUBLESHOOTING INTERNAL SERVER ERROR:

### Error Type 1: "Database Connection Failed"
**Penyebab:** DATABASE_URL salah atau database belum running
**Solusi:**
```bash
# Test koneksi database
npx prisma db push
# Jika error, cek DATABASE_URL format
```

### Error Type 2: "Missing Environment Variables"
**Penyebab:** Environment variables tidak di-set di Vercel
**Solusi:**
1. Cek Vercel Dashboard → Settings → Environment Variables
2. Pastikan semua 5 variables di-set
3. Re-deploy setelah set variables

### Error Type 3: "Prisma Client Error"
**Penyebab:** Prisma client tidak compatible dengan cloud database
**Solusi:**
```bash
# Update prisma schema provider
# Re-generate client
npx prisma generate
```

### Error Type 4: "Build Failed"
**Penyebab:** TypeScript errors atau missing dependencies
**Solusi:**
```bash
# Test build locally
npm run build
# Fix any errors sebelum deploy
```

## 🚨 CRITICAL NOTES:

1. **JANGAN gunakan SQLite untuk production Vercel**
2. **Set semua environment variables SEBELUM deploy**
3. **Test database connection sebelum deploy**
4. **Use cloud database (PlanetScale/Neon/Supabase)**

## ⚡ QUICK FIX COMMANDS:

```bash
# 1. Generate new secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'));"

# 2. Test build
npm run build

# 3. Deploy schema (with cloud DATABASE_URL)
npx prisma db push

# 4. Re-deploy
git add . && git commit -m "Fix Vercel deployment" && git push
```

## 📱 SETELAH FIX:

✅ Internal Server Error hilang
✅ Data bisa disimpan  
✅ Export Excel berfungsi
✅ Authentication working
✅ ADMIN dashboard accessible

## 🆘 JIKA MASIH ERROR:

1. **Cek Vercel Function Logs:**
   - Vercel Dashboard → Project → Functions tab
   - Lihat error logs untuk detail

2. **Cek Build Logs:**
   - Vercel Dashboard → Deployments
   - Klik deployment → View Build Logs

3. **Test Lokal:**
   ```bash
   npm run build
   npm start
   ```

Need help with specific error? Share the exact error message!
