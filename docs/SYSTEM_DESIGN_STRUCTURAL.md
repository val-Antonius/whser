# Perancangan Sistem: Diagram Struktural

Dokumen ini memetakan arsitektur data dan struktur kode program dari platform Whser Laundry Management. Diagram ini mencakup desain basis data relasional (ERD) dan struktur kelas perangkat lunak (Class Diagram).

---

## 1. Entity Relationship Diagram (ERD)

### A. Pengantar
Perancangan basis data sistem ini memisahkan secara tegas antara **Data Operasional** (transaksional, *real-time*) dengan **Data Analitik** (historis, statis). Pendekatan ini dipilih untuk menjaga performa aplikasi kasir (POS) tetap optimal saat volume data membesar, sembari memungkinkan analisis data yang kompleks di sisi manajemen. 
Tabel `tasks` berfungsi sebagai jembatan penghubung yang mengubah wawasan analitik menjadi aksi operasional yang dapat dilacak.

### B. Penjelasan Diagram
1.  **Zona Operasional (Core)**:
    *   Entitas `ORDERS` adalah pusat transaksi yang terhubung dengan `CUSTOMERS` (pelanggan) dan `SERVICES` (layanan).
    *   Setiap pesanan memiliki detail item (`ORDER_ITEMS`) dan riwayat status (`ORDER_STATUS_LOGS`) untuk pelacakan alur kerja.
    *   Manajemen inventaris dikelola melalui relasi `INVENTORY_ITEMS` dan `INVENTORY_TRANSACTIONS` untuk mencatat keluar-masuk barang.
2.  **Zona Analitik**:
    *   `DATA_SNAPSHOTS` menyimpan rekam data berkala. Satu snapshot memiliki banyak `ANALYTICAL_METRICS` (KPI).
    *   `INSIGHTS` adalah hasil analisis cerdas yang dihasilkan dari snapshot tersebut.
3.  **Jembatan Aksi**:
    *   `TASKS` menghubungkan `INSIGHTS` (masalah yang ditemukan) dengan `USERS` (staf yang ditugaskan), memungkinkan siklus "Data ke Aksi".

### C. Diagram
```mermaid
erDiagram
    %% USERS & ROLES
    USERS {
        int id PK
        string role "Enum: Admin, Owner"
        string email
        boolean is_active
    }

    %% ZONA OPERASIONAL
    CUSTOMERS ||--o{ ORDERS : places
    SERVICES ||--o{ ORDERS : defines
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o{ ORDER_STATUS_LOGS : tracks
    
    CUSTOMERS {
        int id PK
        string segment "VIP, Regular"
        json preferences
    }

    SERVICES {
        int id PK
        string service_type
        decimal base_price
    }

    ORDERS {
        int id PK
        int customer_id FK
        string current_status
        boolean sla_breach
    }

    %% MODUL INVENTARIS
    INVENTORY_ITEMS ||--o{ INVENTORY_TRANSACTIONS : has
    ORDERS ||--o{ INVENTORY_TRANSACTIONS : consumptions
    
    INVENTORY_ITEMS {
        int id PK
        string item_name
        int current_stock
        int min_stock
    }

    %% ZONA ANALITIK & AI
    DATA_SNAPSHOTS ||--|{ ANALYTICAL_METRICS : contains
    DATA_SNAPSHOTS ||--o{ INSIGHTS : generates
    
    DATA_SNAPSHOTS {
        int id PK
        date period_start
        date period_end
        boolean is_locked
    }

    ANALYTICAL_METRICS {
        int id PK
        string metric_name
        float value
        float baseline_value
    }

    INSIGHTS {
        int id PK
        text statement
        enum generated_by "LLM, Rule, Manual"
        enum severity "Critical, Attention"
    }

    %% MANAJEMEN TUGAS (BRIDGE)
    INSIGHTS ||--o{ TASKS : triggers
    USERS ||--o{ TASKS : assigned_to

    TASKS {
        int id PK
        int insight_id FK
        int assigned_to FK
        enum status "Open, Resolved"
        datetime completed_at
        text completion_notes
    }
```

