import { query } from '@/lib/db';

export class DashboardService {
    static async getStats(period: 'today' | 'week' | 'month' = 'today') {
        const dateFilter = this.getDateFilter(period);

        // 1. Order Counts
        const [orderCounts]: any = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN current_status IN ('received', 'waiting_for_process', 'in_wash', 'in_dry', 'in_iron', 'in_fold', 'ready_for_qc') THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN current_status IN ('completed', 'ready_for_pickup') THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN current_status IN ('closed', 'cancelled') THEN 1 ELSE 0 END) as closed
            FROM orders
            WHERE created_at >= ?
        `, [dateFilter]);

        // 2. Revenue (based on created_at or completed_at? Usually created_at for 'sales' report, but 'paid' for cashflow. Let's use created_at for "Sales")
        const [revenue]: any = await query(`
            SELECT 
                SUM(estimated_price) as total_sales,
                SUM(balance_due) as pending_payment
            FROM orders
            WHERE created_at >= ? AND current_status != 'cancelled'
        `, [dateFilter]);

        // 3. Service Breakdown
        const serviceBreakdown = await query(`
            SELECT 
                s.service_name,
                COUNT(o.id) as order_count,
                SUM(o.estimated_price) as revenue
            FROM orders o
            JOIN services s ON o.service_id = s.id
            WHERE o.created_at >= ? AND o.current_status != 'cancelled'
            GROUP BY s.service_name
            ORDER BY revenue DESC
            LIMIT 5
        `, [dateFilter]);

        // 4. Status Distribution
        const statusDistribution = await query(`
            SELECT 
                current_status,
                COUNT(*) as count
            FROM orders
            WHERE created_at >= ?
            GROUP BY current_status
            ORDER BY count DESC
        `, [dateFilter]);

        return {
            period,
            orders: {
                total: parseInt(orderCounts?.total || 0),
                active: parseInt(orderCounts?.active || 0),
                completed: parseInt(orderCounts?.completed || 0),
                closed: parseInt(orderCounts?.closed || 0),
            },
            revenue: {
                total: parseFloat(revenue?.total_sales || 0),
                pending: parseFloat(revenue?.pending_payment || 0),
            },
            serviceBreakdown: serviceBreakdown.map((s: any) => ({
                service_name: s.service_name,
                order_count: parseInt(s.order_count),
                revenue: parseFloat(s.revenue)
            })),
            statusDistribution: statusDistribution.map((s: any) => ({
                current_status: s.current_status,
                count: parseInt(s.count)
            }))
        };
    }

    private static getDateFilter(period: string): Date {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        switch (period) {
            case 'week':
                // Set to previous Monday (or 7 days ago, let's do 7 days ago for simplicity)
                date.setDate(date.getDate() - 7);
                break;
            case 'month':
                date.setDate(1); // First day of current month
                break;
            default: // today
                // Date is already start of today
                break;
        }
        return date;
    }
}
