'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderStatus } from '@/types';

interface QueueOrder {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    service_name: string;
    current_status: string;
    priority: string;
    estimated_completion: string;
    created_at: string;
    estimated_price: number;
}

export default function ServiceManagementPage() {
    const [orders, setOrders] = useState<QueueOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [activeTab, statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            let url = '/api/orders?limit=100';

            if (activeTab === 'active') {
                // Active orders: not completed, ready for pickup, closed, or cancelled
                url = '/api/orders?limit=100';
            } else if (activeTab === 'completed') {
                url = '/api/orders?status=completed&limit=100';
            }

            if (statusFilter) {
                url = `/api/orders?status=${statusFilter}&limit=100`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                // Filter active orders if needed
                let filteredOrders = data.data;
                if (activeTab === 'active') {
                    filteredOrders = data.data.filter((order: QueueOrder) =>
                        !['completed', 'ready_for_pickup', 'closed', 'cancelled'].includes(order.current_status)
                    );
                }
                setOrders(filteredOrders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: 'bg-blue-100 text-blue-800 border-blue-200',
            waiting_for_process: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            in_wash: 'bg-purple-100 text-purple-800 border-purple-200',
            in_dry: 'bg-purple-100 text-purple-800 border-purple-200',
            in_iron: 'bg-purple-100 text-purple-800 border-purple-200',
            in_fold: 'bg-purple-100 text-purple-800 border-purple-200',
            ready_for_qc: 'bg-orange-100 text-orange-800 border-orange-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            ready_for_pickup: 'bg-green-100 text-green-800 border-green-200',
            closed: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getPriorityColor = (priority: string) => {
        return priority === 'express'
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getSLAStatus = (estimatedCompletion: string, currentStatus: string) => {
        if (['completed', 'ready_for_pickup', 'closed', 'cancelled'].includes(currentStatus)) {
            return null;
        }

        const now = new Date();
        const estimated = new Date(estimatedCompletion);
        const hoursRemaining = (estimated.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursRemaining < 0) {
            return { label: 'OVERDUE', color: 'bg-red-100 text-red-800 border-red-200' };
        } else if (hoursRemaining < 2) {
            return { label: 'AT RISK', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        }
        return { label: 'ON TRACK', color: 'bg-green-100 text-green-800 border-green-200' };
    };

    const groupOrdersByStatus = () => {
        const grouped: Record<string, QueueOrder[]> = {};
        orders.forEach(order => {
            if (!grouped[order.current_status]) {
                grouped[order.current_status] = [];
            }
            grouped[order.current_status].push(order);
        });
        return grouped;
    };

    const statusOrder = [
        OrderStatus.RECEIVED,
        OrderStatus.WAITING_FOR_PROCESS,
        OrderStatus.IN_WASH,
        OrderStatus.IN_DRY,
        OrderStatus.IN_IRON,
        OrderStatus.IN_FOLD,
        OrderStatus.READY_FOR_QC,
        OrderStatus.COMPLETED,
        OrderStatus.READY_FOR_PICKUP,
    ];

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
                    <p className="text-gray-600 mt-1">Track and manage order workflow</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex space-x-8 px-6">
                            <button
                                onClick={() => {
                                    setActiveTab('active');
                                    setStatusFilter('');
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'active'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Active Orders ({orders.filter(o => !['completed', 'ready_for_pickup', 'closed', 'cancelled'].includes(o.current_status)).length})
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('completed');
                                    setStatusFilter('completed');
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'completed'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Completed
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('all');
                                    setStatusFilter('');
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                All Orders
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex gap-4 items-center">
                            <label className="text-sm font-medium text-gray-700">Quick Filter:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value={OrderStatus.RECEIVED}>Received</option>
                                <option value={OrderStatus.WAITING_FOR_PROCESS}>Waiting for Process</option>
                                <option value={OrderStatus.IN_WASH}>In Wash</option>
                                <option value={OrderStatus.IN_DRY}>In Dry</option>
                                <option value={OrderStatus.IN_IRON}>In Iron</option>
                                <option value={OrderStatus.IN_FOLD}>In Fold</option>
                                <option value={OrderStatus.READY_FOR_QC}>Ready for QC</option>
                                <option value={OrderStatus.COMPLETED}>Completed</option>
                            </select>
                            <button
                                onClick={fetchOrders}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order Queue - Kanban Style */}
                {isLoading ? (
                    <div className="text-center py-12 text-gray-600">Loading orders...</div>
                ) : activeTab === 'active' && !statusFilter ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                            {statusOrder.map(status => {
                                const statusOrders = orders.filter(o => o.current_status === status);
                                if (statusOrders.length === 0) return null;

                                return (
                                    <div key={status} className="flex-shrink-0 w-80">
                                        <div className="bg-white rounded-lg shadow-sm">
                                            {/* Column Header */}
                                            <div className={`p-4 border-b-4 rounded-t-lg ${getStatusColor(status)}`}>
                                                <h3 className="font-semibold text-sm uppercase tracking-wide">
                                                    {formatStatus(status)}
                                                </h3>
                                                <p className="text-xs mt-1 opacity-75">{statusOrders.length} orders</p>
                                            </div>

                                            {/* Order Cards */}
                                            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                                                {statusOrders.map(order => {
                                                    const slaStatus = getSLAStatus(order.estimated_completion, order.current_status);

                                                    return (
                                                        <Link
                                                            key={order.id}
                                                            href={`/admin/services/${order.id}`}
                                                            className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                                                        >
                                                            {/* Order Number & Priority */}
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-semibold text-gray-900 text-sm">
                                                                    {order.order_number}
                                                                </span>
                                                                {order.priority === 'express' && (
                                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityColor(order.priority)}`}>
                                                                        EXPRESS
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Customer */}
                                                            <div className="text-sm text-gray-700 mb-2">
                                                                <div className="font-medium">{order.customer_name}</div>
                                                                <div className="text-xs text-gray-500">{order.customer_phone}</div>
                                                            </div>

                                                            {/* Service */}
                                                            <div className="text-xs text-gray-600 mb-3">
                                                                {order.service_name}
                                                            </div>

                                                            {/* SLA Status */}
                                                            {slaStatus && (
                                                                <div className={`text-xs font-semibold px-2 py-1 rounded border ${slaStatus.color} inline-block`}>
                                                                    {slaStatus.label}
                                                                </div>
                                                            )}

                                                            {/* Estimated Completion */}
                                                            <div className="text-xs text-gray-500 mt-2">
                                                                Due: {new Date(order.estimated_completion).toLocaleString('id-ID')}
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // List View for completed/all/filtered
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {orders.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                No orders found
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Order
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
                                                Priority
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Due Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map(order => {
                                            const slaStatus = getSLAStatus(order.estimated_completion, order.current_status);

                                            return (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{order.customer_name}</div>
                                                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {order.service_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded border ${getStatusColor(order.current_status)}`}>
                                                            {formatStatus(order.current_status)}
                                                        </span>
                                                        {slaStatus && (
                                                            <div className={`mt-1 px-2 py-0.5 inline-flex text-xs font-semibold rounded border ${slaStatus.color}`}>
                                                                {slaStatus.label}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded border ${getPriorityColor(order.priority)}`}>
                                                            {order.priority.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(order.estimated_completion).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <Link
                                                            href={`/admin/services/${order.id}`}
                                                            className="text-green-600 hover:text-green-900 font-medium"
                                                        >
                                                            View Details →
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
                )}
            </div>
        </div>
    );
}
