# Laporan Aktivitas KSUKE - Deployment Guide

## 🚀 Deploy ke Vercel

### Persiapan

1. **Install Vercel CLI** (opsional):
   ```bash
   npm install -g vercel
   ```

2. **Push ke GitHub Repository**:
   - Buat repository baru di GitHub
   - Push semua file ke repository tersebut

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Kunjungi [vercel.com](https://vercel.com)**
2. **Login dengan GitHub account**
3. **Import Repository**:
   - Klik "New Project"
   - Pilih repository GitHub Anda
   - Framework akan otomatis terdeteksi sebagai "Next.js"

4. **Configure Environment Variables**:
   ```
   DATABASE_URL=file:./prod.db
   JWT_SECRET=your-super-secret-jwt-key-32-chars-long
   NEXTAUTH_SECRET=your-nextauth-secret-32-chars-long
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NODE_ENV=production
   ```

5. **Deploy**: Klik "Deploy"

### Method 2: Deploy via CLI

1. **Login ke Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```

### Environment Variables yang Diperlukan

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./prod.db` |
| `JWT_SECRET` | Secret untuk JWT tokens | Generate dengan `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Secret untuk NextAuth | Generate dengan `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL aplikasi production | `https://your-app-name.vercel.app` |

### Generate Strong Secrets

Gunakan command berikut untuk generate secret yang aman:

```bash
# Untuk JWT_SECRET
openssl rand -base64 32

# Untuk NEXTAUTH_SECRET  
openssl rand -base64 32
```

### Database Options

#### Option 1: SQLite (Simple, untuk testing)
```
DATABASE_URL="file:./prod.db"
```

#### Option 2: PostgreSQL (Recommended untuk production)
```
DATABASE_URL="postgresql://username:password@host:5432/database"
```

#### Option 3: PlanetScale (MySQL, Serverless)
```
DATABASE_URL="mysql://username:password@host/database?sslaccept=strict"
```

### Setelah Deploy

1. **Akses aplikasi** di URL yang diberikan Vercel
2. **Login sebagai admin** dengan credentials default:
   - Email: `admin@ksuke.com`
   - Password: `admin123`
3. **Ganti password admin** segera setelah login pertama

### Troubleshooting

#### Build Errors
- Pastikan semua environment variables sudah di-set
- Check logs di Vercel dashboard

#### Database Issues
- Untuk production, gunakan PostgreSQL atau PlanetScale
- SQLite akan reset setiap deployment

#### Authentication Issues
- Pastikan `NEXTAUTH_URL` sesuai dengan domain Vercel Anda
- Check `JWT_SECRET` dan `NEXTAUTH_SECRET` sudah di-set

### Custom Domain (Opsional)

1. **Di Vercel Dashboard**:
   - Go to Project Settings
   - Klik "Domains"
   - Add custom domain
2. **Update DNS** di domain provider Anda
3. **Update `NEXTAUTH_URL`** dengan domain baru

### Maintenance

- **Update Dependencies**: Secara berkala update packages
- **Monitor Logs**: Check Vercel function logs untuk errors
- **Backup Database**: Jika menggunakan PostgreSQL, setup backup otomatis

## 📧 Support

Jika ada pertanyaan atau masalah deployment, silakan hubungi tim developer.

---

**Built with Next.js 15 + Prisma + Tailwind CSS**
