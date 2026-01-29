'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';
import { Switch } from '@/components/ui/switch';
import { OperationalMetricsContent } from '@/components/dashboard/OperationalMetricsContent';

interface DashboardStats {
    period: string;
    orders: {
        total: number;
        active: number;
        completed: number;
        closed: number;
    };
    revenue: {
        total: number;
        pending: number;
    };
    serviceBreakdown: Array<{
        service_name: string;
        order_count: number;
        revenue: number;
    }>;
    statusDistribution: Array<{
        current_status: string;
        count: number;
    }>;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
    const [viewMode, setViewMode] = useState<'quick' | 'metrics'>('quick');

    useEffect(() => {
        // Check if user has admin role
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== UserRole.ADMIN) {
            router.push('/');
            return;
        }
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        if (!isLoading && viewMode === 'quick') {
            fetchStats();
        }
    }, [period, isLoading, viewMode]);

    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/dashboard/stats?period=${period}`);
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: 'bg-blue-400',
            waiting_for_process: 'bg-amber-400',
            in_wash: 'bg-indigo-400',
            in_dry: 'bg-violet-400',
            in_iron: 'bg-purple-400',
            in_fold: 'bg-fuchsia-400',
            ready_for_qc: 'bg-orange-400',
            completed: 'bg-emerald-400',
            ready_for_pickup: 'bg-teal-400',
            closed: 'bg-slate-400',
            cancelled: 'bg-rose-400',
        };
        return colors[status] || 'bg-slate-300';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-500 animate-pulse">Loading dashboard...</div>
            </div>
        );
    }

    const totalOrderCount = stats?.orders.total || 0;
    const maxServiceCount = Math.max(...(stats?.serviceBreakdown.map(s => s.order_count) || [1]));
    const maxStatusCount = Math.max(...(stats?.statusDistribution.map(s => s.count) || [1]));

    return (
        <div className="min-h-screen">
            {/* Header with Toggle Switch */}
            <header className="bg-white/40 backdrop-blur-md border-b border-white/60 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-light text-slate-800">Dashboard</h1>
                            <p className="text-sm text-slate-500 mt-1">Real-time performance overview</p>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-white/60 shadow-sm">
                            <span className={`text-sm font-medium transition-colors ${viewMode === 'quick' ? 'text-sky-600' : 'text-slate-400'}`}>
                                Quick Overview
                            </span>
                            <Switch
                                checked={viewMode === 'metrics'}
                                onCheckedChange={(checked) => setViewMode(checked ? 'metrics' : 'quick')}
                                className="data-[state=checked]:bg-sky-500"
                            />
                            <span className={`text-sm font-medium transition-colors ${viewMode === 'metrics' ? 'text-sky-600' : 'text-slate-400'}`}>
                                Operational Metrics
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {viewMode === 'quick' ? (
                    /* QUICK OVERVIEW CONTENT */
                    <>
                        {/* Period Selector */}
                        <div className="mb-6 flex justify-end">
                            <div className="flex gap-2 p-1 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
                                <button
                                    onClick={() => setPeriod('today')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'today'
                                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                        : 'text-slate-600 hover:bg-white/50'
                                        }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setPeriod('week')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'week'
                                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                        : 'text-slate-600 hover:bg-white/50'
                                        }`}
                                >
                                    This Week
                                </button>
                                <button
                                    onClick={() => setPeriod('month')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'month'
                                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                        : 'text-slate-600 hover:bg-white/50'
                                        }`}
                                >
                                    This Month
                                </button>
                            </div>
                        </div>

                        {/* 5 KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            {/* Total Orders */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">Total Orders</p>
                                        <p className="text-3xl font-light text-slate-900">{stats?.orders.total || 0}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {period === 'today' ? 'Today' : period === 'week' ? 'This week' : 'This month'}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Active Orders */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">Active Orders</p>
                                        <p className="text-3xl font-light text-amber-600">{stats?.orders.active || 0}</p>
                                        <p className="text-xs text-slate-400 mt-1">In progress</p>
                                    </div>
                                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Ready for Pickup */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">Ready for Pickup</p>
                                        <p className="text-3xl font-light text-emerald-600">{stats?.orders.completed || 0}</p>
                                        <p className="text-xs text-slate-400 mt-1">Awaiting customer</p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Closed */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">Closed</p>
                                        <p className="text-3xl font-light text-slate-600">{stats?.orders.closed || 0}</p>
                                        <p className="text-xs text-slate-400 mt-1">Transactions done</p>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">Revenue</p>
                                        <p className="text-3xl font-light text-violet-600">
                                            Rp {Math.round(stats?.revenue.total || 0).toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Pending: Rp {Math.round(stats?.revenue.pending || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Service Breakdown */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Service Breakdown</h3>
                                {stats?.serviceBreakdown && stats.serviceBreakdown.length > 0 ? (
                                    <div className="space-y-5">
                                        {stats.serviceBreakdown.map((service, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-medium text-slate-700">{service.service_name}</span>
                                                    <span className="text-slate-500">{service.order_count} orders</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${(service.order_count / maxServiceCount) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-800 min-w-[80px] text-right">
                                                        Rp {Math.round(service.revenue).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">No service data available</p>
                                )}
                            </div>

                            {/* Order Status Distribution */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Order Status Distribution</h3>
                                {stats?.statusDistribution && stats.statusDistribution.length > 0 ? (
                                    <div className="space-y-4">
                                        {stats.statusDistribution.map((status, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-medium text-slate-700">{formatStatus(status.current_status)}</span>
                                                    <span className="text-slate-500">
                                                        {status.count} ({totalOrderCount > 0 ? Math.round((status.count / totalOrderCount) * 100) : 0}%)
                                                    </span>
                                                </div>
                                                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-500 ${getStatusColor(status.current_status)}`}
                                                        style={{ width: `${(status.count / maxStatusCount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">No status data available</p>
                                )}
                            </div>
                        </div>

                    </>
                ) : (

                    /* OPERATIONAL METRICS CONTENT */
                    <OperationalMetricsContent />
                )}
            </main>
        </div>
    );
}
