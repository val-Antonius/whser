'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Plus } from 'lucide-react';
import ConsumptionTemplateList from '@/components/inventory/ConsumptionTemplateList';
import ServiceRecipeDialog from '@/components/inventory/ServiceRecipeDialog';

export default function ConsumptionManagementPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/consumption-templates');
            if (!response.ok) throw new Error('Failed to fetch templates');

            const data = await response.json();
            setTemplates(data.templates);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`/api/inventory/consumption-templates/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete template');

            fetchTemplates();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete template');
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-slate-800 mb-2 tracking-tight">Resep Layanan <span className="text-slate-400 font-extralight">(Service Recipes)</span></h1>
                    <p className="text-slate-500">
                        Definisikan komposisi bahan (resep) untuk setiap jenis layanan.
                    </p>
                </div>

                {/* Educational Info Card - Collapsible */}
                <div className={`mb-8 overflow-hidden transition-all duration-300 border backdrop-blur-sm rounded-2xl ${isInfoExpanded ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white/40 border-white/60 hover:bg-white/60'}`}>
                    <button
                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${isInfoExpanded ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-white/80 border-white/60 text-slate-400'}`}>
                                <HelpCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isInfoExpanded ? 'text-emerald-900' : 'text-slate-700'}`}>Apa itu Service Recipes?</h3>
                                {!isInfoExpanded && <p className="text-xs text-slate-400 mt-0.5">Klik untuk mempelajari fungsi dan manfaat resep layanan</p>}
                            </div>
                        </div>
                        {isInfoExpanded ? <ChevronUp className="h-5 w-5 text-emerald-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </button>

                    {isInfoExpanded && (
                        <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                        <strong className="text-xs uppercase tracking-wider text-emerald-700 block mb-1">Fungsi:</strong>
                                        <p className="text-sm text-slate-700">Mengatur resep otomatis. Saat order dibuat, stok bahan-bahan ini akan otomatis terpotong.</p>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                        <strong className="text-xs uppercase tracking-wider text-emerald-700 block mb-1">Contoh:</strong>
                                        <p className="text-sm text-slate-700">Layanan "Cuci Kering" menggunakan 50ml deterjen per kg + 30ml softener per kg.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                        <strong className="text-xs uppercase tracking-wider text-emerald-700 block mb-1">Manfaat:</strong>
                                        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                                            <li>Estimasi kebutuhan inventory</li>
                                            <li>Deteksi pemborosan (jika actual &gt; template)</li>
                                            <li>Hitung ideal cost per order</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl border border-white/60">
                                        <strong className="text-xs uppercase tracking-wider text-emerald-700 block mb-1">Flow Real:</strong>
                                        <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1">
                                            <li>Set consumption template per layanan</li>
                                            <li>Sistem hitung estimasi konsumsi saat order dibuat</li>
                                            <li>Bandingkan actual vs template untuk analisis variance</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="mb-6 flex justify-between items-center bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/60 shadow-sm">
                    <div className="text-sm font-medium text-slate-500 ml-2">
                        <span className="text-sky-600 font-bold">{templates.length}</span> template dikonfigurasi
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2.5 bg-sky-500 text-white rounded-full hover:bg-sky-600 font-semibold flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Kelola Resep
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-50/50 backdrop-blur-sm border border-rose-100 rounded-xl text-rose-700 text-sm flex items-center gap-3">
                        <span className="text-lg">⚠️</span> {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                        <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                        <span className="text-sm font-medium">Loading templates...</span>
                    </div>
                )}

                {/* Templates List */}
                {!loading && (
                    <ConsumptionTemplateList
                        templates={templates}
                        onDelete={handleDelete}
                    />
                )}

                {/* Create Modal */}
                <ServiceRecipeDialog
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchTemplates();
                    }}
                />
            </div>
        </div>
    );
}
