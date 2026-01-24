import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

        // Calculate SLA compliance
        const results = await query(
            `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN sla_breach = 0 THEN 1 ELSE 0 END) as on_time_orders,
        SUM(CASE WHEN sla_breach = 1 THEN 1 ELSE 0 END) as breached_orders,
        s.service_name,
        s.id as service_id
       FROM orders o
       JOIN services s ON o.service_id = s.id
       WHERE o.created_at BETWEEN ? AND ?
         AND o.current_status IN ('completed', 'closed')
       GROUP BY s.id, s.service_name`,
            [startDate, endDate]
        );

        // Calculate overall metrics
        const totalOrders = results.reduce((sum: number, r: any) => sum + r.total_orders, 0);
        const onTimeOrders = results.reduce((sum: number, r: any) => sum + r.on_time_orders, 0);
        const complianceRate = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0;

        // Calculate per-service breakdown
        const byService = results.map((r: any) => ({
            service_name: r.service_name,
            service_id: r.service_id,
            total: r.total_orders,
            on_time: r.on_time_orders,
            breached: r.breached_orders,
            compliance_rate: r.total_orders > 0 ? (r.on_time_orders / r.total_orders) * 100 : 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                overall: {
                    compliance_rate: Math.round(complianceRate * 10) / 10,
                    total_orders: totalOrders,
                    on_time_orders: onTimeOrders,
                    breached_orders: totalOrders - onTimeOrders
                },
                by_service: byService,
                period: { start_date: startDate, end_date: endDate }
            }
        });

    } catch (error) {
        console.error('Error calculating SLA compliance:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate SLA compliance' },
            { status: 500 }
        );
    }
}
