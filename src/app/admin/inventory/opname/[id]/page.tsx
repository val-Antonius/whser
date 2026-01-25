'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OpnameItem {
    id: number;
    inventory_item_id: number;
    system_qty: number;
    actual_qty: number | null; // Can be null if not yet counted
    notes: string;
    item_name: string;
    item_code: string;
    unit_of_measure: string;
    category: string;
}

interface OpnameDetail {
    id: number;
    opname_number: string;
    status: 'open' | 'submitted' | 'cancelled';
    created_at: string;
    created_by_name: string;
    items: OpnameItem[];
}

export default function OpnameDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [opname, setOpname] = useState<OpnameDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Local state for editing form
    const [editedItems, setEditedItems] = useState<Record<number, OpnameItem>>({});

    useEffect(() => {
        fetchOpnameDetails();
    }, [id]);

    const fetchOpnameDetails = async () => {
        try {
            const response = await fetch(`/api/inventory/opname/${id}`);
            if (response.ok) {
                const data = await response.json();
                setOpname(data);

                // Initialize editedItems
                const initialMap: Record<number, OpnameItem> = {};
                data.items.forEach((item: OpnameItem) => {
                    initialMap[item.id] = { ...item };
                });
                setEditedItems(initialMap);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (itemId: number, value: string) => {
        const numValue = value === '' ? null : parseFloat(value);
        setEditedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], actual_qty: numValue }
        }));
    };

    const handleNotesChange = (itemId: number, value: string) => {
        setEditedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], notes: value }
        }));
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const itemsToUpdate = Object.values(editedItems).map(item => ({
                id: item.id,
                actual_qty: item.actual_qty,
                notes: item.notes
            }));

            const response = await fetch(`/api/inventory/opname/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToUpdate })
            });

            if (response.ok) {
                // Re-fetch to sync
                await fetchOpnameDetails();
                alert('Progress saved successfully');
            } else {
                alert('Failed to save draft');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            alert('Error saving draft');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitOpname = async () => {
        const uncounted = Object.values(editedItems).filter(i => i.actual_qty === null || i.actual_qty === undefined);
        if (uncounted.length > 0) {
            if (!confirm(`Warning: ${uncounted.length} items have not been counted yet. They will be ignored or treated as matching system stock? (Current Logic: Ignored/No Adjustment). Proceed?`)) {
                return;
            }
        } else {
            if (!confirm('Are you sure you want to finalize this Opname? This will update your specific inventory levels permanently based on variances found.')) {
                return;
            }
        }

        setSubmitting(true);
        try {
            // First save any pending changes
            await fetch(`/api/inventory/opname/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: Object.values(editedItems) })
            });

            // Then submit
            const response = await fetch(`/api/inventory/opname/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submitted_by: 1 }) // TODO: Session
            });

            if (response.ok) {
                alert('Stock Opname finalized successfully!');
                router.push('/admin/inventory/opname');
            } else {
                const err = await response.json();
                alert(`Failed to submit: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting:', error);
            alert('Error submitting opname');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'open': 'bg-blue-100 text-blue-700',
            'submitted': 'bg-green-100 text-green-700',
            'cancelled': 'bg-gray-100 text-gray-700'
        };
        const labels = {
            'open': 'DRAF / OPEN',
            'submitted': 'SELESAI / SUBMITTED',
            'cancelled': 'DIBATALKAN'
        };
        // @ts-ignore
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || styles['cancelled']}`}>{labels[status] || status.toUpperCase()}</span>;
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!opname) return <div className="p-8 text-center text-red-600">Opname not found</div>;

    const isReadOnly = opname.status !== 'open';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/inventory/opname" className="text-gray-500 hover:text-gray-700">
                            ← Kembali
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">{opname.opname_number}</h1>
                        {getStatusBadge(opname.status)}
                    </div>
                    <p className="text-gray-600 mt-2 ml-12">
                        Dibuat pada {new Date(opname.created_at).toLocaleDateString('id-ID')} oleh {opname.created_by_name}
                    </p>
                </div>

                {!isReadOnly && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving || submitting}
                            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 bg-white transition disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Draf'}
                        </button>
                        <button
                            onClick={handleSubmitOpname}
                            disabled={saving || submitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 shadow-sm"
                        >
                            {submitting ? 'Memproses...' : 'Selesaikan & Sesuaikan Stok'}
                        </button>
                    </div>
                )}
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-1/4">Barang</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right w-32">Stok Sistem</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-40 text-center">Stok Fisik</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 w-32 text-right">Selisih</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Catatan</th>
                            </tr>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {opname.items.map((item) => {
                            const edited = editedItems[item.id] || item;
                            const hasVariance = edited.actual_qty !== null && edited.actual_qty !== edited.system_qty;
                            const variance = edited.actual_qty !== null ? edited.actual_qty - edited.system_qty : 0;

                            return (
                                <tr key={item.id} className={hasVariance ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{item.item_name}</div>
                                        <div className="text-xs text-gray-500">{item.item_code} • {item.category}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600 font-mono">
                                        {item.system_qty} <span className="text-xs text-gray-400">{item.unit_of_measure}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isReadOnly ? (
                                            <span className="font-bold text-gray-900">{item.actual_qty ?? '-'}</span>
                                        ) : (
                                            <input
                                                type="number"
                                                className="w-24 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0"
                                                value={edited.actual_qty ?? ''}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-400'
                                        }`}>
                                        {edited.actual_qty !== null && variance !== 0
                                            ? (variance > 0 ? `+${Number(variance.toFixed(4))}` : Number(variance.toFixed(4)))
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isReadOnly ? (
                                            <span className="text-gray-600 text-sm">{item.notes || '-'}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                className="w-full px-2 py-1 text-sm border-b border-gray-200 focus:border-blue-500 outline-none bg-transparent"
                                                placeholder="Tambah catatan..."
                                                value={edited.notes || ''}
                                                onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
