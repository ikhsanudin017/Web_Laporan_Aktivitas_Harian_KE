# Laporan Aktivitas KSUKE

## � Deskripsi

Aplikasi web untuk menggantikan sistem laporan aktivitas harian menggunakan Next.js dengan fitur:

- ✅ **Autentikasi Role-based** (Admin & 8 User roles)
- ✅ **Dashboard Interaktif** dengan Islamic Corporate theme
- ✅ **Form Input** dengan dropdown smart untuk angka 1-30
- ✅ **Export Excel** dengan formatting otomatis
- ✅ **Admin Panel** untuk manajemen data
- ✅ **Responsive Design** dengan Tailwind CSS
- ✅ **Database SQLite** dengan Prisma ORM
- ✅ **Automatic Date Setting** dengan timezone Indonesia

## � Deploy ke Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Push ke GitHub Repository**
2. **Import di Vercel**:
   - Login ke [vercel.com](https://vercel.com)
   - Klik "New Project"
   - Import repository GitHub
3. **Set Environment Variables**:
   ```
   DATABASE_URL=file:./prod.db
   JWT_SECRET=[generate dengan: openssl rand -base64 32]
   NEXTAUTH_SECRET=[generate dengan: openssl rand -base64 32]
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NODE_ENV=production
   ```
4. **Deploy**!

### Method 2: One-Click Deploy
```bash
# Run setup script
./setup-env-vercel.bat

# Deploy to Vercel
./deploy-vercel.bat
```

## 🔐 Default Credentials

**Admin:**
- Email: `admin@ksuke.com`
- Password: `admin123`

**Users:** Login dengan dropdown nama (8 user tersedia)

### 📊 **Manajemen Data Lengkap**
- **History Tracking**: Riwayat laporan per user
- **Date Selector**: Pilih tanggal laporan
- **Load Previous Data**: Muat data tanggal sebelumnya
- **Real-time Sync**: Data tersimpan otomatis

### 👥 **Role & Form Configuration**

#### Simple Forms:
- **Ustadz Yuli**: Aktivitas Harian (textarea)
- **Bapak Toha**: Aktivitas Harian (textarea)

#### Medium Forms:
- **Bapak Sayudi**: Angsuran, Funding B2B/Personal, Survey, Kegiatan
- **Bpk Winarno**: Angsuran, Survey, Kegiatan

#### Complex Forms:
- **Bapak Arwan**: Funding B2B/Personal, Marketing B2B/Personal, Angsuran, Survey
- **Bapak Diah**: Funding B2B/Personal, Marketing B2B/Personal, Angsuran, Survey
- **Mbak Eka**: Funding B2B/Personal, Marketing B2B/Personal, Angsuran, Survey

#### Advanced Forms:
- **Bapak Prasetyo**: KTP, ADR, QUR'AN, WAKAF, GOTA, B2B, Maintenance
- **Bapak Giyarto**: KTP, ADR, QUR'AN, WAKAF, GOTA, B2B, Maintenance

## 🎯 Key Innovation: Smart Number Input

### 💡 **Dropdown Number Fields**
Semua field angka kini menggunakan **dropdown pintar** yang memungkinkan:

1. **📋 Dropdown Selection**: Klik field untuk melihat opsi 0-30
2. **⌨️ Manual Input**: Ketik langsung untuk angka di atas 30
3. **🎯 Quick Access**: Scroll cepat untuk angka kecil yang sering digunakan
4. **💡 Visual Guide**: Tooltip informatif untuk panduan penggunaan

### 🔧 **How It Works**
```html
<!-- Contoh implementasi -->
<input type="number" list="angsuran-datalist" min="0" max="999">
<datalist id="angsuran-datalist">
  <option value="0" />
  <option value="1" />
  <!-- ... hingga 30 -->
</datalist>
```

### ✨ **User Experience Benefits**
- ⚡ **Faster Input**: Tidak perlu mengetik angka kecil
- 🎯 **Accurate Data**: Mengurangi typo untuk angka umum
- 📱 **Mobile Friendly**: Touch-optimized untuk mobile
- 🆘 **Guided Input**: Visual feedback dan instructions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL dengan Prisma ORM
- **Authentication**: JWT
- **Styling**: Tailwind CSS
- **Excel Export**: XLSX.js

## Instalasi dan Setup

### 1. Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### 2. Clone dan Install Dependencies
```bash
git clone <repository-url>
cd laporan_aktivitas_KSUKE
npm install
```

### 3. Setup Database
1. Buat database PostgreSQL baru
2. Copy file `.env.local` dan sesuaikan dengan konfigurasi database Anda:
```bash
cp .env.local .env.local
```

3. Edit file `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/laporan_aktivitas?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
JWT_SECRET="your-jwt-secret-here-change-in-production"
```

### 4. Setup Database Schema
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### 5. Jalankan Aplikasi
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## User Accounts Default

Setelah menjalankan seed, berikut adalah akun yang tersedia:

| Email | Password | Role | Nama |
|-------|----------|------|------|
| admin@ksuke.com | 123456 | ADMIN | Administrator |
| yuli@ksuke.com | 123456 | USTADZ_YULI | Ustadz Yuli |
| toha@ksuke.com | 123456 | BAPAK_TOHA | Bapak Toha |
| sayudi@ksuke.com | 123456 | BAPAK_SAYUDI | Bapak Sayudi |
| winarno@ksuke.com | 123456 | BPK_WINARNO | Bpk Winarno |
| arwan@ksuke.com | 123456 | BAPAK_ARWAN | Bapak Arwan |
| diah@ksuke.com | 123456 | BAPAK_DIAH | Bapak Diah Supriyanto |
| eka@ksuke.com | 123456 | MBAK_EKA | Mbak Eka |
| prasetyo@ksuke.com | 123456 | BAPAK_PRASETYO | Bapak Prasetyo Dani |
| giyarto@ksuke.com | 123456 | BAPAK_GIYARTO | Bapak Giyarto |

## Cara Penggunaan

### 1. Login
- Buka aplikasi di browser
- Masukkan email dan password sesuai role Anda
- Sistem akan mengarahkan ke dashboard yang sesuai

### 2. Mengisi Laporan Harian
- Pilih tanggal laporan
- Isi form sesuai dengan field yang tersedia untuk role Anda
- Klik "Simpan Laporan"
- Laporan akan tersimpan dan bisa diedit kapan saja

### 3. Admin Dashboard
- Login sebagai admin
- Lihat semua laporan dari semua user
- Filter berdasarkan tanggal
- Export data ke Excel

### 4. Export Excel
- Di admin dashboard, pilih range tanggal (opsional)
- Klik "Export Excel"
- File akan terdownload otomatis

## Database Schema

### Users Table
- id, email, name, password, role, createdAt, updatedAt

### Daily Reports Table
- id, userId, date, reportData (JSON), createdAt, updatedAt
- Unique constraint: userId + date

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user

### Reports
- `GET /api/reports?date=YYYY-MM-DD` - Get report for specific date
- `POST /api/reports` - Create/update daily report

### Admin
- `GET /api/admin/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get all reports (admin only)

## Development

### Database Management
```bash
# View database in browser
npm run db:studio

# Reset database
npm run db:push --force-reset
npm run db:seed

# Generate new migration
npm run db:migrate
```

### Deployment

Aplikasi siap untuk deploy di Vercel:

1. Push code ke GitHub repository
2. Connect repository di Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

Environment variables yang diperlukan:
- `DATABASE_URL`
- `NEXTAUTH_URL` 
- `NEXTAUTH_SECRET`
- `JWT_SECRET`

## Troubleshooting

### Database Connection Error
- Pastikan PostgreSQL berjalan
- Cek kredensial database di `.env.local`
- Pastikan database sudah dibuat

### Build Error
- Jalankan `npm run db:generate` 
- Pastikan semua dependencies terinstall

### Login Error
- Pastikan database sudah di-seed
- Cek console browser untuk error detail

## Support

Untuk pertanyaan atau issue, silakan hubungi tim development.
