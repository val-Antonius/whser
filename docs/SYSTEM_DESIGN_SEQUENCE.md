# Perancangan Sistem: Sequence## 1. Pemrosesan Pesanan (Order Processing)

### A. Pengantar
Proses pemenuhan pesanan (*order fulfillment*) merupakan alur kerja inti dalam operasional binis laundry. Alur ini mencakup validasi input, pengecekan ketersediaan stok inventaris (seperti deterjen), pencatatan transaksi ke basis data, hingga penanganan pengecualian (*exception handling*) jika terjadi kesalahan stok atau kegagalan sistem. Diagram ini menggambarkan bagaimana sistem menjamin integritas data stok dan pesanan secara *real-time*.

### B. Penjelasan Diagram
1.  **Inisiasi Pesanan**: Aktor (Admin/Staf) memasukkan rincian pesanan melalui antarmuka **POS UI**. Data ini dikirim ke API Layer sebagai permintaan `POST /api/orders`.
2.  **Validasi & Bisnis Logik**: **OrderService** menerima data dan melakukan validasi. Sebelum menyimpan pesanan, layanan ini memanggil **InventoryService** untuk memeriksa `checkStockAvailability()`.
    *   *Skenario Alternatif (Alt)*: Jika stok tidak mencukupi, sistem mengembalikan *Error* dan UI menampilkan peringatan kepada pengguna, membatalkan transaksi untuk mencegah stok negatif.
3.  **Persistensi Data**: Jika stok tersedia, pesanan disimpan ke tabel `orders` dan `order_items`. Sistem mengembalikan respon sukses (HTTP 201) ke antarmuka pengguna.
4.  **Pembaruan Status  Diagram

Dokumen ini menjelaskan alur interaksi antar objek dalam sistem Whser Laundry Management berdasarkan pola arsitektur *Model-View-Controller* (MVC). Setiap diagram merepresentasikan *use case* utama yang menangani logika bisnis kritikal.

---

& Konsumsi Material**: Saat status pesanan diperbarui menjadi 'In Wash' (sedang dicuci):
    *   Sistem mencatat 'Exception' jika terjadi kendala mesin.
    *   **InventoryService** secara otomatis mencatat pengurangan stok (*consumption*) ke tabel `inventory_transactions` dan memperbarui saldo `inventory_items`.

### C. Diagram
```mermaid
sequenceDiagram
    actor Staff as Admin/Staf Laundry
    participant UI as View (POS UI)
    participant API as Controller (/api/orders)
    participant OrderService as Model Service (Order)
    participant InvService as Model Service (Inventory)
    participant DB as Database

    %% Order Creation Loop
    Note over Staff, UI: Fase Pembuatan Pesanan
    Staff->>UI: Input Detail Pesanan (Item, Layanan)
    UI->>API: POST /api/orders
    activate API
    API->>OrderService: createOrder(input)
    activate OrderService
    
    OrderService->>InvService: checkStockAvailability()
    activate InvService
    
    alt Stok Tidak Mencukupi
        InvService-->>OrderService: Return Error (Insufficient Stock)
        OrderService-->>API: Throw Exception
        API-->>UI: Response 400 Bad Request
        UI-->>Staff: Tampilkan Alert "Stok Habis"
    else Stok Tersedia
        InvService-->>OrderService: Return True
        OrderService->>DB: INSERT INTO orders
        OrderService->>DB: INSERT INTO order_items
        OrderService-->>API: Return Order Object
        API-->>UI: Response 201 Created
        UI-->>Staff: Tampilkan Sukses & Cetak Struk
    end
    deactivate InvService
    deactivate OrderService
    deactivate API

    %% Processing Loop
    Note over Staff, UI: Fase Proses Pencucian
    Staff->>UI: Update Status ('In Wash')
    UI->>API: PUT /api/orders/{id}/status
    activate API
    API->>OrderService: updateStatus(id, 'in_wash')
    activate OrderService
    
    %% Exception Handling Logic
    opt Jika Terjadi Kendala (Exception)
        OrderService->>DB: INSERT INTO order_exceptions
        OrderService->>DB: UPDATE orders SET notes='Machine Issue'
    end

    %% Auto-consumption logic
    OrderService->>InvService: recordConsumption(orderId)
    activate InvService
    InvService->>DB: INSERT INTO inventory_transactions (Type: OUT)
    InvService->>DB: UPDATE inventory_items SET current_stock = new_val
    InvService-->>OrderService: Acknowledge
    deactivate InvService

    OrderService->>DB: UPDATE orders SET current_status='in_wash'
    OrderService-->>API: Return Updated Status
    deactivate OrderService
    API-->>UI: Response 200 OK
    deactivate API
```

