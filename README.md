# ☕ MAKNA COFFEE — Modern Artisan POS & Coffee Shop Management System

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![SQLite WASM](https://img.shields.io/badge/SQLite-WASM-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sql.js.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-047857?style=for-the-badge)](https://github.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20%7C%20All%20Rights%20Reserved-8A4F32?style=for-the-badge)](./LICENSE)

> **Makna Coffee POS** adalah sistem kasir (*Point of Sale*) dan manajemen operasional coffee shop modern berstandar enterprise. Dibangun dengan estetika desain premium (*Artisan Coffee Aesthetics*), arsitektur **Offline-First SQLite WebAssembly**, serta otomatisasi resep dan inventaris bahan baku secara *real-time*.

---

## 🌟 Nilai Jual & Keunggulan Aplikasi (*Unique Selling Proposition*)

1. **⚡ Offline-First Architecture (100% Mandiri Tanpa Ketergantungan Internet)**
   - Menggunakan database relasional **SQLite WebAssembly (sql.js)** yang berjalan langsung di browser kasir.
   - Transaksi tetap berjalan cepat dan stabil bahkan saat koneksi internet mati total di lokasi cafe. Data tersimpan aman di IndexedDB/Local Database.

2. **🍵 Auto-Deduction Inventory & Recipe Mapping (HPP Otomatis)**
   - Setiap transaksi minuman/makanan secara otomatis memotong stok bahan baku (biji kopi, susu, sirup, cup) berdasarkan takaran resep (*recipe engine*).
   - Mencegah *kebocoran bahan baku* (*waste/loss*) dan memberikan akurasi HPP (*Cost of Goods Sold*) per menu.

3. **💳 Multi-Payment Integrated Checkout (Tunai, QRIS Dinamis, Debit & EDC)**
   - Perhitungan kembalian otomatis dan *quick cash chips* (Uang Pas, 50k, 100k, 150k, 200k).
   - QRIS Dinamis lengkap dengan NMID & barcode SVG siap scan pelanggan.
   - Struk termal 80mm/58mm siap cetak instan serta opsi **Kirim Struk Digital WhatsApp** langsung ke pelanggan.

4. **✨ Ultra-Premium Artisan POS Interface**
   - Mengadopsi palet warna hangat (*Warm Coffee, Sand & Cream Palette*), tipografi display `Plus Jakarta Sans`, micro-animations, dan tata letak ergonomis yang dirancang khusus untuk kecepatan input barista/kasir.

5. **📊 Real-time Business Intelligence & Analytics**
   - Visualisasi tren omzet, produk terlaris (*best-seller*), analisis jam sibuk (*peak hours*), serta rekonsiliasi kas register (*Closing Shift Kasir*) per cabang.

6. **🏢 Multi-Outlet & Branch Support**
   - Mendukung multi-cabang dengan data koordinat GPS, Plus Code, jam operasional, dan pemilihan terminal kasir.

7. **🔐 Dual-Authentication (Password Hash & QR Barcode Barista Scan)**
   - Login fleksibel menggunakan username/password terenkripsi atau scan ID Card QR Code barista dalam hitungan detik.

---

## 📑 Rincian Halaman & Fitur Sistem (*Pages & Key Features*)

```
Makna Coffee POS System
├── 1. ☕ Kasir / POS Terminal (Home)
├── 2. 📋 Kelola Menu & Resep Bahan Baku (Menu)
├── 3. 📈 Laporan & Analisis Penjualan (Report)
├── 4. 💳 Saluran & Rekonsiliasi Pembayaran (Payment)
├── 5. 📍 Manajemen Outlet & Cabang (Location)
├── 6. 💾 Backup & Restore Database (Backup)
└── 7. 🔐 Autentikasi & Shift Security (Login & Auth)
```

---

### 1. ☕ Halaman Kasir / POS Terminal (`/`)
Halaman utama barista dan kasir untuk melayani pesanan pelanggan dengan alur transaksi ultra-cepat:
- **Katalog Menu Interaktif**: Filter cepat kategori (*Makna Signature, Coffee, Non-Coffee, Snack, Makanan Utama*) dan kolom pencarian instan.
- **Customization Modal**: Pilihan ukuran cup (*Regular, Large, X-Large*), level es (*Normal, Less, No Ice*), dan catatan khusus pelanggan (contoh: *"less sugar", "pisahkan cup"*).
- **Cart Drawer (Keranjang Pesanan)**: Ringkasan belanja dinamis, pengatur kuantitas (*stepper*), dan penghitungan subtotal real-time.
- **Pop-up Pembayaran Kasir**:
  - Pilihan layanan: **Dine In** (dengan nomor meja) atau **Take Away** (bungkus).
  - 3 Tab Metode Pembayaran: **Tunai/Cash** (input nominal + chip pecahan cepat + status uang kembalian hijau emerald), **QRIS Dinamis** (kode QR resmi Makna Coffee), dan **Debit Card/EDC**.
  - Toggle *Cetak Struk Fisik Otomatis* & *Kirim Struk WhatsApp*.
- **Thermal Receipt Modal**: Tampilan struk kertas kasir modern dengan barcode, nomor order `#MK-XXXX`, rincian menu, info outlet, dan tombol cetak print fisik (`@media print` 80mm) / Share WhatsApp.
- **Shift Closing Register**: Ringkasan total transaksi dan omzet harian saat pergantian shift kasir.

---

### 2. 📋 Halaman Kelola Menu & Resep (`/menu`)
Pusat manajemen master produk dan rekayasa bahan baku:
- **Master Data Menu**: Tambah, edit, nonaktifkan, dan hapus menu dengan upload foto produk, badge (*Best Seller, Signature, New*), dan SKU.
- **Multi-Size Pricing Matrix**: Penetapan harga jual berbeda untuk ukuran Regular, Large, dan Extra Large.
- **Recipe & Ingredient Mapping**: Menghubungkan setiap menu ke bahan baku inventaris (contoh: *Espresso 18gr + Fresh Milk 150ml + Pandan Syrup 20ml*).
- **Kalkulasi Biaya HPP**: Estimasi margin keuntungan bersih per cangkir kopi secara otomatis.

---

### 3. 📈 Halaman Laporan & Analisis Penjualan (`/report`)
Pusat intelijen bisnis untuk pemilik usaha dan manajer operasional:
- **Analisis Pendapatan & Volume Transaksi**: Filter fleksibel berdasarkan Hari Ini, 7 Hari Terakhir, Bulan Ini, Tahun Ini, atau Custom Date Range.
- **Grafik Tren Visual**: Visualisasi kurva penjualan harian dan perbandingan performa kategori produk.
- **Breakdown Metode Pembayaran**: Analisis proporsi transaksi via Cash, QRIS, dan EDC Debit.
- **Riwayat Closing Shift Kasir**: Log audit penutupan buku harian kasir lengkap dengan detail pendapatan per metode bayar.
- **Export Data**: Unduh laporan transaksi ke format **JSON / CSV** untuk keperluan pembukuan akuntansi.

---

### 4. 💳 Halaman Saluran Pembayaran (`/payment`)
Pengaturan jalur pembayaran dan parameter transaksi toko:
- **Konfigurasi Saluran Kasir**: Kelola metode Cash (batas brankas kasir), QRIS (auto-settlement), Debit/EDC (rate MDR), dan Transfer Bank.
- **Log Settlement & Rekonsiliasi**: Pelacakan riwayat kliring bank, auto-settlement QRIS, dan setoran fisik tunai.
- **Analisis Saluran Terpopuler**: Metrik perbandingan saluran bayar yang paling sering digunakan pelanggan.

---

### 5. 📍 Halaman Manajemen Lokasi & Cabang (`/location`)
Pengaturan outlet multi-cabang Makna Coffee:
- **Master Data Cabang**: Kelola nama outlet (misal: *Abepura, Kotaraja*), alamat lengkap, nomor kontak, dan jam operasional.
- **Integrasi Peta & Koordinat**: Penyimpanan titik Latitude, Longitude, dan Google Plus Code lokasi outlet.
- **Branch Switcher**: Kemudahan berganti cabang operasional kasir dengan persistensi sesi kerja.

---

### 6. 💾 Halaman Backup & Restore Data (`/backup`)
Keamanan data tingkat tinggi untuk menjamin integritas data cafe:
- **1-Click Database Export**: Download seluruh struktur database dan transaksi ke file `.sqlite` / `.json`.
- **Database Restore**: Pulihkan seluruh data transaksi dan inventaris dari file cadangan secara aman.
- **Database Health Metrics**: Monitor ukuran file database, total baris tabel, dan versi skema relasional.
- **Reset & Seed Demo Data**: Opsi reset data awal untuk demonstrasi atau persiapan pembukaan cabang baru.

---

### 7. 🔐 Autentikasi & Keamanan Shift (`/login`)
Sistem autentikasi ganda untuk akses kasir dan manajer:
- **Login Password Hash**: Verifikasi kredensial terenkripsi aman (*SHA-256 password hashing*).
- **Login QR Code Barista**: Scan ID Card QR Code untuk login kasir secara instan tanpa perlu mengetik keyboard.
- **Session Protection**: Proteksi rute halaman (*Protected Routes*) dan auto-lock sesi kasir.

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Komponen modular, Hooks, Context API |
| **Build Tool & Bundler** | **Vite 8** | Hot Module Replacement (HMR) super cepat |
| **Embedded Database** | **SQLite WASM (sql.js)** | Database SQL relasional langsung di client browser |
| **Styling Engine** | **Custom Artisan Vanilla CSS** | Design system terstandarisasi, responsif & ringan |
| **QR Code Engine** | **qrcode.react** | Generator QRIS SVG dinamis |
| **Charts & Graphs** | **Chart.js & react-chartjs-2** | Visualisasi tren penjualan interaktif |
| **Routing** | **React Router 7** | Client-side routing dengan sistem proteksi |
| **Iconography** | **Google Material Symbols & Custom SVG** | Ikon grafis tajam dan konsisten |

---

## 🚀 Panduan Menjalankan Aplikasi (*Getting Started*)

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.x atau lebih baru
- **NPM**: Versi 9.x atau lebih baru

### 2. Instalasi Dependensi
```bash
# Clone atau buka direktori proyek
cd Makna-coffe

# Install semua dependensi
npm install
```

### 3. Menjalankan di Lingkungan Development
```bash
npm run dev
```
Buka browser dan akses URL lokal: `http://localhost:5173`

### 4. Build untuk Lingkungan Produksi
```bash
npm run build
```

---

## 🔒 LISENSI & HAK CIPTA KEPEMILIKAN

```text
===================================================================================
                     PROPRIETARY & CONFIDENTIAL LICENSE
===================================================================================

Hak Cipta (c) 2024-2026 ILHAM TATAYO LIE. Seluruh Hak Dilindungi Undang-Undang.
Copyright (c) 2024-2026 ILHAM TATAYO LIE. All Rights Reserved.

Perangkat lunak ini beserta seluruh kode sumber, dokumentasi, desain antarmuka (UI/UX),
dan aset grafis yang terkait merupakan hak milik eksklusif dari:

                         ILHAM TATAYO LIE

DILARANG KERAS:
1. Menyalin, menggandakan, mendistribusikan, mempublikasikan, atau melisensikan ulang
   sebagian atau seluruh kode sumber perangkat lunak ini tanpa izin tertulis resmi dari
   Pemilik Hak Cipta.
2. Menggunakan perangkat lunak ini untuk tujuan komersial oleh pihak ketiga tanpa
   perjanjian lisensi komersial resmi dari Pemilik Hak Cipta.
3. Melakukan rekayasa balik (reverse engineering), dekompilasi, atau membongkar
   arsitektur aplikasi ini untuk kepentingan kompetitif atau tidak sah.

Pelanggaran terhadap ketentuan hak cipta ini akan ditindaklanjuti secara hukum
sesuai dengan Undang-Undang Hak Cipta dan Regulasi Perlindungan Kekayaan Intelektual
yang berlaku secara Nasional maupun Internasional.

Untuk keperluan perizinan, kerja sama, dan lisensi komersial, silakan hubungi:
Pemilik Hak Cipta : ILHAM TATAYO LIE
===================================================================================
```

---

<p align="center">
  Dibuat dengan dedikasi untuk industri coffee shop modern. <br>
  <strong>Makna Coffee POS — Menghadirkan Makna di Setiap Transaksi.</strong>
</p>
