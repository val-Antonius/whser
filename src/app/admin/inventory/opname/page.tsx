'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StockOpname {
    id: number;
    opname_number: string;
    status: 'open' | 'submitted' | 'cancelled';
    notes: string;
    created_at: string;
    created_by_name: string;
    item_count: number;
    counted_items: number;
}

export default function StockOpnamePage() {
    const router = useRouter();
    const [opnames, setOpnames] = useState<StockOpname[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchOpnames();
    }, []);

    const fetchOpnames = async () => {
        try {
            const response = await fetch('/api/inventory/opname');
            if (response.ok) {
                const data = await response.json();
                setOpnames(data);
            }
        } catch (error) {
            console.error('Error fetching opnames:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOpname = async () => {
        if (!confirm('Are you sure you want to start a new Stock Opname session? This will snapshot current inventory levels.')) {
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch('/api/inventory/opname', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    created_by: 1 // TODO: Get from session
                })
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/admin/inventory/opname/${data.id}`);
            } else {
                alert('Failed to start opname session');
            }
        } catch (error) {
            console.error('Error creating opname:', error);
            alert('Error creating opname session');
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusInfo = (status: string) => {
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
        return { style: styles[status] || styles['cancelled'], label: labels[status] || status.toUpperCase() };
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stock Opname (Cek Fisik)</h1>
                    <p className="text-gray-600 mt-1">Rekonsiliasi stok sistem dengan jumlah fisik aktual</p>
                </div>
                <button
                    onClick={handleCreateOpname}
                    disabled={isCreating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition items-center flex gap-2 disabled:opacity-50"
                >
                    {isCreating ? 'Membuat...' : '+ Mulai Sesi Baru'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-700">No. Opname</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Tanggal</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Dibuat Oleh</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Progres</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Memuat riwayat opname...
                                    </td>
                                </tr>
                            ) : opnames.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Belum ada sesi stock opname. Mulai baru untuk mencocokkan stok.
                                    </td>
                                </tr>
                            ) : (
                                opnames.map((opname) => {
                                    const statusInfo = getStatusInfo(opname.status);
                                    return (
                                        <tr key={opname.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {opname.opname_number}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(opname.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{opname.created_by_name || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.style}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {opname.counted_items} / {opname.item_count} Barang
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/admin/inventory/opname/${opname.id}`}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    {opname.status === 'open' ? 'Lanjut Menghitung →' : 'Lihat Detail'}
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
