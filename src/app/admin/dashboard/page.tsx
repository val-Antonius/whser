'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';

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
        if (!isLoading) {
            fetchStats();
        }
    }, [period, isLoading]);

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
            received: 'bg-blue-500',
            waiting_for_process: 'bg-yellow-500',
            in_wash: 'bg-purple-500',
            in_dry: 'bg-purple-400',
            in_iron: 'bg-purple-300',
            in_fold: 'bg-indigo-500',
            ready_for_qc: 'bg-orange-500',
            completed: 'bg-green-500',
            ready_for_pickup: 'bg-green-400',
            closed: 'bg-gray-500',
            cancelled: 'bg-red-500',
        };
        return colors[status] || 'bg-gray-400';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    const totalOrderCount = stats?.orders.total || 0;
    const maxServiceCount = Math.max(...(stats?.serviceBreakdown.map(s => s.order_count) || [1]));
    const maxStatusCount = Math.max(...(stats?.statusDistribution.map(s => s.count) || [1]));

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Operational Dashboard</h1>
                                <p className="text-sm text-gray-500">Admin Role</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('userRole');
                                router.push('/');
                            }}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Switch Role
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <Link
                            href="/admin/dashboard"
                            className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/pos"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            POS
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Orders
                        </Link>
                        <Link
                            href="/admin/services"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Service Management
                        </Link>
                        <Link
                            href="/admin/inventory"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Inventory
                        </Link>
                        <Link
                            href="/admin/customers"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Customers
                        </Link>

                        {/* Reports Dropdown */}
                        <div className="relative group">
                            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center">
                                Reports
                                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute left-0 mt-0 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <Link href="/admin/reports/aging" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    ⏱️ Order Aging Report
                                </Link>
                                <Link href="/admin/reports/inventory-usage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    📈 Inventory Usage
                                </Link>
                            </div>
                        </div>

                        {/* Inventory Dropdown */}
                        <div className="relative group">
                            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center">
                                Inventory+
                                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute left-0 mt-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <Link href="/admin/inventory" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold border-b">
                                    📦 Stock Overview
                                </Link>
                                <div className="py-1">
                                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">Advanced Features</div>
                                    <Link href="/admin/inventory/consumption" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        📝 Consumption Templates
                                    </Link>
                                    <Link href="/admin/inventory/variance" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        ⚠️ Variance Analysis
                                    </Link>
                                    <Link href="/admin/inventory/waste" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        🗑️ Waste Tracking
                                    </Link>
                                    <Link href="/admin/inventory/bundles" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        📦 Bundles
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Period Selector */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Operational Metrics</h2>
                        <p className="text-gray-600 mt-1">Real-time performance overview</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriod('today')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === 'today'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setPeriod('week')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === 'week'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setPeriod('month')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === 'month'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            This Month
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-900">{stats?.orders.total || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {period === 'today' ? 'Today' : period === 'week' ? 'This week' : 'This month'}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats?.orders.active || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">In progress</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Completed</p>
                                <p className="text-3xl font-bold text-green-600">{stats?.orders.completed || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats?.orders.total ? Math.round((stats.orders.completed / stats.orders.total) * 100) : 0}% completion rate
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    Rp {Math.round(stats?.revenue.total || 0).toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Pending: Rp {Math.round(stats?.revenue.pending || 0).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Service Breakdown */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Breakdown</h3>
                        {stats?.serviceBreakdown && stats.serviceBreakdown.length > 0 ? (
                            <div className="space-y-4">
                                {stats.serviceBreakdown.map((service, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-900">{service.service_name}</span>
                                            <span className="text-gray-600">{service.order_count} orders</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-blue-500 h-3 rounded-full transition-all"
                                                    style={{ width: `${(service.order_count / maxServiceCount) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 min-w-[80px] text-right">
                                                Rp {Math.round(service.revenue).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No service data available</p>
                        )}
                    </div>

                    {/* Order Status Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
                        {stats?.statusDistribution && stats.statusDistribution.length > 0 ? (
                            <div className="space-y-3">
                                {stats.statusDistribution.map((status, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-900">{formatStatus(status.current_status)}</span>
                                            <span className="text-gray-600">
                                                {status.count} ({totalOrderCount > 0 ? Math.round((status.count / totalOrderCount) * 100) : 0}%)
                                            </span>
                                        </div>
                                        <div className="bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all ${getStatusColor(status.current_status)}`}
                                                style={{ width: `${(status.count / maxStatusCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No status data available</p>
                        )}
                    </div>
                </div>

                {/* Module Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/admin/pos" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-blue-500">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">POS / Transaction</h3>
                            <p className="text-sm text-gray-600">Create orders, process payments, and manage transactions</p>
                        </div>
                    </Link>

                    <Link href="/admin/orders" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-blue-500">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders List</h3>
                            <p className="text-sm text-gray-600">View all orders, filter by status, and track progress</p>
                        </div>
                    </Link>

                    <Link href="/admin/services" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-blue-500">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Management</h3>
                            <p className="text-sm text-gray-600">Track order workflow, update status, and manage processes</p>
                        </div>
                    </Link>

                    <Link href="/admin/inventory" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-blue-500">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Management</h3>
                            <p className="text-sm text-gray-600">Monitor stock levels, record transactions, and track consumption</p>
                        </div>
                    </Link>

                    <Link href="/admin/customers" className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent group-hover:border-blue-500">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Management</h3>
                            <p className="text-sm text-gray-600">View customer profiles, history, and manage preferences</p>
                        </div>
                    </Link>
                </div>

                {/* Success Notice */}
                <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-semibold text-green-900 mb-1">Phase 1: Operational Application - Complete!</h4>
                            <p className="text-sm text-green-700">
                                All core modules are now operational: POS, Service Management, Inventory, Customer Management, and Dashboard Analytics.
                                The system is ready for daily operations with real-time metrics and comprehensive workflow management.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
