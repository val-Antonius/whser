'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomerSegment } from '@/types';
import CustomerLoyaltyCard from '@/components/customer/CustomerLoyaltyCard';
import ContractList from '@/components/customer/ContractList';
import ComplaintHistory from '@/components/customer/ComplaintHistory';

interface CustomerDetail {
    customer: any;
    orderHistory: any[];
    statistics: {
        totalOrders: number;
        completedOrders: number;
        totalSpent: number;
        pendingPayment: number;
        lastOrderDate: string | null;
    };
}

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        segment: CustomerSegment.REGULAR,
        notes: '',
        preferences: {
            preferred_detergent: '',
            allergies: '',
            special_instructions: '',
        },
    });

    useEffect(() => {
        fetchCustomerDetail();
    }, [id]);

    const fetchCustomerDetail = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/customers/${id}`);
            const data = await response.json();
            if (data.success) {
                setCustomerDetail(data.data);
                // Populate edit form
                const customer = data.data.customer;
                setEditForm({
                    name: customer.name || '',
                    phone: customer.phone || '',
                    email: customer.email || '',
                    address: customer.address || '',
                    segment: customer.segment || CustomerSegment.REGULAR,
                    notes: customer.notes || '',
                    preferences: customer.preferences || {
                        preferred_detergent: '',
                        allergies: '',
                        special_instructions: '',
                    },
                });
            } else {
                setError(data.error || 'Failed to load customer');
            }
        } catch (error) {
            console.error('Error fetching customer detail:', error);
            setError('Failed to load customer');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');

        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();
            if (data.success) {
                setIsEditing(false);
                fetchCustomerDetail(); // Refresh data
            } else {
                setError(data.error || 'Failed to update customer');
            }
        } catch (error) {
            setError('Failed to update customer');
            console.error('Error updating customer:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActiveStatus = async () => {
        if (!customerDetail) return;

        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_active: !customerDetail.customer.is_active,
                }),
            });

            const data = await response.json();
            if (data.success) {
                fetchCustomerDetail(); // Refresh data
            } else {
                setError(data.error || 'Failed to update status');
            }
        } catch (error) {
            setError('Failed to update status');
            console.error('Error updating status:', error);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: 'bg-blue-100 text-blue-800',
            waiting_for_process: 'bg-yellow-100 text-yellow-800',
            in_wash: 'bg-purple-100 text-purple-800',
            in_dry: 'bg-purple-100 text-purple-800',
            in_iron: 'bg-purple-100 text-purple-800',
            in_fold: 'bg-purple-100 text-purple-800',
            ready_for_qc: 'bg-orange-100 text-orange-800',
            completed: 'bg-green-100 text-green-800',
            ready_for_pickup: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'bg-red-100 text-red-800',
            partial: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading customer profile...</div>
            </div>
        );
    }

    if (error && !customerDetail) {
        return (
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-red-800">{error}</p>
                        <Link href="/admin/customers" className="text-red-600 hover:text-red-800 mt-4 inline-block">
                            ← Back to Customers
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!customerDetail) return null;

    const { customer, orderHistory, statistics } = customerDetail;

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/customers" className="text-purple-600 hover:text-purple-800 text-sm font-medium mb-2 inline-block">
                        ← Back to Customers
                    </Link>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-bold text-2xl">
                                    {customer.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
                                <p className="text-gray-600 mt-1">{customer.customer_number}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={toggleActiveStatus}
                                        className={`px-4 py-2 rounded-lg transition-colors ${customer.is_active
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                    >
                                        {customer.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setError('');
                                            // Reset form
                                            fetchCustomerDetail();
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-sm text-gray-600 mb-1">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{statistics.completedOrders}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    Rp {Math.round(statistics.totalSpent).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-sm text-gray-600 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    Rp {Math.round(statistics.pendingPayment).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>

                            {!isEditing ? (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Name:</span>
                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Phone:</span>
                                        <div className="font-medium text-gray-900">{customer.phone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Email:</span>
                                        <div className="font-medium text-gray-900">{customer.email || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Segment:</span>
                                        <div>
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSegmentColor(customer.segment)}`}>
                                                {customer.segment.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600">Address:</span>
                                        <div className="font-medium text-gray-900">{customer.address || 'N/A'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600">Notes:</span>
                                        <div className="font-medium text-gray-900">{customer.notes || 'No notes'}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <div>
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {customer.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Joined:</span>
                                        <div className="font-medium text-gray-900">
                                            {new Date(customer.created_at).toLocaleDateString('id-ID')}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                        <textarea
                                            value={editForm.address}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
                                        <select
                                            value={editForm.segment}
                                            onChange={(e) => setEditForm({ ...editForm, segment: e.target.value as CustomerSegment })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value={CustomerSegment.REGULAR}>Regular</option>
                                            <option value={CustomerSegment.VIP}>VIP</option>
                                            <option value={CustomerSegment.CORPORATE}>Corporate</option>
                                            <option value={CustomerSegment.DORMITORY}>Dormitory</option>
                                            <option value={CustomerSegment.HOTEL}>Hotel</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                        <textarea
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            rows={3}
                                            placeholder="Internal notes about this customer..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* New Loyalty Card Component */}
                        <CustomerLoyaltyCard customerId={customerDetail.customer.id} />
                    </div>

                    {/* Middle & Right Columns: Contracts, History, Disputes */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* New Contracts Component */}
                        <ContractList customerId={customerDetail.customer.id} />

                        {/* PREVIOUSLY: Preferences */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>

                            {!isEditing ? (
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Preferred Detergent:</span>
                                        <div className="font-medium text-gray-900">
                                            {customer.preferences?.preferred_detergent || 'No preference'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Allergies:</span>
                                        <div className="font-medium text-gray-900">
                                            {customer.preferences?.allergies || 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Special Instructions:</span>
                                        <div className="font-medium text-gray-900">
                                            {customer.preferences?.special_instructions || 'None'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Preferred Detergent
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.preferences.preferred_detergent}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                preferences: { ...editForm.preferences, preferred_detergent: e.target.value }
                                            })}
                                            placeholder="e.g., Hypoallergenic, Fragrance-free"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Allergies
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.preferences.allergies}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                preferences: { ...editForm.preferences, allergies: e.target.value }
                                            })}
                                            placeholder="e.g., Fabric softener, Bleach"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Special Instructions
                                        </label>
                                        <textarea
                                            value={editForm.preferences.special_instructions}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                preferences: { ...editForm.preferences, special_instructions: e.target.value }
                                            })}
                                            rows={2}
                                            placeholder="Any special handling instructions..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* New Contracts Component */}
                        <ContractList customerId={customer.id} />

                        {/* Order History */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Order History ({orderHistory.length})
                            </h2>

                            {orderHistory.length === 0 ? (
                                <p className="text-gray-600 text-sm">No orders yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {orderHistory.map((order) => (
                                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <Link
                                                        href={`/admin/services/${order.id}`}
                                                        className="text-sm font-semibold text-purple-600 hover:text-purple-800"
                                                    >
                                                        {order.order_number}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-1">{order.service_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        Rp {order.estimated_price.toLocaleString('id-ID')}
                                                    </p>
                                                    <span className={`mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded ${getPaymentColor(order.payment_status)}`}>
                                                        {order.payment_status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${getStatusColor(order.current_status)}`}>
                                                    {formatStatus(order.current_status)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* New Complaints Component */}
                        <ComplaintHistory customerId={customer.id} />
                    </div>

                    {/* Right Column - Quick Info */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                            <h3 className="font-semibold text-purple-900 mb-3">Quick Stats</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-purple-700">Customer Since:</span>
                                    <span className="font-medium text-purple-900">
                                        {new Date(customer.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                                {statistics.lastOrderDate && (
                                    <div className="flex justify-between">
                                        <span className="text-purple-700">Last Order:</span>
                                        <span className="font-medium text-purple-900">
                                            {new Date(statistics.lastOrderDate).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-purple-700">Avg Order Value:</span>
                                    <span className="font-medium text-purple-900">
                                        Rp {statistics.totalOrders > 0
                                            ? Math.round(statistics.totalSpent / statistics.totalOrders).toLocaleString('id-ID')
                                            : '0'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link
                                    href={`/admin/pos?customer=${id}`}
                                    className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Create New Order
                                </Link>
                                <Link
                                    href={`/admin/orders?customer_id=${id}`}
                                    className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    View All Orders
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
