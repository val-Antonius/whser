'use client';

import { useState, useEffect } from 'react';
import { CustomerContract, ContractType, BillingCycle } from '@/types';

interface ContractListProps {
    customerId: number;
}

export default function ContractList({ customerId }: ContractListProps) {
    const [contracts, setContracts] = useState<CustomerContract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchContracts();
    }, [customerId]);

    const fetchContracts = async () => {
        try {
            const res = await fetch(`/api/customers/${customerId}/contracts`);
            const data = await res.json();
            if (data.success) {
                setContracts(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch contracts', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Active Contracts</h3>
                <button className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 font-medium transition-colors">
                    + Add Contract
                </button>
            </div>

            <div className="p-4 space-y-3">
                {contracts.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 italic text-sm">
                        No active contracts found.
                    </div>
                ) : (
                    contracts.map((contract) => (
                        <div key={contract.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-semibold text-gray-800">{contract.contract_type} Contract</h4>
                                    <p className="text-xs text-gray-500">
                                        {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${contract.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {contract.is_active ? 'ACTIVE' : 'EXPIRED'}
                                </span>
                            </div>

                            <div className="flex gap-4 text-sm mt-3 pt-3 border-t border-gray-50">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase">SLA Modifier</p>
                                    <p className="font-medium text-gray-800">
                                        {contract.sla_modifier_hours > 0 ? '+' : ''}{contract.sla_modifier_hours} Hours
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase">Discount</p>
                                    <p className="font-medium text-green-600">
                                        {Math.abs(contract.price_modifier_percent)}% OFF
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase">Billing</p>
                                    <p className="font-medium text-gray-800">{contract.billing_cycle}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
