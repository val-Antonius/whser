'use client';

import { useState } from 'react';

interface PriorityMarkerProps {
    orderId: number;
    isPriority: boolean;
    priorityReason?: string;
    onUpdate: () => void;
}

export default function PriorityMarker({ orderId, isPriority, priorityReason, onUpdate }: PriorityMarkerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [reason, setReason] = useState(priorityReason || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleTogglePriority = async () => {
        if (isPriority) {
            // Remove priority
            await updatePriority(false, '');
        } else {
            // Show form to add priority
            setIsEditing(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason for priority marking');
            return;
        }
        await updatePriority(true, reason.trim());
    };

    const updatePriority = async (priority: boolean, priorityReason: string) => {
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_priority: priority,
                    priority_reason: priorityReason,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update priority');
            }

            setIsEditing(false);
            setReason('');
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isEditing) {
        return (
            <div className="border-2 border-orange-500 rounded-lg p-3 bg-orange-50">
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium mb-2">
                        Priority Reason *
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full border rounded px-3 py-2 mb-2 text-sm"
                        placeholder="Why is this order a priority?"
                        rows={2}
                        disabled={isSubmitting}
                        required
                    />
                    {error && (
                        <div className="mb-2 text-xs text-red-600">{error}</div>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setReason('');
                                setError('');
                            }}
                            className="flex-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Mark Priority'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (isPriority) {
        return (
            <div className="border-2 border-orange-500 rounded-lg p-3 bg-orange-50">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-orange-600 font-bold text-lg">⚡</span>
                        <span className="font-bold text-orange-800">PRIORITY ORDER</span>
                    </div>
                    <button
                        onClick={handleTogglePriority}
                        className="text-xs text-orange-600 hover:text-orange-800"
                        disabled={isSubmitting}
                    >
                        Remove
                    </button>
                </div>
                {priorityReason && (
                    <p className="text-sm text-orange-700">
                        <span className="font-medium">Reason:</span> {priorityReason}
                    </p>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={handleTogglePriority}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-orange-500 hover:bg-orange-50 transition-colors"
            disabled={isSubmitting}
        >
            <span className="text-sm text-gray-600">⚡ Mark as Priority</span>
        </button>
    );
}
