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
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
            received: 'bg-blue-50 text-blue-700 border-blue-100',
            waiting_for_process: 'bg-amber-50 text-amber-700 border-amber-100',
            in_wash: 'bg-sky-50 text-sky-700 border-sky-100',
            in_dry: 'bg-sky-50 text-sky-700 border-sky-100',
            in_iron: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            in_fold: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            ready_for_qc: 'bg-orange-50 text-orange-700 border-orange-100',
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            ready_for_pickup: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            closed: 'bg-slate-50 text-slate-600 border-slate-100',
            cancelled: 'bg-red-50 text-red-700 border-red-100',
        };
        return colors[status] || 'bg-slate-50 text-slate-600 border-slate-100';
    };

    const getPriorityColor = (priority: string) => {
        return priority === 'express'
            ? 'bg-red-50 text-red-700 border-red-100'
            : 'bg-slate-50 text-slate-600 border-slate-100';
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
        <div>
            <PageHeader
                title="Manajemen Proses Layanan"
                description="Lacak dan kelola alur kerja pesanan dengan fitur lanjutan"
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/reports/aging">
                            <Button variant="outline">
                                📊 Laporan Aging
                            </Button>
                        </Link>
                        <Button onClick={() => setShowBatchModal(true)}>
                            + Buat Batch
                        </Button>
                    </div>
                }
            />

            {/* SLA Alert Banner */}
            <div className="mb-6">
                <SLAAlertBanner alerts={slaAlerts} onAcknowledge={handleAcknowledgeAlert} />
            </div>

            {/* Active Batches Section */}
            {batches.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3">Active Batches</h2>
                    <BatchList batches={batches} onBatchClick={handleBatchClick} />
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-white/50 mb-6 p-1">
                <div className="flex p-1 gap-1">
                    <button
                        onClick={() => {
                            setActiveTab('active');
                            setStatusFilter('');
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'active'
                            ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        Active Orders ({orders.filter(o => !['completed', 'ready_for_pickup', 'closed', 'cancelled'].includes(o.current_status)).length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('completed');
                            setStatusFilter('completed');
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'completed'
                            ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('all');
                            setStatusFilter('');
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'all'
                            ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
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

            {/* Order Queue - Enhanced Kanban Style */}
            {
                isLoading ? (
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
                                                            className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300"
                                                        >
                                                            {/* Order Header - Clickable */}
                                                            <div
                                                                onClick={() => toggleOrderExpansion(order.id)}
                                                                className="p-4 cursor-pointer hover:bg-white/40 transition-colors rounded-t-xl"
                                                            >
                                                                {/* Order Number & Priority */}
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="font-semibold text-slate-800 text-sm">
                                                                        {order.order_number}
                                                                    </span>
                                                                    <div className="flex gap-1">
                                                                        {order.priority === 'express' && (
                                                                            <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded border ${getPriorityColor(order.priority)}`}>
                                                                                EXPRESS
                                                                            </span>
                                                                        )}
                                                                        {order.is_priority && (
                                                                            <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-700 border border-amber-200 rounded font-medium">
                                                                                PRIORITY
                                                                            </span>
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
                        ) : <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pesanan</TableHead>
                                        <TableHead>Pelanggan</TableHead>
                                        <TableHead>Layanan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Prioritas</TableHead>
                                        <TableHead>Umur (Jam)</TableHead>
                                        <TableHead>Estimasi Selesai</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => {
                                        const slaStatus = getSLAStatus(order.estimated_completion, order.current_status);
                                        return (
                                            <TableRow key={order.id}>
                                                <TableCell>
                                                    <div className="font-medium">{order.order_number}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{order.customer_name}</div>
                                                    <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                                                </TableCell>
                                                <TableCell>{order.service_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getStatusColor(order.current_status)}>
                                                        {formatStatus(order.current_status)}
                                                    </Badge>
                                                    {slaStatus && (
                                                        <div className={`mt-1 px-2 py-0.5 inline-flex text-xs font-semibold rounded border ${slaStatus.color}`}>
                                                            {slaStatus.label}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Badge variant="secondary" className={getPriorityColor(order.priority)}>
                                                            {order.priority.toUpperCase()}
                                                        </Badge>
                                                        {order.is_priority && (
                                                            <span className="text-orange-600">⚡</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(String(order.aging_hours || 0)).toFixed(1)}h
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(order.estimated_completion).toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="link" size="sm" asChild>
                                                        <Link href={`/admin/orders/${order.id}`}>
                                                            Lihat Detail
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        }
                    </div>
                )
            }
        </div >


    );
}
