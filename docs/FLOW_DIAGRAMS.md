# Diagram Alur Sistem
## Warehouse Laundry Management System

**Versi**: 1.0  
**Tanggal**: 2026-01-25

---

## 🔄 DIAGRAM ALUR OPERASIONAL LENGKAP

```mermaid
graph TB
    subgraph "APLIKASI OPERASIONAL - Daily Operations"
        A[Admin Login] --> B[Dashboard Operasional]
        B --> C{Aktivitas Harian}
        
        C -->|Pesanan Baru| D[Create Order]
        D --> D1[Input Customer Data]
        D1 --> D2[Pilih Service]
        D2 --> D3[Input Berat & Harga]
        D3 --> D4[Set Target Completion]
        D4 --> D5[Status: PENDING]
        
        C -->|Proses Cucian| E[Start Processing]
        D5 --> E
        E --> E1[Status: IN_PROGRESS]
        E1 --> E2[Catat Inventory Usage]
        E2 --> E3{Ada Masalah?}
        E3 -->|Ya| E4[Catat Exception]
        E3 -->|Tidak| E5[Lanjut QC]
        E4 --> E5
        
        E5 --> F[Quality Check]
        F --> F1{QC Pass?}
        F1 -->|Tidak| E4
        F1 -->|Ya| F2[Packaging]
        F2 --> F3[Catat Inventory Usage]
        F3 --> F4[Status: COMPLETED]
        
        F4 --> G[Delivery/Pickup]
        G --> G1[Status: DELIVERED]
        G1 --> G2[Catat Payment]
        
        C -->|Kelola Inventory| H[Inventory Management]
        H --> H1[Monitor Stock]
        H1 --> H2{Low Stock?}
        H2 -->|Ya| H3[Restock]
        H2 -->|Tidak| H1
        
        G2 --> Z1[(Database Operasional)]
        E2 --> Z1
        F3 --> Z1
        H3 --> Z1
    end
    
    subgraph "APLIKASI POST-OPERATIONAL - Analytics & Insights"
        I[Owner Login] --> J[Dashboard Analytics]
        
        J --> K[Buat Snapshot]
        Z1 -.Data Query.-> K
        K --> K1[Pilih Periode]
        K1 --> K2[Generate Snapshot]
        K2 --> K3[Calculate 8 Metrics]
        K3 --> K4[Compare with Baseline]
        K4 --> K5[Determine Significance]
        K5 --> Z2[(Snapshot Data - Immutable)]
        
        Z2 --> L[Analytics Dashboard]
        L --> L1[View Metric Cards]
        L1 --> L2{Drill-down?}
        L2 -->|Ya| L3[View Metric Detail]
        L2 -->|Tidak| L1
        
        L3 --> M[Identifikasi Masalah]
        M --> N[Buat Insight Manual]
        N --> N1[Tulis Statement]
        N1 --> N2[Set Severity]
        N2 --> N3[Link Metrics]
        N3 --> N4[Mark Actionable]
        N4 --> Z3[(Insights Table)]
        
        Z3 --> O[Review Insights]
        O --> O1{Filter Insights}
        O1 --> O2[Track Progress]
        O2 --> O3[Edit/Delete Insights]
        
        O3 -.Manual Action.-> P[Improve Operations]
        P -.Feedback Loop.-> A
    end
    
    style A fill:#e1f5ff
    style I fill:#fff4e1
    style Z1 fill:#f0f0f0
    style Z2 fill:#f0f0f0
    style Z3 fill:#f0f0f0
    style D5 fill:#ffeb3b
    style E1 fill:#ff9800
    style F4 fill:#4caf50
    style G1 fill:#2196f3
```

---

## 📊 DIAGRAM DATA FLOW

