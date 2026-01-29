'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSLAStatus, formatTimeRemaining, isDueToday, isOverdue, isApproaching, shouldShowSLA } from '@/lib/sla-utils';

interface OrderWithDetails {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    service_name: string;
    current_status: string;
    payment_status: string;
    estimated_price: number;
    paid_amount: number;
    created_at: string;
    estimated_completion: string | null;
    priority: 'regular' | 'express';
}

export default function OrdersListPage() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quickFilter, setQuickFilter] = useState<'all' | 'due_today' | 'overdue' | 'express' | 'approaching'>('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/orders?limit=100');
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const dueToday = orders.filter(o => isDueToday(o.estimated_completion)).length;
        const overdue = orders.filter(o => isOverdue(o.estimated_completion)).length;
        const express = orders.filter(o => o.priority === 'express').length;
        const approaching = orders.filter(o => isApproaching(o.estimated_completion)).length;

        return { dueToday, overdue, express, approaching };
    }, [orders]);

    // Filter orders based on quick filter
    const filteredOrders = useMemo(() => {
        switch (quickFilter) {
            case 'due_today':
                return orders.filter(o => isDueToday(o.estimated_completion));
            case 'overdue':
                return orders.filter(o => isOverdue(o.estimated_completion));
            case 'express':
                return orders.filter(o => o.priority === 'express');
            case 'approaching':
                return orders.filter(o => isApproaching(o.estimated_completion));
            default:
                return orders;
        }
    }, [orders, quickFilter]);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: 'bg-blue-100 text-blue-800',
            waiting_for_process: 'bg-yellow-100 text-yellow-800',
            in_wash: 'bg-purple-100 text-purple-800',
            in_dry: 'bg-purple-100 text-purple-800',
            in_iron: 'bg-purple-100 text-purple-800',
            in_fold: 'bg-purple-100 text-purple-800',
            ready_for_qc: 'bg-orange-100 text-orange-800',
            completed: 'bg-green-100 text-green-800',
            ready_for_pickup: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'bg-red-100 text-red-800',
            partial: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Pesanan</h1>
                        <p className="text-gray-600 mt-1">Lihat dan kelola semua pesanan</p>
                    </div>
                    <Link
                        href="/admin/pos"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Pesanan Baru
                    </Link>
                </div>

                {/* Summary Cards - Glass Style */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Jatuh Tempo Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-slate-800">{stats.dueToday}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50/50 border-red-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">Terlambat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-red-700">{stats.overdue}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-sky-50/50 border-sky-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-sky-600">Express</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-sky-700">{stats.express}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50/50 border-amber-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600">Mendekati Deadline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-amber-700">{stats.approaching}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Filters - Clean Pills */}
                <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/50 p-4 mb-6 shadow-sm">
                    <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-sm font-medium text-slate-500 mr-2">Filter:</span>
                        <Button
                            variant={quickFilter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setQuickFilter('all')}
                            className={quickFilter === 'all' ? "bg-slate-200 text-slate-800" : "text-slate-500"}
                        >
                            Semua ({orders.length})
                        </Button>
                        <Button
                            variant={quickFilter === 'due_today' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setQuickFilter('due_today')}
                            className={quickFilter === 'due_today' ? "bg-blue-100 text-blue-700" : "text-slate-500"}
                        >
                            Hari Ini ({stats.dueToday})
                        </Button>
                        <Button
                            variant={quickFilter === 'overdue' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setQuickFilter('overdue')}
                            className={quickFilter === 'overdue' ? "bg-red-100 text-red-700" : "text-slate-500"}
                        >
                            Terlambat ({stats.overdue})
                        </Button>
                        <Button
                            variant={quickFilter === 'express' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setQuickFilter('express')}
                            className={quickFilter === 'express' ? "bg-sky-100 text-sky-700" : "text-slate-500"}
                        >
                            Express ({stats.express})
                        </Button>
                        <Button
                            variant={quickFilter === 'approaching' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setQuickFilter('approaching')}
                            className={quickFilter === 'approaching' ? "bg-amber-100 text-amber-700" : "text-slate-500"}
                        >
                            Mendekati ({stats.approaching})
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchOrders}
                            className="ml-auto text-slate-400 hover:text-slate-600"
                        >
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-600">Memuat pesanan...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            Tidak ada pesanan ditemukan. <Link href="/admin/pos" className="text-blue-600 hover:text-blue-800">Buat pesanan pertama</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            No. Pesanan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pelanggan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Layanan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status SLA
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Prioritas
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pembayaran
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jumlah
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.map((order) => {
                                        const slaStatus = getSLAStatus(order.estimated_completion);
                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                                        {order.order_number}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        <div className="text-sm text-gray-900">{order.customer_name}</div>
                                                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        <div className="text-sm text-gray-900">{order.service_name}</div>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        {shouldShowSLA(order.current_status) && order.estimated_completion ? (
                                                            <div className={`${slaStatus.bgColor} px-2 py-1 rounded text-sm inline-block`}>
                                                                <span className={slaStatus.color}>
                                                                    {slaStatus.icon} {formatTimeRemaining(order.estimated_completion)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">-</span>
                                                        )}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        {order.priority === 'express' && (
                                                            <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                                                                Express
                                                            </span>
                                                        )}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${getStatusColor(order.current_status).replace('text-800', 'text-700').replace('bg-', 'bg-opacity-50 bg-')}`}>
                                                            {formatStatus(order.current_status)}
                                                        </span>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${getPaymentColor(order.payment_status).replace('text-800', 'text-700')}`}>
                                                            {formatStatus(order.payment_status)}
                                                        </span>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        <div className="text-sm text-gray-900">
                                                            Rp {order.estimated_price.toLocaleString('id-ID')}
                                                        </div>
                                                        {order.payment_status === 'partial' && (
                                                            <div className="text-xs text-gray-500">
                                                                Dibayar: Rp {order.paid_amount.toLocaleString('id-ID')}
                                                            </div>
                                                        )}
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
