'use client';

import { useState, useEffect } from 'react';
import { CustomerComplaint, ComplaintStatus, ComplaintSeverity } from '@/types';

interface ComplaintHistoryProps {
    customerId: number;
}

export default function ComplaintHistory({ customerId }: ComplaintHistoryProps) {
    const [complaints, setComplaints] = useState<CustomerComplaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchComplaints();
    }, [customerId]);

    const fetchComplaints = async () => {
        try {
            const res = await fetch(`/api/customers/${customerId}/complaints`);
            const data = await res.json();
            if (data.success) {
                setComplaints(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch complaints', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getSeverityColor = (sev: ComplaintSeverity) => {
        switch (sev) {
            case ComplaintSeverity.CRITICAL: return 'bg-red-100 text-red-800';
            case ComplaintSeverity.HIGH: return 'bg-orange-100 text-orange-800';
            case ComplaintSeverity.MEDIUM: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: ComplaintStatus) => {
        switch (status) {
            case ComplaintStatus.OPEN: return 'bg-red-50 text-red-600 border-red-200';
            case ComplaintStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-600 border-blue-200';
            case ComplaintStatus.RESOLVED: return 'bg-green-50 text-green-600 border-green-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">Complaints & Issues</h3>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                        {complaints.length}
                    </span>
                </div>
                <button className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition-colors">
                    + Report Issue
                </button>
            </div>

            <div className="p-0">
                {complaints.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <p>No complaints recorded.</p>
                        <p className="text-sm">Great customer satisfaction!</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Issue</th>
                                <th className="px-4 py-3">Severity</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {complaints.map((complaint) => (
                                <tr key={complaint.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {new Date(complaint.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800">{complaint.category}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                            {complaint.description}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(complaint.severity)}`}>
                                            {complaint.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                                            {complaint.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
