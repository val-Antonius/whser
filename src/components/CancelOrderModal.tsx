'use client';

import { useState } from 'react';
import { validateAuthorizationCode } from '@/lib/authorization';

interface CancelOrderModalProps {
    orderId: number;
    orderNumber: string;
    paidAmount: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CancelOrderModal({
    orderId,
    orderNumber,
    paidAmount,
    isOpen,
    onClose,
    onSuccess,
}: CancelOrderModalProps) {
    const [cancellationReason, setCancellationReason] = useState('');
    const [refundAmount, setRefundAmount] = useState(paidAmount.toString());
    const [authCode, setAuthCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleCancel = async () => {
        if (!cancellationReason.trim()) {
            setError('Cancellation reason is required');
            return;
        }

        if (!authCode.trim()) {
            setError('Authorization code is required');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cancellation_reason: cancellationReason,
                    refund_amount: parseFloat(refundAmount) || 0,
                    authorization_code: authCode,
                    cancelled_by: 1, // TODO: Get from session
                }),
            });

            const data = await response.json();
            if (data.success) {
                onSuccess();
                resetForm();
            } else {
                setError(data.error || 'Failed to cancel order');
            }
        } catch (error) {
            setError('Failed to cancel order');
            console.error('Error cancelling order:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setCancellationReason('');
        setRefundAmount('0');
        setAuthCode('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> This action will cancel order {orderNumber}. This cannot be undone.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cancellation Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            rows={3}
                            placeholder="Enter reason for cancellation..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Refund Amount (Rp)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={paidAmount}
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Paid amount: Rp {paidAmount.toLocaleString('id-ID')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Authorization Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                            placeholder="Enter manager authorization code"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Manager authorization required for cancellation
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={isProcessing}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                        >
                            {isProcessing ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
