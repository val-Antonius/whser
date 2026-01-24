// ============================================================================
// PAYMENT TRANSACTIONS API
// ============================================================================
// Purpose: Manage payment transactions for orders
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { ApiResponse } from '@/types';
import { calculatePaymentStatus } from '@/lib/pricing';

/**
 * GET /api/orders/[id]/payments
 * Get payment transaction history for an order
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderId = parseInt(id);

        // Get payment transactions
        const payments = await query<any>(
            `SELECT 
        pt.*,
        u.name as created_by_name
       FROM payment_transactions pt
       LEFT JOIN users u ON pt.created_by = u.id
       WHERE pt.order_id = ?
       ORDER BY pt.created_at DESC`,
            [orderId]
        );

        return NextResponse.json<ApiResponse<any[]>>({
            success: true,
            data: payments,
        });
    } catch (error) {
        console.error('Error fetching payment transactions:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch payment transactions',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders/[id]/payments
 * Record a payment transaction
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderId = parseInt(id);
        const body = await request.json();
        const {
            transaction_type,
            amount,
            payment_method,
            reference_number,
            notes,
            created_by,
        } = body;

        // Validation
        if (!transaction_type || !amount || !created_by) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing required fields: transaction_type, amount, created_by',
                },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Amount must be greater than 0',
                },
                { status: 400 }
            );
        }

        // Get current order details
        const [order] = await query<any>(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        if (!order) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Order not found',
                },
                { status: 404 }
            );
        }

        // Check if order is voided
        if (order.is_voided) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Cannot record payment for voided order',
                },
                { status: 400 }
            );
        }

        // Process payment in transaction
        const result = await transaction(async (conn) => {
            // Insert payment transaction
            const [paymentResult]: any = await conn.execute(
                `INSERT INTO payment_transactions 
         (order_id, transaction_type, amount, payment_method, reference_number, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    transaction_type,
                    amount,
                    payment_method || null,
                    reference_number || null,
                    notes || null,
                    created_by,
                ]
            );

            // Update order amounts based on transaction type
            let newPaidAmount = parseFloat(order.paid_amount);
            let newDepositAmount = parseFloat(order.deposit_amount);

            if (transaction_type === 'payment') {
                newPaidAmount += amount;
            } else if (transaction_type === 'deposit') {
                newDepositAmount += amount;
                newPaidAmount += amount;
            } else if (transaction_type === 'refund') {
                newPaidAmount -= amount;
            } else if (transaction_type === 'adjustment') {
                newPaidAmount += amount; // Can be negative for adjustments
            }

            // Calculate new balance due
            const totalPrice = parseFloat(order.estimated_price);
            const newBalanceDue = Math.max(0, totalPrice - newPaidAmount);

            // Calculate new payment status
            const newPaymentStatus = calculatePaymentStatus(totalPrice, newPaidAmount);

            // Update order
            await conn.execute(
                `UPDATE orders 
         SET paid_amount = ?, 
             deposit_amount = ?, 
             balance_due = ?,
             payment_status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
                [newPaidAmount, newDepositAmount, newBalanceDue, newPaymentStatus, orderId]
            );

            return paymentResult.insertId;
        });

        // Fetch the created payment transaction
        const [newPayment] = await query<any>(
            `SELECT 
        pt.*,
        u.name as created_by_name
       FROM payment_transactions pt
       LEFT JOIN users u ON pt.created_by = u.id
       WHERE pt.id = ?`,
            [result]
        );

        // Fetch updated order
        const [updatedOrder] = await query<any>(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: {
                payment: newPayment,
                order: updatedOrder,
            },
            message: 'Payment transaction recorded successfully',
        });
    } catch (error) {
        console.error('Error recording payment transaction:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to record payment transaction',
            },
            { status: 500 }
        );
    }
}
