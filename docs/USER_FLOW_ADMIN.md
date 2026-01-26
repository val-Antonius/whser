# Alur Aktivitas Pengguna: Administrator Sistem

Dokumen ini merinci interaksi pengguna dengan hak akses **Administrator** dalam aplikasi Whser Laundry Management. Setiap bagian menjelaskan konteks operasional, tujuan penggunaan, dan urutan aktivitas yang dilakukan pengguna pada antarmuka tertentu.

---

## 1. Dashboard Operasional
**Lokasi**: `/admin/dashboard`

### A. Konteks dan Urgensi
Halaman ini merupakan pusat komando bagi operasional harian. Staf memerlukan pandangan menyeluruh yang instan mengenai status pesanan yang tertunda, mesin yang beroperasi, dan indikator kritis lainnya untuk mengambil keputusan operasional yang cepat.

### B. Tujuan
*   Memberikan ringkasan metrik operasional *real-time* (hari ini).
*   Memantau antrean pesanan berdasarkan status (Baru, Proses, Siap).
*   Identifikasi cepat atas pesanan yang membutuhkan perhatian (SLA Breach).

### C. Alur Aktivitas
1.  **Akses Halaman**: Sistem secara otomatis mengarahkan admin ke halaman ini setelah login berhasil.
2.  **Pemantauan Metrik**: Admin membaca kartu ringkasan untuk mengetahui "Total Pesanan Hari Ini" dan "Pendapatan Hari Ini".
3.  **Navigasi Cepat**: Admin mengklik kartu status (misal: "Siap Diambil") untuk berpindah langsung ke halaman Manajemen Pesanan dengan filter yang relevan.

---

## 2. Point of Sales (POS)
**Lokasi**: `/admin/pos`

### A. Konteks dan Urgensi
Fungsi penerimaan pesanan adalah pintu gerbang utama pendapatan. Kecepatan dan akurasi input data sangat krusial untuk mencegah antrean pelanggan di meja depan (*front desk*) dan kesalahan administrasi.

### B. Tujuan
*   Mencatat transaksi penerimaan cucian baru.
*   Menghitung estimasi biaya berdasarkan berat dan jenis layanan.
*   Mencetak struk penerimaan fisik atau digital.

### C. Alur Aktivitas
1.  **Identifikasi Pelanggan**: Admin mencari pelanggan melalui nomor telepon/nama, atau mendaftarkan pelanggan baru via modal *Quick Add*.
2.  **Pemilihan Layanan**: Admin memilih kategori layanan (Kiloan/Satuan) dan jenis layanan spesifik (Cuci Kering/Setrika).
3.  **Input Detail Item**: Admin memasukkan berat (kg) atau kuantitas (pcs) item.
4.  **Konfirmasi Pembayaran**: Admin memilih metode pembayaran (Tunai/Non-Tunai) dan status pembayaran (Lunas/Deposit).
5.  **Finalisasi**: Admin menekan tombol "Buat Pesanan". Sistem memvalidasi stok dan menyimpan data.

---

## 3. Manajemen Pesanan (Order Management)
**Lokasi**: `/admin/orders`

### A. Konteks dan Urgensi
Pesanan laundry bergerak melalui serangkaian status fisik (Diterima -> Dicuci -> Dikeringkan -> Selesai). Pelacakan status yang akurat diperlukan untuk transparansi kepada pelanggan dan efisiensi alur kerja internal.

### B. Tujuan
*   Memperbarui status pengerjaan cucian.
*   Melacak lokasi fisik cucian (misal: di mesin cuci, di rak pengambilan).
*   Menangani kasus khusus (pembatalan atau komplain).

### C. Alur Aktivitas
1.  **Pencarian Pesanan**: Admin menggunakan filter atau bilah pencarian untuk menemukan pesanan spesifik.
2.  **Pembaruan Status**:
    *   Admin mengklik tombol aksi pada baris tabel (misal: tombol "Mulai Cuci").
    *   Sistem memperbarui status menjadi `IN_WASH`.
3.  **Detail Pesanan**: Admin mengklik nomor invoice untuk melihat rincian item atau riwayat log status.

---

## 4. Manajemen Inventaris
**Lokasi**: `/admin/inventory`

### A. Konteks dan Urgensi
Kekurangan bahan baku (deterjen/plastik) dapat menghentikan operasional. Halaman ini mendigitalkan pencatatan keluar-masuk barang yang sebelumnya dilakukan secara manual (kartu stok), meningkatkan akurasi data.

### B. Tujuan
*   Memantau tingkat persediaan bahan baku.
*   Mencatat penambahan stok (Pembelian).
*   Mencatat penyesuaian stok manual (Barang Rusak/Selisih Opname).

