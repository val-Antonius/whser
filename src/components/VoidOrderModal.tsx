'use client';

import { useState } from 'react';

interface VoidOrderModalProps {
    orderId: number;
    orderNumber: string;
    estimatedPrice: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function VoidOrderModal({
    orderId,
    orderNumber,
    estimatedPrice,
    isOpen,
    onClose,
    onSuccess,
}: VoidOrderModalProps) {
    const [voidReason, setVoidReason] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleVoid = async () => {
        if (!voidReason.trim()) {
            setError('Void reason is required');
            return;
        }

        if (!authCode.trim()) {
            setError('Authorization code is required');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const response = await fetch(`/api/orders/${orderId}/void`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    void_reason: voidReason,
                    authorization_code: authCode,
                    voided_by: 1, // TODO: Get from session
                }),
            });

            const data = await response.json();
            if (data.success) {
                onSuccess();
                resetForm();
            } else {
                setError(data.error || 'Failed to void transaction');
            }
        } catch (error) {
            setError('Failed to void transaction');
            console.error('Error voiding transaction:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setVoidReason('');
        setAuthCode('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Void Transaction</h3>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">
                        <strong>Warning:</strong> This action will void order {orderNumber}.
                        This is irreversible and should only be used for transaction errors.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">Order Amount:</p>
                        <p className="text-lg font-semibold text-gray-900">
                            Rp {estimatedPrice.toLocaleString('id-ID')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Void Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            rows={3}
                            placeholder="Enter reason for voiding this transaction..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Example: Duplicate entry, wrong customer, system error, etc.
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
                            Manager authorization required for void operations
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleVoid}
                            disabled={isProcessing}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                        >
                            {isProcessing ? 'Voiding...' : 'Void Transaction'}
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
