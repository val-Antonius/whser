# Spesifikasi Fungsional & Alur Operasional
## Warehouse Laundry Management System

**Versi**: 1.0  
**Tanggal**: 2026-01-25  
**Status**: Phase 3 Complete (Pre-LLM)

---

## 📋 Ringkasan Eksekutif

Sistem ini mengelola operasional laundry warehouse dengan dua aplikasi terpisah:

1. **Aplikasi Operasional** - Untuk operasional harian (Admin/Staff)
2. **Aplikasi Post-Operational** - Untuk analisis & pengambilan keputusan (Owner)

**Prinsip Desain Utama:**
- **Separation of Concerns**: Operasional vs Analitik terpisah total
- **No IoT**: Semua data berbasis proxy metrics dari aktivitas manual
- **Manual-First**: Sistem mendukung proses manual, bukan otomasi penuh

---

## 🔄 ALUR OPERASIONAL END-TO-END

### Fase 1: Operasional Harian (Aplikasi Operasional)

#### **A. Pagi Hari - Persiapan Operasional**

**Aktor**: Admin

**Proses:**

1. **Login ke Sistem**
   - Admin membuka aplikasi dan login
   - Sistem menampilkan dashboard dengan ringkasan hari ini

2. **Cek Inventory Awal**
   - Admin membuka halaman Inventory
   - Melihat stok deterjen, softener, plastik kemasan
   - Jika ada item < minimum stock → catat untuk order
   - Sistem menampilkan warning untuk low stock items

3. **Review Pesanan Pending**
   - Admin membuka halaman Orders
   - Melakukan filter berdasarkan status pesanan
   - Melihat pesanan yang harus diselesaikan hari ini
   - Identifikasi pesanan yang mendekati SLA (72 jam)

**Output**: Admin memiliki gambaran lengkap tentang workload hari ini

---

#### **B. Penerimaan Pesanan Baru**

**Aktor**: Admin (front desk)

**Skenario**: Pelanggan datang membawa cucian

**Proses:**

1. **Buat Pesanan Baru**
   - Admin klik "Create New Order"
   - Input data pelanggan:
     - Nama pelanggan
     - Nomor telepon
     - Alamat (untuk delivery)

2. **Pilih Layanan**
   - Admin memilih service dari dropdown:
     - Cuci Kering (Rp 8,000/kg)
     - Cuci Setrika (Rp 10,000/kg)
     - Setrika Saja (Rp 5,000/kg)
     - Express Service (+50% dari harga normal)

3. **Input Detail Cucian**
   - Admin menimbang cucian → input berat (kg)
   - Sistem otomatis hitung harga berdasarkan service × berat
   - Admin bisa tambah catatan khusus (misal: "Jangan pakai pewangi")

4. **Tentukan Target Completion**
   - Sistem suggest target berdasarkan service type:
     - Regular: 48 jam
     - Express: 24 jam
   - Admin bisa adjust manual jika perlu

5. **Simpan Pesanan**
   - Sistem generate order ID unik
   - Status otomatis: "pending"
   - Print struk untuk pelanggan (berisi order ID & target completion)

**Output**: Pesanan tercatat di sistem, pelanggan dapat struk

**Transisi**: Pesanan masuk antrian untuk diproses

---

#### **C. Proses Pencucian**

**Aktor**: Staff Laundry

**Proses:**

1. **Ambil Pesanan dari Antrian**
   - Staff buka halaman Orders
   - Melakukan filter berdasarkan status pesanan
   - Pilih pesanan yang akan dikerjakan

2. **Update Status ke "In Progress"**
   - Staff klik "Start Processing"
   - Sistem update status berdasarkan status yang dipilih
   - Sistem catat waktu mulai

3. **Catat Penggunaan Inventory** (Manual)
   - Staff mencatat berapa banyak deterjen/softener yang dipakai
   - Input ke sistem:
     - Item: Deterjen
     - Quantity: 0.5 kg
     - Transaction type: "usage"
     - Linked to: Order ID
   - Sistem kurangi stok inventory secara otomatis

4. **Proses Fisik Cucian**
   - Staff melakukan pencucian fisik (di luar sistem)
   - Jika ada masalah (noda tidak hilang) → catat sebagai exception

