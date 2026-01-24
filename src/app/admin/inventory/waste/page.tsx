'use client';

import { useState, useEffect } from 'react';
import WasteReportModal from '@/components/inventory/WasteReportModal';
import WasteList from '@/components/inventory/WasteList';

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
                <h1 className="text-3xl font-bold mb-2">Waste Tracking</h1>
                <p className="text-gray-600">
                    Record and monitor inventory waste and loss events
                </p>
            </div>

            {/* Summary Card */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-sm text-red-700">Total Cost Impact</div>
                        <div className="text-3xl font-bold text-red-800">
                            ₱{totalCostImpact.toFixed(2)}
                        </div>
                        <div className="text-sm text-red-600 mt-1">
                            {wasteEvents.length} waste event{wasteEvents.length !== 1 ? 's' : ''} recorded
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Report Waste
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
                    Loading waste events...
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
