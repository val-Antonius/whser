'use client';

import { useState, useEffect } from 'react';
import BundleCreateModal from '@/components/inventory/BundleCreateModal';
import BundleList from '@/components/inventory/BundleList';

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
                <h1 className="text-3xl font-bold mb-2">Inventory Bundles</h1>
                <p className="text-gray-600">
                    Group inventory items into bundles for bulk operations
                </p>
            </div>

            {/* Action Bar */}
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {bundles.length} bundle{bundles.length !== 1 ? 's' : ''} created
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + Create Bundle
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
