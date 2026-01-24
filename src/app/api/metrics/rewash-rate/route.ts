import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

        // Get rewash events
        const rewashData = await query(
            `SELECT 
        COUNT(*) as total_rewashes,
        SUM(cost_impact) as total_cost_impact,
        process_stage
       FROM rewash_events
       WHERE created_at BETWEEN ? AND ?
       GROUP BY process_stage`,
            [startDate, endDate]
        );

        // Get total completed orders in period
        const orderData = await query(
            `SELECT COUNT(*) as total_orders
       FROM orders
       WHERE created_at BETWEEN ? AND ?
         AND current_status IN ('completed', 'closed')`,
            [startDate, endDate]
        );

        const totalRewashes = rewashData.reduce((sum: number, r: any) => sum + r.total_rewashes, 0);
        const totalCostImpact = rewashData.reduce((sum: number, r: any) => sum + (r.total_cost_impact || 0), 0);
        const totalOrders = orderData[0]?.total_orders || 0;
        const rewashRate = totalOrders > 0 ? (totalRewashes / totalOrders) * 100 : 0;

        // Breakdown by process stage
        const byStage = rewashData.map((r: any) => ({
            process_stage: r.process_stage,
            count: r.total_rewashes,
            cost_impact: r.total_cost_impact || 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                overall: {
                    rewash_rate: Math.round(rewashRate * 10) / 10,
                    total_rewashes: totalRewashes,
                    total_orders: totalOrders,
                    total_cost_impact: Math.round(totalCostImpact)
                },
                by_stage: byStage,
                period: { start_date: startDate, end_date: endDate }
            }
        });

    } catch (error) {
        console.error('Error calculating rewash rate:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate rewash rate' },
            { status: 500 }
        );
    }
}
