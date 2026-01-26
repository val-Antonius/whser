'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';

export default function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${id}`);
                const data = await response.json();
                if (data.success) {
                    setOrder(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch order', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (!isLoading && order) {
            // Auto-print when loaded
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [isLoading, order]);

    if (isLoading) return <div className="p-8 text-center font-mono">Loading receipt...</div>;
    if (!order) return notFound();

    return (
        <div className="font-mono text-sm p-4 max-w-[80mm] mx-auto bg-white text-black leading-tight">
            {/* Controls - Hidden on Print */}
            <div className="print:hidden mb-4 border-b pb-4 flex justify-between items-center">
                <button
                    onClick={() => window.close()}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                >
                    ✕ Close
                </button>
                <button
                    onClick={() => window.print()}
                    className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                >
                    Print Again
                </button>
            </div>

            {/* Header */}
            <div className="text-center mb-6 border-b border-black pb-4">
                <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Whser Laundry</h1>
                <p className="text-xs">Jl. Operational System No. 1</p>
                <p className="text-xs">Jakarta, Indonesia</p>
                <p className="text-xs mb-2">0812-3456-7890</p>
            </div>

            {/* Order Info */}
            <div className="mb-4 space-y-1">
                <div className="flex justify-between">
                    <span className="font-bold">Order #:</span>
                    <span>{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">{order.customer_name}</span>
                </div>
                {order.customer_phone && (
                    <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>{order.customer_phone}</span>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="border-t border-b border-black py-2 mb-4 dashed-border">
                <div className="flex justify-between font-bold mb-1">
                    <span>Service</span>
                    <span>Price</span>
                </div>
                <div className="mb-2">
                    <div className="font-bold">{order.service_name}</div>
                    <div className="flex justify-between pl-2 text-xs">
                        <span>
                            {order.unit_type === 'kg'
                                ? `${order.estimated_weight} kg x ${order.service_price || 'Rate'}`
                                : `${order.quantity} pcs x ${order.service_price || 'Rate'}`}
                        </span>
                        <span>{parseFloat(order.estimated_price).toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {order.is_priority && (
                    <div className="flex justify-between text-xs mt-1">
                        <span>Express Surcharge</span>
                        <span>Included</span>
                    </div>
                )}
            </div>

            {/* Totals */}
            <div className="space-y-1 mb-6">
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rp {parseFloat(order.estimated_price).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Paid</span>
                    <span>Rp {parseFloat(order.paid_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-black pt-1">
                    <span>Balance Due</span>
                    <span className="font-bold">Rp {parseFloat(order.balance_due).toLocaleString('id-ID')}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs space-y-2 border-t border-black pt-4">
                <p>Thank you for trusting us!</p>
                <p className="text-[10px]">
                    Terms: Not responsible for buttons/zippers. Items left over 30 days will be donated.
                </p>
                <div className="mt-4 pt-2">
                    <p className="italic">Powered by Whser</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto; /* Target standard 80mm thermal paper */
                    }
                    body {
                        margin: 0.5cm;
                    }
                    .dashed-border {
                        border-style: dashed;
                    }
                }
            `}</style>
        </div>
    );
}
