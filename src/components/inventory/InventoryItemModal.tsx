'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InventoryItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InventoryItemModal({ isOpen, onClose, onSuccess }: InventoryItemModalProps) {
    const [itemCode, setItemCode] = useState('');
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState('');
    const [unitOfMeasure, setUnitOfMeasure] = useState('');
    const [currentStock, setCurrentStock] = useState('0');
    const [minimumStock, setMinimumStock] = useState('0');
    const [unitCost, setUnitCost] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        // Validation
        if (!itemCode || !itemName || !category || !unitOfMeasure) {
            setError('Semua field wajib diisi');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_code: itemCode,
                    item_name: itemName,
                    category,
                    unit_of_measure: unitOfMeasure,
                    current_stock: parseFloat(currentStock),
                    minimum_stock: parseFloat(minimumStock),
                    unit_cost: parseFloat(unitCost)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create item');
            }

            onSuccess();
            handleClose();
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setItemCode('');
        setItemName('');
        setCategory('');
        setUnitOfMeasure('');
        setCurrentStock('0');
        setMinimumStock('0');
        setUnitCost('0');
        setError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
        }}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Barang Inventory Baru</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Item Code */}
                    <div className="grid gap-2">
                        <Label>Kode Barang <span className="text-destructive">*</span></Label>
                        <Input
                            value={itemCode}
                            onChange={(e) => setItemCode(e.target.value)}
                            placeholder="e.g., DET-001"
                        />
                    </div>

                    {/* Item Name */}
                    <div className="grid gap-2">
                        <Label>Nama Barang <span className="text-destructive">*</span></Label>
                        <Input
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="e.g., Deterjen Cair Premium"
                        />
                    </div>

                    {/* Category */}
                    <div className="grid gap-2">
                        <Label>Kategori <span className="text-destructive">*</span></Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="detergent">Deterjen</SelectItem>
                                <SelectItem value="softener">Pelembut</SelectItem>
                                <SelectItem value="bleach">Pemutih</SelectItem>
                                <SelectItem value="plastic">Plastik</SelectItem>
                                <SelectItem value="hanger">Hanger</SelectItem>
                                <SelectItem value="packaging">Kemasan</SelectItem>
                                <SelectItem value="other">Lainnya</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Unit of Measure */}
                    <div className="grid gap-2">
                        <Label>Satuan <span className="text-destructive">*</span></Label>
                        <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih satuan..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="liter">Liter</SelectItem>
                                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                <SelectItem value="piece">Pcs (Buah)</SelectItem>
                                <SelectItem value="bottle">Botol</SelectItem>
                                <SelectItem value="box">Box</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                            *Untuk ml gunakan desimal Liter (contoh: 500ml = 0.5 Liter)
                        </p>
                    </div>

                    {/* Stock Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Stok Awal</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={currentStock}
                                onChange={(e) => setCurrentStock(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Stok Minimum</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={minimumStock}
                                onChange={(e) => setMinimumStock(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Unit Cost */}
                    <div className="grid gap-2">
                        <Label>Harga Satuan (Rp)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={unitCost}
                            onChange={(e) => setUnitCost(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Tambah Barang'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
