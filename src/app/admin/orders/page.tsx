'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    estimated_completion: string;
}

export default function OrdersListPage() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const url = statusFilter
                ? `/api/orders?status=${statusFilter}&limit=100`
                : '/api/orders?limit=100';

            const response = await fetch(url);
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
                        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                        <p className="text-gray-600 mt-1">View and manage all orders</p>
                    </div>
                    <Link
                        href="/admin/pos"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + New Order
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex gap-4 items-center">
                        <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Orders</option>
                            <option value="received">Received</option>
                            <option value="waiting_for_process">Waiting for Process</option>
                            <option value="in_wash">In Wash</option>
                            <option value="in_dry">In Dry</option>
                            <option value="in_iron">In Iron</option>
                            <option value="completed">Completed</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="closed">Closed</option>
                        </select>
                        <button
                            onClick={fetchOrders}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-600">Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            No orders found. <Link href="/admin/pos" className="text-blue-600 hover:text-blue-800">Create your first order</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order Number
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
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
                                                            Paid: Rp {order.paid_amount.toLocaleString('id-ID')}
                                                        </div>
                                                    )}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <Link href={`/admin/orders/${order.id}`} className="block">
                                                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
