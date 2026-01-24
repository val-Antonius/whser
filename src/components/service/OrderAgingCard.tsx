'use client';

interface OrderAgingCardProps {
    agingHours: number;
    stageAgingHours: number;
    currentStage: string;
    createdAt: string;
}

export default function OrderAgingCard({ agingHours, stageAgingHours, currentStage, createdAt }: OrderAgingCardProps) {
    const getAgingColor = (hours: number) => {
        if (hours < 24) return 'text-green-600 bg-green-50 border-green-200';
        if (hours < 48) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        if (hours < 72) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getAgingLabel = (hours: number) => {
        if (hours < 24) return 'Fresh';
        if (hours < 48) return 'Normal';
        if (hours < 72) return 'Aging';
        return 'Critical';
    };

    const formatDuration = (hours: number) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)} minutes`;
        }
        if (hours < 24) {
            return `${hours.toFixed(1)} hours`;
        }
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return `${days}d ${remainingHours}h`;
    };

    return (
        <div className={`border-2 rounded-lg p-3 ${getAgingColor(agingHours)}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Order Age</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${getAgingColor(agingHours)}`}>
                    {getAgingLabel(agingHours)}
                </span>
            </div>

            <div className="space-y-2">
                {/* Total Age */}
                <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">Total:</span>
                    <span className="font-bold text-sm">{formatDuration(agingHours)}</span>
                </div>

                {/* Stage Age */}
                <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">In {currentStage}:</span>
                    <span className="font-medium text-sm">{formatDuration(stageAgingHours)}</span>
                </div>

                {/* Created At */}
                <div className="pt-2 border-t border-current/20">
                    <span className="text-xs opacity-75">
                        Created: {new Date(createdAt).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