### C. Alur Aktivitas
1.  **Penerimaan Barang**: Admin menekan tombol "Stok Masuk", memilih item, dan memasukkan jumlah yang diterima dari pemasok.
2.  **Koreksi Stok**: Jika terjadi ketidakcocokan fisik, Admin menggunakan fitur "Penyesuaian" (`Adjustment`) dan wajib menyertakan alasan variansi.
3.  **Pemantauan Low Stock**: Admin memeriksa daftar item dengan indikator merah (di bawah stok minimum) untuk segera melakukan pemesanan ulang (*restock*).

---

## 5. Pelacakan Limbah & Kehilangan (Waste Tracking)
**Lokasi**: `/admin/inventory/waste`

### A. Konteks dan Urgensi
Tidak semua pengurangan stok disebabkan oleh pemakaian produksi. Barang yang rusak, tumpah, atau hilang (*Shrinkage*) harus dicatat terpisah untuk membedakan biaya produksi (*COGS*) dengan kerugian operasional. Tanpa pelacakan ini, margin keuntungan akan terdistorsi.

### B. Tujuan
*   Mencatat kehilangan inventaris yang tidak menghasilkan pendapatan.
*   Menghitung dampak finansial dari kecerobohan atau kerusakan.
*   Menjaga akurasi stok fisik vs sistem (mencegah selisih saat Opname).

### C. Alur Aktivitas
1.  **Akses Halaman**: Masuk ke menu Inventaris > Limbah. Admin melihat kartu ringkasan "Total Nilai Kehilangan" (Rupiah).
2.  **Pelaporan Kejadian**:
    *   Klik tombol **"+ Laporkan Kehilangan"**.
    *   Pilih item (misal: "Deterjen Cair"), jumlah (misal: "500 ml"), dan alasan (misal: "Tumpah saat tuang").
3.  **Evaluasi**: Sistem otomatis menghitung kerugian finansial. Data ini tersimpan sebagai riwayat untuk bahan evaluasi manajer.

---

## 6. Manajemen Pelanggan
**Lokasi**: `/admin/customers`

### A. Konteks dan Urgensi
Pengelolaan hubungan pelanggan (*CRM*) sederhana diperlukan untuk mengenali preferensi pelanggan (misal: alergi deterjen tertentu) dan meningkatkan retensi melalui layanan personal.

### B. Tujuan
*   Mengelola basis data pelanggan.
*   Melihat riwayat transaksi per pelanggan.
*   Menyimpan preferensi khusus.

### C. Alur Aktivitas
1.  **Registrasi**: Admin mengisi formulir data diri pelanggan lengkap.
2.  **Pencatatan Preferensi**: Admin menambahkan catatan khusus (misal: "Parfum Lily", "Lipatan Kotak") pada profil pelanggan.
3.  **Analisis Riwayat**: Admin melihat frekuensi kedatangan pelanggan untuk menentukan kelayakan program loyalitas (jika ada).

---

## 7. Daftar Tugas (Task Board)
**Lokasi**: `/admin/tasks`

### A. Konteks dan Urgensi
Fitur ini merupakan mekanisme kontrol kualitas yang diinisiasi oleh Pemilik. Admin bertindak sebagai eksekutor atas arahan perbaikan yang diberikan, memastikan masalah strategis diselesaikan di level operasional.

### B. Tujuan
*   Menerima perintah kerja non-rutin dari Pemilik.
*   Melaporkan penyelesaian masalah operasional.

### C. Alur Aktivitas
1.  **Penerimaan Tugas**: Admin memeriksa tab "Open Tasks" untuk melihat tugas baru yang didelegasikan.
2.  **Eskalasi Status**: Admin mengubah status tugas menjadi `In Progress` saat mulai pengerjaan.
3.  **Penyelesaian**: Setelah tindakan fisik dilakukan (misal: "Mesin A diperbaiki"), Admin menandai tugas sebagai `Resolved` dan menambahkan catatan penyelesaian jika perlu.

---

## 8. Laporan (Reports)
**Lokasi**: `/admin/reports` (Aging / Inventory Usage)

### A. Konteks dan Urgensi
Akuntabilitas operasional membutuhkan bukti data. Laporan digunakan untuk audit harian atau mingguan guna mendeteksi inefisiensi seperti pesanan yang mangkrak terlalu lama (*Aging Report*).

### B. Tujuan
*   Mengidentifikasi kemacetan aliran produksi (Bottleneck).
*   Melacak penggunaan bahan baku berlebih.

### C. Alur Aktivitas
1.  **Seleksi Laporan**: Admin memilih jenis laporan dari *sidebar* (misal: *Order Aging*).
2.  **Analisis**: Admin meninjau data pesanan yang telah melewati batas waktu SLA (>48 jam).
3.  **Tindak Lanjut**: Admin memprioritaskan penyelesaian pesanan yang muncul dalam laporan tersebut.
