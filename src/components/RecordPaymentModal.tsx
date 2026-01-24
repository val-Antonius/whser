'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/types';

interface RecordPaymentModalProps {
    orderId: number;
    orderNumber: string;
    totalPrice: number;
    paidAmount: number;
    balanceDue: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RecordPaymentModal({
    orderId,
    orderNumber,
    totalPrice,
    paidAmount,
    balanceDue,
    isOpen,
    onClose,
    onSuccess,
}: RecordPaymentModalProps) {
    const [transactionType, setTransactionType] = useState<'payment' | 'deposit'>('payment');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleRecordPayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (parseFloat(amount) > balanceDue) {
            setError('Payment amount cannot exceed balance due');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const response = await fetch(`/api/orders/${orderId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_type: transactionType,
                    amount: parseFloat(amount),
                    payment_method: paymentMethod,
                    reference_number: referenceNumber || null,
                    notes: notes || null,
                    created_by: 1, // TODO: Get from session
                }),
            });

            const data = await response.json();
            if (data.success) {
                onSuccess();
                resetForm();
            } else {
                setError(data.error || 'Failed to record payment');
            }
        } catch (error) {
            setError('Failed to record payment');
            console.error('Error recording payment:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setAmount('');
        setPaymentMethod(PaymentMethod.CASH);
        setReferenceNumber('');
        setNotes('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 mb-2">
                        <strong>Order:</strong> {orderNumber}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-blue-600">Total Price:</p>
                            <p className="font-semibold">Rp {totalPrice.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">Paid:</p>
                            <p className="font-semibold">Rp {paidAmount.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-blue-600">Balance Due:</p>
                            <p className="font-bold text-lg text-blue-900">
                                Rp {balanceDue.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction Type
                        </label>
                        <select
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value as 'payment' | 'deposit')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="payment">Payment</option>
                            <option value="deposit">Deposit</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={balanceDue}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {amount && parseFloat(amount) < balanceDue && (
                            <p className="text-sm text-yellow-600 mt-1">
                                Remaining balance: Rp {(balanceDue - parseFloat(amount)).toLocaleString('id-ID')}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={PaymentMethod.CASH}>Cash</option>
                            <option value={PaymentMethod.TRANSFER}>Bank Transfer</option>
                            <option value={PaymentMethod.CARD}>Card</option>
                            <option value={PaymentMethod.OTHER}>Other</option>
                        </select>
                    </div>

                    {(paymentMethod === PaymentMethod.TRANSFER || paymentMethod === PaymentMethod.CARD) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reference Number
                            </label>
                            <input
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="Transaction reference, invoice number, etc."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Optional notes..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleRecordPayment}
                            disabled={isProcessing || !amount}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            {isProcessing ? 'Recording...' : 'Record Payment'}
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
