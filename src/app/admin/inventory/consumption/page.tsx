'use client';

import { useState, useEffect } from 'react';
import ConsumptionTemplateModal from '@/components/inventory/ConsumptionTemplateModal';
import ConsumptionTemplateList from '@/components/inventory/ConsumptionTemplateList';

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
                <h1 className="text-3xl font-bold mb-2">Consumption Templates</h1>
                <p className="text-gray-600">
                    Define expected inventory consumption per service type
                </p>
            </div>

            {/* Action Bar */}
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {templates.length} template{templates.length !== 1 ? 's' : ''} configured
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + Add Template
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
            <ConsumptionTemplateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchTemplates();
                }}
            />
        </div>
    );
}
