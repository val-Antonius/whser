'use client';

import { useState, useEffect } from 'react';

export default function InventoryUsageReportPage() {
    const [usageData, setUsageData] = useState([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchUsageReport();
    }, [startDate, endDate]);

    const fetchUsageReport = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`/api/reports/inventory-usage?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch usage report');

            const data = await response.json();
            setUsageData(data.usage_data);
            setSummary(data.summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Inventory Usage Report</h1>
                <p className="text-gray-600">
                    Track inventory consumption and usage patterns
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total Items</div>
                        <div className="text-2xl font-bold">{summary.total_items}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-700">Total Consumed</div>
                        <div className="text-2xl font-bold text-blue-800">
                            {parseFloat(summary.total_consumed || 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-red-700">Total Wasted</div>
                        <div className="text-2xl font-bold text-red-800">
                            {parseFloat(summary.total_wasted || 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-700">Orders Processed</div>
                        <div className="text-2xl font-bold text-green-800">{summary.total_orders}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border rounded-lg p-4 mb-6">
                <h2 className="font-bold mb-3">Date Range</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border rounded px-3 py-2"
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
                    Loading usage report...
                </div>
            )}

            {/* Usage Data Table */}
            {!loading && usageData.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium">Item</th>
                                <th className="text-left p-3 text-sm font-medium">Category</th>
                                <th className="text-right p-3 text-sm font-medium">Consumed</th>
                                <th className="text-right p-3 text-sm font-medium">Wasted</th>
                                <th className="text-right p-3 text-sm font-medium">Orders</th>
                                <th className="text-right p-3 text-sm font-medium">Avg/Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {usageData.map((item: any) => (
                                <tr key={item.item_id} className="hover:bg-gray-50">
                                    <td className="p-3">
                                        <div className="font-medium">{item.item_name}</div>
                                        <div className="text-xs text-gray-600">{item.item_code}</div>
                                    </td>
                                    <td className="p-3 text-sm capitalize">{item.category}</td>
                                    <td className="p-3 text-right font-semibold text-blue-600">
                                        {parseFloat(item.total_consumed || 0).toFixed(2)} {item.unit_of_measure}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-red-600">
                                        {parseFloat(item.total_wasted || 0).toFixed(2)} {item.unit_of_measure}
                                    </td>
                                    <td className="p-3 text-right">{item.order_count}</td>
                                    <td className="p-3 text-right text-sm text-gray-600">
                                        {parseFloat(item.avg_consumption_per_order || 0).toFixed(2)} {item.unit_of_measure}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && usageData.length === 0 && (
                <div className="text-center py-12 bg-white border rounded-lg">
                    <p className="text-gray-500">No usage data found for the selected period</p>
                </div>
            )}
        </div>
    );
}
