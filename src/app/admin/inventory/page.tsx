'use client';

import { useState, useEffect } from 'react';
import { InventoryCategory, InventoryTransactionType } from '@/types';

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
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');

    const [recordForm, setRecordForm] = useState({
        transaction_type: InventoryTransactionType.STOCK_IN,
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
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-600 mt-1">Track and manage inventory stock levels</p>
                </div>

                {/* Low Stock Alert */}
                {lowStockItems.length > 0 && !showLowStockOnly && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-yellow-800">
                                    {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock or out of stock
                                </span>
                            </div>
                            <button
                                onClick={() => setShowLowStockOnly(true)}
                                className="text-yellow-700 hover:text-yellow-900 font-medium text-sm"
                            >
                                View Items →
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex gap-4 items-center">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            >
                                <option value="">All Categories</option>
                                <option value={InventoryCategory.DETERGENT}>Detergent</option>
                                <option value={InventoryCategory.SOFTENER}>Softener</option>
                                <option value={InventoryCategory.BLEACH}>Bleach</option>
                                <option value={InventoryCategory.PACKAGING}>Packaging</option>
                                <option value={InventoryCategory.SUPPLIES}>Supplies</option>
                                <option value={InventoryCategory.OTHER}>Other</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-7">
                            <input
                                type="checkbox"
                                id="lowStockFilter"
                                checked={showLowStockOnly}
                                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <label htmlFor="lowStockFilter" className="ml-2 text-sm text-gray-700">
                                Show low stock only
                            </label>
                        </div>

                        <div className="flex-1"></div>

                        <button
                            onClick={fetchInventory}
                            className="mt-7 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Record Transaction Modal */}
                {showRecordForm && selectedItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Record Stock Movement</h3>

                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-600">Item:</p>
                                    <p className="font-semibold text-gray-900">{selectedItem.item_name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Current Stock: {selectedItem.current_stock} {selectedItem.unit_of_measure}
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-red-800 text-sm">{error}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Transaction Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={recordForm.transaction_type}
                                        onChange={(e) => setRecordForm({ ...recordForm, transaction_type: e.target.value as InventoryTransactionType })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    >
                                        <option value={InventoryTransactionType.STOCK_IN}>Stock In (Purchase/Receive)</option>
                                        <option value={InventoryTransactionType.STOCK_OUT}>Stock Out (Usage)</option>
                                        <option value={InventoryTransactionType.ADJUSTMENT_IN}>Adjustment In (Correction)</option>
                                        <option value={InventoryTransactionType.ADJUSTMENT_OUT}>Adjustment Out (Correction)</option>
                                        <option value={InventoryTransactionType.CONSUMPTION}>Consumption (Order Usage)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity ({selectedItem.unit_of_measure}) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={recordForm.quantity}
                                        onChange={(e) => setRecordForm({ ...recordForm, quantity: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Unit Cost (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={recordForm.unit_cost}
                                        onChange={(e) => setRecordForm({ ...recordForm, unit_cost: e.target.value })}
                                        placeholder="Optional"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        value={recordForm.reference_number}
                                        onChange={(e) => setRecordForm({ ...recordForm, reference_number: e.target.value })}
                                        placeholder="PO number, invoice, etc."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={recordForm.notes}
                                        onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                                        rows={2}
                                        placeholder="Optional notes..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRecordTransaction}
                                        disabled={isRecording || !recordForm.quantity}
                                        className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {isRecording ? 'Recording...' : 'Record Transaction'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowRecordForm(false);
                                            setSelectedItem(null);
                                            setError('');
                                        }}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Inventory List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Inventory Items ({items.length})
                                </h2>
                            </div>

                            {isLoading ? (
                                <div className="p-8 text-center text-gray-600">Loading inventory...</div>
                            ) : items.length === 0 ? (
                                <div className="p-8 text-center text-gray-600">
                                    No inventory items found
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {items.map((item) => (
                                        <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getStockStatusColor(item.stock_status)}`}>
                                                            {item.stock_status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        {item.item_code} • {item.category}
                                                    </p>

                                                    {/* Stock Level Bar */}
                                                    <div className="mb-2">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span>Current: {item.current_stock} {item.unit_of_measure}</span>
                                                            <span>Min: {item.minimum_stock} {item.unit_of_measure}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${item.stock_status === 'out_of_stock' ? 'bg-red-500' :
                                                                    item.stock_status === 'low_stock' ? 'bg-yellow-500' :
                                                                        'bg-green-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(item.stock_percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-gray-500">
                                                        Unit Cost: Rp {item.unit_cost?.toLocaleString('id-ID') || 'N/A'}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowRecordForm(true);
                                                        setError('');
                                                    }}
                                                    className="ml-4 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                                                >
                                                    Record Movement
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Recent Transactions */}
                    <div>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                            </div>

                            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                                {transactions.length === 0 ? (
                                    <div className="p-4 text-center text-gray-600 text-sm">
                                        No transactions yet
                                    </div>
                                ) : (
                                    transactions.map((tx) => (
                                        <div key={tx.id} className="p-3">
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-900">{tx.item_name}</span>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getTransactionTypeColor(tx.transaction_type)}`}>
                                                    {formatTransactionType(tx.transaction_type)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                <p>Qty: {tx.quantity} | {tx.stock_before} → {tx.stock_after}</p>
                                                <p className="mt-1">{new Date(tx.transaction_date).toLocaleString('id-ID')}</p>
                                                {tx.created_by_name && (
                                                    <p className="mt-1">By: {tx.created_by_name}</p>
                                                )}
                                                {tx.notes && (
                                                    <p className="mt-1 italic">"{tx.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
