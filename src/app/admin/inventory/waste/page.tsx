'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Plus } from 'lucide-react';
import WasteReportModal from '@/components/inventory/WasteReportModal';
import WasteList from '@/components/inventory/WasteList';

export default function WasteTrackingPage() {
    const [wasteEvents, setWasteEvents] = useState([]);
    const [totalCostImpact, setTotalCostImpact] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);

    useEffect(() => {
        fetchWasteEvents();
    }, []);

    const fetchWasteEvents = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/waste');
            if (!response.ok) throw new Error('Failed to fetch waste events');

            const data = await response.json();
            setWasteEvents(data.waste_events);
            setTotalCostImpact(data.total_cost_impact);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Pelacakan Kehilangan <span className="text-slate-400 font-extralight">(Waste Tracking)</span></h1>
                        <p className="text-slate-500 mt-1">
                            Pencatatan barang rusak, tumpah, atau hilang untuk akurasi stok dan biaya.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 font-semibold flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Laporkan Kehilangan
                    </button>
                </div>

                {/* Educational Info Card - Collapsible */}
                <div className={`mb-8 overflow-hidden transition-all duration-300 border backdrop-blur-sm rounded-2xl ${isInfoExpanded ? 'bg-rose-50/30 border-rose-100' : 'bg-white/40 border-white/60 hover:bg-white/60'}`}>
                    <button
                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${isInfoExpanded ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-white/80 border-white/60 text-slate-400'}`}>
                                <HelpCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isInfoExpanded ? 'text-rose-900' : 'text-slate-700'}`}>Mengapa Mencatat Kehilangan?</h3>
                                {!isInfoExpanded && <p className="text-xs text-slate-400 mt-0.5">Klik untuk memahami pentingnya pencatatan kehilangan inventaris</p>}
                            </div>
                        </div>
                        {isInfoExpanded ? <ChevronUp className="h-5 w-5 text-rose-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </button>

                    {isInfoExpanded && (
                        <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-rose-700 block mb-1">Loss (Kehilangan):</strong>
                                    <p className="text-sm text-slate-700">Berbeda dengan pemakaian cuci, data ini adalah inventaris yang terbuang tanpa pendapatan (Tumpah, Rusak, Dicuri).</p>
                                </div>
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-rose-700 block mb-1">Akurasi Stok:</strong>
                                    <p className="text-sm text-slate-700">Jika barang tumpah tidak dicatat, stok sistem akan lebih tinggi dari fisik, menyebabkan selisih saat Opname.</p>
                                </div>
                                <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                    <strong className="text-xs uppercase tracking-wider text-rose-700 block mb-1">Audit Keuangan:</strong>
                                    <p className="text-sm text-slate-700">Setiap gram barang tumpah ada harganya. Sistem otomatis menghitung nilai rupiah dari kehilangan tersebut.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Card */}
                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-sm transition-all hover:bg-white/80 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Nilai Kehilangan</p>
                            <h3 className="text-4xl font-light text-rose-600">
                                Rp {totalCostImpact.toLocaleString('id-ID')}
                            </h3>
                            <p className="text-sm text-slate-500 mt-2 flex items-center justify-center md:justify-start gap-2">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                Dari <span className="font-bold text-slate-700">{wasteEvents.length}</span> laporan kejadian
                            </p>
                        </div>
                        <div className="h-px w-full md:h-12 md:w-px bg-slate-100 hidden md:block" />
                        <div className="text-center md:text-right hidden md:block">
                            <p className="text-xs text-slate-400 italic">"Pencatatan yang akurat adalah awal dari efisiensi."</p>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-rose-50/50 border-b border-rose-100 text-rose-700 text-sm flex items-center gap-3">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                                <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                                <span className="text-sm font-medium">Memuat data riwayat...</span>
                            </div>
                        ) : (
                            <WasteList wasteEvents={wasteEvents} />
                        )}
                    </div>
                </div>

                {/* Report Modal */}
                <WasteReportModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchWasteEvents();
                    }}
                />
            </div>
        </div>
    );
}
