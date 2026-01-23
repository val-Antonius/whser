// ============================================================================
// DASHBOARD STATS API
// ============================================================================
// Purpose: API endpoint for dashboard statistics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const period = searchParams.get('period') || 'today'; // today, week, month

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'today':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
        }

        // Get order counts
        const [orderStats]: any = await query(
            `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN current_status IN ('received', 'waiting_for_process', 'in_wash', 'in_dry', 'in_iron', 'in_fold', 'ready_for_qc') THEN 1 ELSE 0 END) as active_orders,
        SUM(CASE WHEN current_status = 'completed' OR current_status = 'ready_for_pickup' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN current_status = 'closed' THEN 1 ELSE 0 END) as closed_orders
       FROM orders
       WHERE created_at >= ?`,
            [startDate]
        );

        // Get revenue
        const [revenueStats]: any = await query(
            `SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN paid_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN estimated_price ELSE 0 END), 0) as pending_revenue
       FROM orders
       WHERE created_at >= ?`,
            [startDate]
        );

        // Get service breakdown
        const serviceBreakdown = await query(
            `SELECT 
        s.service_name,
        COUNT(o.id) as order_count,
        SUM(CASE WHEN o.payment_status = 'paid' THEN o.paid_amount ELSE o.estimated_price END) as revenue
       FROM orders o
       JOIN services s ON o.service_id = s.id
       WHERE o.created_at >= ?
       GROUP BY s.id, s.service_name
       ORDER BY order_count DESC`,
            [startDate]
        );

        // Get status distribution
        const statusDistribution = await query(
            `SELECT 
        current_status,
        COUNT(*) as count
       FROM orders
       WHERE created_at >= ?
       GROUP BY current_status`,
            [startDate]
        );

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: {
                period,
                orders: {
                    total: orderStats?.total_orders || 0,
                    active: orderStats?.active_orders || 0,
                    completed: orderStats?.completed_orders || 0,
                    closed: orderStats?.closed_orders || 0,
                },
                revenue: {
                    total: revenueStats?.total_revenue || 0,
                    pending: revenueStats?.pending_revenue || 0,
                },
                serviceBreakdown,
                statusDistribution,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch dashboard statistics',
            },
            { status: 500 }
        );
    }
}