---

## 2. Class Diagram

### A. Pengantar
Sistem dikembangkan menggunakan arsitektur berorientasi layanan (*Service-Oriented Architecture*). Logika bisnis dienkapsulasi ke dalam kelas-kelas *Service* yang terpisah dari *Controller* (API Layer) dan *Data Models*. Hal ini meningkatkan *maintainability* dan memudahkan pengujian unit. Kelas khusus seperti `OllamaWrapper` bertindak sebagai adaptor untuk komunikasi dengan layanan AI eksternal.

### B. Penjelasan Diagram
1.  **Core Services**:
    *   `OrderService`: Menangani siklus hidup pesanan. Memiliki dependensi ke `InventoryService` untuk pengecekan stok.
    *   `InventoryService`: Mengelola transaksi stok atomik dan kalkulasi konsumsi bahan baku.
2.  **Analytics Services**:
    *   `SnapshotService`: Orkutrator pembuatan snapshot yang memanggil `MetricsCalculationService`.
    *   `MetricsCalculationService`: Berisi algoritma murni untuk menghitung KPI (misal: *Return on Investment* atau Tingkat Kepatuhan SLA).
    *   `InsightService`: Mengelola pembuatan wawasan, baik manual maupun via AI.
3.  **AI Integration**:
    *   `OllamaWrapper`: Kelas utilitas yang menangani komunikasi HTTP ke model LLM lokal, termasuk pembentukan *prompt*.
4.  **Relasi**: Diagram menunjukkan bagaimana `InsightService` bergantung pada data dari `SnapshotService`, dan bagaimana `OrderService` bergantung pada validasi dari `InventoryService`.

### C. Diagram
```mermaid
classDiagram
    %% Core Services
    class OrderService {
        +createOrder(input: CreateOrderInput) Order
        +updateStatus(id: number, status: OrderStatus) void
        +getOrdersByDate(date: Date) Order[]
        -validateOrderRules(order: Order) boolean
    }

    class InventoryService {
        +checkAvailability(items: OrderItem[]) boolean
        +recordTransaction(input: StockTransactionInput) void
        +getLowStockItems() InventoryItem[]
        +calculateConsumption(orderId: number) void
    }

    %% Analytics Module
    class SnapshotService {
        +createSnapshot(period: PeriodType) DataSnapshot
        +lockSnapshot(id: number) void
        +getLatestSnapshot() DataSnapshot
    }

    class MetricsCalculationService {
        +calculateAllMetrics(snapshotId: number) MetricResult[]
        -calculateSLACompliance(start, end) MetricResult
        -calculateRevenueRetention(start, end) MetricResult
        -calculateInventoryVariance(start, end) MetricResult
    }

    class InsightService {
        +generateManualInsight(input: InsightInput) Insight
        +generateAIInsights(snapshotId: number) Insight[]
        +getInsightsBySeverity(level: SignificanceLevel) Insight[]
    }

    %% AI Wrapper
    class OllamaWrapper {
        -modelName: string
        +generateCompletion(prompt: string) string
        +analyzeMetrics(metrics: Metric[]) Insight[]
    }

    %% Service Relationships
    OrderService ..> InventoryService : uses (Dependency)
    SnapshotService ..> MetricsCalculationService : composed_of
    InsightService ..> SnapshotService : analyzes
    InsightService ..> OllamaWrapper : delegates
    
    %% Data Models (DTOs)
    class Order {
        +id: number
        +status: OrderStatus
        +items: OrderItem[]
        +calculateTotal() number
    }

    class DataSnapshot {
        +id: number
        +metrics: AnalyticalMetric[]
        +is_locked: boolean
    }

    class Insight {
        +statement: string
        +source: AnalysisSource
        +tasks: Task[]
    }
```