5. **Catat Exception (Jika Ada)**
   - Staff klik "Add Exception" di order detail
   - Pilih exception type:
     - Rewash (cucian harus dicuci ulang)
     - Damage (cucian rusak)
     - Lost Item (ada item hilang)
   - Input deskripsi detail
   - Sistem tandai order sebagai "has exception"

**Output**: Cucian selesai diproses, inventory tercatat, exception terdokumentasi

**Transisi**: Cucian siap untuk quality check atau packaging

---

#### **D. Quality Check & Packaging**

**Aktor**: Staff QC

**Proses:**

1. **Review Hasil Cucian**
   - Staff cek kualitas cucian
   - Jika tidak OK → tandai untuk rewash (exception)
   - Jika OK → lanjut packaging

2. **Packaging**
   - Staff kemas cucian dalam plastik
   - Catat penggunaan inventory:
     - Item: Plastik Kemasan
     - Quantity: 1 pcs
     - Linked to: Order ID

3. **Update Status ke "Completed"**
   - Staff klik "Mark as Completed"
   - Input actual completion time (sistem auto-fill current time)
   - Sistem hitung:
     - Completion duration (jam)
     - SLA breach? (jika > 72 jam dari created_at)
   - Status update → "completed"

**Output**: Pesanan selesai, siap diambil/dikirim

**Transisi**: Pesanan menunggu pickup atau delivery

---

#### **E. Pengambilan/Pengiriman**

**Aktor**: Admin atau Delivery Staff

**Proses:**

1. **Pelanggan Datang Ambil**
   - Admin cari order berdasarkan order ID atau nama
   - Verifikasi identitas pelanggan
   - Serahkan cucian

2. **Update Status ke "Delivered"**
   - Admin klik "Mark as Delivered"
   - Input payment method:
     - Cash
     - Transfer
     - E-wallet
   - Sistem update status → "delivered"
   - Sistem catat revenue (final_price)

**Output**: Transaksi selesai, revenue tercatat

---

#### **F. Pengelolaan Inventory (Berkala)**

**Aktor**: Admin

**Proses:**

1. **Monitoring Stock**
   - Admin cek inventory dashboard setiap hari
   - Sistem highlight item dengan low stock (< minimum)

2. **Restock Inventory**
   - Admin klik "Add Stock" untuk item tertentu
   - Input:
     - Quantity yang ditambah
     - Supplier (optional)
     - Cost per unit
   - Transaction type: "restock"
   - Sistem update current stock

3. **Stock Adjustment**
   - Jika ada selisih fisik vs sistem (stock opname)
   - Admin klik "Adjust Stock"
   - Input actual quantity
   - Sistem catat variance

**Output**: Inventory selalu up-to-date

---

### Fase 2: Analisis Post-Operational (Aplikasi Post-Operational)

**Timing**: Biasanya dilakukan mingguan/bulanan oleh Owner

#### **A. Pembuatan Snapshot Data**

**Aktor**: Owner

**Proses:**

1. **Login ke Owner Dashboard**
   - Owner buka aplikasi post-operational
   - Pilih role: Owner

2. **Buat Snapshot Periode**
   - Owner klik "Buat Snapshot Baru"
   - Pilih periode:
     - Weekly (7 hari terakhir)
     - Monthly (30 hari terakhir)
     - Custom range
   - Sistem suggest periode berdasarkan snapshot terakhir

3. **Generate Snapshot**
   - Sistem query semua data operasional dalam periode:
     - Total orders
     - Total revenue
     - Completion metrics
     - SLA breaches
     - Rewash count
     - Inventory usage
   - Sistem hitung 8 analytical metrics:
     - SLA Compliance Rate
     - Order Aging (>72 jam)
     - Rewash Rate
     - Exception Frequency
     - Contribution Margin
     - Inventory Variance
     - Productivity (orders/day)
     - Capacity Utilization
   - Sistem compare dengan baseline (snapshot sebelumnya)
   - Sistem tentukan significance level (normal/attention/critical)

4. **Snapshot Tersimpan**
   - Data di-lock (immutable)
   - Snapshot siap untuk analisis

**Output**: Snapshot data periode dengan metrics terkalkulasi

**Transisi**: Owner dapat menganalisis metrics

---

#### **B. Analisis Metrics**

**Aktor**: Owner

**Proses:**

1. **Buka Analytics Dashboard**
   - Owner pilih snapshot dari dropdown
   - Sistem tampilkan 8 metric cards dengan:
     - Current value
     - Baseline value
     - Variance (absolute & percentage)
     - Trend (up/down/stable)
     - Significance (normal/attention/critical)

