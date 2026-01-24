'use client';

interface VarianceAnalysisCardProps {
    variance: {
        id: number;
        order_number: string;
        item_name: string;
        estimated_quantity: number;
        actual_quantity: number;
        variance_amount: number;
        variance_percentage: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
        status: 'pending' | 'investigating' | 'resolved';
        unit: string;
    };
    onInvestigate?: (id: number) => void;
    onResolve?: (id: number) => void;
}

export default function VarianceAnalysisCard({ variance, onInvestigate, onResolve }: VarianceAnalysisCardProps) {
    const getSeverityColor = (severity: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800 border-green-300',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            high: 'bg-orange-100 text-orange-800 border-orange-300',
            critical: 'bg-red-100 text-red-800 border-red-300'
        };
        return colors[severity as keyof typeof colors] || colors.low;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-gray-100 text-gray-800',
            investigating: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800'
        };
        return colors[status as keyof typeof colors] || colors.pending;
    };

    return (
        <div className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="font-semibold text-gray-900">{variance.item_name}</div>
                    <div className="text-sm text-gray-600">Order: {variance.order_number}</div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded border ${getSeverityColor(variance.severity)}`}>
                        {variance.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(variance.status)}`}>
                        {variance.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                    <div className="text-xs text-gray-500">Estimated</div>
                    <div className="font-medium">{variance.estimated_quantity} {variance.unit}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Actual</div>
                    <div className="font-medium">{variance.actual_quantity} {variance.unit}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Variance</div>
                    <div className={`font-bold ${variance.variance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {variance.variance_amount > 0 ? '+' : ''}{variance.variance_amount} {variance.unit}
                        <span className="text-xs ml-1">({variance.variance_percentage}%)</span>
                    </div>
                </div>
            </div>

            {variance.status !== 'resolved' && (
                <div className="flex gap-2 pt-3 border-t">
                    {variance.status === 'pending' && onInvestigate && (
                        <button
                            onClick={() => onInvestigate(variance.id)}
                            className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                        >
                            Start Investigation
                        </button>
                    )}
                    {variance.status === 'investigating' && onResolve && (
                        <button
                            onClick={() => onResolve(variance.id)}
                            className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
                        >
                            Mark Resolved
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