```mermaid
graph LR
    subgraph "Operational Data Capture"
        A1[Orders] --> DB1[(orders table)]
        A2[Inventory Transactions] --> DB2[(inventory_transactions)]
        A3[Exceptions] --> DB3[(exceptions)]
        A4[Services] --> DB4[(services)]
    end
    
    subgraph "Snapshot Creation"
        DB1 --> S1[Query Period Data]
        DB2 --> S1
        DB3 --> S1
        DB4 --> S1
        S1 --> S2[Aggregate Data]
        S2 --> S3[Create Snapshot]
        S3 --> DB5[(data_snapshots)]
    end
    
    subgraph "Metric Calculation"
        DB5 --> M1[Calculate SLA Compliance]
        DB5 --> M2[Calculate Rewash Rate]
        DB5 --> M3[Calculate Exception Freq]
        DB5 --> M4[Calculate Contribution Margin]
        DB5 --> M5[Calculate Inventory Variance]
        DB5 --> M6[Calculate Productivity]
        DB5 --> M7[Calculate Capacity Util]
        DB5 --> M8[Calculate Order Aging]
        
        M1 --> M9[Get Baseline]
        M2 --> M9
        M3 --> M9
        M4 --> M9
        M5 --> M9
        M6 --> M9
        M7 --> M9
        M8 --> M9
        
        M9 --> M10[Calculate Variance]
        M10 --> M11[Determine Significance]
        M11 --> DB6[(analytical_metrics)]
    end
    
    subgraph "Insight Creation"
        DB6 --> I1[Display in Dashboard]
        I1 --> I2[Owner Analysis]
        I2 --> I3[Manual Insight Creation]
        I3 --> DB7[(insights)]
    end
    
    subgraph "Future: LLM Integration"
        DB6 -.-> L1[LLM Analysis]
        DB7 -.-> L1
        L1 -.-> L2[Generate Recommendations]
        L2 -.-> DB8[(recommendations)]
        DB8 -.-> L3[Create Tasks]
        L3 -.-> DB9[(tasks)]
    end
    
    style DB1 fill:#e3f2fd
    style DB2 fill:#e3f2fd
    style DB3 fill:#e3f2fd
    style DB4 fill:#e3f2fd
    style DB5 fill:#fff3e0
    style DB6 fill:#fff3e0
    style DB7 fill:#e8f5e9
    style DB8 fill:#f3e5f5,stroke-dasharray: 5 5
    style DB9 fill:#f3e5f5,stroke-dasharray: 5 5
    style L1 stroke-dasharray: 5 5
    style L2 stroke-dasharray: 5 5
    style L3 stroke-dasharray: 5 5
```

---

## 🔗 DIAGRAM TRANSISI MODUL

```mermaid
stateDiagram-v2
    [*] --> OperationalApp: Admin/Staff Login
    
    state OperationalApp {
        [*] --> OrderManagement
        OrderManagement --> InventoryManagement
        InventoryManagement --> ExceptionTracking
        ExceptionTracking --> OrderManagement
        
        state OrderManagement {
            [*] --> Pending
            Pending --> InProgress: Start Processing
            InProgress --> Completed: QC Pass
            Completed --> Delivered: Customer Pickup
            Delivered --> [*]
        }
    }
    
    OperationalApp --> DataStorage: Continuous Data Capture
    
    state DataStorage {
        [*] --> OperationalDB
        OperationalDB --> [*]
    }
    
    DataStorage --> PostOperationalApp: Owner Creates Snapshot
    
    state PostOperationalApp {
        [*] --> SnapshotCreation
        SnapshotCreation --> MetricCalculation: Auto-trigger
        MetricCalculation --> AnalyticsDashboard: Display Metrics
        AnalyticsDashboard --> InsightCreation: Owner Analysis
        InsightCreation --> InsightManagement: Save Insight
        InsightManagement --> [*]
    }
    
    PostOperationalApp --> OperationalApp: Feedback Loop (Manual)
    
    note right of DataStorage
        Separation of Concerns:
        - Operational data immutable
        - Snapshots are point-in-time
        - No real-time analytics
    end note
    
    note right of PostOperationalApp
        Pre-LLM Phase:
        - Manual insight creation
        - Owner interprets metrics
        - No automated recommendations
    end note
```

---

## 📈 DIAGRAM METRIC CALCULATION FLOW

