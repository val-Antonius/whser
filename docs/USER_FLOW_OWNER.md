# Alur Aktivitas Pengguna: Pemilik Bisnis (Owner)

Dokumen ini menjelaskan interaksi pengguna dengan hak akses **Owner** (Pemilik) dalam ekosistem Whser Laundry Management. Fokus utama peran ini adalah pengawasan strategis, analisis kinerja, dan pengambilan keputusan berbasis data, bukan operasional harian.

---

## 1. Dashboard Analitik
**Lokasi**: `/owner/analytics`

### A. Konteks dan Urgensi
Dalam lingkungan bisnis yang kompetitif, pemilik usaha tidak dapat hanya mengandalkan intuisi. Mereka memerlukan data historis yang teragregasi untuk menilai kesehatan bisnis secara objektif dalam periode tertentu (Snapshot).

### B. Tujuan
*   Melihat gambaran besar kinerja bisnis (Pendapatan, Volume Pesanan).
*   Menganalisis tren melalui perbandingan antar periode.
*   Mengakses metrik kinerja terperinci (*metrics drilldown*).

### C. Alur Aktivitas
1.  **Pemilihan Periode**: Pemilik memilih *Snapshot Data* (misal: "Laporan Januari Minggu 1") dari menu *dropdown*.
2.  **Tinjauan KPI**: Sistem menampilkan kartu metrik utama. Pemilik meninjau indikator visual (Merah/Kuning/Hijau) untuk mendeteksi anomali.
3.  **Eksplorasi Detail**: Pemilik mengklik salah satu kartu metrik (misal: "Profit Margin") untuk melihat komponen penyusunnya secara mendalam.

---

## 2. Manajemen Snapshot Data
**Lokasi**: `/owner/analytics/snapshots`

### A. Konteks dan Urgensi
Agar analisis data valid, data operasional yang terus bergerak harus "dibekukan" dalam periode waktu tertentu. Tanpa snapshot yang terkunci, angka laporan akan terus berubah seiring masuknya transaksi baru, membuat analisis historis menjadi tidak konsisten.

### B. Tujuan
*   Membuat titik data statis (Harian/Mingguan/Bulanan) untuk dianalisis.
*   Mengunci data agar tidak dapat diubah lagi (*Immutable*).
*   Mengelola arsip laporan kinerja masa lalu.

### C. Alur Aktivitas
1.  **Pembuatan Snapshot**:
    *   Pemilik mengklik tombol **"Create Snapshot"**.
    *   Memilih periode (misal: "Weekly") dan rentang tanggal.
    *   Sistem memproses agregasi data jutaan transaksi menjadi satu baris rekapitulasi.
2.  **Penguncian Data**: Secara default, snapshot baru berstatus "Unlocked". Setelah verifikasi, Pemilik mengklik icon *Gembok* untuk menguncinya, menjadikannya valid sebagai laporan resmi.
3.  **Audit**: Melihat riwayat snapshot untuk memastikan tidak ada kekosongan data (*Data Gap*) antar periode.

---

## 3. Wawasan Bisnis (Insights)
**Lokasi**: `/owner/insights`

### A. Konteks dan Urgensi
Data mentah seringkali sulit diterjemahkan menjadi tindakan. Fitur ini menjembatani kesenjangan tersebut dengan menyediakan analisis kualitatif, baik yang dihasilkan secara manual oleh manajer maupun secara otomatis oleh Kecerdasan Buatan (AI).

### B. Tujuan
*   Mendapatkan interpretasi naratif atas data statistik.
*   Mengidentifikasi akar permasalahan (*root cause analysis*) dari penurunan kinerja.
*   Mengubah temuan masalah menjadi tiket penugasan (*actionable tasks*).

### C. Alur Aktivitas
1.  **Pembangkitan Wawasan AI**: Pemilik menekan tombol "Analisis AI". Sistem memproses data metrik melalui model LLM dan menghasilkan daftar temuan.
2.  **Kurasi**: Pemilik membaca daftar wawasan yang dihasilkan. Wawasan dikategorikan berdasarkan tingkat keparahan (*Critical/Attention/Normal*).
3.  **Tindak Lanjut**: Jika wawasan memerlukan tindakan korektif, Pemilik mengklik tombol **"+ Tugas"** untuk mendelegasikan penyelesaiannya kepada Admin.

---

## 4. Rekomendasi Sistem
**Lokasi**: `/owner/recommendations`

### A. Konteks dan Urgensi
Selain diagnosis masalah (Insight), bisnis memerlukan preskripsi solusi. Halaman ini menyediakan saran proaktif untuk optimasi sistem, seperti penyesuaian harga, promosi, atau perubahan SOP inventaris.

### B. Tujuan
*   Menerima saran strategis untuk peningkatan efisiensi atau pendapatan.
*   Melacak status implementasi saran tersebut (Diterima/Ditolak/Selesai).

### C. Alur Aktivitas
1.  **Tinjauan Saran**: Pemilik meninjau kartu rekomendasi yang dikelompokkan berdasarkan kategori (misal: *Pricing*, *Inventory*).
2.  **Evaluasi**: Pemilik mempertimbangkan rasionalisasi yang diberikan sistem.
3.  **Keputusan**: Pemilik mengubah status rekomendasi menjadi "Accepted" jika setuju untuk menjalankannya, atau "Rejected" jika tidak relevan.

---

## 5. Manajemen Tugas (Tasks Control)
**Lokasi**: `/owner/tasks`

### A. Konteks dan Urgensi
Instruksi perbaikan seringkali hilang tanpa jejak jika hanya disampaikan secara lisan. Modul ini merupakan mekanisme kontrol (*Control Loop*) untuk memastikan bahwa instruksi strategis yang diturunkan ke level operasional benar-benar dilaksanakan dan efektif.

### B. Tujuan
*   Memantau status penyelesaian tugas yang didelegasikan ke Admin.
*   Memvalidasi efektivitas solusi yang diterapkan (*Post-Implementation Review*).

### C. Alur Aktivitas
1.  **Monitoring**: Pemilik melihat papan status untuk mengetahui berapa banyak tugas yang masih "Open" atau "In Progress".
2.  **Verifikasi Penyelesaian**: Saat Admin menandai tugas sebagai "Resolved", tugas tersebut muncul di tab penyelesaian pemilik.
3.  **Uji Efektivitas**:
    *   Pemilik mengklik tombol **"Cek Efektivitas"**.
    *   Sistem membandingkan data metrik *sebelum* tugas dibuat dengan data metrik *setelah* tugas selesai.
    *   Hasil perbandingan ini menjadi dasar bagi Pemilik untuk menutup tugas secara permanen atau membukanya kembali jika masalah belum teratasi.
