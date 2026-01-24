'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderStatus } from '@/types';

// Import Phase 2.2 Components
import SLAAlertBanner from '@/components/service/SLAAlertBanner';
import OrderAgingCard from '@/components/service/OrderAgingCard';
import PriorityMarker from '@/components/service/PriorityMarker';
import ExceptionList from '@/components/service/ExceptionList';
import ExceptionReportModal from '@/components/service/ExceptionReportModal';
import ProcessChecklist from '@/components/service/ProcessChecklist';
import RewashModal from '@/components/service/RewashModal';
import BatchCreateModal from '@/components/service/BatchCreateModal';
import BatchList from '@/components/service/BatchList';

interface QueueOrder {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    service_name: string;
    service_id: number;
    current_status: string;
    priority: string;
    is_priority: boolean;
    priority_reason?: string;
    estimated_completion: string;
    created_at: string;
    estimated_price: number;
    aging_hours: number;
    stage_aging_hours: number;
}

interface Exception {
    id: number;
    exception_type: string;
    description: string;
    severity: string;
    status: string;
    reported_at: string;
    resolved_at?: string;
    resolution_notes?: string;
}

interface ChecklistItem {
    id: number;
    checklist_item: string;
    is_required: boolean;
    is_completed: boolean;
    completed_at?: string;
    completed_by?: number;
}

interface SLAAlert {
    id: number;
    order_id: number;
    alert_type: 'approaching' | 'breached' | 'critical';
    alert_message: string;
    hours_remaining: number | null;
    is_acknowledged: boolean;
    created_at: string;
}

