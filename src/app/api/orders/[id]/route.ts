// ============================================================================
// ORDER DETAIL API
// ============================================================================
// Purpose: API endpoint for fetching single order with complete details
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

/**
 * GET /api/orders/[id]
 * Get single order with complete details including status history
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const orderId = parseInt(params.id);

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

        // Get process jobs if any
        const processJobs = await query<any>(
            `SELECT 
        oj.*,
        sp.process_name,
        sp.sequence_order,
        sp.estimated_duration_minutes
       FROM order_jobs oj
       JOIN service_processes sp ON oj.service_process_id = sp.id
       WHERE oj.order_id = ?
       ORDER BY sp.sequence_order`,
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
                order,
                statusHistory,
                processJobs,
                sla: {
                    estimatedCompletion: order.estimated_completion,
                    isOverdue,
                    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
                    status: isOverdue ? 'overdue' : hoursRemaining < 2 ? 'at_risk' : 'on_track',
                },
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
