// ============================================================================
// TRANSACTION VOID API
// ============================================================================
// Purpose: Void transactions with authorization and audit trail
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { ApiResponse, OrderStatus } from '@/types';
import { validateAuthorizationCode } from '@/lib/authorization';

/**
 * POST /api/orders/[id]/void
 * Void a transaction with reason and authorization
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
            void_reason,
            authorization_code,
            voided_by,
        } = body;

        // Validation
        if (!void_reason || !authorization_code || !voided_by) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing required fields: void_reason, authorization_code, voided_by',
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

        // Check if order is already voided
        if (order.is_voided) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Order is already voided',
                },
                { status: 400 }
            );
        }

        // Check if order is closed (typically can't void closed orders)
        if (order.current_status === OrderStatus.CLOSED) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Cannot void a closed order. Please use cancellation instead.',
                },
                { status: 400 }
            );
        }

        // Process void in transaction
        await transaction(async (conn) => {
            // Insert void record
            await conn.execute(
                `INSERT INTO order_voids 
         (order_id, void_reason, original_amount, authorized_by, authorization_code, voided_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    void_reason,
                    order.estimated_price,
                    'Manager', // In production, this should be the actual user name
                    authorization_code,
                    voided_by,
                ]
            );

            // Mark order as voided
            await conn.execute(
                `UPDATE orders 
         SET is_voided = TRUE,
             voided_at = CURRENT_TIMESTAMP,
             current_status = ?,
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
                    voided_by,
                    `Transaction voided: ${void_reason}`,
                ]
            );
        });

        // Fetch updated order
        const [updatedOrder] = await query<any>(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: updatedOrder,
            message: 'Transaction voided successfully',
        });
    } catch (error) {
        console.error('Error voiding transaction:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to void transaction',
            },
            { status: 500 }
        );
    }
}