interface Batch {
    id: number;
    batch_number: string;
    batch_type: string;
    status: string;
    total_orders: number;
    total_weight: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

export default function ServiceManagementPage() {
    const [orders, setOrders] = useState<QueueOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
    const [statusFilter, setStatusFilter] = useState('');

    // Phase 2.2 State
    const [slaAlerts, setSlaAlerts] = useState<SLAAlert[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [showExceptionModal, setShowExceptionModal] = useState(false);
    const [showRewashModal, setShowRewashModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchOrders();
        fetchSLAAlerts();
        fetchBatches();
    }, [activeTab, statusFilter]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            let url = '/api/orders?limit=100';

            if (activeTab === 'active') {
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

    const fetchSLAAlerts = async () => {
        try {
            const response = await fetch('/api/sla-alerts?acknowledged=false');
            const data = await response.json();
            setSlaAlerts(data.alerts || []);
        } catch (error) {
            console.error('Error fetching SLA alerts:', error);
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await fetch('/api/batches?status=pending&status=in_progress');
            const data = await response.json();
            setBatches(data.batches || []);
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    const handleAcknowledgeAlert = async (alertId: number) => {
        try {
            await fetch(`/api/sla-alerts/${alertId}/acknowledge`, {
                method: 'POST',
            });
            fetchSLAAlerts();
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    const handleBatchClick = (batchId: number) => {
        // Navigate to batch detail or open modal
        window.location.href = `/admin/batches/${batchId}`;
    };

    const toggleOrderExpansion = (orderId: number) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
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
                    <p className="text-gray-600 mt-1">Track and manage order workflow with advanced features</p>
                </div>

                {/* SLA Alert Banner */}
                <SLAAlertBanner alerts={slaAlerts} onAcknowledge={handleAcknowledgeAlert} />

                {/* Action Buttons */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={() => setShowBatchModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Create Batch
                    </button>
                    <Link
                        href="/admin/reports/aging"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        📊 View Aging Report
                    </Link>
                </div>

                {/* Active Batches Section */}
                {batches.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3">Active Batches</h2>
                        <BatchList batches={batches} onBatchClick={handleBatchClick} />
                    </div>
                )}

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

                {/* Order Queue - Enhanced Kanban Style */}
                {isLoading ? (
                    <div className="text-center py-12 text-gray-600">Loading orders...</div>
                ) : activeTab === 'active' && !statusFilter ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                            {statusOrder.map(status => {
                                const statusOrders = orders.filter(o => o.current_status === status);
                                if (statusOrders.length === 0) return null;

                                return (
                                    <div key={status} className="flex-shrink-0 w-96">
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
                                                    const isExpanded = expandedOrders.has(order.id);

                                                    return (
                                                        <div
                                                            key={order.id}
                                                            className="bg-gray-50 rounded-lg border border-gray-200"
                                                        >
                                                            {/* Order Header - Clickable */}
                                                            <div
                                                                onClick={() => toggleOrderExpansion(order.id)}
                                                                className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                                            >
                                                                {/* Order Number & Priority */}
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="font-semibold text-gray-900 text-sm">
                                                                        {order.order_number}
                                                                    </span>
                                                                    <div className="flex gap-1">
                                                                        {order.priority === 'express' && (
                                                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityColor(order.priority)}`}>
                                                                                EXPRESS
                                                                            </span>
                                                                        )}
                                                                        {order.is_priority && (
                                                                            <span className="text-orange-600 text-lg">⚡</span>
                                                                        )}
                                                                    </div>
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
                                                                    <div className={`text-xs font-semibold px-2 py-1 rounded border ${slaStatus.color} inline-block mb-2`}>
                                                                        {slaStatus.label}
                                                                    </div>
                                                                )}

                                                                {/* Aging Indicator */}
                                                                <div className="text-xs text-gray-500">
                                                                    Age: {parseFloat(String(order.aging_hours || 0)).toFixed(1)}h | Stage: {parseFloat(String(order.stage_aging_hours || 0)).toFixed(1)}h
                                                                </div>

                                                                {/* Expand Indicator */}
                                                                <div className="text-xs text-blue-600 mt-2">
                                                                    {isExpanded ? '▼ Click to collapse' : '▶ Click to expand details'}
                                                                </div>
                                                            </div>

                                                            {/* Expanded Details */}
                                                            {isExpanded && (
                                                                <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
                                                                    {/* Order Aging Card */}
                                                                    <OrderAgingCard
                                                                        agingHours={parseFloat(String(order.aging_hours || 0))}
                                                                        stageAgingHours={parseFloat(String(order.stage_aging_hours || 0))}
                                                                        currentStage={formatStatus(order.current_status)}
                                                                        createdAt={order.created_at}
                                                                    />

                                                                    {/* Priority Marker */}
                                                                    <PriorityMarker
                                                                        orderId={order.id}
                                                                        isPriority={order.is_priority}
                                                                        priorityReason={order.priority_reason}
                                                                        onUpdate={fetchOrders}
                                                                    />

                                                                    {/* Action Buttons */}
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedOrderId(order.id);
                                                                                setShowExceptionModal(true);
                                                                            }}
                                                                            className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                                                                        >
                                                                            Report Exception
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedOrderId(order.id);
                                                                                setShowRewashModal(true);
                                                                            }}
                                                                            className="flex-1 px-3 py-2 text-sm bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100"
                                                                        >
                                                                            Record Rewash
                                                                        </button>
                                                                    </div>

                                                                    {/* View Full Details Link */}
                                                                    <Link
                                                                        href={`/admin/orders/${order.id}`}
                                                                        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        View Full Details →
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                Aging
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
                                                        <div className="flex items-center gap-1">
                                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded border ${getPriorityColor(order.priority)}`}>
                                                                {order.priority.toUpperCase()}
                                                            </span>
                                                            {order.is_priority && (
                                                                <span className="text-orange-600 text-lg">⚡</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {parseFloat(String(order.aging_hours || 0)).toFixed(1)}h
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(order.estimated_completion).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
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

            {/* Modals */}
            {selectedOrderId && (
                <>
                    <ExceptionReportModal
                        orderId={selectedOrderId}
                        isOpen={showExceptionModal}
                        onClose={() => {
                            setShowExceptionModal(false);
                            setSelectedOrderId(null);
                        }}
                        onSuccess={() => {
                            fetchOrders();
                            setShowExceptionModal(false);
                            setSelectedOrderId(null);
                        }}
                    />
                    <RewashModal
                        orderId={selectedOrderId}
                        isOpen={showRewashModal}
                        onClose={() => {
                            setShowRewashModal(false);
                            setSelectedOrderId(null);
                        }}
                        onSuccess={() => {
                            fetchOrders();
                            setShowRewashModal(false);
                            setSelectedOrderId(null);
                        }}
                    />
                </>
            )}
            <BatchCreateModal
                isOpen={showBatchModal}
                onClose={() => setShowBatchModal(false)}
                onSuccess={() => {
                    fetchBatches();
                    setShowBatchModal(false);
                }}
            />
        </div>
    );
}
