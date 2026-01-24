'use client';

import { useState } from 'react';

interface ConsumptionTemplateModalProps {
    serviceId?: number;
    serviceName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ConsumptionTemplateModal({
    serviceId,
    serviceName,
    isOpen,
    onClose,
    onSuccess
}: ConsumptionTemplateModalProps) {
    const [inventoryItemId, setInventoryItemId] = useState('');
    const [estimatedQuantity, setEstimatedQuantity] = useState('');
    const [unit, setUnit] = useState('ml');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/consumption-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    inventory_item_id: parseInt(inventoryItemId),
                    estimated_quantity: parseFloat(estimatedQuantity),
                    unit,
                    notes
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create template');
            }

            onSuccess();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setInventoryItemId('');
        setEstimatedQuantity('');
        setUnit('ml');
        setNotes('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    Add Consumption Template
                    {serviceName && <span className="text-gray-600 text-base ml-2">for {serviceName}</span>}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Inventory Item Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Inventory Item <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={inventoryItemId}
                                onChange={(e) => setInventoryItemId(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            >
                                <option value="">Select item...</option>
                                {/* TODO: Populate from API */}
                                <option value="1">Detergent</option>
                                <option value="2">Fabric Softener</option>
                                <option value="3">Bleach</option>
                            </select>
                        </div>

                        {/* Estimated Quantity */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Estimated Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={estimatedQuantity}
                                onChange={(e) => setEstimatedQuantity(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Unit */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Unit <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            >
                                <option value="ml">Milliliters (ml)</option>
                                <option value="g">Grams (g)</option>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="l">Liters (l)</option>
                                <option value="pieces">Pieces</option>
                                <option value="units">Units</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                placeholder="Optional notes about this consumption pattern..."
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
