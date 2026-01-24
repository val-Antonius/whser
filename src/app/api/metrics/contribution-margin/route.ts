import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

        // Calculate revenue and inventory costs per service
        const results = await query(
            `SELECT 
        s.id as service_id,
        s.service_name,
        SUM(o.final_price) as total_revenue,
        COUNT(o.id) as order_count,
        COALESCE(SUM(ic.total_cost), 0) as total_inventory_cost
       FROM orders o
       JOIN services s ON o.service_id = s.id
       LEFT JOIN (
         SELECT 
           oic.order_id,
           SUM(oic.actual_quantity * it.cost_per_unit) as total_cost
         FROM order_inventory_consumption oic
         JOIN inventory_transactions it ON oic.inventory_item_id = it.inventory_item_id
         WHERE it.transaction_type = 'consumption'
         GROUP BY oic.order_id
       ) ic ON o.id = ic.order_id
       WHERE o.created_at BETWEEN ? AND ?
         AND o.current_status IN ('completed', 'closed')
         AND o.payment_status = 'paid'
       GROUP BY s.id, s.service_name`,
            [startDate, endDate]
        );

        // Calculate contribution margin for each service
        const byService = results.map((r: any) => {
            const revenue = r.total_revenue || 0;
            const inventoryCost = r.total_inventory_cost || 0;
            const contributionMargin = revenue - inventoryCost;
            const marginPercentage = revenue > 0 ? (contributionMargin / revenue) * 100 : 0;

            return {
                service_id: r.service_id,
                service_name: r.service_name,
                order_count: r.order_count,
                total_revenue: Math.round(revenue),
                total_inventory_cost: Math.round(inventoryCost),
                contribution_margin: Math.round(contributionMargin),
                margin_percentage: Math.round(marginPercentage * 10) / 10
            };
        });

        // Calculate overall totals
        const totalRevenue = byService.reduce((sum, s) => sum + s.total_revenue, 0);
        const totalCost = byService.reduce((sum, s) => sum + s.total_inventory_cost, 0);
        const overallMargin = totalRevenue - totalCost;
        const overallPercentage = totalRevenue > 0 ? (overallMargin / totalRevenue) * 100 : 0;

        return NextResponse.json({
            success: true,
            data: {
                overall: {
                    total_revenue: totalRevenue,
                    total_inventory_cost: totalCost,
                    contribution_margin: overallMargin,
                    margin_percentage: Math.round(overallPercentage * 10) / 10
                },
                by_service: byService,
                period: { start_date: startDate, end_date: endDate }
            }
        });

    } catch (error) {
        console.error('Error calculating contribution margin:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate contribution margin' },
            { status: 500 }
        );
    }
}
