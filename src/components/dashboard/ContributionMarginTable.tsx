'use client';

interface ContributionMarginTableProps {
    data: Array<{
        service_name: string;
        order_count: number;
        total_revenue: number;
        total_inventory_cost: number;
        contribution_margin: number;
        margin_percentage: number;
    }>;
}

export default function ContributionMarginTable({ data }: ContributionMarginTableProps) {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-white/60 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-800">Contribution Margin by Service</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/30 border-b border-white/60">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-500">Service</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-500">Orders</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-500">Revenue</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-500">Inv. Cost</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-500">Margin</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-500">Margin %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/60">
                        {data.map((service, index) => (
                            <tr key={index} className="hover:bg-sky-50/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{service.service_name}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{service.order_count}</td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    Rp {service.total_revenue.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    Rp {service.total_inventory_cost.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                    Rp {service.contribution_margin.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`font-bold ${service.margin_percentage >= 70 ? 'text-emerald-600' :
                                        service.margin_percentage >= 50 ? 'text-amber-600' :
                                            'text-rose-600'
                                        }`}>
                                        {service.margin_percentage}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