2. **Drill-down Metrics**
   - Owner klik metric card untuk detail
   - Sistem tampilkan:
     - Breakdown data
     - Metadata (periode, sample size)
     - Comparison dengan baseline

3. **Identifikasi Masalah**
   - Owner lihat metrics dengan significance "critical" atau "attention"
   - Contoh findings:
     - "Rewash rate naik 50% dari baseline"
     - "SLA compliance turun 15%"
     - "Contribution margin turun 5%"

**Output**: Owner memahami performa operasional

**Transisi**: Owner membuat insights berdasarkan metrics

---

#### **C. Pembuatan Insights Manual**

**Aktor**: Owner

**Proses:**

1. **Buka Halaman Insights**
   - Owner klik menu "Wawasan"

2. **Buat Insight Baru**
   - Owner klik "Buat Wawasan Baru"
   - Pilih snapshot yang dianalisis
   - Tulis pernyataan insight (10-1000 karakter):
     - Contoh: "Tingkat rewash meningkat 50% dari baseline, kemungkinan disebabkan oleh kualitas deterjen yang menurun atau staff baru yang kurang terlatih"

3. **Kategorisasi Insight**
   - Pilih severity:
     - Normal: Informasi biasa
     - Perhatian: Perlu monitoring
     - Kritis: Perlu tindakan segera
   - Pilih metrics terkait (multi-select):
     - Rewash Rate
     - SLA Compliance
     - dll
   - Tandai "Dapat Ditindaklanjuti" jika perlu action

4. **Simpan Insight**
   - Sistem simpan insight dengan metadata lengkap
   - Insight muncul di list dengan color-coding severity

**Output**: Insight terdokumentasi untuk referensi

**Transisi**: Insight dapat digunakan untuk membuat rekomendasi (Phase 4)

---

#### **D. Review & Monitoring Berkala**

**Aktor**: Owner

**Proses:**

1. **Filter Insights**
   - Owner filter berdasarkan:
     - Snapshot tertentu
     - Severity (critical/attention/normal)
     - Actionable status

2. **Track Progress**
   - Owner review insights dari periode sebelumnya
   - Bandingkan dengan metrics periode current
   - Evaluasi apakah masalah sudah teratasi

3. **Edit/Delete Insights**
   - Owner bisa update insight jika ada informasi baru
   - Hapus insight yang sudah tidak relevan

**Output**: Knowledge base insights yang terus ter-update

---

## 🔗 TRANSISI ANTAR MODUL

### 1. **Operasional → Post-Operational**

**Trigger**: Owner ingin analisis performa

**Mekanisme**:
- Data operasional (orders, inventory, exceptions) tersimpan di database
- Owner membuat snapshot → sistem query & aggregate data operasional
- Data di-snapshot menjadi immutable untuk analisis
- Metrics dihitung berdasarkan data snapshot

**Data Flow**:
```
Orders Table → Snapshot Query → Data Snapshot Table
Inventory Transactions → Metric Calculation → Analytical Metrics Table
Exceptions → Aggregation → Insight Creation
```

---

### 2. **Snapshot → Metrics**

**Trigger**: Snapshot dibuat

**Mekanisme**:
- Sistem otomatis trigger `calculateAllMetrics()`
- Untuk setiap metric:
  - Query data dari snapshot
  - Hitung current value
  - Ambil baseline dari snapshot sebelumnya
  - Hitung variance & significance
  - Simpan ke `analytical_metrics` table

**Data Flow**:
```
Data Snapshot (period data) 
    ↓
MetricsCalculationService
    ↓
8 Metrics calculated
    ↓
Analytical Metrics Table (linked to snapshot_id)
```

---

### 3. **Metrics → Insights**

**Trigger**: Owner melihat metrics dan membuat insight

**Mekanisme**:
- Owner analisis metrics di dashboard
- Identifikasi pattern/anomaly
- Buat insight manual dengan:
  - Statement (interpretasi metrics)
  - Link ke metrics terkait
  - Severity assignment
  - Actionable flag

**Data Flow**:
```
Analytical Metrics (displayed in dashboard)
    ↓
Owner Analysis (manual)
    ↓
Insight Creation Form
    ↓
Insights Table (linked to snapshot_id & metrics)
```

---

