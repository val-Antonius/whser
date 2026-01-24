'use client';

import { useState } from 'react';

interface ExceptionReportModalProps {
    orderId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ExceptionType = 'stain_treatment' | 'delay' | 'damage' | 'missing_item' | 'other';
type Severity = 'low' | 'medium' | 'high' | 'critical';

export default function ExceptionReportModal({ orderId, isOpen, onClose, onSuccess }: ExceptionReportModalProps) {
    const [exceptionType, setExceptionType] = useState<ExceptionType>('stain_treatment');
    const [severity, setSeverity] = useState<Severity>('medium');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!description.trim()) {
            setError('Please provide a description of the exception');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/orders/${orderId}/exceptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exception_type: exceptionType,
                    severity,
                    description: description.trim(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to report exception');
            }

            // Reset form
            setExceptionType('stain_treatment');
            setSeverity('medium');
            setDescription('');
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
            setExceptionType('stain_treatment');
            setSeverity('medium');
            setDescription('');
            setError('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Report Exception</h2>

                <form onSubmit={handleSubmit}>
                    {/* Exception Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Exception Type</label>
                        <select
                            value={exceptionType}
                            onChange={(e) => setExceptionType(e.target.value as ExceptionType)}
                            className="w-full border rounded px-3 py-2"
                            disabled={isSubmitting}
                        >
                            <option value="stain_treatment">Stain Treatment Required</option>
                            <option value="delay">Processing Delay</option>
                            <option value="damage">Item Damage</option>
                            <option value="missing_item">Missing Item</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Severity */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Severity</label>
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value as Severity)}
                            className="w-full border rounded px-3 py-2"
                            disabled={isSubmitting}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2 min-h-[100px]"
                            placeholder="Describe the exception in detail..."
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
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Reporting...' : 'Report Exception'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
