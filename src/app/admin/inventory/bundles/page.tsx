'use client';

import { useState, useEffect } from 'react';
import BundleCreateModal from '@/components/inventory/BundleCreateModal';
import BundleList from '@/components/inventory/BundleList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function BundleManagementPage() {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState<any>(null);
    const [bundleDetails, setBundleDetails] = useState<any>(null);

    useEffect(() => {
        fetchBundles();
    }, []);

    const fetchBundles = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/bundles');
            if (!response.ok) throw new Error('Failed to fetch bundles');

            const data = await response.json();
            setBundles(data.bundles);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleViewBundle = async (id: number) => {
        try {
            const response = await fetch(`/api/inventory/bundles/${id}`);
            if (!response.ok) throw new Error('Failed to fetch bundle details');

            const data = await response.json();
            setSelectedBundle(data.bundle);
            setBundleDetails(data.items);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to fetch bundle details');
        }
    };

    const handleEdit = async (id: number) => {
        // TODO: Implement edit functionality
        alert('Edit functionality coming soon');
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Paket Barang (Bundles)</h1>
                <p className="text-gray-600">
                    Kelompokkan barang inventory menjadi paket untuk operasi massal
                </p>
            </div>

            {/* DEPRECATION WARNING */}
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>Fitur ini sudah tidak digunakan (Deprecated).</strong>
                            <br />
                            Silakan gunakan fitur <a href="/admin/inventory/consumption" className="underline font-bold text-yellow-800">Consumption Templates (Resep Layanan)</a> yang lebih otomatis dan terintegrasi dengan Order Processing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Educational Info Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        Apa itu Inventory Bundles?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <strong className="text-sm text-gray-900">Fungsi:</strong>
                        <p className="text-sm text-gray-700">Mengelompokkan beberapa barang inventory menjadi satu paket.</p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">Contoh:</strong>
                        <p className="text-sm text-gray-700">Bundle "Cuci Kering 1kg" = 50ml deterjen + 30ml softener + 1 plastik kemasan.</p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">Manfaat:</strong>
                        <p className="text-sm text-gray-700">Mengurangi stok otomatis saat processing order menggunakan bundle ini.</p>
                    </div>
                    <div>
                        <strong className="text-sm text-gray-900">Flow Real:</strong>
                        <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                            <li>Buat bundle untuk layanan tertentu</li>
                            <li>Saat order diproses, pilih bundle</li>
                            <li>Sistem auto-deduct semua item dalam bundle dari inventory</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            {/* Action Bar */}
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {bundles.length} bundle dibuat
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + Buat Bundle
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
                    Loading bundles...
                </div>
            )}

            {/* Bundles List */}
            {!loading && (
                <BundleList
                    bundles={bundles}
                    onView={handleViewBundle}
                    onEdit={handleEdit}
                />
            )}

            {/* Bundle Details Modal */}
            {selectedBundle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold">{selectedBundle.bundle_name}</h2>
                                <p className="text-sm text-gray-600">{selectedBundle.bundle_code}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedBundle(null);
                                    setBundleDetails(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedBundle.description && (
                            <p className="text-gray-700 mb-4">{selectedBundle.description}</p>
                        )}

                        <h3 className="font-bold mb-3">Bundle Items ({bundleDetails?.length || 0})</h3>

                        {bundleDetails && bundleDetails.length > 0 ? (
                            <div className="space-y-2">
                                {bundleDetails.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <div>
                                            <div className="font-medium">{item.item_name}</div>
                                            <div className="text-sm text-gray-600">{item.item_code}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{item.quantity} {item.unit}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No items in this bundle</p>
                        )}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <BundleCreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchBundles();
                }}
            />
        </div>
    );
}
