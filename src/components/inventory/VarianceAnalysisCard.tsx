'use client';

import { FileText, ClipboardList } from 'lucide-react';

export interface VarianceRecord {
    id: string | number;
    source: 'order_consumption' | 'stock_opname';
    reference_number: string;
    item_name: string;
    item_code: string;
    expected_qty: number;
    actual_qty: number;
    variance_qty: number;
    variance_percent: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'investigating' | 'resolved';
    unit: string;
    investigation_notes?: string;
    resolution_notes?: string;
}

interface VarianceAnalysisCardProps {
    variance: VarianceRecord;
    onInvestigate?: (id: string | number) => void;
    onResolve?: (id: string | number) => void;
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

    // Helper to translate status textual 
    const translateStatus = (s: string) => {
        if (s === 'pending') return 'Menunggu';
        if (s === 'investigating') return 'Investigasi';
        if (s === 'resolved') return 'Selesai';
        return s;
    };

    return (
        <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                    <div className={`p-2 rounded-lg h-10 w-10 flex items-center justify-center ${variance.source === 'stock_opname' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {variance.source === 'stock_opname' ? <ClipboardList size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{variance.item_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{variance.item_code}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <span className="text-xs uppercase tracking-wider text-gray-400">REF:</span>
                            {variance.reference_number}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${getSeverityColor(variance.severity)}`}>
                        {variance.severity}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${getStatusColor(variance.status)}`}>
                        {translateStatus(variance.status)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 p-3 rounded text-sm">
                <div>
                    <div className="text-[10px] uppercase text-gray-500 font-semibold">Estimasi</div>
                    <div className="font-medium text-gray-700">{variance.expected_qty} {variance.unit}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase text-gray-500 font-semibold">Aktual</div>
                    <div className="font-medium text-gray-700">{variance.actual_qty} {variance.unit}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase text-gray-500 font-semibold">Selisih</div>
                    <div className={`font-bold ${variance.variance_qty > 0 ? 'text-green-600' : variance.variance_qty < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {variance.variance_qty > 0 ? '+' : ''}{Number(variance.variance_qty.toFixed(4))} {variance.unit}
                    </div>
                    <div className={`text-[10px] ${Math.abs(variance.variance_percent) > 5 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                        {variance.variance_percent.toFixed(1)}%
                    </div>
                </div>
            </div>

            {variance.resolution_notes && (
                <div className="mb-3 p-2 bg-green-50 border border-green-100 rounded text-xs text-green-800 italic">
                    "Masalah ini telah diselesaikan: {variance.resolution_notes}"
                </div>
            )}

            {variance.status !== 'resolved' && (
                <div className="flex gap-2 pt-3 border-t mt-2">
                    {variance.status === 'pending' && onInvestigate && (
                        <button
                            onClick={() => onInvestigate(variance.id)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        >
                            Mulai Investigasi
                        </button>
                    )}
                    {variance.status === 'investigating' && onResolve && (
                        <button
                            onClick={() => onResolve(variance.id)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
                        >
                            Tandai Selesai
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
