'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CancelOrderModal from '@/components/CancelOrderModal';
import VoidOrderModal from '@/components/VoidOrderModal';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import CostAttributionCard from '@/components/inventory/CostAttributionCard';
import { ExceptionDialog } from '@/components/orders/ExceptionDialog';
import { ExceptionCard } from '@/components/orders/ExceptionCard';
import { OrderStatus } from '@/types';
import RewashModal from '@/components/service/RewashModal';

interface PaymentTransaction {
    id: number;
    transaction_type: string;
    amount: number;
    payment_method: string;
    reference_number: string;
    notes: string;
    created_at: string;
    created_by_name: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [order, setOrder] = useState<any>(null);
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [statusHistory, setStatusHistory] = useState<any[]>([]);
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExceptionDialog, setShowExceptionDialog] = useState(false);
    const [showRewashModal, setShowRewashModal] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
        fetchPayments();
        fetchStatusHistory();
        fetchExceptions();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const response = await fetch(`/api/orders/${id}`);
            const data = await response.json();
            if (data.success) {
                setOrder(data.data);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPayments = async () => {
        try {
            const response = await fetch(`/api/orders/${id}/payments`);
            const data = await response.json();
            if (data.success) {
                setPayments(data.data);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const fetchStatusHistory = async () => {
        try {
            const response = await fetch(`/api/orders/${id}/status-history`);
            const data = await response.json();
            if (data.success) {
                setStatusHistory(data.data);
            }
        } catch (error) {
            console.error('Error fetching status history:', error);
        }
    };

    const fetchExceptions = async () => {
        try {
            const response = await fetch(`/api/orders/${id}/exceptions`);
            const data = await response.json();
            if (data.exceptions) {
                setExceptions(data.exceptions);
            }
        } catch (error) {
            console.error('Error fetching exceptions:', error);
        }
    };

    const handleActionSuccess = () => {
        fetchOrderDetails();
        fetchPayments();
        fetchStatusHistory();
        fetchExceptions();
    };

    const handleCreateException = async (data: any) => {
        try {
            const response = await fetch(`/api/orders/${id}/exceptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, reported_by: 1 }) // TODO: Get from session
            });

            if (response.ok) {
                await fetchExceptions();
                alert('Exception created successfully');
            } else {
                throw new Error('Failed to create exception');
            }
        } catch (error) {
            console.error('Error creating exception:', error);
            throw error;
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const response = await fetch(`/api/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_status: newStatus,
                    changed_by: 1, // TODO: Get from session
                    actual_completion: newStatus === 'completed' ? new Date().toISOString() : undefined
                })
            });

            if (response.ok) {
                await handleActionSuccess();
                alert('Status updated successfully');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getNextStatusButton = () => {
        const status = order.current_status;
        const statusButtons: Record<string, { label: string; nextStatus: string; color: string }> = {
            'received': { label: 'Start Processing', nextStatus: 'waiting_for_process', color: 'bg-blue-600 hover:bg-blue-700' },
            'waiting_for_process': { label: 'Start Wash', nextStatus: 'in_wash', color: 'bg-purple-600 hover:bg-purple-700' },
            'in_wash': { label: 'Move to Dry', nextStatus: 'in_dry', color: 'bg-purple-600 hover:bg-purple-700' },
            'in_dry': { label: 'Move to Iron', nextStatus: 'in_iron', color: 'bg-indigo-600 hover:bg-indigo-700' },
            'in_iron': { label: 'Move to Fold', nextStatus: 'in_fold', color: 'bg-indigo-600 hover:bg-indigo-700' },
            'in_fold': { label: 'Ready for QC', nextStatus: 'ready_for_qc', color: 'bg-orange-600 hover:bg-orange-700' },
            'ready_for_qc': { label: 'Mark as Completed', nextStatus: 'completed', color: 'bg-green-600 hover:bg-green-700' },
            'completed': { label: 'Ready for Pickup', nextStatus: 'ready_for_pickup', color: 'bg-green-600 hover:bg-green-700' },
            'ready_for_pickup': { label: 'Mark as Picked Up', nextStatus: 'closed', color: 'bg-gray-600 hover:bg-gray-700' },
        };

        const button = statusButtons[status];
        if (!button) return null;

        return (
            <button
                onClick={() => handleUpdateStatus(button.nextStatus)}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${button.color}`}
            >
                {button.label}
            </button>
        );
    };

    const formatStatus = (status: string) => {
        if (!status) return 'N/A';
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: 'bg-blue-100 text-blue-800',
            waiting_for_process: 'bg-yellow-100 text-yellow-800',
            in_wash: 'bg-purple-100 text-purple-800',
            in_dry: 'bg-purple-100 text-purple-800',
            in_iron: 'bg-indigo-100 text-indigo-800',
            in_fold: 'bg-indigo-100 text-indigo-800',
            ready_for_qc: 'bg-orange-100 text-orange-800',
            completed: 'bg-green-100 text-green-800',
            ready_for_pickup: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'bg-red-100 text-red-800',
            partial: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getTransactionTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            payment: 'bg-green-100 text-green-800',
            deposit: 'bg-blue-100 text-blue-800',
            refund: 'bg-red-100 text-red-800',
            adjustment: 'bg-yellow-100 text-yellow-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading order details...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Order not found</div>
            </div>
        );
    }

    const canCancel = order.current_status !== 'closed' && order.current_status !== 'cancelled' && !order.is_voided;
    const canVoid = order.current_status !== 'closed' && !order.is_voided;
    const canRecordPayment = !order.is_voided && order.balance_due > 0;
    const canRewash = order && ['ready_for_qc', 'completed'].includes(order.current_status);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <Link href="/admin/orders" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                            ← Kembali ke Pesanan
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Detail Pesanan</h1>
                        <p className="text-gray-600 mt-1">{order.order_number}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {getNextStatusButton()}
                        {canRecordPayment && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Catat Pembayaran
                            </button>
                        )}
                        {canRewash && (
                            <button
                                onClick={() => setShowRewashModal(true)}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Catat Rewash
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                Batalkan (Cancel)
                            </button>
                        )}
                        {canVoid && (
                            <button
                                onClick={() => setShowVoidModal(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Void Transaksi
                            </button>
                        )}
                    </div>
                </div>

                {/* Voided/Cancelled Alert */}
                {order.is_voided && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800 font-semibold">⚠️ This transaction has been voided</p>
                    </div>
                )}
                {order.current_status === 'cancelled' && !order.is_voided && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-semibold">⚠️ This order has been cancelled</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Customer</p>
                                    <p className="font-medium">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Phone</p>
                                    <p className="font-medium">{order.customer_phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Service</p>
                                    <p className="font-medium">{order.service_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Priority</p>
                                    <p className="font-medium capitalize">{order.priority}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Weight/Quantity</p>
                                    <p className="font-medium">
                                        {order.unit_type === 'kg'
                                            ? `${order.estimated_weight} kg`
                                            : `${order.quantity} pcs`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Status</p>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.current_status)}`}>
                                        {formatStatus(order.current_status)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-gray-600">Created</p>
                                    <p className="font-medium">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Est. Completion</p>
                                    <p className="font-medium">
                                        {order.estimated_completion
                                            ? new Date(order.estimated_completion).toLocaleString('id-ID')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            {order.special_instructions && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-gray-600 text-sm">Special Instructions</p>
                                    <p className="text-gray-900">{order.special_instructions}</p>
                                </div>
                            )}
                            {order.minimum_charge_applied && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm text-blue-600">ℹ️ Minimum charge applied for this order</p>
                                </div>
                            )}
                        </div>

                        {/* Exceptions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Exceptions</h2>
                                {order && ![OrderStatus.RECEIVED, OrderStatus.CLOSED, OrderStatus.CANCELLED].includes(order.current_status as OrderStatus) && (
                                    <button
                                        onClick={() => setShowExceptionDialog(true)}
                                        className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                                    >
                                        Add Exception
                                    </button>
                                )}
                            </div>
                            {exceptions.length > 0 ? (
                                <div className="space-y-3">
                                    {exceptions.map((exception) => (
                                        <ExceptionCard key={exception.id} exception={exception} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No exceptions reported</p>
                            )}
                        </div>

                        {/* Payment Transactions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
                            {payments.length > 0 ? (
                                <div className="space-y-3">
                                    {payments.map((payment) => (
                                        <div key={payment.id} className="border border-gray-200 rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getTransactionTypeColor(payment.transaction_type)}`}>
                                                    {payment.transaction_type.toUpperCase()}
                                                </span>
                                                <span className="text-lg font-bold text-gray-900">
                                                    Rp {payment.amount.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                {payment.payment_method && (
                                                    <p>Method: {payment.payment_method}</p>
                                                )}
                                                {payment.reference_number && (
                                                    <p>Ref: {payment.reference_number}</p>
                                                )}
                                                {payment.notes && (
                                                    <p className="italic">"{payment.notes}"</p>
                                                )}
                                                <p className="text-xs">
                                                    {new Date(payment.created_at).toLocaleString('id-ID')}
                                                    {payment.created_by_name && ` • by ${payment.created_by_name}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No payment transactions recorded</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Payment Summary & Status */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Price</span>
                                    <span className="font-semibold">Rp {parseFloat(order.estimated_price).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Paid Amount</span>
                                    <span className="font-semibold text-green-600">Rp {parseFloat(order.paid_amount).toLocaleString('id-ID')}</span>
                                </div>
                                {order.deposit_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Deposit</span>
                                        <span className="font-semibold text-blue-600">Rp {parseFloat(order.deposit_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3 flex justify-between">
                                    <span className="text-gray-900 font-semibold">Balance Due</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        Rp {parseFloat(order.balance_due).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Status</span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                                        {order.payment_status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cost Attribution */}
                        <CostAttributionCard orderId={parseInt(id)} />

                        {/* Status History */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
                            {statusHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {statusHistory.map((log, index) => (
                                        <div key={log.id} className="text-sm">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-600" />
                                                <div className="ml-3 flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {formatStatus(log.new_status)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(log.changed_at).toLocaleString('id-ID')}
                                                    </p>
                                                    {log.notes && (
                                                        <p className="text-xs text-gray-600 mt-1 italic">
                                                            {log.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {index < statusHistory.length - 1 && (
                                                <div className="ml-1 w-0.5 h-4 bg-gray-200" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No status history available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CancelOrderModal
                orderId={parseInt(id)}
                orderNumber={order.order_number}
                paidAmount={parseFloat(order.paid_amount)}
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onSuccess={() => {
                    setShowCancelModal(false);
                    handleActionSuccess();
                    alert('Order cancelled successfully');
                }}
            />

            <VoidOrderModal
                orderId={parseInt(id)}
                orderNumber={order.order_number}
                estimatedPrice={parseFloat(order.estimated_price)}
                isOpen={showVoidModal}
                onClose={() => setShowVoidModal(false)}
                onSuccess={() => {
                    setShowVoidModal(false);
                    handleActionSuccess();
                    alert('Transaction voided successfully');
                }}
            />

            <RecordPaymentModal
                orderId={parseInt(id)}
                orderNumber={order.order_number}
                totalPrice={parseFloat(order.estimated_price)}
                paidAmount={parseFloat(order.paid_amount)}
                balanceDue={parseFloat(order.balance_due)}
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={() => {
                    setShowPaymentModal(false);
                    handleActionSuccess();
                    alert('Payment recorded successfully');
                }}
            />

            <RewashModal
                orderId={parseInt(id)}
                isOpen={showRewashModal}
                onClose={() => setShowRewashModal(false)}
                onSuccess={() => {
                    handleActionSuccess();
                    alert('Rewash recorded successfully');
                }}
            />

            <ExceptionDialog
                open={showExceptionDialog}
                onOpenChange={setShowExceptionDialog}
                onSubmit={handleCreateException}
            />
        </div>
    );
}
