import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

        // Get complaint counts by week
        const weeklyComplaints = await query(
            `SELECT 
        YEARWEEK(created_at) as week,
        COUNT(*) as complaint_count,
        AVG(CASE 
          WHEN severity = 'Low' THEN 1
          WHEN severity = 'Medium' THEN 2
          WHEN severity = 'High' THEN 3
          WHEN severity = 'Critical' THEN 4
          ELSE 0
        END) as avg_severity_score
       FROM customer_complaints
       WHERE created_at BETWEEN ? AND ?
       GROUP BY YEARWEEK(created_at)
       ORDER BY week DESC`,
            [startDate, endDate]
        );

        // Get total orders in period for rate calculation
        const orderCount = await query(
            `SELECT COUNT(*) as total_orders
       FROM orders
       WHERE created_at BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        // Get complaint breakdown by category and severity
        const breakdown = await query(
            `SELECT 
        category,
        severity,
        COUNT(*) as count
       FROM customer_complaints
       WHERE created_at BETWEEN ? AND ?
       GROUP BY category, severity`,
            [startDate, endDate]
        );

        const totalComplaints = weeklyComplaints.reduce((sum: number, w: any) => sum + w.complaint_count, 0);
        const totalOrders = orderCount[0]?.total_orders || 0;
        const complaintRate = totalOrders > 0 ? (totalComplaints / totalOrders) * 100 : 0;

        // Calculate trend (comparing first half vs second half of period)
        const midpoint = weeklyComplaints.length / 2;
        const firstHalf = weeklyComplaints.slice(Math.ceil(midpoint));
        const secondHalf = weeklyComplaints.slice(0, Math.floor(midpoint));

        const firstHalfAvg = firstHalf.length > 0
            ? firstHalf.reduce((sum: number, w: any) => sum + w.complaint_count, 0) / firstHalf.length
            : 0;
        const secondHalfAvg = secondHalf.length > 0
            ? secondHalf.reduce((sum: number, w: any) => sum + w.complaint_count, 0) / secondHalf.length
            : 0;

        const trendDirection = secondHalfAvg > firstHalfAvg ? 'increasing' : secondHalfAvg < firstHalfAvg ? 'decreasing' : 'stable';
        const trendPercentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

        return NextResponse.json({
            success: true,
            data: {
                overall: {
                    total_complaints: totalComplaints,
                    total_orders: totalOrders,
                    complaint_rate: Math.round(complaintRate * 100) / 100,
                    trend_direction: trendDirection,
                    trend_percentage: Math.round(trendPercentage * 10) / 10
                },
                weekly_data: weeklyComplaints,
                breakdown: breakdown,
                period: { start_date: startDate, end_date: endDate }
            }
        });

    } catch (error) {
        console.error('Error calculating complaint trends:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate complaint trends' },
            { status: 500 }
        );
    }
}
