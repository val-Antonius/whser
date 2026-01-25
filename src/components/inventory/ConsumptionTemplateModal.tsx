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

interface ConsumptionTemplateModalProps {
    serviceId?: number;
    serviceName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ConsumptionTemplateModal({
    serviceId: initialServiceId,
    serviceName,
    isOpen,
    onClose,
    onSuccess
}: ConsumptionTemplateModalProps) {
    const [serviceId, setServiceId] = useState(initialServiceId?.toString() || '');
    const [services, setServices] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [inventoryItemId, setInventoryItemId] = useState('');
    const [estimatedQuantity, setEstimatedQuantity] = useState('');
    const [unit, setUnit] = useState('per_kg');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch services and inventory items on mount
    useEffect(() => {
        if (isOpen) {
            fetchServices();
            fetchInventoryItems();
        }
    }, [isOpen]);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/services');
            const data = await response.json();
            if (data.success) {
                setServices(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchInventoryItems = async () => {
        try {
            const response = await fetch('/api/inventory');
            const data = await response.json();
            if (data.success) {
                setInventoryItems(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching inventory items:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate required fields
        if (!serviceId || !inventoryItemId || !estimatedQuantity || !unit) {
            setError('Semua field wajib diisi');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/inventory/consumption-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: parseInt(serviceId),
                    inventory_item_id: parseInt(inventoryItemId),
                    estimated_quantity: parseFloat(estimatedQuantity),
                    unit // Passes 'per_kg', 'per_pc', etc.
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
        setServiceId(initialServiceId?.toString() || '');
        setInventoryItemId('');
        setEstimatedQuantity('');
        setUnit('per_kg');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-4">
                    Tambah Resep Layanan
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Service Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Layanan <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={serviceId}
                                onValueChange={(val) => setServiceId(val)}
                                disabled={!!initialServiceId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih layanan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map((service) => (
                                        <SelectItem key={service.id} value={service.id.toString()}>
                                            {service.service_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Inventory Item Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Barang Inventory <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={inventoryItemId}
                                onValueChange={(val) => setInventoryItemId(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih barang..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventoryItems.map((item) => (
                                        <SelectItem key={item.id} value={item.id.toString()}>
                                            {item.item_name} ({item.item_code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estimated Quantity & Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Jumlah <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={estimatedQuantity}
                                    onChange={(e) => setEstimatedQuantity(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Satuan <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={unit}
                                    onValueChange={(val) => setUnit(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih satuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="per_kg">Per Kg</SelectItem>
                                        <SelectItem value="per_pc">Per Pcs</SelectItem>
                                        <SelectItem value="per_order">Per Order (Flat)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Contoh: 10 (ml) per Kg. Sistem otomatis menghitung total berdasarkan berat order.
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Resep'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
