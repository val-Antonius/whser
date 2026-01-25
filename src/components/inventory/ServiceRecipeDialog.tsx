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
import { X, Plus, Trash2 } from 'lucide-react';

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
                // Map existing templates to UI items
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

        // Filter out incomplete rows
        const validItems = items.filter(
            item => item.inventory_item_id && item.estimated_quantity && item.unit
        );

        if (validItems.length === 0 && items.length > 0) {
            // If user entered rows but they are incomplete
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Kelola Resep Layanan</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Service Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Layanan Target</label>
                        <Select
                            value={serviceId}
                            onValueChange={(val) => setServiceId(val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Layanan..." />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.service_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Pilih layanan untuk melihat atau mengedit resepnya.
                        </p>
                    </div>

                    {/* Recipe Items List */}
                    {serviceId && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-semibold">Komposisi Bahan</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItemRow}
                                    className="h-8"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Tambah Bahan
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {items.length === 0 && (
                                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded border border-dashed">
                                        Belum ada bahan. Klik "Tambah Bahan" untuk memulai.
                                    </div>
                                )}

                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-end p-3 bg-gray-50 rounded border">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-xs font-medium">Barang</label>
                                            <Select
                                                value={item.inventory_item_id}
                                                onValueChange={(val) => updateItem(index, 'inventory_item_id', val)}
                                            >
                                                <SelectTrigger className="h-9 bg-white">
                                                    <SelectValue placeholder="Pilih Barang" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {inventoryItems.map(i => (
                                                        <SelectItem key={i.id} value={i.id.toString()}>
                                                            {i.item_name} ({i.item_code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="w-24 space-y-1">
                                            <label className="text-xs font-medium">Jumlah</label>
                                            <Input
                                                type="number"
                                                value={item.estimated_quantity}
                                                onChange={(e) => updateItem(index, 'estimated_quantity', e.target.value)}
                                                className="h-9 bg-white"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="w-32 space-y-1">
                                            <label className="text-xs font-medium">Satuan</label>
                                            <Select
                                                value={item.unit}
                                                onValueChange={(val) => updateItem(index, 'unit', val)}
                                            >
                                                <SelectTrigger className="h-9 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="per_kg">Per Kg</SelectItem>
                                                    <SelectItem value="per_pc">Per Pcs</SelectItem>
                                                    <SelectItem value="per_order">Per Order</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItemRow(index)}
                                            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !serviceId} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? 'Menyimpan...' : 'Simpan Resep'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