### 4. **Insights → Recommendations** (Phase 4 - Future)

**Trigger**: LLM analyze insights

**Mekanisme** (Planned):
- LLM membaca insights + metrics
- Generate actionable recommendations
- Owner review & approve
- Recommendations menjadi tasks

**Data Flow** (Planned):
```
Insights + Metrics
    ↓
LLM Analysis (Gemma 3 4B)
    ↓
Recommendations Table
    ↓
Tasks Table (actionable items)
```

---

## 📊 CONTOH SKENARIO LENGKAP

### **Skenario: Analisis Performa Mingguan**

**Konteks**: Sudah 1 minggu operasional, Owner ingin evaluasi

**Timeline**:

#### **Hari 1-7: Operasional Normal**
- Admin terima 50 pesanan
- Staff proses semua pesanan
- 5 pesanan mengalami rewash (10% rewash rate)
- 3 pesanan breach SLA (6% breach rate)
- Inventory usage: 25kg deterjen, 15kg softener, 50 plastik

#### **Hari 8: Owner Analisis**

**Langkah 1: Buat Snapshot**
- Owner login → pilih "Weekly" period
- Sistem create snapshot "Minggu 1 - 2026"
- Sistem hitung metrics:
  - Total orders: 50
  - Total revenue: Rp 4,500,000
  - SLA Compliance: 94%
  - Rewash Rate: 10%
  - Contribution Margin: Rp 3,200,000 (71%)
  - Productivity: 7.14 orders/day

**Langkah 2: Lihat Dashboard**
- Owner buka analytics dashboard
- Pilih snapshot "Minggu 1 - 2026"
- Lihat 8 metric cards
- Identifikasi:
  - ⚠️ Rewash Rate 10% (attention - baseline 5%)
  - ✅ SLA Compliance 94% (normal)
  - ✅ Productivity 7.14 orders/day (normal)

**Langkah 3: Buat Insight**
- Owner klik "Buat Wawasan Baru"
- Tulis: "Tingkat rewash 10% lebih tinggi dari target 5%. Perlu investigasi apakah ada masalah dengan kualitas deterjen atau training staff baru."
- Severity: Perhatian
- Metrics: Rewash Rate, Contribution Margin
- Actionable: Yes
- Simpan

**Langkah 4: Action (Manual - Outside System)**
- Owner diskusi dengan Admin
- Cek kualitas deterjen
- Review training staff
- Buat SOP baru

#### **Hari 15: Review Progress**
- Owner buat snapshot "Minggu 2 - 2026"
- Sistem compare dengan "Minggu 1"
- Rewash rate turun jadi 6% (improvement!)
- Owner update insight: "Masalah teratasi setelah ganti supplier deterjen"

---

## 🎯 KEY TAKEAWAYS

### **Untuk Admin/Staff (Operasional)**:
1. Input data secara real-time saat operasional
2. Catat semua exceptions dengan detail
3. Update inventory usage setiap kali pakai
4. Pastikan status order selalu up-to-date

### **Untuk Owner (Post-Operational)**:
1. Buat snapshot berkala (weekly/monthly)
2. Review metrics untuk identifikasi masalah
3. Buat insights untuk dokumentasi knowledge
4. Gunakan insights untuk improve operasional

### **Separation of Concerns**:
- **Operasional**: Focus pada execution & data capture
- **Post-Operational**: Focus pada analysis & decision making
- **No Real-time Analytics**: Analytics dilakukan post-facto via snapshots
- **Manual Insights**: Owner yang interpret data, bukan sistem (pre-LLM)

---

## 📝 CATATAN IMPLEMENTASI

### **Yang Sudah Tersedia (Phase 1-3)**:
✅ Order management (CRUD)  
✅ Service management  
✅ Inventory management  
✅ Exception tracking  
✅ Data snapshots  
✅ Metric calculation (8 metrics)  
✅ Analytics dashboard  
✅ Manual insight creation  

### **Yang Belum Tersedia (Future Phases)**:
⏳ LLM-generated insights (Phase 4)  
⏳ Automated recommendations (Phase 4)  
⏳ Task management system (Phase 5)  
⏳ Inventory bundling & cost attribution (Phase 2.3)  

---

**Dokumen ini menjelaskan bagaimana sistem digunakan dalam operasional sehari-hari, dari penerimaan pesanan hingga analisis performa oleh Owner.**
