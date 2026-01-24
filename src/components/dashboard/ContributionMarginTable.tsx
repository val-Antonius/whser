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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Contribution Margin by Service</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Service</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">Orders</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">Revenue</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">Inv. Cost</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">Margin</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">Margin %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((service, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{service.service_name}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{service.order_count}</td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                    Rp {service.total_revenue.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                    Rp {service.total_inventory_cost.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600">
                                    Rp {service.contribution_margin.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`font-bold ${service.margin_percentage >= 70 ? 'text-green-600' :
                                            service.margin_percentage >= 50 ? 'text-yellow-600' :
                                                'text-red-600'
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
