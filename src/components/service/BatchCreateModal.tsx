'use client';

import { useState } from 'react';

interface BatchCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type BatchType = 'wash' | 'dry' | 'iron' | 'fold' | 'mixed';

export default function BatchCreateModal({ isOpen, onClose, onSuccess }: BatchCreateModalProps) {
    const [batchType, setBatchType] = useState<BatchType>('wash');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch_type: batchType,
                    notes: notes.trim() || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create batch');
            }

            // Reset form
            setBatchType('wash');
            setNotes('');
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
            setBatchType('wash');
            setNotes('');
            setError('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Processing Batch</h2>

                <form onSubmit={handleSubmit}>
                    {/* Batch Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Batch Type *</label>
                        <select
                            value={batchType}
                            onChange={(e) => setBatchType(e.target.value as BatchType)}
                            className="w-full border rounded px-3 py-2"
                            disabled={isSubmitting}
                            required
                        >
                            <option value="wash">Wash</option>
                            <option value="dry">Dry</option>
                            <option value="iron">Iron</option>
                            <option value="fold">Fold</option>
                            <option value="mixed">Mixed</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select the primary process type for this batch
                        </p>
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded px-3 py-2 min-h-[80px]"
                            placeholder="Optional notes about this batch..."
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                        ℹ️ After creating the batch, you can add orders to it from the service management page.
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
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
