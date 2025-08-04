#!/bin/bash

echo "🚀 SETUP DATABASE CLOUD UNTUK VERCEL DEPLOYMENT"
echo "================================================"
echo ""

echo "Pilih database cloud provider:"
echo "1) PlanetScale (MySQL) - Recommended"
echo "2) Neon (PostgreSQL)"
echo "3) Supabase (PostgreSQL)"
echo ""

read -p "Pilih opsi (1-3): " choice

case $choice in
  1)
    echo ""
    echo "🌟 SETUP PLANETSCALE (MySQL)"
    echo "============================="
    echo ""
    echo "1. Buka https://planetscale.com dan daftar (gratis)"
    echo "2. Create database dengan nama: ksuke-reports"
    echo "3. Pilih region: ap-southeast-1 (Singapore)"
    echo "4. Klik 'Connect' → 'Prisma' untuk get connection string"
    echo ""
    echo "Connection string format:"
    echo "mysql://username:password@host/ksuke-reports?sslaccept=strict"
    echo ""
    
    # Update Prisma schema for MySQL
    cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file.
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id       String   @id @default(cuid())
  email    String   @unique
  name     String
  role     String
  password String
  reports  Report[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Report {
  id         String   @id @default(cuid())
  userId     String
  date       DateTime
  reportData Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([date])
}
EOF
    
    echo "✅ Prisma schema updated untuk MySQL (PlanetScale)"
    ;;
    
  2)
    echo ""
    echo "🐘 SETUP NEON (PostgreSQL)"
    echo "=========================="
    echo ""
    echo "1. Buka https://neon.tech dan daftar (gratis)"
    echo "2. Create project dengan nama: ksuke-reports"
    echo "3. Copy connection string dari dashboard"
    echo ""
    echo "Connection string format:"
    echo "postgresql://username:password@host/database?sslmode=require"
    echo ""
    
    # Update Prisma schema for PostgreSQL
    cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file.
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       String   @id @default(cuid())
  email    String   @unique
  name     String
  role     String
  password String
  reports  Report[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Report {
  id         String   @id @default(cuid())
  userId     String
  date       DateTime
  reportData Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([date])
}
EOF
    
    echo "✅ Prisma schema updated untuk PostgreSQL (Neon)"
    ;;
    
  3)
    echo ""
    echo "⚡ SETUP SUPABASE (PostgreSQL)"
    echo "============================="
    echo ""
    echo "1. Buka https://supabase.com dan daftar (gratis)"
    echo "2. Create new project: ksuke-reports"
    echo "3. Di Settings → Database, copy connection string"
    echo ""
    echo "Connection string format:"
    echo "postgresql://postgres:password@host:5432/postgres"
    echo ""
    
    # Update Prisma schema for PostgreSQL (same as Neon)
    cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file.
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       String   @id @default(cuid())
  email    String
  name     String
  role     String
  password String
  reports  Report[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Report {
  id         String   @id @default(cuid())
  userId     String
  date       DateTime
  reportData Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([date])
}
EOF
    
    echo "✅ Prisma schema updated untuk PostgreSQL (Supabase)"
    ;;
    
  *)
    echo "Pilihan tidak valid!"
    exit 1
    ;;
esac

echo ""
echo "🔐 GENERATE SECURE SECRETS:"
echo "=========================="
echo ""

# Generate JWT Secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "JWT_SECRET=\"$JWT_SECRET\""

# Generate NextAuth Secret  
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""

echo ""
echo "📝 ENVIRONMENT VARIABLES UNTUK VERCEL:"
echo "====================================="
echo ""
echo "Copy dan paste ke Vercel Dashboard → Settings → Environment Variables:"
echo ""
echo "DATABASE_URL=\"[paste your cloud database connection string here]\""
echo "JWT_SECRET=\"$JWT_SECRET\""
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""
echo "NEXTAUTH_URL=\"https://your-app-name.vercel.app\""
echo "NODE_ENV=\"production\""
echo ""

echo "📋 LANGKAH SELANJUTNYA:"
echo "======================"
echo ""
echo "1. Set DATABASE_URL dengan connection string dari cloud database"
echo "2. Set semua environment variables di Vercel Dashboard"
echo "3. Run: npm run build (test build locally)"
echo "4. Run: npx prisma db push (deploy schema ke cloud database)"
echo "5. Re-deploy di Vercel"
echo ""
echo "✅ Setelah itu, aplikasi akan bisa menyimpan data dan export Excel!"
echo ""

read -p "Press Enter to continue..."
