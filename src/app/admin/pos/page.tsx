'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Customer,
    Service,
    UnitType,
    OrderPriority,
    PaymentStatus,
    PaymentMethod,
    CustomerSegment
} from '@/types';

export default function POSPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<'customer' | 'order' | 'payment'>('customer');

    // Customer search/create
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        segment: CustomerSegment.REGULAR,
        notes: '',
    });

    // Services
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Order details
    const [orderDetails, setOrderDetails] = useState({
        estimatedWeight: '',
        quantity: '',
        unitType: UnitType.KG,
        priority: OrderPriority.REGULAR,
        specialInstructions: '',
    });

    // Payment
    const [paymentDetails, setPaymentDetails] = useState({
        paymentStatus: PaymentStatus.UNPAID,
        paidAmount: '',
        paymentMethod: PaymentMethod.CASH,
    });

    const [estimatedPrice, setEstimatedPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Load services on mount
    useEffect(() => {
        fetchServices();
    }, []);

    // Search customers when search term changes
    useEffect(() => {
        if (customerSearch.length >= 2) {
            searchCustomers();
        } else {
            setCustomers([]);
        }
    }, [customerSearch]);

    // Calculate price when service or weight/quantity changes
    useEffect(() => {
        if (selectedService) {
            calculatePrice();
        }
    }, [selectedService, orderDetails.estimatedWeight, orderDetails.quantity, orderDetails.unitType]);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/services');
            const data = await response.json();
            if (data.success) {
                setServices(data.data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const searchCustomers = async () => {
        try {
            const response = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
            const data = await response.json();
            if (data.success) {
                setCustomers(data.data);
            }
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    };

    const createCustomer = async () => {
        if (!newCustomer.name) {
            setError('Customer name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newCustomer,
                    created_by: 1, // TODO: Get from session
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSelectedCustomer(data.data);
                setShowNewCustomerForm(false);
                setNewCustomer({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    segment: CustomerSegment.REGULAR,
                    notes: '',
                });
                setCurrentStep('order');
            } else {
                setError(data.error || 'Failed to create customer');
            }
        } catch (error) {
            setError('Failed to create customer');
            console.error('Error creating customer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculatePrice = () => {
        if (!selectedService) return;

        let price = 0;
        if (orderDetails.unitType === UnitType.KG && orderDetails.estimatedWeight) {
            const weight = parseFloat(orderDetails.estimatedWeight);
            price = weight * selectedService.base_price;
        } else if (orderDetails.unitType === UnitType.PIECE && orderDetails.quantity) {
            const qty = parseInt(orderDetails.quantity);
            price = qty * selectedService.base_price;
        }

        // Apply minimum charge
        if (selectedService.minimum_charge && price < selectedService.minimum_charge) {
            price = selectedService.minimum_charge;
        }

        setEstimatedPrice(price);
    };

    const createOrder = async () => {
        if (!selectedCustomer || !selectedService) {
            setError('Please select customer and service');
            return;
        }

        if (orderDetails.unitType === UnitType.KG && !orderDetails.estimatedWeight) {
            setError('Please enter estimated weight');
            return;
        }

        if (orderDetails.unitType === UnitType.PIECE && !orderDetails.quantity) {
            setError('Please enter quantity');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: selectedCustomer.id,
                    service_id: selectedService.id,
                    estimated_weight: orderDetails.unitType === UnitType.KG ? parseFloat(orderDetails.estimatedWeight) : null,
                    quantity: orderDetails.unitType === UnitType.PIECE ? parseInt(orderDetails.quantity) : null,
                    unit_type: orderDetails.unitType,
                    priority: orderDetails.priority,
                    payment_status: paymentDetails.paymentStatus,
                    paid_amount: paymentDetails.paidAmount ? parseFloat(paymentDetails.paidAmount) : 0,
                    payment_method: paymentDetails.paymentStatus !== PaymentStatus.UNPAID ? paymentDetails.paymentMethod : null,
                    special_instructions: orderDetails.specialInstructions || null,
                    created_by: 1, // TODO: Get from session
                }),
            });

            const data = await response.json();
            if (data.success) {
                // Show success and reset form
                alert(`Order created successfully!\nOrder Number: ${data.data.order_number}`);
                resetForm();
            } else {
                setError(data.error || 'Failed to create order');
            }
        } catch (error) {
            setError('Failed to create order');
            console.error('Error creating order:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentStep('customer');
        setSelectedCustomer(null);
        setSelectedService(null);
        setCustomerSearch('');
        setCustomers([]);
        setOrderDetails({
            estimatedWeight: '',
            quantity: '',
            unitType: UnitType.KG,
            priority: OrderPriority.REGULAR,
            specialInstructions: '',
        });
        setPaymentDetails({
            paymentStatus: PaymentStatus.UNPAID,
            paidAmount: '',
            paymentMethod: PaymentMethod.CASH,
        });
        setEstimatedPrice(0);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
                    <p className="text-gray-600 mt-1">Create new orders and process transactions</p>
                </div>

                {/* Progress Steps */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${currentStep === 'customer' ? 'text-blue-600' : selectedCustomer ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'customer' ? 'bg-blue-600 text-white' : selectedCustomer ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                                1
                            </div>
                            <span className="ml-2 font-medium">Customer</span>
                        </div>
                        <div className="flex-1 h-1 mx-4 bg-gray-200">
                            <div className={`h-full ${selectedCustomer ? 'bg-green-600' : 'bg-gray-200'}`} style={{ width: selectedCustomer ? '100%' : '0%' }} />
                        </div>
                        <div className={`flex items-center ${currentStep === 'order' ? 'text-blue-600' : selectedService ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'order' ? 'bg-blue-600 text-white' : selectedService ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="ml-2 font-medium">Order Details</span>
                        </div>
                        <div className="flex-1 h-1 mx-4 bg-gray-200">
                            <div className={`h-full ${selectedService ? 'bg-green-600' : 'bg-gray-200'}`} style={{ width: selectedService ? '100%' : '0%' }} />
                        </div>
                        <div className={`flex items-center ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                3
                            </div>
                            <span className="ml-2 font-medium">Payment</span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Step 1: Customer Selection */}
                {currentStep === 'customer' && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select or Create Customer</h2>

                        {!showNewCustomerForm ? (
                            <>
                                {/* Search */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Customer (Name, Phone, or Customer Number)
                                    </label>
                                    <input
                                        type="text"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        placeholder="Type to search..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Search Results */}
                                {customers.length > 0 && (
                                    <div className="mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                        {customers.map((customer) => (
                                            <button
                                                key={customer.id}
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setCurrentStep('order');
                                                }}
                                                className="w-full text-left p-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                            >
                                                <div className="font-medium text-gray-900">{customer.name}</div>
                                                <div className="text-sm text-gray-600">
                                                    {customer.customer_number} • {customer.phone || 'No phone'} • {customer.segment}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* New Customer Button */}
                                <button
                                    onClick={() => setShowNewCustomerForm(true)}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    + Create New Customer
                                </button>
                            </>
                        ) : (
                            <>
                                {/* New Customer Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={newCustomer.phone}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={newCustomer.email}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                        <textarea
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Segment</label>
                                        <select
                                            value={newCustomer.segment}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, segment: e.target.value as CustomerSegment })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            value={newCustomer.notes}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={createCustomer}
                                            disabled={isLoading}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                        >
                                            {isLoading ? 'Creating...' : 'Create Customer'}
                                        </button>
                                        <button
                                            onClick={() => setShowNewCustomerForm(false)}
                                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 2: Order Details */}
                {currentStep === 'order' && selectedCustomer && (
                    <div className="space-y-6">
                        {/* Customer Info Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-blue-900">{selectedCustomer.name}</h3>
                                    <p className="text-sm text-blue-700">
                                        {selectedCustomer.customer_number} • {selectedCustomer.phone || 'No phone'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedCustomer(null);
                                        setCurrentStep('customer');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Change
                                </button>
                            </div>
                        </div>

                        {/* Order Form */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

                            <div className="space-y-4">
                                {/* Service Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Service <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedService?.id || ''}
                                        onChange={(e) => {
                                            const service = services.find(s => s.id === parseInt(e.target.value));
                                            setSelectedService(service || null);
                                            setOrderDetails({ ...orderDetails, unitType: service?.unit_type || UnitType.KG });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select a service</option>
                                        {services.map((service) => (
                                            <option key={service.id} value={service.id}>
                                                {service.service_name} - Rp {service.base_price.toLocaleString('id-ID')}/{service.unit_type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedService && (
                                    <>
                                        {/* Weight or Quantity */}
                                        {orderDetails.unitType === UnitType.KG ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Estimated Weight (kg) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    value={orderDetails.estimatedWeight}
                                                    onChange={(e) => setOrderDetails({ ...orderDetails, estimatedWeight: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quantity (pieces) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={orderDetails.quantity}
                                                    onChange={(e) => setOrderDetails({ ...orderDetails, quantity: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        )}

                                        {/* Priority */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                            <select
                                                value={orderDetails.priority}
                                                onChange={(e) => setOrderDetails({ ...orderDetails, priority: e.target.value as OrderPriority })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value={OrderPriority.REGULAR}>Regular</option>
                                                <option value={OrderPriority.EXPRESS}>Express</option>
                                            </select>
                                        </div>

                                        {/* Special Instructions */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                                            <textarea
                                                value={orderDetails.specialInstructions}
                                                onChange={(e) => setOrderDetails({ ...orderDetails, specialInstructions: e.target.value })}
                                                rows={3}
                                                placeholder="Any special handling instructions..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* Price Display */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700 font-medium">Estimated Price:</span>
                                                <span className="text-2xl font-bold text-blue-600">
                                                    Rp {estimatedPrice.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            {selectedService.minimum_charge && estimatedPrice === selectedService.minimum_charge && (
                                                <p className="text-sm text-gray-600 mt-2">* Minimum charge applied</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCurrentStep('customer')}
                                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep('payment')}
                                        disabled={!selectedService || (!orderDetails.estimatedWeight && !orderDetails.quantity)}
                                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 'payment' && selectedCustomer && selectedService && (
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Customer:</span>
                                    <span className="font-medium">{selectedCustomer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Service:</span>
                                    <span className="font-medium">{selectedService.service_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        {orderDetails.unitType === UnitType.KG ? 'Weight:' : 'Quantity:'}
                                    </span>
                                    <span className="font-medium">
                                        {orderDetails.unitType === UnitType.KG
                                            ? `${orderDetails.estimatedWeight} kg`
                                            : `${orderDetails.quantity} pcs`}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Priority:</span>
                                    <span className="font-medium capitalize">{orderDetails.priority}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between">
                                    <span className="text-gray-900 font-semibold">Total:</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        Rp {estimatedPrice.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>

                            <div className="space-y-4">
                                {/* Payment Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                                    <select
                                        value={paymentDetails.paymentStatus}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentStatus: e.target.value as PaymentStatus })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value={PaymentStatus.UNPAID}>Unpaid (Pay Later)</option>
                                        <option value={PaymentStatus.PARTIAL}>Partial Payment</option>
                                        <option value={PaymentStatus.PAID}>Paid in Full</option>
                                    </select>
                                </div>

                                {/* Payment Method (if not unpaid) */}
                                {paymentDetails.paymentStatus !== PaymentStatus.UNPAID && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                            <select
                                                value={paymentDetails.paymentMethod}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentMethod: e.target.value as PaymentMethod })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value={PaymentMethod.CASH}>Cash</option>
                                                <option value={PaymentMethod.TRANSFER}>Bank Transfer</option>
                                                <option value={PaymentMethod.CARD}>Card</option>
                                                <option value={PaymentMethod.OTHER}>Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Amount Paid <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={estimatedPrice}
                                                value={paymentDetails.paidAmount}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, paidAmount: e.target.value })}
                                                placeholder="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            {paymentDetails.paidAmount && parseFloat(paymentDetails.paidAmount) < estimatedPrice && (
                                                <p className="text-sm text-yellow-600 mt-1">
                                                    Remaining: Rp {(estimatedPrice - parseFloat(paymentDetails.paidAmount)).toLocaleString('id-ID')}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCurrentStep('order')}
                                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={createOrder}
                                        disabled={isLoading}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
                                    >
                                        {isLoading ? 'Creating Order...' : 'Create Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
