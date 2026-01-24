// ============================================================================
// ORDER DETAIL API
// ============================================================================
// Purpose: API endpoint for fetching single order with complete details
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db';
import { ApiResponse } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/orders/[id]
 * Get single order with complete details including status history
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderId = parseInt(id);

        // Get order details
        const [order] = await query<any>(
            `SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        c.segment as customer_segment,
        s.service_name,
        s.service_type,
        s.service_code,
        s.estimated_hours,
        s.express_hours
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       JOIN services s ON o.service_id = s.id
       WHERE o.id = ?`,
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

        // Get status history
        const statusHistory = await query<any>(
            `SELECT 
        osl.*,
        u.name as changed_by_name
       FROM order_status_log osl
       LEFT JOIN users u ON osl.changed_by = u.id
       WHERE osl.order_id = ?
       ORDER BY osl.changed_at DESC`,
            [orderId]
        );

        // Get process jobs if any (simplified query)
        const processJobs = await query<any>(
            `SELECT oj.* 
       FROM order_jobs oj
       WHERE oj.order_id = ?
       ORDER BY oj.id`,
            [orderId]
        );

        // Calculate SLA status
        const now = new Date();
        const estimatedCompletion = new Date(order.estimated_completion);
        const isOverdue = now > estimatedCompletion && !['completed', 'ready_for_pickup', 'closed', 'cancelled'].includes(order.current_status);
        const hoursRemaining = (estimatedCompletion.getTime() - now.getTime()) / (1000 * 60 * 60);

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: {
                ...order,
                statusHistory,
                processJobs,
            },
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch order details',
            },
            { status: 500 }
        );
    }
}

// PATCH /api/orders/[id] - Update order fields (priority, etc.)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: 'Invalid order ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { is_priority, priority_reason } = body;

        // Verify order exists
        const [orders] = await getPool().query<RowDataPacket[]>(
            'SELECT id FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Build update query
        const updates: string[] = [];
        const values: any[] = [];

        if (is_priority !== undefined) {
            updates.push('is_priority = ?');
            values.push(is_priority);
        }

        if (priority_reason !== undefined) {
            updates.push('priority_reason = ?');
            values.push(priority_reason || null);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'No updates provided' },
                { status: 400 }
            );
        }

        values.push(orderId);

        await getPool().query(
            `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({
            message: 'Order updated successfully'
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
