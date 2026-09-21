# 🗺️ PGI Booking Engine - Master Roadmap

Roadmap ini merupakan rencana kerja skala besar (*Grand Blueprint*) untuk mengembangkan sistem PGI Booking Engine dari aplikasi pemesanan statis menjadi sistem manajemen operasi penuh yang terintegrasi (Dinamis, Offline/Online tersinkronisasi, dan Analitik Visual).

Setiap fase di bawah ini akan dipecah menjadi **Implementation Plan** tersendiri sebelum mulai dieksekusi.

---

## ⚓ Fase 1: Product & Quota Engine (Sistem Dinamis)
*Mengubah sistem yang saat ini masih hardcoded (produk, harga, jadwal statis) menjadi sistem database dinamis (CRUD) yang bisa dikendalikan sepenuhnya dari Portal Admin.*

### Target & Fitur:
- **Database Architecture**: Membuat dua koleksi di Firestore: 
  - `products` (Master Cabins): Menyimpan tipe kabin, deskripsi, gambar, harga per pax (berdasarkan tipe kabin, tanpa beda usia), dan kapasitas maksimal.
  - `voyages` (Schedules): Menyimpan jadwal keberangkatan setiap Sabtu, melacak sisa kuota untuk tiap tipe kabin pada tanggal tersebut.
- **Admin - Product Management (CRUD)**:
  - Menu baru: **Fleet & Voyages** di sidebar Admin.
  - Halaman Daftar Produk dengan `<AdminTable>`.
  - Halaman Tambah/Edit Produk (dengan integrasi Upload Gambar/Cloudinary).
- **Client - Dynamic Front-End**:
  - Merombak halaman Beranda (`/`) dan halaman Checkout (`/payment`) agar tidak lagi membaca data statis, melainkan membaca data dari koleksi `voyages` secara *real-time*.

---

## 🎟️ Fase 2: Omnichannel Booking System (Sistem Order Manual)
*Membangun jalur masuk bagi pesanan offline (dari kantor fisik atau agen wisata) agar dapat didata dalam satu pintu bersama pesanan dari aplikasi.*

### Target & Fitur:
- **Admin - Manual Entry Menu**: 
  - Menu baru: **Manual Registry** di Admin Portal.
  - Formulir pemesanan khusus Admin untuk mendaftarkan tamu secara manual (meng-input nama, jumlah pax, pembayaran langsung lunas/DP).
- **Source Tracking (Pelacakan Sumber)**:
  - Modifikasi koleksi `bookings` dengan parameter baru: `source` (contoh: `APP`, `AGENT_A`, `AGENT_B`, `INTERNAL_OFFICE`).
- **Admin Manifest Editing**:
  - Menyediakan fitur *Inline Edit* pada dasbor detail pemesanan untuk melengkapi data penumpang B2C yang kosong, termasuk *upload* ulang foto paspor/KTP.
- **Visual Separation**:
  - Mengubah tampilan tabel di Dasbor Utama Admin agar memiliki *Badge* pembeda (misal: Warna Biru untuk APP, warna Emas untuk AGENT).

---

## ⚖️ Fase 3: Real-Time Quota Synchronization (Sinkronisasi Kritis)
*Jantung dari seluruh sistem: Mencegah terjadinya bentrok data (overbooking) antara penumpang aplikasi dengan penumpang offline.*

### Target & Fitur:
- **Strict Quota Deductions**: 
  - Logika terpusat di mana setiap pembuatan *booking* (baik oleh User di aplikasi maupun oleh Admin via jalur manual) akan langsung memotong **Sisa Kuota** dari produk di Fase 1.
- **Concurrency Protection (Transaksi Firestore)**:
  - Menerapkan *Firestore Transactions* untuk menjamin bahwa jika 2 orang (satu offline, satu online) memesan kursi terakhir di detik yang sama, sistem tidak akan bocor menjadi minus.
- **Client Auto-Lock UI**:
  - Modifikasi portal klien: Jika sisa kuota menipis (misal sisa 5 kursi), muncul label *"Almost Sold Out"*.
  - Jika kuota habis (0), tombol booking mati secara seketika (*Disabled*) di semua layar pelanggan secara *real-time*.

---

## 📊 Fase 4: Command Center Analytics (Bagan & Grafik visual)
*Menghidupkan dasbor Admin dengan data statistik visual untuk mempermudah pengambilan keputusan bisnis.*

### Target & Fitur:
- **Library Integration**: Meng-install pustaka analitik visual seperti `recharts` atau `chart.js` (dengan gaya warna Navy & Gold).
- **Dashboard Visuals**:
  - **Revenue Line Chart**: Grafik garis tren pendapatan 30 hari terakhir.
  - **Booking Source Pie Chart**: Diagram lingkaran proporsi pesanan (Berapa % dari Aplikasi vs % dari Agen).
  - **Occupancy Bar Chart**: Grafik batang sisa kuota vs kuota terjual untuk keberangkatan terdekat.
- **Data Aggregation**: Pembuatan logika kalkulasi data Firestore yang efisien agar grafik dimuat dengan cepat tanpa menghabiskan kuota pembacaan database.

---

> **Catatan Pengembang**: Fase ini sangat berkesinambungan. Fase 2 (Order Offline) tidak bisa dieksekusi dengan baik jika Fase 1 (Sistem Produk Dinamis) belum berdiri, karena order offline butuh memotong stok produk. Oleh karena itu, eksekusi wajib dilakukan berurutan dari **Fase 1**. 
