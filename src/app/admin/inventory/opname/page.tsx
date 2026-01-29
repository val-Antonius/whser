'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, Info, Search, Plus, ChevronDown, ChevronUp, History, Clock, User, ArrowRight } from 'lucide-react';

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
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);

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
        if (!confirm('Apakah Anda yakin ingin memulai sesi Stock Opname baru? Ini akan mengambil snapshot stok sistem saat ini.')) {
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch('/api/inventory/opname', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    created_by: 1
                })
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/admin/inventory/opname/${data.id}`);
            } else {
                alert('Gagal membuat sesi opname');
            }
        } catch (error) {
            console.error('Error creating opname:', error);
            alert('Terjadi kesalahan saat membuat sesi opname');
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const configs: Record<string, { style: string, label: string }> = {
            'open': {
                style: 'bg-blue-50/50 text-blue-700 border-blue-100',
                label: 'DRAF'
            },
            'submitted': {
                style: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
                label: 'SELESAI'
            },
            'cancelled': {
                style: 'bg-slate-50/50 text-slate-700 border-slate-100',
                label: 'BATAL'
            }
        };
        return configs[status] || { style: 'bg-slate-50 border-slate-100 text-slate-600', label: status.toUpperCase() };
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Stock Opname</h1>
                        <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">Laporan Cek Fisik Berkala</p>
                    </div>
                    <button
                        onClick={handleCreateOpname}
                        disabled={isCreating}
                        className="px-6 py-2.5 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isCreating ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        <span>Mulai Sesi Baru</span>
                    </button>
                </div>

                {/* Educational Info Card */}
                <div className={`mb-8 overflow-hidden transition-all duration-300 border backdrop-blur-sm rounded-2xl ${isInfoExpanded ? 'bg-blue-50/30 border-blue-100' : 'bg-white/40 border-white/60 hover:bg-white/60'}`}>
                    <button
                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${isInfoExpanded ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-white/80 border-white/60 text-slate-400'}`}>
                                <Info className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isInfoExpanded ? 'text-blue-900' : 'text-slate-700'}`}>Apa itu Stock Opname?</h3>
                                {!isInfoExpanded && <p className="text-xs text-slate-400 mt-0.5 italic">Ketahui pentingnya sinkronisasi stok sistem vs fisik</p>}
                            </div>
                        </div>
                        {isInfoExpanded ? <ChevronUp className="h-5 w-5 text-blue-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </button>

                    {isInfoExpanded && (
                        <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-blue-700 block mb-1">Tujuan:</strong>
                                    <p className="text-sm text-slate-700">Stock opname dilakukan untuk memastikan jumlah stok di sistem sama dengan jumlah barang yang ada di gudang secara nyata.</p>
                                </div>
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-blue-700 block mb-1">Kapan Dilakukan?</strong>
                                    <p className="text-sm text-slate-700">Idealnya dilakukan setiap akhir periode (mingguan atau bulanan) untuk mendeteksi kehilangan barang atau kesalahan input transaksi.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Session List Card */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-3xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <History className="h-5 w-5 text-blue-500" />
                            Riwayat Sesi Terakhir
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-none">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Opname</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu & Tanggal</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Petugas</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progres</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                <span className="text-sm font-medium text-slate-400">Memuat riwayat...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : opnames.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <ClipboardCheck className="h-12 w-12 text-slate-300" />
                                                <p className="text-slate-500 italic">Belum ada sesi stock opname.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    opnames.map((opname) => {
                                        const statusInfo = getStatusInfo(opname.status);
                                        const progress = opname.item_count > 0 ? (opname.counted_items / opname.item_count) * 100 : 0;

                                        return (
                                            <tr key={opname.id} className="hover:bg-slate-50/30 transition-colors group">
                                                <td className="px-8 py-4">
                                                    <span className="font-bold text-slate-700">{opname.opname_number}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-600">
                                                            {new Date(opname.created_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric', month: 'short', year: 'numeric'
                                                            })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {new Date(opname.created_at).toLocaleTimeString('id-ID', {
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                                                            <User className="h-3 w-3 text-slate-400" />
                                                        </div>
                                                        <span className="text-sm text-slate-600">{opname.created_by_name || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.style}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="font-bold text-slate-500">{opname.counted_items}/{opname.item_count}</span>
                                                            <span className="text-slate-400">{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${opname.status === 'submitted' ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <Link
                                                        href={`/admin/inventory/opname/${opname.id}`}
                                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 group"
                                                    >
                                                        {opname.status === 'open' ? 'Lanjut Menghitung' : 'Lihat Detail'}
                                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
        </div>
    );
}
