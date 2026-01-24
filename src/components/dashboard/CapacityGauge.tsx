'use client';

interface CapacityGaugeProps {
    utilizationPercentage: number;
    activeOrders: number;
    peakCapacity: number;
}

export default function CapacityGauge({
    utilizationPercentage,
    activeOrders,
    peakCapacity
}: CapacityGaugeProps) {
    const getColor = (percentage: number) => {
        if (percentage >= 80) return 'text-red-600';
        if (percentage >= 50) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getBarColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-red-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatus = (percentage: number) => {
        if (percentage >= 80) return 'High Load';
        if (percentage >= 50) return 'Moderate Load';
        return 'Low Load';
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Utilization</h3>

            <div className="text-center mb-6">
                <div className={`text-5xl font-bold ${getColor(utilizationPercentage)}`}>
                    {Math.round(utilizationPercentage)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">{getStatus(utilizationPercentage)}</p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                    className={`h-4 rounded-full transition-all duration-500 ${getBarColor(utilizationPercentage)}`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                ></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Active Orders</p>
                    <p className="text-xl font-bold text-gray-900">{activeOrders}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Peak Capacity</p>
                    <p className="text-xl font-bold text-gray-900">{peakCapacity}</p>
                </div>
            </div>
        </div>
    );
}
