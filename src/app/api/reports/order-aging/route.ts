import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/reports/order-aging - Get order aging report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const minAge = parseInt(searchParams.get('min_age') || '0');
        const maxAge = parseInt(searchParams.get('max_age') || '999999');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = `
      SELECT 
        o.id,
        o.order_number,
        o.current_status as status,
        o.is_priority,
        o.priority_reason,
        o.aging_hours,
        o.stage_aging_hours,
        o.created_at,
        o.estimated_price,
        c.name as customer_name,
        c.phone as customer_phone,
        s.service_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN services s ON o.service_id = s.id
      WHERE o.current_status NOT IN ('COMPLETED', 'CANCELLED')
        AND o.is_voided = FALSE
    `;
        const params: any[] = [];

        if (status) {
            query += ' AND o.current_status = ?';
            params.push(status);
        }

        if (priority === 'true') {
            query += ' AND o.is_priority = TRUE';
        } else if (priority === 'false') {
            query += ' AND o.is_priority = FALSE';
        }

        query += ' AND o.aging_hours >= ? AND o.aging_hours <= ?';
        params.push(minAge, maxAge);

        query += ' ORDER BY o.aging_hours DESC LIMIT ?';
        params.push(limit);

        const [orders] = await pool.query<RowDataPacket[]>(query, params);

        // Calculate statistics
        const stats = {
            total_orders: orders.length,
            priority_orders: orders.filter(o => o.is_priority).length,
            avg_age_hours: orders.length > 0
                ? orders.reduce((sum, o) => sum + parseFloat(o.aging_hours), 0) / orders.length
                : 0,
            critical_aging: orders.filter(o => parseFloat(o.aging_hours) > 72).length,
            high_aging: orders.filter(o => parseFloat(o.aging_hours) > 48 && parseFloat(o.aging_hours) <= 72).length,
            medium_aging: orders.filter(o => parseFloat(o.aging_hours) > 24 && parseFloat(o.aging_hours) <= 48).length,
            fresh: orders.filter(o => parseFloat(o.aging_hours) <= 24).length,
        };

        // Group by status
        const byStatus: Record<string, number> = {};
        orders.forEach(order => {
            byStatus[order.status] = (byStatus[order.status] || 0) + 1;
        });

        return NextResponse.json({
            orders,
            stats,
            by_status: byStatus
        });
    } catch (error) {
        console.error('Error generating aging report:', error);
        return NextResponse.json(
            { error: 'Failed to generate aging report' },
            { status: 500 }
        );
    }
}
