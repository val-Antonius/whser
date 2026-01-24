'use client';

import { useState } from 'react';

interface WasteReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function WasteReportModal({ isOpen, onClose, onSuccess }: WasteReportModalProps) {
    const [inventoryItemId, setInventoryItemId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('ml');
    const [wasteType, setWasteType] = useState('spillage');
    const [reason, setReason] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/waste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inventory_item_id: parseInt(inventoryItemId),
                    quantity: parseFloat(quantity),
                    unit,
                    waste_type: wasteType,
                    reason,
                    authorization_code: authCode
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to report waste');
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
        setQuantity('');
        setUnit('ml');
        setWasteType('spillage');
        setReason('');
        setAuthCode('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-red-700">Report Inventory Waste/Loss</h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Inventory Item */}
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
                            </select>
                        </div>

                        {/* Quantity */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Unit</label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="ml">ml</option>
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="l">l</option>
                                    <option value="pieces">pieces</option>
                                </select>
                            </div>
                        </div>

                        {/* Waste Type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Waste Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={wasteType}
                                onChange={(e) => setWasteType(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            >
                                <option value="spillage">Spillage</option>
                                <option value="expiration">Expiration</option>
                                <option value="damage">Damage</option>
                                <option value="theft">Theft</option>
                                <option value="contamination">Contamination</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                placeholder="Detailed explanation required..."
                                required
                            />
                        </div>

                        {/* Authorization Code */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <label className="block text-sm font-medium mb-1">
                                Manager Authorization Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={authCode}
                                onChange={(e) => setAuthCode(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter manager PIN"
                                required
                            />
                            <p className="text-xs text-yellow-700 mt-1">
                                Manager authorization required for waste reporting
                            </p>
                        </div>

                        {/* Error */}
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
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Reporting...' : 'Report Waste'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