---

## 2. Penyesuaian Stok (Inventory Adjustment)

### A. Pengantar
Manajemen inventaris memerlukan mekanisme koreksi manual untuk menangani perbedaan antara stok fisik dan stok sistem (misalnya akibat kerusakan barang, kehilangan, atau hasil *stock opname*). Alur ini memastikan bahwa setiap perubahan saldo stok tercatat secara akuntabel dengan alasan yang jelas, menjaga integritas audit *trail* sistem.

### B. Penjelasan Diagram
1.  **Input Koreksi**: Staf memilih *item* inventaris pada **Inventory UI** dan memasukkan jumlah penyesuaian beserta alasannya (misal: "Botol Pecah").
2.  **Kalkulasi Ulang**: API meneruskan permintaan ke **InventoryService**. Layanan ini mengambil saldo `current_stock` saat ini dari basis data.
3.  **Pencatatan Transaksi**: Sistem menghitung saldo baru dan melakukan dua operasi atomik:
    *   Menyimpan riwayat di tabel `inventory_transactions` untuk rekam jejak.
    *   Memperbarui nilai `current_stock` pada tabel induk `inventory_items`.
4.  **Umpan Balik**: Saldo terbaru dikembalikan ke UI untuk memperbarui tampilan stok secara instan tanpa perlu memuat ulang halaman.

### C. Diagram
```mermaid
sequenceDiagram
    actor Staff as Admin Inventaris
    participant UI as View (Inventory UI)
    participant API as Controller (/api/inventory)
    participant InvService as Model Service (Inventory)
    participant DB as Database

    Staff->>UI: Submit Penyesuaian (Item, Qty, Alasan)
    UI->>API: POST /api/inventory/transactions
    activate API
    API->>InvService: createTransaction(input)
    activate InvService
    
    InvService->>DB: SELECT current_stock FROM inventory_items WHERE id=?
    DB-->>InvService: Return current_stock
    
    Note right of InvService: Kalkulasi: Stock Akhir = Awal + Penyesuaian
    
    par Atomic Transaction
        InvService->>DB: INSERT INTO inventory_transactions
        InvService->>DB: UPDATE inventory_items SET current_stock = new_val
    end
    
    InvService-->>API: Return Transaction & Snapshot
    deactivate InvService
    
    API-->>UI: Response 200 OK
    deactivate API
    UI->>Staff: Render Saldo Stok Baru
```

---

## 3. Pembuatan Snapshot Data (Data Aggregation)

### A. Pengantar
Sistem analitik Whser bekerja berdasarkan prinsip *snapshot*, yaitu pembekuan data operasional dalam periode tertentu (harian/mingguan) menjadi data metrik statis. Proses ini krusial untuk mencegah beban kinerja pada basis data transaksional saat pemilik melakukan analisis historis yang kompleks.

### B. Penjelasan Diagram
1.  **Pemicu Snapshot**: Pemilik memicu pembuatan snapshot melalui **Dashboard UI** (atau dijadwalkan oleh sistem).
2.  **Inisialisasi**: **SnapshotService** membuat entri baru di tabel `data_snapshots` dengan status awal 'processing' untuk menandai proses sedang berjalan.
3.  **Kalkulasi Metrik (Asinkron)**:
    *   Layanan memanggil **MetricsCalculationService** untuk menghitung berbagai KPI (Key Performance Indicators) seperti SLA Compliance, Pendapatan, dan Variansi Stok.
    *   Layanan ini melakukan *query* agregat berat ke tabel operasional (`orders`, `inventory`).
    *   Hasil kalkulasi disimpan ke tabel `analytical_metrics` sebagai data statis.
