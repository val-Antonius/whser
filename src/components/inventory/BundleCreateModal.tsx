'use client';

import { useState } from 'react';

interface BundleCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BundleCreateModal({ isOpen, onClose, onSuccess }: BundleCreateModalProps) {
    const [bundleName, setBundleName] = useState('');
    const [bundleCode, setBundleCode] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/inventory/bundles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bundle_name: bundleName,
                    bundle_code: bundleCode,
                    description
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create bundle');
            }

            onSuccess();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setBundleName('');
        setBundleCode('');
        setDescription('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Inventory Bundle</h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Bundle Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={bundleName}
                                onChange={(e) => setBundleName(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="e.g., Starter Kit"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Bundle Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={bundleCode}
                                onChange={(e) => setBundleCode(e.target.value.toUpperCase())}
                                className="w-full border rounded px-3 py-2"
                                placeholder="e.g., STARTER-001"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                placeholder="Optional description..."
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Bundle'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
