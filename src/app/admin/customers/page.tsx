'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CustomerSegment } from '@/types';

interface Customer {
    id: number;
    customer_number: string;
    name: string;
    phone: string;
    email: string;
    segment: string;
    is_active: boolean;
    created_at: string;
    last_order_date?: string;
    total_orders?: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/customers?limit=100');
            const data = await response.json();
            if (data.success) {
                setCustomers(data.data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // Segment filter
        const matchesSegment = segmentFilter === '' || customer.segment === segmentFilter;

        // Status filter
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && customer.is_active) ||
            (statusFilter === 'inactive' && !customer.is_active);

        return matchesSearch && matchesSegment && matchesStatus;
    });

    const getSegmentColor = (segment: string) => {
        const colors: Record<string, string> = {
            regular: 'bg-gray-100 text-gray-800',
            vip: 'bg-purple-100 text-purple-800',
            corporate: 'bg-blue-100 text-blue-800',
            dormitory: 'bg-green-100 text-green-800',
            hotel: 'bg-yellow-100 text-yellow-800',
        };
        return colors[segment] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
                        <p className="text-gray-600 mt-1">View and manage customer profiles</p>
                    </div>
                    <Link
                        href="/admin/pos"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        + New Customer (via POS)
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Name, phone, email, or customer number..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Segment Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Segment
                            </label>
                            <select
                                value={segmentFilter}
                                onChange={(e) => setSegmentFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">All Segments</option>
                                <option value={CustomerSegment.REGULAR}>Regular</option>
                                <option value={CustomerSegment.VIP}>VIP</option>
                                <option value={CustomerSegment.CORPORATE}>Corporate</option>
                                <option value={CustomerSegment.DORMITORY}>Dormitory</option>
                                <option value={CustomerSegment.HOTEL}>Hotel</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                                <option value="all">All Customers</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {filteredCustomers.length} of {customers.length} customers
                        </p>
                        <button
                            onClick={fetchCustomers}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Customer List */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-600">Loading customers...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            No customers found. {searchTerm && 'Try adjusting your search criteria.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Segment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <span className="text-purple-600 font-semibold">
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                                        <div className="text-xs text-gray-500">{customer.customer_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{customer.phone || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{customer.email || 'No email'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSegmentColor(customer.segment)}`}>
                                                    {customer.segment.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {customer.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(customer.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={`/admin/customers/${customer.id}`}
                                                    className="text-purple-600 hover:text-purple-900 font-medium"
                                                >
                                                    View Profile →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
