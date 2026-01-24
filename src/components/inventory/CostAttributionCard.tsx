'use client';

interface CostAttributionCardProps {
    orderId: number;
}

export default function CostAttributionCard({ orderId }: CostAttributionCardProps) {
    const [costData, setCostData] = useState<any>(null);
    const [itemBreakdown, setItemBreakdown] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCostAttribution();
    }, [orderId]);

    const fetchCostAttribution = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/reports/cost-attribution?order_id=${orderId}`);
            if (!response.ok) throw new Error('Failed to fetch cost attribution');

            const data = await response.json();
            if (data.cost_data && data.cost_data.length > 0) {
                setCostData(data.cost_data[0]);
            }
            setItemBreakdown(data.item_breakdown || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border rounded-lg p-4">
                <div className="text-center text-gray-500">Loading cost attribution...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-700">{error}</div>
            </div>
        );
    }

    if (!costData) {
        return (
            <div className="bg-gray-50 border rounded-lg p-4">
                <div className="text-gray-500">No cost attribution data available</div>
            </div>
        );
    }

    const totalInventoryCost = parseFloat(costData.total_inventory_cost || 0);
    const estimatedPrice = parseFloat(costData.estimated_price || 0);
    const profitMargin = estimatedPrice - totalInventoryCost;
    const profitPercentage = estimatedPrice > 0 ? (profitMargin / estimatedPrice) * 100 : 0;

    return (
        <div className="bg-white border rounded-lg p-4">
            <h3 className="font-bold mb-4">Inventory Cost Attribution</h3>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm text-blue-700">Total Inventory Cost</div>
                    <div className="text-xl font-bold text-blue-800">
                        ₱{totalInventoryCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                        {costData.items_used} items used
                    </div>
                </div>
                <div className={`border rounded p-3 ${profitMargin >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`text-sm ${profitMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        Profit Margin
                    </div>
                    <div className={`text-xl font-bold ${profitMargin >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        ₱{profitMargin.toFixed(2)}
                    </div>
                    <div className={`text-xs mt-1 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitPercentage.toFixed(1)}% of price
                    </div>
                </div>
            </div>

            {/* Item Breakdown */}
            {itemBreakdown.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 text-sm">Item Breakdown</h4>
                    <div className="space-y-2">
                        {itemBreakdown.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                <div>
                                    <div className="font-medium">{item.item_name}</div>
                                    <div className="text-xs text-gray-600">
                                        {item.quantity} × ₱{parseFloat(item.cost_per_unit || 0).toFixed(2)}
                                    </div>
                                </div>
                                <div className="font-semibold">
                                    ₱{parseFloat(item.total_cost || 0).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
