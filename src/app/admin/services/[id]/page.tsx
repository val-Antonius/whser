'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderStatus } from '@/types';

interface OrderDetail {
    order: any;
    statusHistory: any[];
    processJobs: any[];
    sla: {
        estimatedCompletion: string;
        isOverdue: boolean;
        hoursRemaining: number;
        status: string;
    };
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrderDetail();
    }, [params.id]);

    const fetchOrderDetail = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${params.id}`);
            const data = await response.json();
            if (data.success) {
                setOrderDetail(data.data);
            } else {
                setError(data.error || 'Failed to load order');
            }
        } catch (error) {
            console.error('Error fetching order detail:', error);
            setError('Failed to load order');
        } finally {
            setIsLoading(false);
        }
    };

    const getValidNextStatuses = (currentStatus: string): { value: string; label: string }[] => {
        const transitions: Record<string, { value: string; label: string }[]> = {
            [OrderStatus.RECEIVED]: [
                { value: OrderStatus.WAITING_FOR_PROCESS, label: 'Move to Waiting for Process' },
                { value: OrderStatus.CANCELLED, label: 'Cancel Order' },
            ],
            [OrderStatus.WAITING_FOR_PROCESS]: [
                { value: OrderStatus.IN_WASH, label: 'Start Washing' },
                { value: OrderStatus.CANCELLED, label: 'Cancel Order' },
            ],
            [OrderStatus.IN_WASH]: [
                { value: OrderStatus.IN_DRY, label: 'Move to Drying' },
                { value: OrderStatus.CANCELLED, label: 'Cancel Order' },
            ],
            [OrderStatus.IN_DRY]: [
                { value: OrderStatus.IN_IRON, label: 'Move to Ironing' },
                { value: OrderStatus.IN_FOLD, label: 'Move to Folding' },
                { value: OrderStatus.READY_FOR_QC, label: 'Ready for Quality Check' },
            ],
            [OrderStatus.IN_IRON]: [
                { value: OrderStatus.IN_FOLD, label: 'Move to Folding' },
                { value: OrderStatus.READY_FOR_QC, label: 'Ready for Quality Check' },
            ],
            [OrderStatus.IN_FOLD]: [
                { value: OrderStatus.READY_FOR_QC, label: 'Ready for Quality Check' },
            ],
            [OrderStatus.READY_FOR_QC]: [
                { value: OrderStatus.COMPLETED, label: 'Mark as Completed (QC Passed)' },
                { value: OrderStatus.IN_WASH, label: 'Rewash (QC Failed)' },
            ],
            [OrderStatus.COMPLETED]: [
                { value: OrderStatus.READY_FOR_PICKUP, label: 'Ready for Customer Pickup' },
            ],
            [OrderStatus.READY_FOR_PICKUP]: [
                { value: OrderStatus.CLOSED, label: 'Close Order (Picked Up)' },
            ],
        };

        return transitions[currentStatus] || [];
    };

    const handleStatusUpdate = async () => {
        if (!newStatus) {
            setError('Please select a new status');
            return;
        }

        setIsUpdating(true);
        setError('');

        try {
            const response = await fetch(`/api/orders/${params.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_status: newStatus,
                    notes: statusNotes || null,
                    changed_by: 1, // TODO: Get from session
                }),
            });

            const data = await response.json();
            if (data.success) {
                setShowStatusUpdate(false);
                setNewStatus('');
                setStatusNotes('');
                fetchOrderDetail(); // Refresh order details
            } else {
                setError(data.error || 'Failed to update status');
            }
        } catch (error) {
            setError('Failed to update status');
            console.error('Error updating status:', error);
        } finally {
            setIsUpdating(false);
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

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading order details...</div>
            </div>
        );
    }

    if (error && !orderDetail) {
        return (
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-red-800">{error}</p>
                        <Link href="/admin/services" className="text-red-600 hover:text-red-800 mt-4 inline-block">
                            ← Back to Service Management
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!orderDetail) return null;

    const { order, statusHistory, processJobs, sla } = orderDetail;
    const validNextStatuses = getValidNextStatuses(order.current_status);
    const canUpdateStatus = validNextStatuses.length > 0;

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/services" className="text-green-600 hover:text-green-800 text-sm font-medium mb-2 inline-block">
                        ← Back to Service Management
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{order.order_number}</h1>
                            <p className="text-gray-600 mt-1">Order Details & Workflow</p>
                        </div>
                        {canUpdateStatus && (
                            <button
                                onClick={() => setShowStatusUpdate(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Update Status
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Status Update Modal */}
                {showStatusUpdate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Order Status</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Status
                                    </label>
                                    <div className={`px-3 py-2 rounded-lg ${getStatusColor(order.current_status)}`}>
                                        {formatStatus(order.current_status)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="">Select new status...</option>
                                        {validNextStatuses.map(status => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={statusNotes}
                                        onChange={(e) => setStatusNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Add any notes about this status change..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleStatusUpdate}
                                        disabled={isUpdating || !newStatus}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {isUpdating ? 'Updating...' : 'Update Status'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowStatusUpdate(false);
                                            setNewStatus('');
                                            setStatusNotes('');
                                            setError('');
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Current Status & SLA */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
                            <div className="flex items-center justify-between">
                                <span className={`px-4 py-2 rounded-lg text-lg font-semibold ${getStatusColor(order.current_status)}`}>
                                    {formatStatus(order.current_status)}
                                </span>

                                {!['completed', 'ready_for_pickup', 'closed', 'cancelled'].includes(order.current_status) && (
                                    <div className="text-right">
                                        <div className={`text-sm font-semibold ${sla.status === 'overdue' ? 'text-red-600' :
                                                sla.status === 'at_risk' ? 'text-yellow-600' :
                                                    'text-green-600'
                                            }`}>
                                            {sla.status === 'overdue' ? '⚠️ OVERDUE' :
                                                sla.status === 'at_risk' ? '⏰ AT RISK' :
                                                    '✓ ON TRACK'}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {sla.isOverdue
                                                ? `${Math.abs(sla.hoursRemaining).toFixed(1)}h overdue`
                                                : `${sla.hoursRemaining.toFixed(1)}h remaining`
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Order Number:</span>
                                    <div className="font-medium text-gray-900">{order.order_number}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Service:</span>
                                    <div className="font-medium text-gray-900">{order.service_name}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Priority:</span>
                                    <div className="font-medium text-gray-900 capitalize">{order.priority}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Unit Type:</span>
                                    <div className="font-medium text-gray-900">{order.unit_type}</div>
                                </div>
                                {order.estimated_weight && (
                                    <div>
                                        <span className="text-gray-600">Weight:</span>
                                        <div className="font-medium text-gray-900">{order.estimated_weight} kg</div>
                                    </div>
                                )}
                                {order.quantity && (
                                    <div>
                                        <span className="text-gray-600">Quantity:</span>
                                        <div className="font-medium text-gray-900">{order.quantity} pcs</div>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-600">Estimated Price:</span>
                                    <div className="font-medium text-gray-900">Rp {order.estimated_price.toLocaleString('id-ID')}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Payment Status:</span>
                                    <div className="font-medium text-gray-900 capitalize">{order.payment_status}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Created:</span>
                                    <div className="font-medium text-gray-900">
                                        {new Date(order.created_at).toLocaleString('id-ID')}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Estimated Completion:</span>
                                    <div className="font-medium text-gray-900">
                                        {new Date(order.estimated_completion).toLocaleString('id-ID')}
                                    </div>
                                </div>
                                {order.actual_completion && (
                                    <div>
                                        <span className="text-gray-600">Actual Completion:</span>
                                        <div className="font-medium text-gray-900">
                                            {new Date(order.actual_completion).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                )}
                                {order.special_instructions && (
                                    <div className="col-span-2">
                                        <span className="text-gray-600">Special Instructions:</span>
                                        <div className="font-medium text-gray-900 mt-1">{order.special_instructions}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status History */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
                            <div className="space-y-4">
                                {statusHistory.map((log, index) => (
                                    <div key={log.id} className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {index === 0 ? '✓' : index + 1}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {log.previous_status && (
                                                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(log.previous_status)}`}>
                                                        {formatStatus(log.previous_status)}
                                                    </span>
                                                )}
                                                {log.previous_status && <span className="text-gray-400">→</span>}
                                                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(log.new_status)}`}>
                                                    {formatStatus(log.new_status)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {new Date(log.changed_at).toLocaleString('id-ID')}
                                                {log.changed_by_name && ` • by ${log.changed_by_name}`}
                                            </div>
                                            {log.notes && (
                                                <div className="text-sm text-gray-700 mt-1 italic">"{log.notes}"</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Customer Info */}
                    <div className="space-y-6">
                        {/* Customer Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Name:</span>
                                    <div className="font-medium text-gray-900">{order.customer_name}</div>
                                </div>
                                {order.customer_phone && (
                                    <div>
                                        <span className="text-gray-600">Phone:</span>
                                        <div className="font-medium text-gray-900">{order.customer_phone}</div>
                                    </div>
                                )}
                                {order.customer_email && (
                                    <div>
                                        <span className="text-gray-600">Email:</span>
                                        <div className="font-medium text-gray-900">{order.customer_email}</div>
                                    </div>
                                )}
                                {order.customer_address && (
                                    <div>
                                        <span className="text-gray-600">Address:</span>
                                        <div className="font-medium text-gray-900">{order.customer_address}</div>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-600">Segment:</span>
                                    <div className="font-medium text-gray-900 capitalize">{order.customer_segment}</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {canUpdateStatus && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <h3 className="font-semibold text-green-900 mb-3">Next Actions</h3>
                                <div className="space-y-2">
                                    {validNextStatuses.map(status => (
                                        <button
                                            key={status.value}
                                            onClick={() => {
                                                setNewStatus(status.value);
                                                setShowStatusUpdate(true);
                                            }}
                                            className="w-full text-left px-4 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm"
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
