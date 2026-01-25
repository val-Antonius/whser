'use client';

import { useState, useEffect } from 'react';
import ConsumptionTemplateList from '@/components/inventory/ConsumptionTemplateList';
import ServiceRecipeDialog from '@/components/inventory/ServiceRecipeDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function ConsumptionManagementPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Resep Layanan (Service Recipes)</h1>
                <p className="text-gray-600">
                    Definisikan komposisi bahan (resep) untuk setiap jenis layanan.
                </p>
            </div>

            {/* Educational Info Card */}
            <Card className="mb-6 bg-green-50 border-green-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-900">
                        <HelpCircle className="h-5 w-5 text-green-600" />
                        Apa itu Service Recipes?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <strong className="text-sm text-gray-900">Fungsi:</strong>
                        <p className="text-sm text-gray-700">Mengatur resep otomatis. Saat order dibuat, stok bahan-bahan ini akan otomatis terpotong.</p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">Contoh:</strong>
                        <p className="text-sm text-gray-700">Layanan "Cuci Kering" menggunakan 50ml deterjen per kg + 30ml softener per kg.</p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">Manfaat:</strong>
                        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                            <li>Estimasi kebutuhan inventory</li>
                            <li>Deteksi pemborosan (jika actual &gt; template)</li>
                            <li>Hitung ideal cost per order</li>
                        </ul>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">Flow Real:</strong>
                        <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                            <li>Set consumption template per layanan</li>
                            <li>Sistem hitung estimasi konsumsi saat order dibuat</li>
                            <li>Bandingkan actual vs template untuk analisis variance</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            {/* Action Bar */}
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {templates.length} template dikonfigurasi
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                    + Kelola Resep
                </button>
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
                    Loading templates...
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
    );
}
