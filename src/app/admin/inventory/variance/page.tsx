'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search, Filter, AlertTriangle, CheckCircle2, SearchCode, History } from 'lucide-react';
import VarianceAnalysisCard from '@/components/inventory/VarianceAnalysisCard';

export default function VarianceAnalysisPage() {
    const [variances, setVariances] = useState([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);

    useEffect(() => {
        fetchVariances();
    }, [statusFilter, severityFilter]);

    const fetchVariances = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (severityFilter) params.append('severity', severityFilter);

            const response = await fetch(`/api/inventory/variance?${params.toString()}`);
            if (!response.ok) throw new Error('Gagal mengambil data variansi');

            const data = await response.json();
            setVariances(data.variances);
            setSummary(data.summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleInvestigate = async (id: string | number) => {
        if (typeof id === 'string' && id.startsWith('opn-')) {
            alert('Penyesuaian Stock Opname sudah dianggap selesai (Resolved).');
            return;
        }

        const numericId = typeof id === 'string' ? parseInt(id.replace('ord-', '')) : id;

        try {
            const response = await fetch(`/api/inventory/variance/${numericId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'investigating' })
            });

            if (!response.ok) throw new Error('Gagal memperbarui status variansi');

            fetchVariances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Gagal memperbarui status variansi');
        }
    };

    const handleResolve = async (id: string | number) => {
        const notes = prompt('Masukkan catatan penyelesaian:');
        if (!notes) return;

        try {
            const response = await fetch(`/api/inventory/variance/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'resolved',
                    resolution_notes: notes
                })
            });

            if (!response.ok) throw new Error('Gagal menyelesaikan variance');

            fetchVariances();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Gagal menyelesaikan variance');
        }
    };

    const stats = summary ? [
        {
            label: 'Total Kasus',
            value: summary.total,
            icon: <History className="h-4 w-4 text-slate-500" />,
            bgColor: 'bg-white/60',
            borderColor: 'border-white/60'
        },
        {
            label: 'Menunggu',
            value: summary.pending,
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            bgColor: 'bg-amber-50/50',
            borderColor: 'border-amber-100'
        },
        {
            label: 'Investigasi',
            value: summary.investigating,
            icon: <SearchCode className="h-4 w-4 text-sky-500" />,
            bgColor: 'bg-sky-50/50',
            borderColor: 'border-sky-100'
        },
        {
            label: 'Selesai',
            value: summary.resolved,
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            bgColor: 'bg-emerald-50/50',
            borderColor: 'border-emerald-100'
        },
        {
            label: 'Kritis',
            value: summary.critical,
            icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,
            bgColor: 'bg-rose-50/50',
            borderColor: 'border-rose-100'
        }
    ] : [];

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-slate-800 tracking-tight">Analisis Variansi <span className="text-slate-400 font-extralight">(Audit)</span></h1>
                    <p className="text-slate-500 mt-1">
                        Audit ketidaksesuaian antara pemakaian standar vs aktual untuk deteksi pemborosan.
                    </p>
                </div>

                {/* Educational Info Card - Collapsible */}
                <div className={`mb-8 overflow-hidden transition-all duration-300 border backdrop-blur-sm rounded-2xl ${isInfoExpanded ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white/40 border-white/60 hover:bg-white/60'}`}>
                    <button
                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${isInfoExpanded ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white/80 border-white/60 text-slate-400'}`}>
                                <HelpCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isInfoExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>Untuk apa halaman ini?</h3>
                                {!isInfoExpanded && <p className="text-xs text-slate-400 mt-0.5">Klik untuk mendalami konsep audit ketidaksesuaian pemakaian barang</p>}
                            </div>
                        </div>
                        {isInfoExpanded ? <ChevronUp className="h-5 w-5 text-indigo-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </button>

                    {isInfoExpanded && (
                        <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-indigo-700 block mb-1">1. Deteksi Kebocoran:</strong>
                                    <p className="text-sm text-slate-700">Jika <strong>Stok Fisik &lt; Stok Sistem</strong>, berarti ada barang hilang, dicuri, atau pemakaian berlebih tanpa pencatatan.</p>
                                </div>
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-indigo-700 block mb-1">2. Efisiensi Resep:</strong>
                                    <p className="text-sm text-slate-700">Jika selisih terus-menerus muncul pada item tertentu, mungkin takaran di sistem perlu disesuaikan dengan realita lapangan.</p>
                                </div>
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-indigo-700 block mb-1">3. Rekonsiliasi:</strong>
                                    <p className="text-sm text-slate-700">Setiap kali Anda melakukan Stock Opname, selisihnya akan tercatat di sini sebagai riwayat audit permanen.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        {stats.map((stat, i) => (
                            <div key={i} className={`p-4 rounded-2xl border backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 ${stat.bgColor} ${stat.borderColor}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-1.5 bg-white/80 rounded-lg border border-white/60 shadow-sm">
                                        {stat.icon}
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-xl font-light text-slate-900">{stat.value}</h3>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Content Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    {/* Filters Bar */}
                    <div className="p-6 border-b border-slate-100 bg-white/30 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                            <div className="w-full md:w-64">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="pending">Menunggu (Pending)</option>
                                    <option value="investigating">Sedang Investigasi</option>
                                    <option value="resolved">Selesai (Resolved)</option>
                                </select>
                            </div>
                            <div className="w-full md:w-64">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Keparahan (Severity)</label>
                                <select
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Semua Tingkat</option>
                                    <option value="low">Rendah (Low)</option>
                                    <option value="medium">Sedang (Medium)</option>
                                    <option value="high">Tinggi (High)</option>
                                    <option value="critical">Kritis (Critical)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {error && (
                            <div className="mb-6 p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-rose-700 text-sm flex items-center gap-3">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                                <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                                <span className="text-sm font-medium">Memuat data variansi...</span>
                            </div>
                        ) : variances.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {variances.map((variance: any) => (
                                    <VarianceAnalysisCard
                                        key={variance.id}
                                        variance={variance}
                                        onInvestigate={handleInvestigate}
                                        onResolve={handleResolve}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-3xl">
                                <p className="text-slate-400">Tidak ada selisih data ditemukan (Semua aman).</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
