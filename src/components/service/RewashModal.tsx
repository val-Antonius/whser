'use client';

import { useState } from 'react';

interface RewashModalProps {
    orderId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ProcessStage = 'wash' | 'dry' | 'iron' | 'fold' | 'all';

export default function RewashModal({ orderId, isOpen, onClose, onSuccess }: RewashModalProps) {
    const [processStage, setProcessStage] = useState<ProcessStage>('wash');
    const [reason, setReason] = useState('');
    const [costImpact, setCostImpact] = useState('');
    const [notes, setNotes] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!reason.trim()) {
            setError('Please provide a reason for rewash');
            return;
        }

        if (!authCode) {
            setError('Authorization code is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/orders/${orderId}/rewash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    process_stage: processStage,
                    reason: reason.trim(),
                    cost_impact: costImpact ? parseFloat(costImpact) : 0,
                    notes: notes.trim() || null,
                    authorization_code: authCode,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to record rewash event');
            }

            // Reset form
            setProcessStage('wash');
            setReason('');
            setCostImpact('');
            setNotes('');
            setAuthCode('');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setProcessStage('wash');
            setReason('');
            setCostImpact('');
            setNotes('');
            setAuthCode('');
            setError('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-orange-600">Record Rewash Event</h2>

                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                    ⚠️ Rewash events are tracked as cost events, not new orders
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Process Stage */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Process Stage *</label>
                        <select
                            value={processStage}
                            onChange={(e) => setProcessStage(e.target.value as ProcessStage)}
                            className="w-full border rounded px-3 py-2"
                            disabled={isSubmitting}
                            required
                        >
                            <option value="wash">Wash</option>
                            <option value="dry">Dry</option>
                            <option value="iron">Iron</option>
                            <option value="fold">Fold</option>
                            <option value="all">All Stages</option>
                        </select>
                    </div>

                    {/* Reason */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Reason *</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border rounded px-3 py-2 min-h-[80px]"
                            placeholder="Why is rewash needed?"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {/* Cost Impact */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Estimated Cost Impact (₱)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={costImpact}
                            onChange={(e) => setCostImpact(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="0.00"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Additional Notes */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Additional Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded px-3 py-2 min-h-[60px]"
                            placeholder="Any additional information..."
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Authorization Code */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Manager Authorization Code *
                        </label>
                        <input
                            type="password"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Enter authorization code"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Recording...' : 'Record Rewash'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