```mermaid
flowchart TD
    A[Snapshot Created] --> B{For Each Metric}
    
    B --> C1[SLA Compliance Rate]
    B --> C2[Order Aging Critical %]
    B --> C3[Rewash Rate]
    B --> C4[Exception Frequency]
    B --> C5[Contribution Margin]
    B --> C6[Inventory Variance]
    B --> C7[Productivity]
    B --> C8[Capacity Utilization]
    
    C1 --> D1[Query: SLA breaches vs total orders]
    C2 --> D2[Query: Orders > 72 hours]
    C3 --> D3[Query: Rewash exceptions]
    C4 --> D4[Query: All exceptions]
    C5 --> D5[Query: Revenue - Inventory costs]
    C6 --> D6[Query: Inventory variance]
    C7 --> D7[Query: Orders per day]
    C8 --> D8[Query: Orders vs capacity]
    
    D1 --> E1[Calculate: 1 - breaches/total]
    D2 --> E2[Calculate: critical/total * 100]
    D3 --> E3[Calculate: rewash/total * 100]
    D4 --> E4[Calculate: exceptions/total]
    D5 --> E5[Calculate: revenue - costs]
    D6 --> E6[Calculate: avg variance]
    D7 --> E7[Calculate: total/days]
    D8 --> E8[Calculate: actual/capacity]
    
    E1 --> F[Get Baseline Value]
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F
    E6 --> F
    E7 --> F
    E8 --> F
    
    F --> G[Calculate Variance]
    G --> H{Determine Significance}
    
    H -->|Variance < 10%| I1[Normal]
    H -->|10% <= Variance < 25%| I2[Attention]
    H -->|Variance >= 25%| I3[Critical]
    
    I1 --> J[Save to analytical_metrics]
    I2 --> J
    I3 --> J
    
    J --> K[Link to snapshot_id]
    K --> L[Display in Dashboard]
    
    style A fill:#e1f5ff
    style F fill:#fff3e0
    style H fill:#ffeb3b
    style I1 fill:#4caf50
    style I2 fill:#ff9800
    style I3 fill:#f44336
    style L fill:#e8f5e9
```

---

## 🎯 DIAGRAM USER JOURNEY

```mermaid
journey
    title Operational & Post-Operational User Journey
    section Morning - Admin
        Login to system: 5: Admin
        Check pending orders: 4: Admin
        Review inventory: 4: Admin
        Identify low stock: 3: Admin
    section Customer Arrives
        Create new order: 5: Admin
        Input customer data: 4: Admin
        Select service: 5: Admin
        Weigh laundry: 5: Admin
        Print receipt: 5: Admin
    section Processing - Staff
        Start processing: 5: Staff
        Record inventory usage: 3: Staff
        Wash laundry: 5: Staff
        Note exceptions: 2: Staff
    section Quality Check
        QC inspection: 4: Staff
        Package laundry: 5: Staff
        Mark completed: 5: Staff
    section Delivery
        Customer pickup: 5: Admin
        Process payment: 5: Admin
        Mark delivered: 5: Admin
    section Weekly Analysis - Owner
        Login to analytics: 5: Owner
        Create snapshot: 4: Owner
        Review metrics: 5: Owner
        Identify issues: 3: Owner
        Create insights: 4: Owner
        Plan improvements: 5: Owner
```

---

## 🔄 DIAGRAM FEEDBACK LOOP

```mermaid
graph TB
    subgraph "Continuous Improvement Cycle"
        A[Operasional Harian] --> B[Data Capture]
        B --> C[Snapshot Creation]
        C --> D[Metric Calculation]
        D --> E[Owner Analysis]
        E --> F[Insight Creation]
        F --> G{Actionable?}
        
        G -->|Ya| H[Manual Action]
        G -->|Tidak| I[Knowledge Base]
        
        H --> J[Improve Process]
        J --> K[Update SOP]
        K --> L[Train Staff]
        L --> A
        
        I --> M[Reference for Future]
        M --> E
    end
    
    style A fill:#e3f2fd
    style E fill:#fff3e0
    style F fill:#e8f5e9
    style H fill:#ffeb3b
    style J fill:#4caf50
```

---

**Diagram-diagram ini melengkapi dokumentasi OPERATIONAL_WORKFLOW.md dengan visualisasi yang lebih jelas tentang alur sistem.**
