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
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, ShoppingCart, CreditCard } from "lucide-react";

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
        depositAmount: '',
        paymentMethod: PaymentMethod.CASH,
        referenceNumber: '',
    });

    const [estimatedPrice, setEstimatedPrice] = useState(0);
    const [minimumChargeApplied, setMinimumChargeApplied] = useState(false);
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
        let basePrice = 0;
        if (orderDetails.unitType === UnitType.KG && orderDetails.estimatedWeight) {
            const weight = parseFloat(orderDetails.estimatedWeight);
            basePrice = weight * selectedService.base_price;
            price = basePrice;
        } else if (orderDetails.unitType === UnitType.PIECE && orderDetails.quantity) {
            const qty = parseInt(orderDetails.quantity);
            basePrice = qty * selectedService.base_price;
            price = basePrice;
        }

        // Apply minimum charge
        let minChargeApplied = false;
        if (selectedService.minimum_charge && price < selectedService.minimum_charge) {
            price = selectedService.minimum_charge;
            minChargeApplied = true;
        }

        setEstimatedPrice(price);
        setMinimumChargeApplied(minChargeApplied);
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
                alert(`Pesanan berhasil dibuat!\nNomor Pesanan: ${data.data.order_number}`);
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
            depositAmount: '',
            paymentMethod: PaymentMethod.CASH,
            referenceNumber: '',
        });
        setEstimatedPrice(0);
        setError('');
    };

    return (
        <div>
            <PageHeader
                title="Kasir Point of Sale"
                description="Buat pesanan baru dan proses transaksi"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin/dashboard/operations' },
                    { label: 'Kasir (POS)' }
                ]}
            />

            <div className="max-w-6xl mx-auto">
                {/* Progress Steps */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center ${currentStep === 'customer' ? 'text-primary' : selectedCustomer ? 'text-green-600' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentStep === 'customer' ? 'bg-primary text-primary-foreground border-primary' : selectedCustomer ? 'bg-green-600 text-white border-green-600' : 'bg-muted text-muted-foreground'}`}>
                                    <Search className="w-4 h-4" />
                                </div>
                                <span className="ml-2 font-medium hidden sm:inline">Pelanggan</span>
                            </div>
                            <div className="flex-1 h-1 mx-4 bg-secondary">
                                <div className={`h-full ${selectedCustomer ? 'bg-green-600' : 'bg-secondary'}`} style={{ width: selectedCustomer ? '100%' : '0%' }} />
                            </div>
                            <div className={`flex items-center ${currentStep === 'order' ? 'text-primary' : selectedService ? 'text-green-600' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentStep === 'order' ? 'bg-primary text-primary-foreground border-primary' : selectedService ? 'bg-green-600 text-white border-green-600' : 'bg-muted text-muted-foreground'}`}>
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                                <span className="ml-2 font-medium hidden sm:inline">Detail</span>
                            </div>
                            <div className="flex-1 h-1 mx-4 bg-secondary">
                                <div className={`h-full ${selectedService ? 'bg-green-600' : 'bg-secondary'}`} style={{ width: selectedService ? '100%' : '0%' }} />
                            </div>
                            <div className={`flex items-center ${currentStep === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentStep === 'payment' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <span className="ml-2 font-medium hidden sm:inline">Pembayaran</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Message */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6">
                        <p>{error}</p>
                    </div>
                )}

                {/* Step 1: Customer Selection */}
                {currentStep === 'customer' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pilih Pesanan atau Buat Baru</CardTitle>
                            <CardDescription>Cari pelanggan yang sudah ada atau daftarkan pelanggan baru</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!showNewCustomerForm ? (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Cari nama, telepon, atau ID pelanggan..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>

                                        {customers.length > 0 && (
                                            <div className="border rounded-md divide-y">
                                                {customers.map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        onClick={() => {
                                                            setSelectedCustomer(customer);
                                                            setCurrentStep('order');
                                                        }}
                                                        className="p-4 hover:bg-accent/50 cursor-pointer flex justify-between items-center transition-colors"
                                                    >
                                                        <div>
                                                            <div className="font-medium">{customer.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {customer.customer_number} • {customer.phone || '-'}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline">{customer.segment}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">Atau</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed py-6"
                                        onClick={() => setShowNewCustomerForm(true)}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Buat Pelanggan Baru
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
                                            <Input
                                                value={newCustomer.name}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Telepon</Label>
                                                <Input
                                                    type="tel"
                                                    value={newCustomer.phone}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Email</Label>
                                                <Input
                                                    type="email"
                                                    value={newCustomer.email}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Alamat</Label>
                                            <Textarea
                                                value={newCustomer.address}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Segmen Pelanggan</Label>
                                            <Select
                                                value={newCustomer.segment}
                                                onValueChange={(val) => setNewCustomer({ ...newCustomer, segment: val as CustomerSegment })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={CustomerSegment.REGULAR}>Regular</SelectItem>
                                                    <SelectItem value={CustomerSegment.VIP}>VIP</SelectItem>
                                                    <SelectItem value={CustomerSegment.CORPORATE}>Corporate</SelectItem>
                                                    <SelectItem value={CustomerSegment.DORMITORY}>Dormitory</SelectItem>
                                                    <SelectItem value={CustomerSegment.HOTEL}>Hotel</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Catatan</Label>
                                            <Textarea
                                                value={newCustomer.notes}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setShowNewCustomerForm(false)}>
                                            Batal
                                        </Button>
                                        <Button onClick={createCustomer} disabled={isLoading} className="flex-1">
                                            {isLoading ? 'Menyimpan...' : 'Simpan Pelanggan'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Order Details */}
                {currentStep === 'order' && selectedCustomer && (
                    <div className="grid gap-6">
                        {/* Customer Info Card */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-foreground">{selectedCustomer.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedCustomer.customer_number} • {selectedCustomer.phone || '-'}
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setSelectedCustomer(null);
                                    setCurrentStep('customer');
                                }}>
                                    Ganti
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Pesanan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Layanan <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={selectedService?.id?.toString() || ''}
                                        onValueChange={(val) => {
                                            const service = services.find(s => s.id === parseInt(val));
                                            setSelectedService(service || null);
                                            setOrderDetails({ ...orderDetails, unitType: service?.unit_type || UnitType.KG });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Layanan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.id.toString()}>
                                                    {service.service_name} — Rp {service.base_price.toLocaleString('id-ID')}/{service.unit_type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedService && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label>
                                                {orderDetails.unitType === UnitType.KG ? 'Estimasi Berat (kg)' : 'Jumlah (pcs)'} <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                step={orderDetails.unitType === UnitType.KG ? "0.1" : "1"}
                                                min="0"
                                                value={orderDetails.unitType === UnitType.KG ? orderDetails.estimatedWeight : orderDetails.quantity}
                                                onChange={(e) => setOrderDetails(orderDetails.unitType === UnitType.KG
                                                    ? { ...orderDetails, estimatedWeight: e.target.value }
                                                    : { ...orderDetails, quantity: e.target.value }
                                                )}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Prioritas</Label>
                                            <Select
                                                value={orderDetails.priority}
                                                onValueChange={(val) => setOrderDetails({ ...orderDetails, priority: val as OrderPriority })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={OrderPriority.REGULAR}>Reguler</SelectItem>
                                                    <SelectItem value={OrderPriority.EXPRESS}>Ekspress</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Catatan Khusus</Label>
                                            <Textarea
                                                placeholder="Contoh: Jangan disetrika terlalu panas, noda di kerah..."
                                                value={orderDetails.specialInstructions}
                                                onChange={(e) => setOrderDetails({ ...orderDetails, specialInstructions: e.target.value })}
                                            />
                                        </div>

                                        <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                                            <span className="font-medium">Estimasi Harga</span>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-primary">
                                                    Rp {estimatedPrice.toLocaleString('id-ID')}
                                                </div>
                                                {minimumChargeApplied && (
                                                    <div className="text-xs text-muted-foreground">* Minimum charge applied</div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setCurrentStep('customer')}>
                                        Kembali
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => setCurrentStep('payment')}
                                        disabled={!selectedService || (!orderDetails.estimatedWeight && !orderDetails.quantity)}
                                    >
                                        Lanjut Pembayaran
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 'payment' && selectedCustomer && selectedService && (
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan Pesanan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pelanggan</span>
                                        <span className="font-medium">{selectedCustomer.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Layanan</span>
                                        <span className="font-medium">{selectedService.service_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {orderDetails.unitType === UnitType.KG ? 'Berat' : 'Jumlah'}
                                        </span>
                                        <span className="font-medium">
                                            {orderDetails.unitType === UnitType.KG
                                                ? `${orderDetails.estimatedWeight} kg`
                                                : `${orderDetails.quantity} pcs`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Prioritas</span>
                                        <Badge variant="outline" className="capitalize">{orderDetails.priority}</Badge>
                                    </div>
                                    <div className="border-t pt-4 mt-2 flex justify-between items-center">
                                        <span className="font-semibold text-lg">Total</span>
                                        <span className="text-xl font-bold text-primary">
                                            Rp {estimatedPrice.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Pembayaran</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Status Pembayaran</Label>
                                    <Select
                                        value={paymentDetails.paymentStatus}
                                        onValueChange={(val) => setPaymentDetails({ ...paymentDetails, paymentStatus: val as PaymentStatus })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={PaymentStatus.UNPAID}>Belum Lunas (Bayar Nanti)</SelectItem>
                                            <SelectItem value={PaymentStatus.PARTIAL}>Bayar Sebagian (DP)</SelectItem>
                                            <SelectItem value={PaymentStatus.PAID}>Lunas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {paymentDetails.paymentStatus !== PaymentStatus.UNPAID && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label>Metode Pembayaran</Label>
                                            <Select
                                                value={paymentDetails.paymentMethod}
                                                onValueChange={(val) => setPaymentDetails({ ...paymentDetails, paymentMethod: val as PaymentMethod })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={PaymentMethod.CASH}>Tunai (Cash)</SelectItem>
                                                    <SelectItem value={PaymentMethod.TRANSFER}>Transfer Bank</SelectItem>
                                                    <SelectItem value={PaymentMethod.CARD}>Kartu Debit/Kredit</SelectItem>
                                                    <SelectItem value={PaymentMethod.OTHER}>Lainnya (QRIS/E-Wallet)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Jumlah Bayar <span className="text-destructive">*</span></Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-muted-foreground">Rp</span>
                                                <Input
                                                    type="number"
                                                    className="pl-9"
                                                    value={paymentDetails.paidAmount}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, paidAmount: e.target.value })}
                                                />
                                            </div>
                                            {paymentDetails.paidAmount && parseFloat(paymentDetails.paidAmount) < estimatedPrice && (
                                                <p className="text-sm text-yellow-600">
                                                    Sisa Tagihan: Rp {(estimatedPrice - parseFloat(paymentDetails.paidAmount)).toLocaleString('id-ID')}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setCurrentStep('order')}>
                                        Kembali
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        size="lg"
                                        onClick={createOrder}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Memproses...' : 'Buat Pesanan'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
