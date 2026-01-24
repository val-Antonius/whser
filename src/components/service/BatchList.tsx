'use client';

interface Batch {
    id: number;
    batch_number: string;
    batch_type: string;
    status: string;
    total_orders: number;
    total_weight: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

interface BatchListProps {
    batches: Batch[];
    onBatchClick: (batchId: number) => void;
}

export default function BatchList({ batches, onBatchClick }: BatchListProps) {
    if (batches.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No active batches</p>
                <p className="text-xs mt-1">Create a batch to start processing orders efficiently</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-300';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'wash': return '🧼';
            case 'dry': return '🌀';
            case 'iron': return '🔥';
            case 'fold': return '📦';
            case 'mixed': return '🔀';
            default: return '📋';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
                <div
                    key={batch.id}
                    onClick={() => onBatchClick(batch.id)}
                    className="border-2 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{getTypeIcon(batch.batch_type)}</span>
                            <div>
                                <div className="font-bold text-sm">{batch.batch_number}</div>
                                <div className="text-xs text-gray-500 capitalize">{batch.batch_type}</div>
                            </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(batch.status)}`}>
                            {formatStatus(batch.status)}
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-50 rounded p-2">
                            <div className="text-xs text-gray-600">Orders</div>
                            <div className="font-bold text-lg">{batch.total_orders}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                            <div className="text-xs text-gray-600">Weight</div>
                            <div className="font-bold text-lg">{batch.total_weight.toFixed(1)}kg</div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 space-y-1">
                        <div>Created: {new Date(batch.created_at).toLocaleString()}</div>
                        {batch.started_at && (
                            <div>Started: {new Date(batch.started_at).toLocaleString()}</div>
                        )}
                        {batch.completed_at && (
                            <div>Completed: {new Date(batch.completed_at).toLocaleString()}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
