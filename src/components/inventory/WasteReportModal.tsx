'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { X, ShieldCheck, AlertCircle } from 'lucide-react';

interface WasteReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function WasteReportModal({ isOpen, onClose, onSuccess }: WasteReportModalProps) {
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [inventoryItemId, setInventoryItemId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('ml');
    const [wasteType, setWasteType] = useState('spillage');
    const [reason, setReason] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchInventoryItems();
        }
    }, [isOpen]);

    const fetchInventoryItems = async () => {
        try {
            const response = await fetch('/api/inventory');
            if (response.ok) {
                const data = await response.json();
                setInventoryItems(data.items || []);
            }
        } catch (err) {
            console.error('Failed to fetch inventory items:', err);
        }
    };

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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-white/90 backdrop-blur-xl border-white/60 shadow-2xl rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="px-8 pt-8 pb-4">
                    <DialogTitle className="text-2xl font-light text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                            <AlertCircle className="h-6 w-6 text-rose-500" />
                        </div>
                        Laporkan Kehilangan
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                    <div className="space-y-5">
                        {/* Inventory Item */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                                Nama Barang
                            </label>
                            <select
                                value={inventoryItemId}
                                onChange={(e) => setInventoryItemId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Pilih barang...</option>
                                {inventoryItems.map(item => (
                                    <option key={item.id} value={item.id}>{item.name} ({item.stock} {item.unit})</option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity & Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                                    Jumlah
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                                    Satuan
                                </label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
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
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                                Jenis Kehilangan
                            </label>
                            <select
                                value={wasteType}
                                onChange={(e) => setWasteType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
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
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                                Alasan / Keterangan
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                rows={2}
                                placeholder="Jelaskan penyebab kehilangan..."
                                required
                            />
                        </div>

                        {/* Authorization Section */}
                        <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-100 rounded-3xl p-5 space-y-3">
                            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                                <ShieldCheck className="h-4 w-4" />
                                Otorisasi Manager
                            </div>
                            <input
                                type="password"
                                value={authCode}
                                onChange={(e) => setAuthCode(e.target.value)}
                                className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-center tracking-[0.5em] font-mono"
                                placeholder="••••"
                                required
                            />
                            <p className="text-[10px] text-amber-600 text-center leading-relaxed font-medium">
                                Masukkan PIN Manager untuk memvalidasi laporan ini.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-6 py-3 border border-slate-200 rounded-full text-slate-600 font-semibold hover:bg-slate-50 transition-all active:scale-95"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-full font-semibold hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Menyimpan...</span>
                                </div>
                            ) : 'Simpan Laporan'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
