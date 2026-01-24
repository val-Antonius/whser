'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AgingOrder {
    id: number;
    order_number: string;
    status: string;
    is_priority: boolean;
    priority_reason?: string;
    aging_hours: number;
    stage_aging_hours: number;
    created_at: string;
    estimated_price: number;
    customer_name: string;
    customer_phone: string;
    service_name: string;
}

interface AgingStats {
    total_orders: number;
    priority_orders: number;
    avg_age_hours: number;
    critical_aging: number;
    high_aging: number;
    medium_aging: number;
    fresh: number;
}

export default function OrderAgingReportPage() {
    const [orders, setOrders] = useState<AgingOrder[]>([]);
    const [stats, setStats] = useState<AgingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
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

            const response = await fetch(`/api/reports/order-aging?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch aging report');

            const data = await response.json();
            setOrders(data.orders);
            setStats(data.stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getAgingColor = (hours: number) => {
        if (hours < 24) return 'bg-green-100 text-green-800 border-green-300';
        if (hours < 48) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        if (hours < 72) return 'bg-orange-100 text-orange-800 border-orange-300';
        return 'bg-red-100 text-red-800 border-red-300';
    };

    const getAgingLabel = (hours: number) => {
        if (hours < 24) return 'Fresh';
        if (hours < 48) return 'Normal';
        if (hours < 72) return 'Aging';
        return 'Critical';
    };

    const formatDuration = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${hours.toFixed(1)}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return `${days}d ${remainingHours}h`;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Order Aging Report</h1>
                <p className="text-gray-600">Track order age and identify bottlenecks</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total Orders</div>
                        <div className="text-2xl font-bold">{stats.total_orders}</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-600">Priority</div>
                        <div className="text-2xl font-bold text-orange-600">{stats.priority_orders}</div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-600">Avg Age</div>
                        <div className="text-2xl font-bold">{formatDuration(stats.avg_age_hours)}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-red-600">Critical (&gt;72h)</div>
                        <div className="text-2xl font-bold text-red-800">{stats.critical_aging}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="text-sm text-orange-600">High (48-72h)</div>
                        <div className="text-2xl font-bold text-orange-800">{stats.high_aging}</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-yellow-600">Medium (24-48h)</div>
                        <div className="text-2xl font-bold text-yellow-800">{stats.medium_aging}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-600">Fresh (&lt;24h)</div>
                        <div className="text-2xl font-bold text-green-800">{stats.fresh}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border rounded-lg p-4 mb-6">
                <h2 className="font-bold mb-3">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="READY">Ready</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">All Orders</option>
                            <option value="true">Priority Only</option>
                            <option value="false">Non-Priority</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Min Age (hours)</label>
                        <input
                            type="number"
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Max Age (hours)</label>
                        <input
                            type="number"
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value)}
                            className="w-full border rounded px-3 py-2"
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
                <div className="text-center py-8 text-gray-500">Loading aging report...</div>
            )}

            {/* Orders Table */}
            {!loading && orders.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left p-3 font-medium">Order</th>
                                <th className="text-left p-3 font-medium">Customer</th>
                                <th className="text-left p-3 font-medium">Service</th>
                                <th className="text-left p-3 font-medium">Status</th>
                                <th className="text-left p-3 font-medium">Age</th>
                                <th className="text-left p-3 font-medium">Stage Time</th>
                                <th className="text-left p-3 font-medium">Priority</th>
                                <th className="text-right p-3 font-medium">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            {order.order_number}
                                        </Link>
                                        <div className="text-xs text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="font-medium">{order.customer_name}</div>
                                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                                    </td>
                                    <td className="p-3 text-sm">{order.service_name}</td>
                                    <td className="p-3">
                                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-1 rounded border font-bold ${getAgingColor(order.aging_hours)}`}>
                                            {getAgingLabel(order.aging_hours)}
                                        </span>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {formatDuration(order.aging_hours)}
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-600">
                                        {formatDuration(order.stage_aging_hours)}
                                    </td>
                                    <td className="p-3">
                                        {order.is_priority && (
                                            <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800 border border-orange-300 font-bold">
                                                ⚡ PRIORITY
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right font-medium">
                                        ₱{parseFloat(String(order.estimated_price || 0)).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && orders.length === 0 && (
                <div className="text-center py-12 bg-white border rounded-lg">
                    <p className="text-gray-500">No orders found matching the selected filters</p>
                </div>
            )}
        </div>
    );
}
