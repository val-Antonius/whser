import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

/**
 * GET /api/reports/aging-v2
 * Get order aging report using optimized SQL View
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const priority = searchParams.get('priority'); // 'true', 'false', or null
        const minAge = parseInt(searchParams.get('min_age') || '0');
        const maxAge = parseInt(searchParams.get('max_age') || '9999');

        let sql = `SELECT * FROM view_order_aging WHERE total_aging_hours >= ? AND total_aging_hours <= ?`;
        const params: any[] = [minAge, maxAge];

        if (status) {
            // Mapping UI status filters to internal status
            if (status === 'active') {
                sql += ` AND current_status NOT IN ('completed', 'cancelled', 'closed', 'ready_for_pickup')`;
            } else {
                sql += ` AND current_status = ?`;
                params.push(status);
            }
        }

        if (priority) {
            sql += ` AND is_priority = ?`;
            params.push(priority === 'true' ? 1 : 0);
        }

        sql += ` ORDER BY total_aging_hours DESC LIMIT 200`;

        const orders = await query<any>(sql, params);

        // Calculate Stats Summary
        const [stats] = await query<any>(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN total_aging_hours > 72 THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN total_aging_hours BETWEEN 48 AND 72 THEN 1 ELSE 0 END) as warning,
                SUM(CASE WHEN is_priority = 1 THEN 1 ELSE 0 END) as priority_count,
                AVG(total_aging_hours) as avg_aging
            FROM view_order_aging
        `);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                orders,
                stats: stats
            }
        });
    } catch (error) {
        console.error('Error fetching aging report v2:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch aging report',
            },
            { status: 500 }
        );
    }
}