4.  **Finalisasi**: Setelah semua kalkulasi selesai, status snapshot dikunci ('locked') untuk menjamin data tidak berubah lagi, sehingga valid untuk analisis jangka panjang.

### C. Diagram
```mermaid
sequenceDiagram
    actor Owner as Pemilik Bisnis
    participant UI as View (Dashboard)
    participant API as Controller (/api/snapshots)
    participant SnapService as Service (Snapshot)
    participant MetricService as Service (MetricEngine)
    participant DB as Database

    Owner->>UI: Klik "Buat Snapshot Baru"
    UI->>API: POST /api/analytics/snapshots
    activate API
    API->>SnapService: createSnapshot(periodType)
    activate SnapService
    
    SnapService->>DB: INSERT INTO data_snapshots (status='processing')
    
    Note right of SnapService: Proses Kalkulasi & Agregasi Data
    
    loop Untuk Setiap Kategori Metrik
        SnapService->>MetricService: calculateAllMetrics(snapshotId)
        activate MetricService
        MetricService->>DB: QUERY Aggregation (Orders, Inventory)
        DB-->>MetricService: Return Raw Data Rows
        MetricService->>MetricService: Compute Logic (Formula KPI)
        MetricService->>DB: INSERT INTO analytical_metrics
        deactivate MetricService
    end

    SnapService->>DB: UPDATE data_snapshots SET status='locked'
    SnapService-->>API: Return Snapshot Object
    deactivate SnapService
    
    API-->>UI: Response 201 Created
    deactivate API
    UI->>Owner: Tampilkan Laporan Kinerja Baru
```

---

## 4. Pembuatan Wawasan Cerdas (AI Insight Generation)

### A. Pengantar
Fitur ini memanfaatkan *Large Language Model* (LLM) Gemma 2 4B via Ollama untuk menganalisis data metrik yang telah dibentuk dalam proses Snapshot. Tujuannya adalah menerjemahkan angka statistik menjadi narasi bisnis kualitatif dan rekomendasi strategis yang mudah dipahami oleh pemilik usaha.

### B. Penjelasan Diagram
1.  **Permintaan Analisis**: Pemilik meminta analisis AI pada snapshot tertentu.
2.  **Pengambilan Konteks**: **InsightService** mengambil seluruh data metrik dari basis data untuk snapshot tersebut dan memformatnya menjadi *prompt* JSON terstruktur.
3.  **Inferensi AI**:
    *   Data dikirim ke **OllamaWrapper** yang berinteraksi dengan model lokal.
    *   Model melakukan penalaran (reasoning) untuk mengidentifikasi anomali, tren positif/negatif, dan akar masalah.
4.  **Penyimpanan Wawasan**: Respon dari AI disimpan ke tabel `insights` dengan atribut keparahan (*severity*) dan kategori, siap untuk ditampilkan atau ditindaklanjuti menjadi tugas.

### C. Diagram
```mermaid
sequenceDiagram
    actor Owner as Pemilik Bisnis
    participant UI as View (Insight UI)
    participant API as Controller (/api/insights)
    participant InsightService as Service (Insight)
    participant Ollama as AI Adapter (OllamaWrapper)
    participant DB as Database

    Owner->>UI: Klik "Generate AI Insights"
    UI->>API: POST /api/analytics/insights/generate
    activate API
    API->>InsightService: generateAIInsights(snapshotId)
    activate InsightService
    
    %% Context Retrieval
    InsightService->>DB: SELECT * FROM analytical_metrics WHERE snapshot_id=...
    DB-->>InsightService: Return Metrics Data (JSON)
    
    %% AI Processing
    InsightService->>Ollama: Send Prompt (Metrics Context + Instructions)
    activate Ollama
    Note right of Ollama: Model Menganalisis Pola & Variansi
    Ollama-->>InsightService: Return Analysis (Array of Insights JSON)
    deactivate Ollama

    %% Persistence
    loop Simpan Setiap Wawasan
        InsightService->>DB: INSERT INTO insights (source='llm', severity=...)
    end
    
    InsightService-->>API: Return Success Count
    deactivate InsightService
    
    API-->>UI: Response 200 OK
    deactivate API
    UI->>Owner: Tampilkan Kartu Wawasan & Rekomendasi
```

