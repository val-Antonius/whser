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
import { ProcessJobList } from '@/components/orders/ProcessJobList';

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
            received: 'bg-blue-50/50 text-blue-700 border-blue-100',
            waiting_for_process: 'bg-amber-50/50 text-amber-700 border-amber-100',
            in_wash: 'bg-indigo-50/50 text-indigo-700 border-indigo-100',
            in_dry: 'bg-violet-50/50 text-violet-700 border-violet-100',
            in_iron: 'bg-purple-50/50 text-purple-700 border-purple-100',
            in_fold: 'bg-fuchsia-50/50 text-fuchsia-700 border-fuchsia-100',
            ready_for_qc: 'bg-orange-50/50 text-orange-700 border-orange-100',
            completed: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
            ready_for_pickup: 'bg-teal-50/50 text-teal-700 border-teal-100',
            closed: 'bg-slate-50/50 text-slate-700 border-slate-100',
            cancelled: 'bg-rose-50/50 text-rose-700 border-rose-100',
        };
        return colors[status] || 'bg-slate-50/50 text-slate-700 border-slate-100';
    };

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'bg-rose-50/50 text-rose-700 border-rose-100',
            partial: 'bg-amber-50/50 text-amber-700 border-amber-100',
            paid: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
        };
        return colors[status] || 'bg-slate-50/50 text-slate-700 border-slate-100';
    };

    const getTransactionTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            payment: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
            deposit: 'bg-sky-50/50 text-sky-700 border-sky-100',
            refund: 'bg-rose-50/50 text-rose-700 border-rose-100',
            adjustment: 'bg-amber-50/50 text-amber-700 border-amber-100',
        };
        return colors[type] || 'bg-slate-50/50 text-slate-700 border-slate-100';
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
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <Link href="/admin/orders" className="text-sky-600 hover:text-sky-800 text-sm mb-3 flex items-center gap-1 transition-colors group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali ke Pesanan
                        </Link>
                        <h1 className="text-3xl font-light text-slate-900">Detail Pesanan</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="bg-white/50 px-2 py-0.5 rounded border border-white/60 text-xs font-mono">{order.order_number}</span>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => window.open(`/admin/orders/${id}/print`, '_blank')}
                            className="px-4 py-2 bg-white/60 backdrop-blur-sm text-slate-700 border border-white/60 rounded-full hover:bg-white/80 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <span>🖨️</span> Print
                        </button>
                        {getNextStatusButton()}
                        {canRecordPayment && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="px-5 py-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-all shadow-md shadow-sky-500/20"
                            >
                                Catat Pembayaran
                            </button>
                        )}
                        {canRewash && (
                            <button
                                onClick={() => setShowRewashModal(true)}
                                className="px-5 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
                            >
                                Catat Rewash
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="px-4 py-2 bg-white/40 backdrop-blur-sm text-rose-600 border border-rose-100 rounded-full hover:bg-rose-50 transition-all"
                            >
                                Batalkan (Cancel)
                            </button>
                        )}
                        {canVoid && (
                            <button
                                onClick={() => setShowVoidModal(true)}
                                className="px-4 py-2 bg-white/40 backdrop-blur-sm text-rose-700 border border-rose-200 rounded-full hover:bg-rose-100 transition-all"
                            >
                                Void Transaksi
                            </button>
                        )}
                    </div>
                </div>

                {/* Voided/Cancelled Alert */}
                {order.is_voided && (
                    <div className="bg-rose-50/50 backdrop-blur-sm border border-rose-100 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-rose-800 font-medium">This transaction has been voided</p>
                    </div>
                )}
                {order.current_status === 'cancelled' && !order.is_voided && (
                    <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-100 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-amber-800 font-medium">This order has been cancelled</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Information */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                                Order Information
                            </h2>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                                <div>
                                    <p className="text-slate-500 mb-0.5">Customer</p>
                                    <p className="font-semibold text-slate-900">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-0.5">Phone</p>
                                    <p className="font-medium text-slate-700">{order.customer_phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-0.5">Service</p>
                                    <div className="flex items-center gap-2 font-medium text-slate-800 uppercase tracking-wide bg-sky-50/50 px-2.5 py-1 rounded-lg border border-sky-100/50 w-fit">
                                        {order.service_name}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-0.5">Priority</p>
                                    <p className="font-medium text-slate-700 capitalize flex items-center gap-1.5">
                                        {order.priority === 'urgent' && <span className="text-rose-500">🔥</span>}
                                        {order.priority}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-0.5">Weight/Quantity</p>
                                    <p className="font-semibold text-slate-900">
                                        {order.unit_type === 'kg'
                                            ? `${order.estimated_weight} kg`
                                            : `${order.quantity} pcs`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-0.5">Status</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.current_status)}`}>
                                        {formatStatus(order.current_status)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-0.5">Created</p>
                                    <p className="font-medium text-slate-700">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-0.5">Est. Completion</p>
                                    <p className="font-medium text-slate-700">
                                        {order.estimated_completion
                                            ? new Date(order.estimated_completion).toLocaleString('id-ID')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            {order.special_instructions && (
                                <div className="mt-6 pt-5 border-t border-slate-100">
                                    <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider font-semibold">Special Instructions</p>
                                    <p className="text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100 italic">
                                        "{order.special_instructions}"
                                    </p>
                                </div>
                            )}
                            {order.minimum_charge_applied && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-sky-600 flex items-center gap-2 bg-sky-50/50 p-3 rounded-lg border border-sky-100">
                                        <span className="text-lg">ℹ️</span> Minimum charge applied for this order
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* [NEW] Workflow Process List */}
                        {order.processJobs && order.processJobs.length > 0 && (
                            <ProcessJobList jobs={order.processJobs} />
                        )}

                        {/* Exceptions */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    Exceptions
                                </h2>
                                {order && ![OrderStatus.RECEIVED, OrderStatus.CLOSED, OrderStatus.CANCELLED].includes(order.current_status as OrderStatus) && (
                                    <button
                                        onClick={() => setShowExceptionDialog(true)}
                                        className="px-4 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-full hover:bg-orange-600 transition-all shadow-md shadow-orange-500/10"
                                    >
                                        Add Exception
                                    </button>
                                )}
                            </div>
                            {exceptions.length > 0 ? (
                                <div className="space-y-4">
                                    {exceptions.map((exception) => (
                                        <ExceptionCard key={exception.id} exception={exception} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                                    <p className="text-slate-400 text-sm">No exceptions reported</p>
                                </div>
                            )}
                        </div>

                        {/* Payment Transactions */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Payment History
                            </h2>
                            {payments.length > 0 ? (
                                <div className="space-y-4">
                                    {payments.map((payment) => (
                                        <div key={payment.id} className="bg-white/50 border border-white/60 rounded-xl p-4 transition-all hover:shadow-md">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getTransactionTypeColor(payment.transaction_type)}`}>
                                                    {payment.transaction_type}
                                                </span>
                                                <span className="text-lg font-bold text-slate-900">
                                                    Rp {payment.amount.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                {payment.payment_method && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400">Method:</span>
                                                        <span className="font-medium text-slate-700">{payment.payment_method}</span>
                                                    </div>
                                                )}
                                                {payment.reference_number && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400">Ref:</span>
                                                        <span className="font-medium text-slate-700">{payment.reference_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {payment.notes && (
                                                <p className="mt-2 text-xs text-slate-500 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                    "{payment.notes}"
                                                </p>
                                            )}
                                            <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                {new Date(payment.created_at).toLocaleString('id-ID')}
                                                {payment.created_by_name && (
                                                    <>
                                                        <span className="mx-1">•</span>
                                                        <span>by {payment.created_by_name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                                    <p className="text-slate-400 text-sm">No payment transactions recorded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Payment Summary & Status */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                                Payment Summary
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Total Price</span>
                                    <span className="font-semibold text-slate-900">Rp {parseFloat(order.estimated_price).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Paid Amount</span>
                                    <span className="font-bold text-emerald-600">Rp {parseFloat(order.paid_amount).toLocaleString('id-ID')}</span>
                                </div>
                                {order.deposit_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Deposit</span>
                                        <span className="font-semibold text-sky-600">Rp {parseFloat(order.deposit_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
                                    <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Balance Due</span>
                                    <span className="text-2xl font-light text-sky-600">
                                        Rp {parseFloat(order.balance_due).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-slate-500 text-sm">Payment Status</span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${getPaymentStatusColor(order.payment_status)}`}>
                                        {order.payment_status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status History */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                                Status History
                            </h2>
                            {statusHistory.length > 0 ? (
                                <div className="relative pl-6 border-l border-slate-100 space-y-6">
                                    {statusHistory.map((log) => (
                                        <div key={log.id} className="relative">
                                            {/* Dot */}
                                            <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-sky-500 shadow-sm" />

                                            <div className="flex flex-col">
                                                <p className="text-sm font-semibold text-slate-800 leading-none">
                                                    {formatStatus(log.new_status)}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
                                                    {new Date(log.changed_at).toLocaleString('id-ID')}
                                                </p>
                                                {log.notes && (
                                                    <div className="mt-2 text-xs text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100 italic">
                                                        {log.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm text-center py-4 italic">No history available</p>
                            )}
                        </div>

                        {/* Cost Attribution */}
                        <CostAttributionCard orderId={parseInt(id)} />
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
