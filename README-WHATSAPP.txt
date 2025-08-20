WhatsApp Notification System - KSU KE

OVERVIEW:
Sistem notifikasi WhatsApp otomatis untuk mengingatkan karyawan yang belum mengisi laporan aktivitas harian.

FEATURES:
1. Setup Nomor WhatsApp - Admin dapat mengatur nomor WhatsApp untuk setiap role
2. Notifikasi Manual - Perlu Perhatian (60-79%) dan Urgent (<60%)
3. Notifikasi Otomatis - Cron job harian setiap jam 08:00 WIB

SETUP:
1. Tambahkan ke .env.local:
   FONNTE_API_TOKEN="your-fonnte-token-here"
   FONNTE_API_URL="https://api.fonnte.com/send"

2. Database Setup:
   npx prisma db execute --file add-whatsapp-column.sql --schema prisma/schema.prisma
   node scripts/setup-whatsapp-numbers.js

WHATSAPP NUMBERS:
BAPAK_SAYUDI: 6281579099992
USTADZ_YULI: 6282138957274
BAPAK_TOHA: 6281578585162
BAPAK_PRASETYO: 6281325919175
BAPAK_DIAH: 6285655543883
BAPAK_ARWAN: 6287803894839
BAPAK_GIYARTO: 6285879824874
BPK_WINARNO: 6288137568832
ADMIN: 6289630988257

API ENDPOINTS:
- POST /api/admin/users/update-whatsapp
- POST /api/admin/whatsapp-notification
- GET /api/cron/daily-whatsapp-reminder
