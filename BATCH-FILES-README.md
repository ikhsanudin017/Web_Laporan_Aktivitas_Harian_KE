# 🚀 Batch Files - Panduan Penggunaan

File batch ini dibuat untuk memudahkan pengelolaan aplikasi KSU KE dengan 1 klik.

## 📁 File Batch yang Tersedia

### 🎯 **start-server.bat** (UTAMA)
**Untuk penggunaan sehari-hari development**
- ✅ Start development server otomatis
- ✅ Auto-install dependencies jika belum ada
- ✅ Buka di http://localhost:3000
- ✅ Hot reload untuk development

**Cara pakai:** Double-click file ini untuk langsung menjalankan aplikasi!

---

### 🏭 **start-production.bat**
**Untuk deploy production**
- ✅ Build aplikasi untuk production
- ✅ Start production server
- ✅ Optimized performance
- ✅ Ready for live deployment

---

### ⚙️ **server-control.bat**
**Control panel lengkap**
- ✅ Menu interaktif
- ✅ Start/stop server
- ✅ Monitor processes
- ✅ Database management
- ✅ Browser launcher

---

### 🛠️ **install-all.bat**
**Untuk setup pertama kali**
- ✅ Install semua dependencies
- ✅ Setup database
- ✅ Generate Prisma client
- ✅ One-time setup

---

### 🗄️ **setup-database.bat**
**Database management**
- ✅ Generate Prisma client
- ✅ Push database schema
- ✅ Optional seed data
- ✅ Reset database

---

### 🌐 **open-browser.bat**
**Browser launcher**
- ✅ Auto-open di browser default
- ✅ Instruksi untuk browser lain
- ✅ URL helper

---

## 🎯 Quick Start Guide

### 🆕 **Setup Pertama Kali**
1. Double-click `install-all.bat`
2. Tunggu hingga instalasi selesai
3. Double-click `start-server.bat`
4. Aplikasi siap digunakan!

### 📅 **Penggunaan Harian**
1. Double-click `start-server.bat`
2. Tunggu server start (biasanya 10-15 detik)
3. Browser akan auto-open atau buka manual di http://localhost:3000
4. Mulai input laporan aktivitas harian

### 🔧 **Troubleshooting**
- **Server tidak start**: Jalankan `install-all.bat` dulu
- **Database error**: Jalankan `setup-database.bat`
- **Port sudah digunakan**: Gunakan `server-control.bat` → Stop All
- **Dependencies outdated**: Jalankan `install-all.bat` lagi

## 💡 Tips Penggunaan

### 🎯 **Rekomendasi Workflow**
```
Setup Awal → install-all.bat
Harian     → start-server.bat  
Production → start-production.bat
Maintenance→ server-control.bat
```

### ⚡ **Shortcut Desktop**
1. Right-click pada `start-server.bat`
2. Pilih "Create shortcut"
3. Drag shortcut ke Desktop
4. Rename jadi "KSU KE App"

### 🔄 **Auto-start dengan Windows**
1. Copy `start-server.bat` ke folder Startup:
   `Win+R` → `shell:startup` → Paste file
2. Aplikasi akan auto-start setiap Windows boot

### 🌐 **Network Access**
Untuk akses dari komputer lain di jaringan:
1. Edit file `.bat`
2. Ganti `localhost` dengan IP address komputer server
3. Pastikan firewall allow port 3000

## ⚠️ Troubleshooting Common Issues

### ❌ **"npm is not recognized"**
- Install Node.js dari https://nodejs.org
- Restart command prompt
- Jalankan `install-all.bat` lagi

### ❌ **Port 3000 sudah digunakan**
```batch
# Stop semua node processes
taskkill /f /im node.exe

# Atau gunakan server-control.bat → Stop All
```

### ❌ **Database connection error**
- Jalankan `setup-database.bat`
- Check file `prisma/dev.db` ada
- Restart server

### ❌ **Permission denied**
- Run as Administrator
- Check folder permissions
- Disable antivirus temporarily

## 📞 Support

Jika ada masalah:
1. Check error message di terminal
2. Restart dengan `server-control.bat`
3. Fresh install dengan `install-all.bat`
4. Contact developer team

---

**© 2025 KSU KE - Sistem Laporan Aktivitas Harian**  
*One-click solution untuk produktivitas maksimal!* 🚀
