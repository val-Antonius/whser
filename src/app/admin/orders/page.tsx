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

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Jatuh Tempo Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.dueToday}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-red-700">Terlambat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-orange-700">Express</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700">{stats.express}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-yellow-700">Mendekati Deadline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-700">{stats.approaching}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-sm font-medium text-gray-700 mr-2">Filter Cepat:</span>
                        <Button
                            variant={quickFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setQuickFilter('all')}
                        >
                            Semua ({orders.length})
                        </Button>
                        <Button
                            variant={quickFilter === 'due_today' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setQuickFilter('due_today')}
                        >
                            Jatuh Tempo Hari Ini ({stats.dueToday})
                        </Button>
                        <Button
                            variant={quickFilter === 'overdue' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => setQuickFilter('overdue')}
                        >
                            🔴 Terlambat ({stats.overdue})
                        </Button>
                        <Button
                            variant={quickFilter === 'express' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setQuickFilter('express')}
                            className={quickFilter === 'express' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                            ⚡ Express ({stats.express})
                        </Button>
                        <Button
                            variant={quickFilter === 'approaching' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setQuickFilter('approaching')}
                        >
                            🟡 Mendekati ({stats.approaching})
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchOrders}
                            className="ml-auto"
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
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                                ⚡ Express
                                                            </span>
                                                        )}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.current_status)}`}>
                                                            {formatStatus(order.current_status)}
                                                        </span>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/orders/${order.id}`} className="block">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentColor(order.payment_status)}`}>
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
