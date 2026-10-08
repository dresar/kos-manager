# 🏠 Kos Manager

Sistem manajemen rumah kos modern dengan fitur pembukuan kas, status kamar & okupansi, generator reminder WhatsApp otomatis, serta penasehat finansial bertenaga **Qwen AI (`qwen3.8-flash`)**.

## Fitur Utama
- **Manajemen Kamar & Penghuni**: Monitoring status kamar (TERISI, MENUNGGAK, KOSONG), rincian fasilitas, dan tanggal jatuh tempo sewa.
- **Pencatatan Kas Masuk & Keluar**: Rekapitulasi real-time arus kas, kategori biaya operasional, dan laba bersih.
- **Invoicing & 1-Click WhatsApp Reminder**: Template tagihan formal dengan tautan langsung `wa.me` untuk konfirmasi pembayaran via WhatsApp.
- **Database JSON Lokal**: Penyimpanan data persisten mandiri tanpa konfigurasi database eksternal yang rumit.
- **Qwen Flash AI Financial Advisor**: Analisis rasio okupansi, proyeksi cashflow, evaluasi efisiensi operasional, dan strategi penagihan persuasif.

## Konfigurasi & Menjalankan
```bash
cd 02-kos-manager
npm install
node server.js
```
Akses di browser: `http://localhost:3002`
