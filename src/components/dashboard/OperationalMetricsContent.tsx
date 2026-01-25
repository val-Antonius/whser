// ============================================================================
// OPERATIONAL METRICS CONTENT COMPONENT
// ============================================================================
// Purpose: EXACT COPY of operational metrics from /admin/dashboard/operations
// DO NOT MODIFY - Keep identical to original
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import CapacityGauge from '@/components/dashboard/CapacityGauge';
import ContributionMarginTable from '@/components/dashboard/ContributionMarginTable';
import { Button } from '@/components/ui/button';

export function OperationalMetricsContent() {
    const [dateRange, setDateRange] = useState({
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const [metrics, setMetrics] = useState({
        sla: null as any,
        rewash: null as any,
        margin: null as any,
        productivity: null as any,
        capacity: null as any,
        complaints: null as any
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAllMetrics();
    }, [dateRange]);

    const fetchAllMetrics = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(dateRange);

            const [sla, rewash, margin, productivity, capacity, complaints] = await Promise.all([
                fetch(`/api/metrics/sla-compliance?${params}`).then(r => r.json()),
                fetch(`/api/metrics/rewash-rate?${params}`).then(r => r.json()),
                fetch(`/api/metrics/contribution-margin?${params}`).then(r => r.json()),
                fetch(`/api/metrics/productivity?${params}`).then(r => r.json()),
                fetch(`/api/metrics/capacity-utilization?${params}`).then(r => r.json()),
                fetch(`/api/metrics/complaint-trends?${params}`).then(r => r.json())
            ]);

            setMetrics({
                sla: sla.success ? sla.data : null,
                rewash: rewash.success ? rewash.data : null,
                margin: margin.success ? margin.data : null,
                productivity: productivity.success ? productivity.data : null,
                capacity: capacity.success ? capacity.data : null,
                complaints: complaints.success ? complaints.data : null
            });
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Date Range Selector */}
            <div className="flex gap-3 items-center mb-6 justify-end">
                <label className="text-sm font-medium text-gray-700">Periode:</label>
                <input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-500">s/d</span>
                <input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <Button
                    onClick={fetchAllMetrics}
                    size="sm"
                >
                    Refresh
                </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* SLA Compliance */}
                {metrics.sla && (
                    <MetricCard
                        title="Tingkat Kepatuhan SLA"
                        value={`${metrics.sla.overall.compliance_rate}%`}
                        subtitle={`${metrics.sla.overall.on_time_orders} / ${metrics.sla.overall.total_orders} pesanan tepat waktu`}
                        colorScheme={metrics.sla.overall.compliance_rate >= 90 ? 'green' : metrics.sla.overall.compliance_rate >= 75 ? 'yellow' : 'red'}
                        icon={<span className="text-2xl">✓</span>}
                    />
                )}

                {/* Rewash Rate */}
                {metrics.rewash && (
                    <MetricCard
                        title="Tingkat Cuci Ulang"
                        value={`${metrics.rewash.overall.rewash_rate}%`}
                        subtitle={`${metrics.rewash.overall.total_rewashes} cuci ulang • Rp ${metrics.rewash.overall.total_cost_impact.toLocaleString('id-ID')} biaya`}
                        colorScheme={metrics.rewash.overall.rewash_rate <= 2 ? 'green' : metrics.rewash.overall.rewash_rate <= 5 ? 'yellow' : 'red'}
                        icon={<span className="text-2xl">↻</span>}
                    />
                )}

                {/* Complaint Rate */}
                {metrics.complaints && (
                    <MetricCard
                        title="Tingkat Keluhan"
                        value={`${metrics.complaints.overall.complaint_rate}%`}
                        subtitle={`${metrics.complaints.overall.total_complaints} keluhan`}
                        trend={{
                            direction: metrics.complaints.overall.trend_direction === 'increasing' ? 'up' :
                                metrics.complaints.overall.trend_direction === 'decreasing' ? 'down' : 'neutral',
                            value: `${Math.abs(metrics.complaints.overall.trend_percentage)}% vs periode lalu`
                        }}
                        colorScheme={metrics.complaints.overall.complaint_rate <= 1 ? 'green' : metrics.complaints.overall.complaint_rate <= 3 ? 'yellow' : 'red'}
                        icon={<span className="text-2xl">⚠</span>}
                    />
                )}
            </div>

            {/* Productivity & Capacity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Productivity Metrics */}
                {metrics.productivity && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Indikator Produktivitas</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                                <span className="text-sm font-medium text-gray-700">Pesanan per Hari</span>
                                <span className="text-xl font-bold text-blue-900">{metrics.productivity.orders_per_day}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                                <span className="text-sm font-medium text-gray-700">Rata-rata Waktu Proses</span>
                                <span className="text-xl font-bold text-green-900">{metrics.productivity.avg_processing_hours} jam</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                                <span className="text-sm font-medium text-gray-700">Tingkat Penyelesaian</span>
                                <span className="text-xl font-bold text-purple-900">{metrics.productivity.job_completion_rate}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Capacity Utilization */}
                {metrics.capacity && (
                    <CapacityGauge
                        utilizationPercentage={metrics.capacity.utilization_percentage}
                        activeOrders={metrics.capacity.current_active_orders}
                        peakCapacity={metrics.capacity.estimated_peak_capacity}
                    />
                )}
            </div>

            {/* Contribution Margin Table */}
            {metrics.margin && metrics.margin.by_service && metrics.margin.by_service.length > 0 && (
                <div className="mb-6">
                    <ContributionMarginTable data={metrics.margin.by_service} />
                </div>
            )}

            {/* Overall Margin Summary */}
            {metrics.margin && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Pendapatan"
                        value={`Rp ${metrics.margin.overall.total_revenue.toLocaleString('id-ID')}`}
                        colorScheme="blue"
                    />
                    <MetricCard
                        title="Biaya Inventori"
                        value={`Rp ${metrics.margin.overall.total_inventory_cost.toLocaleString('id-ID')}`}
                        colorScheme="yellow"
                    />
                    <MetricCard
                        title="Margin Kontribusi"
                        value={`Rp ${metrics.margin.overall.contribution_margin.toLocaleString('id-ID')}`}
                        colorScheme="green"
                    />
                    <MetricCard
                        title="Margin %"
                        value={`${metrics.margin.overall.margin_percentage}%`}
                        colorScheme={metrics.margin.overall.margin_percentage >= 70 ? 'green' : metrics.margin.overall.margin_percentage >= 50 ? 'yellow' : 'red'}
                    />
                </div>
            )}
        </div>
    );
}
