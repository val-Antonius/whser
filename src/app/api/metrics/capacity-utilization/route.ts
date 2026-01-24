import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

        // Get current active orders (in-process)
        const activeOrders = await query(
            `SELECT COUNT(*) as active_count
       FROM orders
       WHERE current_status IN ('received', 'waiting_for_process', 'in_wash', 'in_dry', 'in_iron', 'in_fold', 'ready_for_qc')`
        );

        // Get active batches
        const activeBatches = await query(
            `SELECT COUNT(*) as batch_count
       FROM processing_batches
       WHERE status IN ('pending', 'in_progress')`
        );

        // Estimate peak capacity based on historical max
        const peakCapacity = await query(
            `SELECT MAX(daily_count) as peak
       FROM (
         SELECT DATE(created_at) as order_date, COUNT(*) as daily_count
         FROM orders
         WHERE created_at BETWEEN DATE_SUB(?, INTERVAL 90 DAY) AND ?
         GROUP BY DATE(created_at)
       ) daily_orders`,
            [endDate, endDate]
        );

        // Calculate average daily orders in current period
        const currentLoad = await query(
            `SELECT COUNT(*) / DATEDIFF(?, ?) as avg_daily
       FROM orders
       WHERE created_at BETWEEN ? AND ?`,
            [endDate, startDate, startDate, endDate]
        );

        const activeCount = activeOrders[0]?.active_count || 0;
        const batchCount = activeBatches[0]?.batch_count || 0;
        const peak = peakCapacity[0]?.peak || 100; // Default to 100 if no history
        const avgDaily = currentLoad[0]?.avg_daily || 0;

        // Utilization based on current active orders vs estimated peak capacity
        const utilizationPercentage = peak > 0 ? (activeCount / peak) * 100 : 0;

        return NextResponse.json({
            success: true,
            data: {
                current_active_orders: activeCount,
                active_batches: batchCount,
                estimated_peak_capacity: peak,
                current_avg_daily: Math.round(avgDaily * 10) / 10,
                utilization_percentage: Math.round(utilizationPercentage * 10) / 10,
                status: utilizationPercentage > 80 ? 'high' : utilizationPercentage > 50 ? 'moderate' : 'low',
                period: { start_date: startDate, end_date: endDate }
            }
        });

    } catch (error) {
        console.error('Error calculating capacity utilization:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate capacity utilization' },
            { status: 500 }
        );
    }
}
