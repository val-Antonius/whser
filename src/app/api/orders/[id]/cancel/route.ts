// ============================================================================
// ORDER CANCELLATION API
// ============================================================================
// Purpose: Cancel orders with authorization and refund processing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { ApiResponse, OrderStatus } from '@/types';
import { validateAuthorizationCode } from '@/lib/authorization';

/**
 * POST /api/orders/[id]/cancel
 * Cancel an order with authorization
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
            cancellation_reason,
            refund_amount,
            authorization_code,
            cancelled_by,
        } = body;

        // Validation
        if (!cancellation_reason || !authorization_code || !cancelled_by) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing required fields: cancellation_reason, authorization_code, cancelled_by',
                },
                { status: 400 }
            );
        }

        // Validate authorization code
        if (!validateAuthorizationCode(authorization_code)) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Invalid authorization code',
                },
                { status: 401 }
            );
        }

        // Get current order
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

        // Check if order can be cancelled
        if (order.current_status === OrderStatus.CLOSED) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Cannot cancel a closed order',
                },
                { status: 400 }
            );
        }

        if (order.current_status === OrderStatus.CANCELLED) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Order is already cancelled',
                },
                { status: 400 }
            );
        }

        if (order.is_voided) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Cannot cancel a voided order',
                },
                { status: 400 }
            );
        }

        // Process cancellation in transaction
        await transaction(async (conn) => {
            // Insert cancellation record
            await conn.execute(
                `INSERT INTO order_cancellations 
         (order_id, cancellation_reason, refund_amount, authorized_by, authorization_code, cancelled_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    cancellation_reason,
                    refund_amount || 0,
                    'Manager', // In production, this should be the actual user name
                    authorization_code,
                    cancelled_by,
                ]
            );

            // Update order status to CANCELLED
            await conn.execute(
                `UPDATE orders 
         SET current_status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
                [OrderStatus.CANCELLED, orderId]
            );

            // Log status change
            await conn.execute(
                `INSERT INTO order_status_log 
         (order_id, previous_status, new_status, changed_by, notes)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    order.current_status,
                    OrderStatus.CANCELLED,
                    cancelled_by,
                    `Order cancelled: ${cancellation_reason}`,
                ]
            );

            // Process refund if applicable
            if (refund_amount && refund_amount > 0) {
                await conn.execute(
                    `INSERT INTO payment_transactions 
           (order_id, transaction_type, amount, notes, created_by)
           VALUES (?, 'refund', ?, ?, ?)`,
                    [
                        orderId,
                        refund_amount,
                        `Refund for cancelled order: ${cancellation_reason}`,
                        cancelled_by,
                    ]
                );

                // Update paid amount
                const newPaidAmount = parseFloat(order.paid_amount) - refund_amount;
                await conn.execute(
                    `UPDATE orders 
           SET paid_amount = ?,
               balance_due = estimated_price - ?
           WHERE id = ?`,
                    [newPaidAmount, newPaidAmount, orderId]
                );
            }
        });

        // Fetch updated order
        const [updatedOrder] = await query<any>(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: updatedOrder,
            message: 'Order cancelled successfully',
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to cancel order',
            },
            { status: 500 }
        );
    }
}
