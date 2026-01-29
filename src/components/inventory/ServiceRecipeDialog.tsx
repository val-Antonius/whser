'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { X, Plus, Trash2, Beaker, Info, Save } from 'lucide-react';

interface RecipeItem {
    inventory_item_id: string;
    estimated_quantity: string;
    unit: string;
}

interface ServiceRecipeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ServiceRecipeDialog({
    isOpen,
    onClose,
    onSuccess
}: ServiceRecipeDialogProps) {
    const [serviceId, setServiceId] = useState('');
    const [items, setItems] = useState<RecipeItem[]>([]);

    // Data sources
    const [services, setServices] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchServices();
            fetchInventoryItems();
            setServiceId('');
            setItems([]);
            setError('');
        }
    }, [isOpen]);

    // Load existing recipe when service changes
    useEffect(() => {
        if (serviceId) {
            fetchExistingRecipe(serviceId);
        } else {
            setItems([]);
        }
    }, [serviceId]);

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            if (data.success) setServices(data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchInventoryItems = async () => {
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            if (data.success) setInventoryItems(data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchExistingRecipe = async (svcId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/consumption-templates?service_id=${svcId}`);
            const data = await res.json();
            if (data.templates && Array.isArray(data.templates)) {
                const mappedItems = data.templates.map((t: any) => ({
                    inventory_item_id: t.inventory_item_id.toString(),
                    estimated_quantity: t.estimated_quantity.toString(),
                    unit: t.unit
                }));
                setItems(mappedItems.length > 0 ? mappedItems : [{ inventory_item_id: '', estimated_quantity: '', unit: 'per_kg' }]);
            } else {
                setItems([{ inventory_item_id: '', estimated_quantity: '', unit: 'per_kg' }]);
            }
        } catch (error) {
            console.error('Error fetching recipe:', error);
            setItems([{ inventory_item_id: '', estimated_quantity: '', unit: 'per_kg' }]);
        } finally {
            setLoading(false);
        }
    };

    const addItemRow = () => {
        setItems([...items, { inventory_item_id: '', estimated_quantity: '', unit: 'per_kg' }]);
    };

    const removeItemRow = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof RecipeItem, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!serviceId) {
            setError('Pilih layanan terlebih dahulu');
            return;
        }

        const validItems = items.filter(
            item => item.inventory_item_id && item.estimated_quantity && item.unit
        );

        if (validItems.length === 0 && items.length > 0) {
            setError('Mohon lengkapi data item sebelum menyimpan');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/consumption-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: parseInt(serviceId),
                    items: validItems.map(item => ({
                        inventory_item_id: parseInt(item.inventory_item_id),
                        estimated_quantity: parseFloat(item.estimated_quantity),
                        unit: item.unit
                    }))
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Gagal menyimpan resep');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white/90 backdrop-blur-xl border-white/60 shadow-2xl rounded-3xl">
                <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
                    <DialogTitle className="text-2xl font-light text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                            <Beaker className="h-6 w-6 text-emerald-500" />
                        </div>
                        Kelola Resep Layanan
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-6 scrollbar-hide">
                    {/* Service Selector */}
                    <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                            <Info className="w-3.5 h-3.5" />
                            Layanan Target
                        </div>
                        <Select
                            value={serviceId}
                            onValueChange={(val) => setServiceId(val)}
                        >
                            <SelectTrigger className="w-full bg-white/80 border-slate-200 rounded-xl h-12 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                                <SelectValue placeholder="Pilih Layanan untuk diedit..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                {services.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.service_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-500 italic px-1">
                            Resep yang Anda buat akan otomatis digunakan untuk menghitung penggunaan stok setiap kali layanan ini dipesan.
                        </p>
                    </div>

                    {/* Recipe Items List */}
                    {serviceId ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-semibold text-slate-700">Komposisi Bahan Baku</h3>
                                <button
                                    onClick={addItemRow}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Tambah Bahan
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                        <Beaker className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Belum ada bahan baku. Klik "Tambah Bahan" untuk memulai.</p>
                                    </div>
                                )}

                                {items.map((item, index) => (
                                    <div key={index} className="group flex flex-col md:flex-row gap-4 items-start md:items-end p-5 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
                                        <div className="flex-[2] w-full space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nama Barang / Produk</label>
                                            <Select
                                                value={item.inventory_item_id}
                                                onValueChange={(val) => updateItem(index, 'inventory_item_id', val)}
                                            >
                                                <SelectTrigger className="h-11 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20">
                                                    <SelectValue placeholder="Pilih Produk..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-64">
                                                    {inventoryItems.map(i => (
                                                        <SelectItem key={i.id} value={i.id.toString()}>
                                                            <div className="flex flex-col py-0.5">
                                                                <span className="font-medium text-slate-800">{i.item_name}</span>
                                                                <span className="text-[10px] text-slate-500">Code: {i.item_code} | Stok: {i.stock} {i.unit}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-row gap-3 w-full md:w-auto">
                                            <div className="flex-1 md:w-28 space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Jumlah</label>
                                                <Input
                                                    type="number"
                                                    value={item.estimated_quantity}
                                                    onChange={(e) => updateItem(index, 'estimated_quantity', e.target.value)}
                                                    className="h-11 bg-white/80 border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-emerald-500/20"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div className="flex-1 md:w-36 space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Takaran</label>
                                                <Select
                                                    value={item.unit}
                                                    onValueChange={(val) => updateItem(index, 'unit', val)}
                                                >
                                                    <SelectTrigger className="h-11 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200">
                                                        <SelectItem value="per_kg">Per Kg</SelectItem>
                                                        <SelectItem value="per_pc">Per Pcs</SelectItem>
                                                        <SelectItem value="per_order">Per Order</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeItemRow(index)}
                                                className="mt-8 flex items-center justify-center h-11 w-11 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all active:scale-90"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-4 opacity-50">
                            <Info className="w-12 h-12 stroke-[1px]" />
                            <p className="text-sm font-light">Silakan pilih layanan di atas untuk mengelola resep.</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <X className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-8 py-6 bg-slate-50/50 border-t border-white/60 gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-6 py-3 border border-slate-200 rounded-full text-slate-600 font-semibold hover:bg-white/80 transition-all active:scale-95 text-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !serviceId}
                        className="flex-[2] px-6 py-3 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Menyimpan...' : 'Simpan Resep'}</span>
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
