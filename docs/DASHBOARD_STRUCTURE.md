# Dashboard Structure
## Dashboard A: /admin/dashboard (Operational Dashboard)
Purpose: Quick operational overview for daily monitoring When shown: Default landing page when entering as admin

KPIs:

Total Orders: Jumlah order dalam periode (today/week/month)
Active Orders: Order yang sedang diproses (status: received → ready_for_pickup)
Completed: ⚠️ AMBIGU - Cucian yang sudah selesai diproses (status = 'completed')
Revenue: Total pendapatan yang sudah dibayar
Problem:

"Completed" = status 'completed' (cucian selesai diproses)
Bukan "transaksi selesai" (status 'closed')
Ketika order di-mark as pickup → closed, angka "Completed" turun karena status berubah dari 'completed' ke 'closed'

## Dashboard B: /admin/dashboard/operations (Operational Metrics)

Purpose: Advanced operational metrics & KPIs When shown: When clicking "Dashboard" in sidebar

KPIs:

Tingkat Kepatuhan SLA: Berapa persen order selesai tepat waktu
Tingkat Cuci Ulang: Berapa persen order yang perlu rewash
Tingkat Keluhan: Berapa persen customer complaint
Pesanan per Hari: Produktivitas harian
Rata-rata Waktu Proses: Average processing time
Tingkat Penyelesaian: Completion rate
Capacity Utilization: Berapa persen kapasitas terpakai
Contribution Margin: Profit margin per service

## Note: Operational Metrics view masih placeholder - akan diimplementasikan di phase berikutnya jika diperlukan.


## Operational Metrics (yang ada di Admin Dashboard / Phase 2.5):
Untuk Siapa: Manager Operasional / Admin.
Sifat Data: Real-time & "Hidup".
Tujuan: Monitoring hari ini/minggu ini. Contoh: "Apakah ada bottleneck sekarang?", "Berapa kapasitas kita hari ini?", "Apakah ada komplain yang belum selesai?".
Teknis: Mengambil data langsung dari tabel orders secara live.

## Owner Analytics (yang ada di Owner Dashboard / Phase 3):
Untuk Siapa: Pemilik Bisnis / Investor.
Sifat Data: Snapshot (Beku).
Tujuan: Analisis Strategis Jangka Panjang. Contoh: "Berapa profitabilitas bulan lalu dibanding 3 bulan lalu?", "Apakah tren variance inventory memburuk?", "Apakah rekomendasi efisiensi bulan lalu berhasil?".
Teknis: Menggunakan tabel data_snapshots dan analytical_metrics. Data dibekukan agar laporan keuangan/performa tidak berubah-ubah jika ada edit data lama.
Simplenya:

Admin Dashboard: "Apa yang terjadi sekarang?" (Monitoring)
Owner Dashboard: "Apa yang terjadi bulan lalu dan apa strategi kedepan?" (Evaluasi & Planning)