'use client';

import { useState, useEffect } from 'react';
import { CustomerLoyaltyHistory, LoyaltyTier } from '@/types';
import { formatCurrency } from '@/lib/utils'; // Assuming this utility exists, if not I'll define a local helper

interface CustomerLoyaltyCardProps {
    customerId: number;
}

export default function CustomerLoyaltyCard({ customerId }: CustomerLoyaltyCardProps) {
    const [currentTier, setCurrentTier] = useState<LoyaltyTier>(LoyaltyTier.STANDARD);
    const [lifetimeValue, setLifetimeValue] = useState<number>(0);
    const [riskScore, setRiskScore] = useState<number>(0);
    const [history, setHistory] = useState<CustomerLoyaltyHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLoyaltyData();
    }, [customerId]);

    const fetchLoyaltyData = async () => {
        try {
            const res = await fetch(`/api/customers/${customerId}/loyalty`);
            const data = await res.json();
            if (data.success) {
                setCurrentTier(data.data.current_tier);
                setLifetimeValue(data.data.lifetime_value);
                setRiskScore(data.data.risk_score);
                setHistory(data.data.history);
            }
        } catch (error) {
            console.error('Failed to fetch loyalty data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTierColor = (tier: LoyaltyTier) => {
        switch (tier) {
            case LoyaltyTier.PLATINUM: return 'bg-slate-800 text-slate-100 border-slate-600';
            case LoyaltyTier.GOLD: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case LoyaltyTier.SILVER: return 'bg-slate-200 text-slate-800 border-slate-300';
            default: return 'bg-blue-50 text-blue-800 border-blue-200';
        }
    };

    if (isLoading) return <div className="animate-pulse h-48 bg-gray-100 rounded-lg"></div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">Loyalty & Value</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTierColor(currentTier)}`}>
                    {currentTier} Member
                </span>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 uppercase font-semibold">Lifetime Value</p>
                    <p className="text-xl font-bold text-blue-900">Rp {lifetimeValue.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs text-red-600 uppercase font-semibold">Risk Score</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-red-900">{riskScore}</p>
                        <span className="text-xs text-red-500">(0-100)</span>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-2">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Recent Activity</h4>
            </div>

            <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs text-left sticky top-0">
                        <tr>
                            <th className="px-4 py-2 font-medium">Date</th>
                            <th className="px-4 py-2 font-medium">Type</th>
                            <th className="px-4 py-2 font-medium text-right">Points/Val</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {history.length > 0 ? (
                            history.slice(0, 5).map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-600">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                            {item.change_type}
                                        </span>
                                        {item.new_tier && (
                                            <span className="ml-2 text-xs text-green-600">→ {item.new_tier}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-700">
                                        {item.points_earned > 0 ? '+' : ''}{item.points_earned}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                                    No loyalty history yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {history.length > 5 && (
                <div className="p-2 text-center border-t border-gray-100">
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        View Full History
                    </button>
                </div>
            )}
        </div>
    );
}
