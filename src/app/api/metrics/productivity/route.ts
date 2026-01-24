import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

        // Calculate orders per day
        const ordersPerDay = await query(
            `SELECT 
        DATE(created_at) as order_date,
        COUNT(*) as order_count
       FROM orders
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY order_date DESC`,
            [startDate, endDate]
        );

        // Calculate average processing time (from received to completed)
        const processingTime = await query(
            `SELECT 
        AVG(TIMESTAMPDIFF(HOUR, created_at, actual_completion)) as avg_hours
       FROM orders
       WHERE created_at BETWEEN ? AND ?
         AND actual_completion IS NOT NULL
         AND current_status IN ('completed', 'closed')`,
            [startDate, endDate]
        );

        // Calculate job completion rate (completed jobs vs total jobs)
        const jobStats = await query(
            `SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs
       FROM order_jobs
       WHERE created_at BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        // Calculate orders per staff member (proxy - using created_by)
        const staffProductivity = await query(
            `SELECT 
        created_by,
        COUNT(*) as orders_created
       FROM orders
       WHERE created_at BETWEEN ? AND ?
       GROUP BY created_by`,
            [startDate, endDate]
        );

        const avgOrdersPerDay = ordersPerDay.length > 0
            ? ordersPerDay.reduce((sum: number, d: any) => sum + d.order_count, 0) / ordersPerDay.length
            : 0;

        const avgProcessingHours = processingTime[0]?.avg_hours || 0;
        const totalJobs = jobStats[0]?.total_jobs || 0;
        const completedJobs = jobStats[0]?.completed_jobs || 0;
        const jobCompletionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

        return NextResponse.json({
            success: true,
            data: {
                orders_per_day: Math.round(avgOrdersPerDay * 10) / 10,
                avg_processing_hours: Math.round(avgProcessingHours * 10) / 10,
                job_completion_rate: Math.round(jobCompletionRate * 10) / 10,
                total_jobs: totalJobs,
                completed_jobs: completedJobs,
                staff_count: staffProductivity.length,
                period: { start_date: startDate, end_date: endDate }
            }
        });

    } catch (error) {
        console.error('Error calculating productivity metrics:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate productivity metrics' },
            { status: 500 }
        );
    }
}
