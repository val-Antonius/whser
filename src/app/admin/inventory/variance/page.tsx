'use client';

import { useState, useEffect } from 'react';
import VarianceAnalysisCard from '@/components/inventory/VarianceAnalysisCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function VarianceAnalysisPage() {
    const [variances, setVariances] = useState([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');

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
        // Only Order Variances can be investigated via this endpoint currently
        if (typeof id === 'string' && id.startsWith('opn-')) {
            alert('Penyesuaian Stock Opname sudah dianggap selesai (Resolved).');
            return;
        }

        // Strip prefix if present (ord-123 -> 123)
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

        // Strip prefix if present (ord-123 -> 123)
        const numericId = typeof id === 'string' ? parseInt(id.replace('ord-', '')) : id;

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

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Analisis Variansi (Audit)</h1>
                <p className="text-gray-600">
                    Audit ketidaksesuaian antara pemakaian standar vs aktual untuk deteksi pemborosan.
                </p>
            </div>

            {/* Educational Info Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        Untuk apa halaman ini?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <strong className="text-sm text-gray-900">1. Mendeteksi Kebocoran (Kehilangan Stok)</strong>
                        <p className="text-sm text-gray-700">
                            Jika <strong>Stok Fisik &lt; Stok Sistem</strong> (Selisih Negatif), berarti ada barang hilang, dicuri, atau pemakaian berlebih tanpa pencatatan.
                        </p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">2. Evaluasi Efisiensi Resep</strong>
                        <p className="text-sm text-gray-700">
                            Jika selisih terus-menerus muncul pada item tertentu, mungkin settingan resep (takaran) di sistem perlu disesuaikan dengan realita lapangan.
                        </p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">3. Rekonsiliasi Opname</strong>
                        <p className="text-sm text-gray-700">
                            Setiap kali Anda melakukan Stock Opname, selisihnya akan tercatat di sini sebagai riwayat audit.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total Kasus</div>
                        <div className="text-2xl font-bold">{summary.total}</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-yellow-700">Menunggu</div>
                        <div className="text-2xl font-bold text-yellow-800">{summary.pending}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-700">Investigasi</div>
                        <div className="text-2xl font-bold text-blue-800">{summary.investigating}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-700">Selesai</div>
                        <div className="text-2xl font-bold text-green-800">{summary.resolved}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-red-700">Kritis</div>
                        <div className="text-2xl font-bold text-red-800">{summary.critical}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="text-sm text-orange-700">Tinggi</div>
                        <div className="text-2xl font-bold text-orange-800">{summary.high}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border rounded-lg p-4 mb-6">
                <h2 className="font-bold mb-3">Filter Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-white"
                        >
                            <option value="">Semua Status</option>
                            <option value="pending">Menunggu (Pending)</option>
                            <option value="investigating">Sedang Investigasi</option>
                            <option value="resolved">Selesai (Resolved)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tingkat Keparahan (Severity)</label>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-white"
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

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12 text-gray-500">
                    Memuat data variansi...
                </div>
            )}

            {/* Variances Grid */}
            {!loading && variances.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variances.map((variance: any) => (
                        <VarianceAnalysisCard
                            key={variance.id}
                            variance={variance}
                            onInvestigate={handleInvestigate}
                            onResolve={handleResolve}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && variances.length === 0 && (
                <div className="text-center py-12 bg-white border rounded-lg">
                    <p className="text-gray-500">Tidak ada selisih data ditemukan (Semua aman).</p>
                </div>
            )}
        </div>
    );
}
