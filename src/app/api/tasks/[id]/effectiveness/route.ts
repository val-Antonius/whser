import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// 5.4 Task Effectiveness Tracking
// Calculates the improvement of the metric linked to the task
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Get Task and Insight Info
        // We need to know:
        // - What insight generated this task?
        // - What metrics were involved? (from insight)
        // - When was it resolved?
        const [taskRows] = await pool.query<RowDataPacket[]>(`
            SELECT t.id, t.status, t.completed_at, i.snapshot_id as origin_snapshot_id, i.metrics_involved
            FROM tasks t
            JOIN insights i ON t.insight_id = i.id
            WHERE t.id = ?
        `, [id]);

        if (taskRows.length === 0) {
            return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        const task = taskRows[0];

        if (task.status !== 'resolved') {
            return NextResponse.json({
                success: true,
                data: null,
                message: 'Task is not resolved yet. Effectiveness can only be measured after resolution.'
            });
        }

        // Parse metrics involved
        let metricsInvolved: string[] = [];
        try {
            metricsInvolved = typeof task.metrics_involved === 'string'
                ? JSON.parse(task.metrics_involved)
                : task.metrics_involved;
        } catch (e) {
            console.warn('Failed to parse metrics_involved', e);
        }

        if (!metricsInvolved || metricsInvolved.length === 0) {
            return NextResponse.json({
                success: true,
                data: null,
                message: 'No specific metrics linked to this task.'
            });
        }

        const primaryMetricName = metricsInvolved[0];

        // 2. Get Origin Metric Value
        const [originMetricRows] = await pool.query<RowDataPacket[]>(`
            SELECT metric_value, unit 
            FROM analytical_metrics 
            WHERE snapshot_id = ? AND metric_name = ?
        `, [task.origin_snapshot_id, primaryMetricName]);

        const originValue = originMetricRows.length > 0 ? parseFloat(originMetricRows[0].metric_value) : null;

        // 3. Get Latest Metric Value (Comparison)
        // Ideally, we find a snapshot created AFTER the task completion.
        // If none exists, we use the latest available snapshot that is NOT the origin (if any).
        // Or we just grab the very latest snapshot.
        const [latestSnapshotRows] = await pool.query<RowDataPacket[]>(`
            SELECT id, snapshot_name, period_end 
            FROM data_snapshots 
            WHERE id > ? 
            ORDER BY id DESC 
            LIMIT 1
        `, [task.origin_snapshot_id]);

        let comparisonValue = null;
        let comparisonSnapshotName = '';

        if (latestSnapshotRows.length > 0) {
            const latestSnapshot = latestSnapshotRows[0];
            comparisonSnapshotName = latestSnapshot.snapshot_name;

            const [latestMetricRows] = await pool.query<RowDataPacket[]>(`
                SELECT metric_value 
                FROM analytical_metrics 
                WHERE snapshot_id = ? AND metric_name = ?
            `, [latestSnapshot.id, primaryMetricName]);

            if (latestMetricRows.length > 0) {
                comparisonValue = parseFloat(latestMetricRows[0].metric_value);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                metric_name: primaryMetricName,
                origin_value: originValue,
                origin_snapshot_id: task.origin_snapshot_id,
                comparison_value: comparisonValue,
                comparison_snapshot_name: comparisonSnapshotName || 'No subsequent snapshot',
                improvement: (originValue !== null && comparisonValue !== null)
                    ? (originValue - comparisonValue) // Simple diff, sign interpretation depends on metric goal
                    : null
            }
        });

    } catch (error: any) {
        console.error('Error calculating effectiveness:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
