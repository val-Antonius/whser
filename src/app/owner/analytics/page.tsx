'use client';

// ============================================================================
// OWNER ANALYTICS DASHBOARD
// ============================================================================
// Purpose: Main analytics dashboard with metrics display and visualization
// Phase: 3.3 - Post-Operational Dashboard UI
// ============================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';
import { MetricCard } from '@/components/analytics/MetricCard';
import { MetricDrilldown } from '@/components/analytics/MetricDrilldown';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';

interface Snapshot {
    id: number;
    snapshot_name: string;
    period_type: string;
    period_start: string;
    period_end: string;
    total_orders: number;
    total_revenue: number;
}

interface Metric {
    id: number;
    metric_name: string;
    metric_value: number;
    baseline_value: number | null;
    variance: number | null;
    variance_percentage: number | null;
    significance_level: 'normal' | 'attention' | 'critical';
    metadata?: Record<string, unknown>;
}

export default function OwnerAnalytics() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);

    useEffect(() => {
        // Check if user has owner role
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== UserRole.OWNER) {
            router.push('/');
            return;
        }
        setIsLoading(false);
        fetchSnapshots();
    }, [router]);

    const fetchSnapshots = async () => {
        try {
            const response = await fetch('/api/analytics/snapshots');
            const data = await response.json();
            if (data.success && data.data) {
                setSnapshots(data.data);
                // Auto-select the latest snapshot
                if (data.data.length > 0) {
                    setSelectedSnapshotId(data.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching snapshots:', error);
        }
    };

    const fetchMetrics = async (snapshotId: number) => {
        setLoadingMetrics(true);
        try {
            const response = await fetch(`/api/analytics/metrics?snapshotId=${snapshotId}`);
            const data = await response.json();
            if (data.success && data.data) {
                setMetrics(data.data);
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoadingMetrics(false);
        }
    };

    useEffect(() => {
        if (selectedSnapshotId) {
            fetchMetrics(selectedSnapshotId);
        }
    }, [selectedSnapshotId]);

    const handleMetricClick = (metric: Metric) => {
        setSelectedMetric(metric);
        setIsDrilldownOpen(true);
    };

    const selectedSnapshot = snapshots.find(s => s.id === selectedSnapshotId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Dashboard Analitik</h1>
                                <p className="text-sm text-gray-500">Peran Pemilik</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('userRole');
                                router.push('/');
                            }}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Ganti Peran
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <Link
                            href="/owner/analytics"
                            className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-600"
                        >
                            Analitik
                        </Link>
                        <Link
                            href="/owner/insights"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Wawasan
                        </Link>
                        <Link
                            href="/owner/recommendations"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Rekomendasi
                        </Link>
                        <Link
                            href="/owner/tasks"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Tugas
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
                    <h2 className="text-3xl font-bold mb-2">Selamat Datang di Dashboard Analitik</h2>
                    <p className="text-purple-100">Wawasan strategis dan rekomendasi berbasis AI untuk bisnis Anda</p>
                </div>

                {/* Period Selector & Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Periode Analisis</h3>
                            <p className="text-sm text-gray-600 mb-4">Pilih snapshot untuk melihat metrik</p>

                            <Select
                                value={selectedSnapshotId?.toString()}
                                onValueChange={(value) => setSelectedSnapshotId(parseInt(value))}
                            >
                                <SelectTrigger className="w-full md:w-96">
                                    <SelectValue placeholder="Pilih periode..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {snapshots.map((snapshot) => (
                                        <SelectItem key={snapshot.id} value={snapshot.id.toString()}>
                                            {snapshot.snapshot_name} ({snapshot.period_start} - {snapshot.period_end})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedSnapshot && (
                                <div className="mt-4 flex gap-4 text-sm text-gray-600">
                                    <span>📦 {selectedSnapshot.total_orders} pesanan</span>
                                    <span>💰 Rp {selectedSnapshot.total_revenue.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => fetchSnapshots()}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </Button>
                            <Link href="/owner/analytics/snapshots">
                                <Button variant="default">
                                    Kelola Snapshot
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                {selectedSnapshotId && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Metrik Kinerja</h3>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Ekspor Laporan
                            </Button>
                        </div>

                        {loadingMetrics ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-gray-600">Memuat metrik...</div>
                            </div>
                        ) : metrics.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <p className="text-gray-600">Tidak ada metrik untuk snapshot ini</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {metrics.map((metric) => (
                                    <MetricCard
                                        key={metric.id}
                                        metricName={metric.metric_name}
                                        metricValue={metric.metric_value}
                                        baselineValue={metric.baseline_value}
                                        variance={metric.variance}
                                        variancePercentage={metric.variance_percentage}
                                        significanceLevel={metric.significance_level}
                                        onClick={() => handleMetricClick(metric)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!selectedSnapshotId && snapshots.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Snapshot</h3>
                        <p className="text-gray-600 mb-6">Buat snapshot pertama Anda untuk mulai menganalisis data</p>
                        <Link href="/owner/analytics/snapshots">
                            <Button>Buat Snapshot</Button>
                        </Link>
                    </div>
                )}
            </main>

            {/* Metric Drilldown Modal */}
            <MetricDrilldown
                isOpen={isDrilldownOpen}
                onClose={() => setIsDrilldownOpen(false)}
                metric={selectedMetric}
            />
        </div>
    );
}
