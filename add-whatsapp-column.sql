-- Menambahkan kolom whatsapp ke tabel users dengan aman
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp TEXT;
