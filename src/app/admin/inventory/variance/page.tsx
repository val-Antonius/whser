'use client';

import { useState, useEffect } from 'react';
import VarianceAnalysisCard from '@/components/inventory/VarianceAnalysisCard';

export default function VarianceAnalysisPage() {
    const [variances, setVariances] = useState([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');

    useEffect(() => {
        fetchVariances();
    }, [statusFilter, severityFilter]);

    const fetchVariances = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (severityFilter) params.append('severity', severityFilter);

            const response = await fetch(`/api/inventory/variance?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch variances');

            const data = await response.json();
            setVariances(data.variances);
            setSummary(data.summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleInvestigate = async (id: number) => {
        try {
            const response = await fetch(`/api/inventory/variance/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'investigating' })
            });

            if (!response.ok) throw new Error('Failed to update variance');

            fetchVariances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update variance');
        }
    };

    const handleResolve = async (id: number) => {
        const notes = prompt('Enter resolution notes:');
        if (!notes) return;

        try {
            const response = await fetch(`/api/inventory/variance/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'resolved',
                    resolution_notes: notes
                })
            });

            if (!response.ok) throw new Error('Failed to resolve variance');

            fetchVariances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to resolve variance');
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Variance Analysis</h1>
                <p className="text-gray-600">
                    Track and investigate consumption variances
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-yellow-700">Pending</div>
                        <div className="text-2xl font-bold text-yellow-800">{summary.pending}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-700">Investigating</div>
                        <div className="text-2xl font-bold text-blue-800">{summary.investigating}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-700">Resolved</div>
                        <div className="text-2xl font-bold text-green-800">{summary.resolved}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-red-700">Critical</div>
                        <div className="text-2xl font-bold text-red-800">{summary.critical}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="text-sm text-orange-700">High</div>
                        <div className="text-2xl font-bold text-orange-800">{summary.high}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border rounded-lg p-4 mb-6">
                <h2 className="font-bold mb-3">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Severity</label>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">All Severities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
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
                    Loading variances...
                </div>
            )}

            {/* Variances Grid */}
            {!loading && variances.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variances.map((variance: any) => (
                        <VarianceAnalysisCard
                            key={variance.id}
                            variance={variance}
                            onInvestigate={handleInvestigate}
                            onResolve={handleResolve}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && variances.length === 0 && (
                <div className="text-center py-12 bg-white border rounded-lg">
                    <p className="text-gray-500">No variances found</p>
                </div>
            )}
        </div>
    );
}
