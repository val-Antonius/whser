'use client';

import { useState, useEffect } from 'react';
import { InventoryCategory, InventoryTransactionType } from '@/types';
import InventoryItemModal from '@/components/inventory/InventoryItemModal';
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
import { Search, AlertTriangle, RefreshCw, Plus, History, Package, ArrowUpRight, ArrowDownRight, Activity, Save } from "lucide-react";

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
    const [showAddItemModal, setShowAddItemModal] = useState(false);
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
            setError('Mohon lengkapi jumlah barang.');
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
                    created_by: 1,
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
                setError(data.error || 'Gagal menyimpan transaksi');
            }
        } catch (error) {
            setError('Gagal menyimpan transaksi');
            console.error('Error recording transaction:', error);
        } finally {
            setIsRecording(false);
        }
    };

    const formatTransactionType = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const lowStockItems = items.filter(item => item.stock_status === 'low_stock' || item.stock_status === 'out_of_stock');

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Manajemen Inventori</h1>
                        <p className="text-slate-500 mt-1">Lacak dan kelola stok barang secara real-time</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchInventory}
                            className="p-2.5 bg-white/60 hover:bg-white text-slate-500 rounded-xl border border-white/60 shadow-sm transition-all"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddItemModal(true)}
                            className="px-6 py-2.5 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Tambah Barang</span>
                        </button>
                        <button
                            onClick={() => {
                                if (items.length > 0) {
                                    setSelectedItem(items[0]);
                                    setShowRecordForm(true);
                                }
                            }}
                            className="px-6 py-2.5 bg-white text-emerald-600 border border-emerald-100 rounded-full font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2"
                        >
                            <Activity className="h-4 w-4" />
                            <span>Catat Stok</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Inventory List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Alerts */}
                        {lowStockItems.length > 0 && !showLowStockOnly && (
                            <div className="overflow-hidden bg-rose-50/50 backdrop-blur-sm border border-rose-100 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wider">Perhatian: Stok Menipis!</h4>
                                        <p className="text-sm text-rose-700">{lowStockItems.length} barang memerlukan restock segera.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLowStockOnly(true)}
                                    className="px-4 py-2 bg-rose-100/50 hover:bg-rose-100 text-rose-700 rounded-full text-xs font-bold transition-all border border-rose-200"
                                >
                                    Lihat Daftar →
                                </button>
                            </div>
                        )}

                        {/* Inventory Table Card */}
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-3xl overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Package className="h-5 w-5 text-emerald-500" />
                                    Daftar Barang
                                </h2>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger className="w-full bg-white/50 border-slate-200 rounded-full h-10 text-sm">
                                                <SelectValue placeholder="Semua Kategori" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
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
                                    <button
                                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                                        className={`p-2.5 rounded-full border transition-all ${showLowStockOnly ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white/50 border-slate-200 text-slate-400 hover:text-slate-600'}`}
                                        title="Filter Stok Menipis"
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                                            <TableHead className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Barang</TableHead>
                                            <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</TableHead>
                                            <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Stok</TableHead>
                                            <TableHead className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-24 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                                        <span className="text-sm font-medium text-slate-400">Memuat data...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-24 text-center text-slate-400">
                                                    Tidak ada barang ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            items.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                                                    <TableCell className="px-8 py-4">
                                                        <div className="font-medium text-slate-900">{item.item_name}</div>
                                                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.item_code}</div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Badge variant="outline" className="text-[10px] font-semibold bg-white/50 border-slate-100 text-slate-500 rounded-lg capitalize px-2 py-0.5">
                                                            {item.category.toLowerCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4 min-w-[180px]">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-end">
                                                                <span className={`text-sm font-bold ${item.current_stock <= item.minimum_stock ? "text-rose-500" : "text-slate-700"}`}>
                                                                    {item.current_stock} <span className="text-[10px] font-normal text-slate-400 uppercase ml-0.5">{item.unit_of_measure}</span>
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Min: {item.minimum_stock}</span>
                                                            </div>
                                                            <Progress
                                                                value={Math.min(item.stock_percentage, 100)}
                                                                className="h-1.5"
                                                                indicatorClassName={`${item.stock_status === 'out_of_stock' ? 'bg-rose-500' : item.stock_status === 'low_stock' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setShowRecordForm(true);
                                                                setError('');
                                                            }}
                                                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100/50"
                                                        >
                                                            Catat Transaksi
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Transactions */}
                    <div className="space-y-6">
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-3xl overflow-hidden max-h-[calc(100vh-200px)] flex flex-col">
                            <div className="px-6 py-6 border-b border-slate-50 shrink-0">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <History className="h-5 w-5 text-sky-500" />
                                    Histori Terbaru
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 text-sm italic">Belum ada aktivitas.</div>
                                ) : (
                                    transactions.map((tx) => (
                                        <div key={tx.id} className="p-4 bg-white/40 hover:bg-white/60 border border-white/60 rounded-2xl shadow-sm transition-all animate-in fade-in slide-in-from-right-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-700 text-xs truncate max-w-[120px]">{tx.item_name}</span>
                                                <Badge className={`text-[9px] px-1.5 py-0 rounded-full font-bold uppercase ${tx.transaction_type.includes('out') || tx.transaction_type === 'consumption' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                    {tx.transaction_type === 'stock_in' ? <ArrowUpRight className="h-2.5 w-2.5 mr-1" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-1" />}
                                                    {tx.transaction_type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                                                <span className="font-mono">{tx.stock_before} → {tx.stock_after} <span className="text-slate-600 font-bold ml-1">({tx.quantity})</span></span>
                                                <span>{new Date(tx.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {tx.notes && (
                                                <div className="mt-2 p-2 bg-slate-100/50 rounded-lg text-[10px] text-slate-500 italic">
                                                    "{tx.notes}"
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 bg-slate-50/50 border-t border-white/60 shrink-0 mt-auto">
                                <p className="text-[10px] text-center text-slate-400 italic">Sinkronisasi otomatis aktif</p>
                            </div>
                        </div>
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
                <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border-white/60 shadow-2xl rounded-3xl p-0 overflow-hidden">
                    <DialogHeader className="px-8 pt-8 pb-4">
                        <DialogTitle className="text-2xl font-light text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-sky-50 rounded-xl border border-sky-100 text-sky-500">
                                <Activity className="h-6 w-6" />
                            </div>
                            Catat Pergerakan Stok
                        </DialogTitle>
                        <CardDescription className="px-1 text-slate-500">
                            {selectedItem?.item_name} <span className="text-slate-400 font-normal">(Stok: {selectedItem?.current_stock} {selectedItem?.unit_of_measure})</span>
                        </CardDescription>
                    </DialogHeader>

                    <div className="px-8 pb-8 space-y-6">
                        {error && (
                            <div className="bg-rose-50/50 border border-rose-100 text-rose-700 text-xs p-3 rounded-2xl flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Tipe Transaksi</Label>
                                <Select
                                    value={recordForm.transaction_type}
                                    onValueChange={(val) => setRecordForm({ ...recordForm, transaction_type: val })}
                                >
                                    <SelectTrigger className="h-11 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value={InventoryTransactionType.STOCK_IN}>Stok Masuk (Beli/Terima)</SelectItem>
                                        <SelectItem value={InventoryTransactionType.STOCK_OUT}>Stok Keluar (Rusak/Hilang)</SelectItem>
                                        <SelectItem value="adjustment_in">Koreksi Masuk (Opname)</SelectItem>
                                        <SelectItem value="adjustment_out">Koreksi Keluar (Opname)</SelectItem>
                                        <SelectItem value={InventoryTransactionType.CONSUMPTION}>Pemakaian (Produksi)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Jumlah ({selectedItem?.unit_of_measure})</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={recordForm.quantity}
                                        onChange={(e) => setRecordForm({ ...recordForm, quantity: e.target.value })}
                                        className="h-11 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 text-center font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Biaya / Unit (Opsional)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Rp 0"
                                        value={recordForm.unit_cost}
                                        onChange={(e) => setRecordForm({ ...recordForm, unit_cost: e.target.value })}
                                        className="h-11 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nomor Referensi (Opsional)</Label>
                                <Input
                                    placeholder="No. PO, Invoice, dll..."
                                    value={recordForm.reference_number}
                                    onChange={(e) => setRecordForm({ ...recordForm, reference_number: e.target.value })}
                                    className="h-11 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Catatan</Label>
                                <Textarea
                                    placeholder="Keterangan tambahan..."
                                    value={recordForm.notes}
                                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                                    className="resize-none h-24 bg-white/80 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowRecordForm(false)}
                                className="flex-1 px-6 py-3 border border-slate-200 rounded-full text-slate-600 font-semibold hover:bg-slate-50 transition-all active:scale-95 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleRecordTransaction}
                                disabled={isRecording || !recordForm.quantity}
                                className="flex-[2] px-6 py-3 bg-sky-500 text-white rounded-full font-semibold hover:bg-sky-600 shadow-lg shadow-sky-500/30 transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                            >
                                {isRecording ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{isRecording ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
                            </button>
                        </DialogFooter>
                    </div>
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

// End of InventoryPage
