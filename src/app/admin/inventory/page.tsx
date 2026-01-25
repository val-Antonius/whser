'use client';

import { useState, useEffect } from 'react';
import { InventoryCategory, InventoryTransactionType } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import InventoryItemModal from '@/components/inventory/InventoryItemModal'; // Added import
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, AlertTriangle, RefreshCw, Plus, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InventoryItem {
    id: number;
    item_code: string;
    item_name: string;
    category: string;
    unit_of_measure: string;
    current_stock: number;
    minimum_stock: number;
    unit_cost: number;
    is_active: boolean;
    stock_status: string;
    stock_percentage: number;
}

interface Transaction {
    id: number;
    item_name: string;
    transaction_type: string;
    quantity: number;
    stock_before: number;
    stock_after: number;
    transaction_date: string;
    created_by_name: string;
    notes: string;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [showRecordForm, setShowRecordForm] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false); // Added state
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');

    const [recordForm, setRecordForm] = useState({
        transaction_type: InventoryTransactionType.STOCK_IN as string,
        quantity: '',
        unit_cost: '',
        reference_number: '',
        notes: '',
    });

    useEffect(() => {
        fetchInventory();
        fetchTransactions();
    }, [categoryFilter, showLowStockOnly]);

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            let url = '/api/inventory?';
            if (categoryFilter) url += `category=${categoryFilter}&`;
            if (showLowStockOnly) url += 'low_stock=true&';

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setItems(data.data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/inventory/transactions?limit=20');
            const data = await response.json();
            if (data.success) {
                setTransactions(data.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handleRecordTransaction = async () => {
        if (!selectedItem || !recordForm.quantity) {
            setError('Please fill in all required fields');
            return;
        }

        setIsRecording(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inventory_item_id: selectedItem.id,
                    transaction_type: recordForm.transaction_type,
                    quantity: parseFloat(recordForm.quantity),
                    unit_cost: recordForm.unit_cost ? parseFloat(recordForm.unit_cost) : null,
                    reference_number: recordForm.reference_number || null,
                    notes: recordForm.notes || null,
                    created_by: 1, // TODO: Get from session
                }),
            });

            const data = await response.json();
            if (data.success) {
                setShowRecordForm(false);
                setSelectedItem(null);
                setRecordForm({
                    transaction_type: InventoryTransactionType.STOCK_IN,
                    quantity: '',
                    unit_cost: '',
                    reference_number: '',
                    notes: '',
                });
                fetchInventory();
                fetchTransactions();
            } else {
                setError(data.error || 'Failed to record transaction');
            }
        } catch (error) {
            setError('Failed to record transaction');
            console.error('Error recording transaction:', error);
        } finally {
            setIsRecording(false);
        }
    };

    const getStockStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            in_stock: 'bg-green-100 text-green-800 border-green-200',
            low_stock: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            out_of_stock: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getTransactionTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            stock_in: 'bg-green-100 text-green-800',
            stock_out: 'bg-red-100 text-red-800',
            adjustment: 'bg-blue-100 text-blue-800',
            adjustment_in: 'bg-blue-100 text-blue-800',
            adjustment_out: 'bg-orange-100 text-orange-800',
            consumption: 'bg-purple-100 text-purple-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const formatTransactionType = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const lowStockItems = items.filter(item => item.stock_status === 'low_stock' || item.stock_status === 'out_of_stock');

    return (
        <div>
            <PageHeader
                title="Manajemen Inventori"
                description="Lacak dan kelola stok barang dan perlengkapan"
                actions={
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowAddItemModal(true)}
                            size="sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Barang Baru
                        </Button>
                        <Button
                            onClick={() => {
                                // Find first item to open transaction modal
                                if (items.length > 0) {
                                    setSelectedItem(items[0]);
                                    setShowRecordForm(true);
                                }
                            }}
                            variant="outline"
                            size="sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Catat Stok
                        </Button>
                        <Button onClick={fetchInventory} variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Inventory List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Filters & Alerts */}
                        {lowStockItems.length > 0 && !showLowStockOnly && (
                            <Alert variant="destructive" className="border-red-300 bg-red-50">
                                <AlertTriangle className="h-5 w-5 animate-pulse" />
                                <AlertTitle className="font-bold text-red-800">PERINGATAN: Stok Menipis!</AlertTitle>
                                <AlertDescription className="text-red-700">
                                    {lowStockItems.length} barang memerlukan restock segera.
                                    <Button
                                        variant="link"
                                        className="text-red-700 hover:text-red-900 p-0 h-auto ml-2 underline"
                                        onClick={() => setShowLowStockOnly(true)}
                                    >
                                        Lihat Daftar →
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-center">
                                    <CardTitle>Daftar Barang</CardTitle>
                                    <div className="flex gap-2">
                                        <div className="w-[200px]">
                                            <Select
                                                value={categoryFilter}
                                                onValueChange={setCategoryFilter}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Semua Kategori" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Semua Kategori</SelectItem>
                                                    <SelectItem value={InventoryCategory.DETERGENT}>Deterjen</SelectItem>
                                                    <SelectItem value={InventoryCategory.SOFTENER}>Pelembut</SelectItem>
                                                    <SelectItem value={InventoryCategory.BLEACH}>Pemutih</SelectItem>
                                                    <SelectItem value={InventoryCategory.PACKAGING}>Kemasan</SelectItem>
                                                    <SelectItem value={InventoryCategory.SUPPLIES}>Perlengkapan</SelectItem>
                                                    <SelectItem value={InventoryCategory.OTHER}>Lainnya</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            variant={showLowStockOnly ? "secondary" : "ghost"}
                                            size="icon"
                                            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                                            title="Filter Low Stock"
                                        >
                                            <AlertTriangle className={`h-4 w-4 ${showLowStockOnly ? 'text-yellow-600' : 'text-gray-400'}`} />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Memuat data inventori...</div>
                                ) : items.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">Tidak ada barang ditemukan</div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Barang</TableHead>
                                                    <TableHead>Kategori</TableHead>
                                                    <TableHead>Stok</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{item.item_name}</div>
                                                            <div className="text-xs text-muted-foreground">{item.item_code}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="text-xs font-normal capitalize">
                                                                {item.category.toLowerCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="min-w-[150px]">
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className={item.current_stock <= item.minimum_stock ? "text-red-600 font-medium" : ""}>
                                                                        {item.current_stock} {item.unit_of_measure}
                                                                    </span>
                                                                    <span className="text-muted-foreground">Min: {item.minimum_stock}</span>
                                                                </div>
                                                                <Progress
                                                                    value={Math.min(item.stock_percentage, 100)}
                                                                    className={`h-2 ${item.stock_status === 'out_of_stock' ? '[&>div]:bg-red-500' : item.stock_status === 'low_stock' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    setShowRecordForm(true);
                                                                    setError('');
                                                                }}
                                                            >
                                                                <Plus className="mr-2 h-3 w-3" />
                                                                Catat Transaksi Stok
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Transactions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Riwayat Transaksi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {transactions.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground text-sm">Belum ada transaksi</div>
                                    ) : (
                                        transactions.map((tx) => (
                                            <div key={tx.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium text-sm">{tx.item_name}</span>
                                                    <Badge variant={tx.transaction_type.includes('out') || tx.transaction_type === 'consumption' ? 'destructive' : 'default'} className="text-[10px] px-1 py-0 h-5">
                                                        {formatTransactionType(tx.transaction_type)}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex justify-between items-center mt-1">
                                                    <span>{tx.quantity} unit ({tx.stock_before} → {tx.stock_after})</span>
                                                    <span>{new Date(tx.transaction_date).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                {tx.notes && (
                                                    <div className="text-xs italic bg-muted/50 p-1.5 rounded mt-1">
                                                        "{tx.notes}"
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-muted-foreground text-right mt-1">
                                                    Oleh: {tx.created_by_name || 'System'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Record Transaction Dialog */}
            <Dialog open={showRecordForm} onOpenChange={(open) => {
                if (!open) {
                    setShowRecordForm(false);
                    setSelectedItem(null);
                    setError('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Catat Pergerakan Stok</DialogTitle>
                        <CardDescription>
                            {selectedItem?.item_name} (Stok: {selectedItem?.current_stock} {selectedItem?.unit_of_measure})
                        </CardDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Tipe Transaksi</Label>
                            <Select
                                value={recordForm.transaction_type}
                                onValueChange={(val) => setRecordForm({ ...recordForm, transaction_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={InventoryTransactionType.STOCK_IN}>Stok Masuk (Beli/Terima)</SelectItem>
                                    <SelectItem value={InventoryTransactionType.STOCK_OUT}>Stok Keluar (Rusak/Hilang)</SelectItem>
                                    <SelectItem value="adjustment_in">Koreksi Masuk (Opname)</SelectItem>
                                    <SelectItem value="adjustment_out">Koreksi Keluar (Opname)</SelectItem>
                                    <SelectItem value={InventoryTransactionType.CONSUMPTION}>Pemakaian (Produksi)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Jumlah ({selectedItem?.unit_of_measure})</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={recordForm.quantity}
                                onChange={(e) => setRecordForm({ ...recordForm, quantity: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Biaya Satuan (Rp) <span className="text-muted-foreground text-xs font-normal">(Opsional)</span></Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="Biaya per unit..."
                                value={recordForm.unit_cost}
                                onChange={(e) => setRecordForm({ ...recordForm, unit_cost: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Nomor Referensi</Label>
                            <Input
                                placeholder="No. PO, Invoice, dll..."
                                value={recordForm.reference_number}
                                onChange={(e) => setRecordForm({ ...recordForm, reference_number: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Catatan</Label>
                            <Textarea
                                placeholder="Keterangan tambahan..."
                                value={recordForm.notes}
                                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRecordForm(false)}>Batal</Button>
                        <Button onClick={handleRecordTransaction} disabled={isRecording || !recordForm.quantity}>
                            {isRecording ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Item Modal */}
            <InventoryItemModal
                isOpen={showAddItemModal}
                onClose={() => setShowAddItemModal(false)}
                onSuccess={() => {
                    fetchInventory();
                }}
            />
        </div>
    );
}
