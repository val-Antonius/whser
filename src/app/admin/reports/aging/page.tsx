'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AgingOrder {
    id: number;
    order_number: string;
    current_status: string;
    stage_group: string;
    is_priority: boolean;
    total_aging_hours: number;
    created_at: string;
    estimated_price: number;
    customer_name: string;
    service_name: string;
}

interface AgingStats {
    total_orders: number;
    critical: number;
    warning: number;
    priority_count: number;
    avg_aging: number;
}

export default function OrderAgingReportPage() {
    const [orders, setOrders] = useState<AgingOrder[]>([]);
    const [stats, setStats] = useState<AgingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('active'); // Default to active only
    const [priorityFilter, setPriorityFilter] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');

    useEffect(() => {
        fetchAgingReport();
    }, [statusFilter, priorityFilter, minAge, maxAge]);

    const fetchAgingReport = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);
            if (minAge) params.append('min_age', minAge);
            if (maxAge) params.append('max_age', maxAge);

            const response = await fetch(`/api/reports/aging-v2?${params.toString()}`);
            if (!response.ok) throw new Error('Gagal mengambil laporan aging');

            const result = await response.json();
            if (result.success) {
                setOrders(result.data.orders);
                setStats(result.data.stats);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const getAgingColor = (hours: number) => {
        if (hours > 72) return 'bg-red-100 text-red-800 border-red-300';
        if (hours > 48) return 'bg-orange-100 text-orange-800 border-orange-300';
        if (hours > 24) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        return 'bg-green-100 text-green-800 border-green-300';
    };

    const getAgingLabel = (hours: number) => {
        if (hours > 72) return 'Kritis (>72h)';
        if (hours > 48) return 'Warning (>48h)';
        if (hours > 24) return 'Normal (>24h)';
        return 'Baru (<24h)';
    };

    const formatDuration = (hours: number) => {
        if (!hours) return '0j';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        return `${Math.round(hours)} Jam`;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Laporan Aging Pesanan</h1>
                <p className="text-gray-600">Analisis durasi pesanan dan bottleneck operasional</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-gray-600">Total Pesanan</div>
                        <div className="text-2xl font-bold">{stats.total_orders}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-red-600 font-medium">Kritis ({'>'}72 Jam)</div>
                        <div className="text-2xl font-bold text-red-800">{stats.critical}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-orange-600 font-medium">Warning (48-72 Jam)</div>
                        <div className="text-2xl font-bold text-orange-800">{stats.warning}</div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
                        <div className="text-sm text-indigo-600 font-medium">Rata-rata Durasi</div>
                        <div className="text-2xl font-bold text-indigo-800">{formatDuration(stats.avg_aging)}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
                <h2 className="font-bold mb-3 text-gray-800">Filter Laporan</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            <option value="">Semua Status</option>
                            <option value="active">Aktif (Belum Selesai)</option>
                            <option value="received">Received</option>
                            <option value="in_wash">Sedang Dicuci</option>
                            <option value="ready_for_qc">Siap QC</option>
                            <option value="completed">Selesai</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Prioritas</label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            <option value="">Semua</option>
                            <option value="true">Prioritas (Express)</option>
                            <option value="false">Reguler</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Min Durasi (Jam)</label>
                        <input
                            type="number"
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Max Durasi (Jam)</label>
                        <input
                            type="number"
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="999"
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12 text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                    <p>Memuat data...</p>
                </div>
            )}

            {/* Orders Table */}
            {!loading && orders.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-700">
                            <tr>
                                <th className="text-left p-3 font-semibold">No. Order</th>
                                <th className="text-left p-3 font-semibold">Pelanggan</th>
                                <th className="text-left p-3 font-semibold">Layanan</th>
                                <th className="text-left p-3 font-semibold">Status</th>
                                <th className="text-left p-3 font-semibold">Total Durasi</th>
                                <th className="text-left p-3 font-semibold">Prioritas</th>
                                <th className="text-right p-3 font-semibold">Estimasi Harga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-bold"
                                        >
                                            {order.order_number}
                                        </Link>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-3 font-medium text-gray-900">
                                        {order.customer_name}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {order.service_name}
                                    </td>
                                    <td className="p-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                            {order.current_status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getAgingColor(order.total_aging_hours)}`}>
                                            {getAgingLabel(order.total_aging_hours)}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1 font-mono">
                                            {formatDuration(order.total_aging_hours)}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {order.is_priority ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                                ⚡ EXPRESS
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right font-medium text-gray-900">
                                        Rp {order.estimated_price?.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && orders.length === 0 && (
                <div className="text-center py-16 bg-white border rounded-lg shadow-sm">
                    <p className="text-gray-500 text-lg">Tidak ada pesanan yang sesuai filter.</p>
                    <p className="text-gray-400 text-sm mt-1">Coba sesuaikan status atau rentang durasi.</p>
                </div>
            )}
        </div>
    );
}