---

## 5. Manajemen & Efektivitas Tugas (Task Effectiveness)

### A. Pengantar
Siklus perbaikan berkelanjutan (*continuous improvement*) ditutup dengan mengubah wawasan menjadi tindakan nyata (Talk). Diagram ini mendemonstrasikan alur kerja lengkap: mulai dari Pemilik membuat tugas berdasarkan wawasan, Admin menyelesaikan tugas tersebut, hingga sistem memverifikasi apakah tindakan tersebut efektif meningkatkan metrik kinerja.

### B. Penjelasan Diagram
1.  **Delegasi Tugas**: Pemilik membuat tugas baru yang terhubung langsung dengan `insight_id`. Tugas ini didelegasikan kepada Admin.
2.  **Eksekusi Operasional**: Admin melihat tugas di papan kerjanya, menandai 'In Progress', melakukan perbaikan di lapangan, dan akhirnya menandai 'Resolved'.
3.  **Verifikasi Sistem**:
    *   Setelah tugas selesai, Pemilik melakukan pengecekan efektivitas (`checkEffectiveness`).
    *   Sistem membandingkan nilai metrik pada saat masalah ditemukan (*Origin Metric*) dengan nilai metrik pada snapshot terbaru (*Current Metric*).
    *   Selisih (*Improvement*) ditampilkan untuk membuktikan ROI dari tindakan perbaikan tersebut.

### C. Diagram
```mermaid
sequenceDiagram
    actor Owner as Pemilik (Strategis)
    actor Admin as Admin (Eksekutor)
    participant UI as View (Task UI)
    participant API as Controller (/api/tasks)
    participant DB as Database
    participant EffectAPI as Controller (Effectiveness)

    %% Fase 1: Delegasi (Creation)
    Note over Owner, DB: Fase Delegasi & Pembuatan Tugas
    Owner->>UI: Klik "Buat Tugas" pada Insight
    UI->>API: POST /api/tasks
    activate API
    API->>DB: INSERT INTO tasks (insight_id, assigned_to, status='open')
    API-->>UI: Response 201 Created
    deactivate API

    %% Fase 2: Eksekusi (Resolution)
    Note over Admin, DB: Fase Eksekusi Lapangan
    Admin->>UI: Buka Daftar Tugas
    UI->>API: GET /api/tasks
    API-->>UI: Return Task List
    
    Admin->>UI: Update Status (Resolved)
    UI->>API: PUT /api/tasks/{id} (status='resolved')
    activate API
    API->>DB: UPDATE tasks SET completed_at=NOW(), status='resolved'
    API-->>UI: Response 200 OK
    deactivate API

    %% Fase 3: Validasi (Verification)
    Note over Owner, EffectAPI: Fase Validasi Dampak
    Owner->>UI: Klik "Cek Efektivitas"
    UI->>EffectAPI: GET /api/tasks/{id}/effectiveness
    activate EffectAPI
    
    EffectAPI->>DB: SELECT origin_metric FROM insights WHERE id=task.insight_id
    EffectAPI->>DB: SELECT metric_value FROM analytical_metrics (Snapshot Terbaru)
    
    Note right of EffectAPI: Bandingkan: Nilai Awal vs Nilai Akhir
    
    EffectAPI-->>UI: Return JSON { improvement: +15%, is_positive: true }
    deactivate EffectAPI
    UI->>Owner: Tampilkan Popup Analisis Dampak
```
