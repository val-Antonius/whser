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
                <h2 className="text-xl font-bold mb-4 text-red-700">Laporkan Kehilangan/Limbah</h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Inventory Item */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Nama Barang <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={inventoryItemId}
                                onChange={(e) => setInventoryItemId(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            >
                                <option value="">Pilih barang...</option>
                                {/* TODO: Populate from API */}
                                <option value="1">Detergent</option>
                                <option value="2">Fabric Softener</option>
                            </select>
                        </div>

                        {/* Quantity */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Jumlah <span className="text-red-500">*</span>
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
                                <label className="block text-sm font-medium mb-1">Satuan</label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="ml">ml</option>
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="l">l</option>
                                    <option value="pieces">buah</option>
                                </select>
                            </div>
                        </div>

                        {/* Waste Type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Jenis Kehilangan <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={wasteType}
                                onChange={(e) => setWasteType(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            >
                                <option value="spillage">Tumpah (Spillage)</option>
                                <option value="expiration">Kadaluarsa</option>
                                <option value="damage">Rusak</option>
                                <option value="theft">Hilang/Dicuri</option>
                                <option value="contamination">Terkontaminasi</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Alasan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                placeholder="Jelaskan penyebab kehilangan..."
                                required
                            />
                        </div>

                        {/* Authorization Code */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <label className="block text-sm font-medium mb-1">
                                Kode Otorisasi Manager <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={authCode}
                                onChange={(e) => setAuthCode(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Masukkan PIN manager"
                                required
                            />
                            <p className="text-xs text-yellow-700 mt-1">
                                Diperlukan persetujuan manager untuk mencatat kehilangan.
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
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Laporan'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
