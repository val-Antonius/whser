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
        if (percentage >= 80) return 'text-rose-600';
        if (percentage >= 50) return 'text-amber-600';
        return 'text-emerald-600';
    };

    const getBarColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-rose-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const getStatus = (percentage: number) => {
        if (percentage >= 80) return 'High Load';
        if (percentage >= 50) return 'Moderate Load';
        return 'Low Load';
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Capacity Utilization</h3>

            <div className="text-center mb-6">
                <div className={`text-5xl font-light ${getColor(utilizationPercentage)}`}>
                    {Math.round(utilizationPercentage)}%
                </div>
                <p className="text-sm text-slate-500 mt-2">{getStatus(utilizationPercentage)}</p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-4 mb-4 overflow-hidden">
                <div
                    className={`h-4 rounded-full transition-all duration-500 ${getBarColor(utilizationPercentage)}`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                ></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-white/50 border border-white/50 rounded-lg backdrop-blur-sm">
                    <p className="text-slate-500">Active Orders</p>
                    <p className="text-xl font-semibold text-slate-900">{activeOrders}</p>
                </div>
                <div className="text-center p-3 bg-white/50 border border-white/50 rounded-lg backdrop-blur-sm">
                    <p className="text-slate-500">Peak Capacity</p>
                    <p className="text-xl font-semibold text-slate-900">{peakCapacity}</p>
                </div>
            </div>
        </div>
    );
}
