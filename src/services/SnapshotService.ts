// ============================================================================
// SNAPSHOT SERVICE
// ============================================================================
// Purpose: Handle creation and management of data snapshots for analytics
// Phase: 3.1 - Data Snapshot System
// ============================================================================

import { query, transaction, getPool } from '@/lib/db';
import { PeriodType } from '@/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { calculateAllMetrics } from './MetricsCalculationService';

export interface CreateSnapshotInput {
    periodType: PeriodType;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string;   // YYYY-MM-DD
    snapshotName?: string;
    createdBy?: number;
}

export interface Snapshot {
    id: number;
    snapshot_name: string;
    period_type: PeriodType;
    period_start: string;
    period_end: string;
    snapshot_date: Date;
    is_locked: boolean;
    total_orders: number;
    total_revenue: number;
    metadata?: Record<string, unknown>;
    created_by?: number;
    created_at: Date;
}

/**
 * Create a new data snapshot
 * This freezes operational data for a specific period
 */
export async function createSnapshot(input: CreateSnapshotInput): Promise<Snapshot> {
    const { periodType, periodStart, periodEnd, snapshotName, createdBy } = input;

    // Validate dates
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (start >= end) {
        throw new Error('Period start must be before period end');
    }

    // Check if snapshot already exists for this period
    const existing = await query<{ id: number }>(
        `SELECT id FROM data_snapshots 
     WHERE period_type = ? AND period_start = ? AND period_end = ?`,
        [periodType, periodStart, periodEnd]
    );

    if (existing.length > 0) {
        throw new Error('Snapshot already exists for this period');
    }

    // Generate snapshot name if not provided
    const name = snapshotName || `${periodType.toUpperCase()}_${periodStart}_${periodEnd}`;

    return await transaction(async (connection) => {
        // 1. Create snapshot record
        const [snapshotResult] = await connection.query(
            `INSERT INTO data_snapshots 
       (snapshot_name, period_type, period_start, period_end, snapshot_date, is_locked, created_by)
       VALUES (?, ?, ?, ?, NOW(), TRUE, ?)`,
            [name, periodType, periodStart, periodEnd, createdBy || null]
        );

        const snapshotId = (snapshotResult as { insertId: number }).insertId;

        // 2. Calculate and store basic metrics
        interface OrderStatsRow extends RowDataPacket {
            total_orders: number;
            total_revenue: number;
            avg_completion_hours: number;
            sla_breaches: number;
            rewash_count: number;
        }

        const [orderStats] = await connection.query<OrderStatsRow[]>(
            `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(final_price), 0) as total_revenue,
        COALESCE(AVG(TIMESTAMPDIFF(HOUR, created_at, actual_completion)), 0) as avg_completion_hours,
        SUM(CASE WHEN sla_breach = 1 THEN 1 ELSE 0 END) as sla_breaches,
        SUM(CASE WHEN is_rewash = 1 THEN 1 ELSE 0 END) as rewash_count
       FROM orders
       WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND current_status IN ('completed', 'closed')`,
            [periodStart, periodEnd]
        );

        const stats = orderStats[0] || {
            total_orders: 0,
            total_revenue: 0,
            avg_completion_hours: 0,
            sla_breaches: 0,
            rewash_count: 0
        };

        // 3. Update snapshot with calculated totals
        await connection.query(
            `UPDATE data_snapshots 
       SET total_orders = ?, total_revenue = ?, metadata = ?
       WHERE id = ?`,
            [
                stats.total_orders,
                stats.total_revenue,
                JSON.stringify({
                    avg_completion_hours: Number(stats.avg_completion_hours),
                    sla_breaches: Number(stats.sla_breaches),
                    rewash_count: Number(stats.rewash_count)
                }),
                snapshotId
            ]
        );

        // 4. Calculate and store comprehensive analytical metrics
        const calculatedMetrics = await calculateAllMetrics(
            snapshotId,
            periodStart,
            periodEnd,
            periodType
        );

        for (const metric of calculatedMetrics) {
            await connection.query(
                `INSERT INTO analytical_metrics 
         (snapshot_id, metric_name, metric_value, baseline_value, variance, variance_percentage, significance_level, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    snapshotId,
                    metric.metric_name,
                    metric.metric_value,
                    metric.baseline_value,
                    metric.variance,
                    metric.variance_percentage,
                    metric.significance_level,
                    JSON.stringify(metric.metadata || {})
                ]
            );
        }

        // 5. Fetch and return the created snapshot
        interface SnapshotRow extends RowDataPacket, Snapshot { }
        const [snapshot] = await connection.query<SnapshotRow[]>(
            `SELECT * FROM data_snapshots WHERE id = ?`,
            [snapshotId]
        );

        return snapshot[0];
    });
}

/**
 * Get all snapshots
 */
export async function getAllSnapshots(): Promise<Snapshot[]> {
    return await query<Snapshot>(
        `SELECT * FROM data_snapshots ORDER BY period_start DESC, snapshot_date DESC`
    );
}

/**
 * Get snapshot by ID
 */
export async function getSnapshotById(id: number): Promise<Snapshot | null> {
    const results = await query<Snapshot>(
        `SELECT * FROM data_snapshots WHERE id = ?`,
        [id]
    );
    return results.length > 0 ? results[0] : null;
}

/**
 * Get metrics for a snapshot
 */
export interface AnalyticalMetric {
    id: number;
    snapshot_id: number;
    metric_name: string;
    metric_value: number;
    baseline_value: number | null;
    variance: number | null;
    variance_percentage: number | null;
    significance_level: 'normal' | 'attention' | 'critical';
    metadata?: Record<string, unknown>;
    created_at: Date;
}

export async function getSnapshotMetrics(snapshotId: number): Promise<AnalyticalMetric[]> {
    return await query<AnalyticalMetric>(
        `SELECT * FROM analytical_metrics WHERE snapshot_id = ? ORDER BY metric_name`,
        [snapshotId]
    );
}

/**
 * Lock/unlock a snapshot
 */
export async function toggleSnapshotLock(snapshotId: number, isLocked: boolean): Promise<void> {
    await query(
        `UPDATE data_snapshots SET is_locked = ? WHERE id = ?`,
        [isLocked, snapshotId]
    );
}

/**
 * Delete a snapshot (only if unlocked)
 */
export async function deleteSnapshot(snapshotId: number): Promise<void> {
    const snapshot = await getSnapshotById(snapshotId);

    if (!snapshot) {
        throw new Error('Snapshot not found');
    }

    if (snapshot.is_locked) {
        throw new Error('Cannot delete locked snapshot');
    }

    await query(
        `DELETE FROM data_snapshots WHERE id = ?`,
        [snapshotId]
    );
}

/**
 * Get suggested period for next snapshot
 */
export async function getSuggestedPeriod(periodType: PeriodType): Promise<{ start: string; end: string }> {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (periodType) {
        case PeriodType.DAILY:
            // Yesterday
            start = new Date(now);
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
            break;

        case PeriodType.WEEKLY:
            // Last week (Monday to Sunday)
            start = new Date(now);
            start.setDate(start.getDate() - start.getDay() - 7); // Last Monday
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(end.getDate() + 6); // Sunday
            end.setHours(23, 59, 59, 999);
            break;

        case PeriodType.MONTHLY:
            // Last month
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            end.setHours(23, 59, 59, 999);
            break;

        default:
            throw new Error('Invalid period type');
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}
