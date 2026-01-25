'use client';

import { useState, useEffect } from 'react';
import WasteReportModal from '@/components/inventory/WasteReportModal';
import WasteList from '@/components/inventory/WasteList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function WasteTrackingPage() {
    const [wasteEvents, setWasteEvents] = useState([]);
    const [totalCostImpact, setTotalCostImpact] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Pelacakan Limbah & Kehilangan</h1>
                <p className="text-gray-600">
                    Pencatatan barang rusak, tumpah, atau hilang untuk akurasi stok dan biaya.
                </p>
            </div>

            {/* Educational Info Card */}
            <Card className="mb-6 bg-red-50 border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-900">
                        <HelpCircle className="h-5 w-5 text-red-600" />
                        Apa fungsi halaman ini?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <strong className="text-sm text-gray-900">1. Mencatat "Loss" (Kehilangan)</strong>
                        <p className="text-sm text-gray-700">
                            Berbeda dengan pemakaian cuci (Consumption), data ini adalah inventaris yang terbuang tanpa menghasilkan pendapatan (Tumpah, Rusak, Dicuri).
                        </p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">2. Menjaga Akurasi Stok</strong>
                        <p className="text-sm text-gray-700">
                            Jika barang tumpah tapi tidak dicatat, stok sistem akan lebih tinggi dari fisik, menyebabkan selisih saat Opname.
                        </p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">3. Menghitung Kerugian Finansial</strong>
                        <p className="text-sm text-gray-700">
                            Setiap gram deterjen yang tumpah ada harganya. Sistem otomatis menghitung nilai rupiah dari kehilangan tersebut.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Card */}
            <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Total Nilai Kehilangan</div>
                        <div className="text-3xl font-bold text-red-600">
                            Rp {totalCostImpact.toLocaleString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            Dari {wasteEvents.length} laporan kejadian
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm"
                    >
                        + Laporkan Kehilangan
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12 text-gray-500">
                    Memuat data...
                </div>
            )}

            {/* Waste List */}
            {!loading && <WasteList wasteEvents={wasteEvents} />}

            {/* Report Modal */}
            <WasteReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchWasteEvents();
                }}
            />
        </div>
    );
}
