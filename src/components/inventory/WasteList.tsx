'use client';

interface WasteEvent {
    id: number;
    item_name: string;
    quantity: number;
    unit: string;
    waste_type: string;
    reason: string;
    cost_impact: number;
    reported_at: string;
    reported_by_name: string;
}

interface WasteListProps {
    wasteEvents: WasteEvent[];
}

export default function WasteList({ wasteEvents }: WasteListProps) {
    const getWasteTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            spillage: 'bg-yellow-100 text-yellow-800',
            expiration: 'bg-orange-100 text-orange-800',
            damage: 'bg-red-100 text-red-800',
            theft: 'bg-purple-100 text-purple-800',
            contamination: 'bg-pink-100 text-pink-800',
            other: 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors.other;
    };

    const getWasteTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            spillage: 'Tumpah',
            expiration: 'Kadaluarsa',
            damage: 'Rusak',
            theft: 'Hilang/Dicuri',
            contamination: 'Terkontaminasi',
            other: 'Lainnya'
        };
        return labels[type] || type;
    };

    const formatCurrency = (value: any) => {
        const numValue = parseFloat(value || 0);
        return numValue.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    if (wasteEvents.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
                Belum ada laporan kehilangan yang tercatat.
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Tanggal</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Barang</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Jumlah</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Jenis</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Dampak Biaya</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Dilaporkan Oleh</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {wasteEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                            <td className="p-3 text-sm">
                                {new Date(event.reported_at).toLocaleString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </td>
                            <td className="p-3 font-medium">{event.item_name}</td>
                            <td className="p-3 text-sm">
                                {event.quantity} {event.unit}
                            </td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs rounded ${getWasteTypeColor(event.waste_type)}`}>
                                    {getWasteTypeLabel(event.waste_type)}
                                </span>
                            </td>
                            <td className="p-3 text-sm font-semibold text-red-600">
                                {formatCurrency(event.cost_impact)}
                            </td>
                            <td className="p-3 text-sm text-gray-600">{event.reported_by_name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
