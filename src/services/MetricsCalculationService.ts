// ============================================================================
// METRICS CALCULATION SERVICE
// ============================================================================
// Purpose: Calculate analytical metrics from operational data
// Phase: 3.2 - Analytical Metric Engine
// ============================================================================

import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MetricResult {
    metric_name: string;
    metric_value: number;
    baseline_value: number | null;
    variance: number | null;
    variance_percentage: number | null;
    significance_level: 'normal' | 'attention' | 'critical';
    metadata?: Record<string, unknown>;
}

export interface SignificanceThresholds {
    attention: number;  // Percentage variance for attention level
    critical: number;   // Percentage variance for critical level
}

interface OrderStatsRow extends RowDataPacket {
    total_orders: number;
    completed_orders: number;
    on_time_orders: number;
    breached_orders: number;
}

interface AgingBucketRow extends RowDataPacket {
    bucket: string;
    count: number;
}

interface RewashStatsRow extends RowDataPacket {
    total_completed: number;
    rewash_count: number;
}

interface ExceptionStatsRow extends RowDataPacket {
    total_orders: number;
    exception_count: number;
    by_type: string;
    by_severity: string;
}

interface ContributionMarginRow extends RowDataPacket {
    service_name: string;
    total_revenue: number;
    total_cost: number;
}

interface InventoryVarianceRow extends RowDataPacket {
    item_name: string;
    expected_qty: number;
    actual_qty: number;
}

interface ProductivityRow extends RowDataPacket {
    total_orders: number;
    avg_processing_hours: number;
    days_in_period: number;
}

interface CapacityRow extends RowDataPacket {
    active_orders: number;
    total_capacity_estimate: number;
}

// ============================================================================
// BASELINE RETRIEVAL
// ============================================================================

/**
 * Get baseline metric value from previous snapshot of same period type
 */
async function getBaselineMetric(
    metricName: string,
    periodType: string,
    currentPeriodStart: string
): Promise<number | null> {
    interface BaselineRow extends RowDataPacket {
        metric_value: number;
    }

    const rows = await query<BaselineRow[]>(
        `SELECT am.metric_value
         FROM analytical_metrics am
         JOIN data_snapshots ds ON am.snapshot_id = ds.id
         WHERE am.metric_name = ?
           AND ds.period_type = ?
           AND ds.period_start < ?
         ORDER BY ds.period_start DESC
         LIMIT 1`,
        [metricName, periodType, currentPeriodStart]
    );

    return rows && rows.length > 0 ? rows[0].metric_value : null;
}

// ============================================================================
// SIGNIFICANCE DETERMINATION
// ============================================================================

/**
 * Determine significance level based on variance percentage
 */
function determineSignificance(
    variancePercentage: number | null,
    thresholds: SignificanceThresholds
): 'normal' | 'attention' | 'critical' {
    if (variancePercentage === null) return 'normal';

    const absVariance = Math.abs(variancePercentage);

    if (absVariance >= thresholds.critical) return 'critical';
    if (absVariance >= thresholds.attention) return 'attention';
    return 'normal';
}

/**
 * Compare current value with baseline and calculate variance
 */
function compareWithBaseline(
    current: number,
    baseline: number | null,
    thresholds: SignificanceThresholds
): {
    variance: number | null;
    variance_percentage: number | null;
    significance_level: 'normal' | 'attention' | 'critical';
} {
    if (baseline === null || baseline === 0) {
        return {
            variance: null,
            variance_percentage: null,
            significance_level: 'normal'
        };
    }

    const variance = current - baseline;
    const variancePercentage = (variance / baseline) * 100;
    const significance_level = determineSignificance(variancePercentage, thresholds);

    return { variance, variance_percentage: variancePercentage, significance_level };
}

// ============================================================================
// METRIC CALCULATIONS
// ============================================================================

/**
 * 1. SLA Compliance Rate
 * Percentage of orders completed on time
 */
export async function calculateSLACompliance(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    const rows = await query<OrderStatsRow[]>(
        `SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN current_status IN ('completed', 'ready', 'closed') THEN 1 ELSE 0 END) as completed_orders,
            SUM(CASE WHEN sla_breach = 0 AND current_status IN ('completed', 'ready', 'closed') THEN 1 ELSE 0 END) as on_time_orders,
            SUM(CASE WHEN sla_breach = 1 THEN 1 ELSE 0 END) as breached_orders
         FROM orders
         WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
        [periodStart, periodEnd]
    );

    const stats = rows[0] || { total_orders: 0, completed_orders: 0, on_time_orders: 0, breached_orders: 0 };
    const currentValue = stats.completed_orders > 0
        ? (Number(stats.on_time_orders) / Number(stats.completed_orders)) * 100
        : 0;

    const baseline = await getBaselineMetric('sla_compliance_rate', periodType, periodStart) ?? 95.0;
    const comparison = compareWithBaseline(currentValue, baseline, { attention: 5, critical: 10 });

    return {
        metric_name: 'sla_compliance_rate',
        metric_value: currentValue,
        baseline_value: baseline,
        ...comparison,
        metadata: {
            total_orders: Number(stats.total_orders),
            completed_orders: Number(stats.completed_orders),
            on_time: Number(stats.on_time_orders),
            breached: Number(stats.breached_orders)
        }
    };
}

/**
 * 2. Order Aging Distribution
 * Distribution of orders across age buckets
 */
export async function calculateOrderAgingDistribution(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    const rows = await query<AgingBucketRow[]>(
        `SELECT 
            CASE 
                WHEN TIMESTAMPDIFF(HOUR, created_at, NOW()) < 24 THEN '0-24h'
                WHEN TIMESTAMPDIFF(HOUR, created_at, NOW()) < 48 THEN '24-48h'
                WHEN TIMESTAMPDIFF(HOUR, created_at, NOW()) < 72 THEN '48-72h'
                ELSE '>72h'
            END as bucket,
            COUNT(*) as count
         FROM orders
         WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
           AND current_status NOT IN ('completed', 'closed', 'cancelled')
         GROUP BY bucket`,
        [periodStart, periodEnd]
    );

    const buckets: Record<string, number> = {
        '0-24h': 0,
        '24-48h': 0,
        '48-72h': 0,
        '>72h': 0
    };

    rows.forEach(row => {
        buckets[row.bucket] = Number(row.count);
    });

    const totalOrders = Object.values(buckets).reduce((sum, count) => sum + count, 0);
    const criticalAging = buckets['>72h'];
    const currentValue = totalOrders > 0 ? (criticalAging / totalOrders) * 100 : 0;

    const baseline = await getBaselineMetric('order_aging_critical_pct', periodType, periodStart) ?? 5.0;
    const comparison = compareWithBaseline(currentValue, baseline, { attention: 3, critical: 5 });

    return {
        metric_name: 'order_aging_critical_pct',
        metric_value: currentValue,
        baseline_value: baseline,
        ...comparison,
        metadata: {
            buckets,
            total_orders: totalOrders
        }
    };
}

/**
 * 3. Rewash/Reprocess Rate
 * Percentage of orders requiring rewash
 */
export async function calculateRewashRate(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    const rows = await query<RewashStatsRow[]>(
        `SELECT 
            COUNT(DISTINCT o.id) as total_completed,
            COUNT(DISTINCT re.order_id) as rewash_count
         FROM orders o
         LEFT JOIN rewash_events re ON o.id = re.order_id
         WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
           AND o.current_status IN ('completed', 'ready', 'closed')`,
        [periodStart, periodEnd]
    );

    const stats = rows[0] || { total_completed: 0, rewash_count: 0 };
    const currentValue = Number(stats.total_completed) > 0
        ? (Number(stats.rewash_count) / Number(stats.total_completed)) * 100
        : 0;

    const baseline = await getBaselineMetric('rewash_rate', periodType, periodStart) ?? 2.5;
    const comparison = compareWithBaseline(currentValue, baseline, { attention: 1, critical: 2 });

    return {
        metric_name: 'rewash_rate',
        metric_value: currentValue,
        baseline_value: baseline,
        ...comparison,
        metadata: {
            total_completed: Number(stats.total_completed),
            rewash_count: Number(stats.rewash_count)
        }
    };
}

/**
 * 4. Exception Frequency
 * Rate of exceptions per order
 */
export async function calculateExceptionFrequency(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    const rows = await query<ExceptionStatsRow[]>(
        `SELECT 
            COUNT(DISTINCT o.id) as total_orders,
            COUNT(DISTINCT oe.id) as exception_count
         FROM orders o
         LEFT JOIN order_exceptions oe ON o.id = oe.order_id
         WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
        [periodStart, periodEnd]
    );

    const stats = rows[0] || { total_orders: 0, exception_count: 0 };
    const currentValue = Number(stats.total_orders) > 0
        ? (Number(stats.exception_count) / Number(stats.total_orders)) * 100
        : 0;

    const baseline = await getBaselineMetric('exception_frequency', periodType, periodStart) ?? 5.0;
    const comparison = compareWithBaseline(currentValue, baseline, { attention: 2, critical: 5 });

    return {
        metric_name: 'exception_frequency',
        metric_value: currentValue,
        baseline_value: baseline,
        ...comparison,
        metadata: {
            total_orders: Number(stats.total_orders),
            exception_count: Number(stats.exception_count)
        }
    };
}

/**
 * 5. Contribution Margin
 * Profitability percentage (revenue - inventory costs)
 */
export async function calculateContributionMargin(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    const rows = await query<ContributionMarginRow[]>(
        `SELECT 
            s.service_name as service_name,
            COALESCE(SUM(o.final_price), 0) as total_revenue,
            COALESCE(SUM(
                (SELECT SUM(it.quantity * i.unit_cost)
                 FROM inventory_transactions it
                 JOIN inventory_items i ON it.inventory_item_id = i.id
                 WHERE it.order_id = o.id AND it.transaction_type = 'out')
            ), 0) as total_cost
         FROM orders o
         JOIN services s ON o.service_id = s.id
         WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
           AND o.current_status IN ('completed', 'ready', 'closed')
         GROUP BY s.id, s.service_name`,
        [periodStart, periodEnd]
    );

    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.total_revenue), 0);
    const totalCost = rows.reduce((sum, row) => sum + Number(row.total_cost), 0);
    const currentValue = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    const baseline = await getBaselineMetric('contribution_margin', periodType, periodStart) ?? 70.0;
    const comparison = compareWithBaseline(currentValue, baseline, { attention: 5, critical: 10 });

    const byService: Record<string, { revenue: number; cost: number; margin: number }> = {};
    rows.forEach(row => {
        const revenue = Number(row.total_revenue);
        const cost = Number(row.total_cost);
        const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
        byService[row.service_name] = { revenue, cost, margin };
    });

    return {
        metric_name: 'contribution_margin',
        metric_value: currentValue,
        baseline_value: baseline,
        ...comparison,
        metadata: {
            total_revenue: totalRevenue,
            total_cost: totalCost,
            by_service: byService
        }
    };
}

/**
 * 6. Inventory Variance
 * Deviation from expected consumption
 */
export async function calculateInventoryVariance(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    // Phase 7 Integration: Calculate variance from Stock Opnames
    const rows = await query<InventoryVarianceRow[]>(
        `SELECT 
            i.item_name,
            SUM(soi.system_qty) as expected_qty,
            SUM(soi.physical_qty) as actual_qty
         FROM stock_opname_items soi
         JOIN stock_opnames so ON soi.opname_id = so.id
         JOIN inventory_items i ON soi.inventory_item_id = i.id
         WHERE so.status = 'completed'
           AND so.submitted_at >= ? AND so.submitted_at < DATE_ADD(?, INTERVAL 1 DAY)
         GROUP BY i.id, i.item_name`,
        [periodStart, periodEnd]
    );

    const totalSystem = rows.reduce((sum, row) => sum + Number(row.expected_qty), 0);
    const totalPhysical = rows.reduce((sum, row) => sum + Number(row.actual_qty), 0);

    // Variance = Actual - System (Negative means loss)
    const netVariance = totalPhysical - totalSystem;

    // Variance % = (Net / Expected) * 100
    const variancePercentage = totalSystem > 0
        ? (netVariance / totalSystem) * 100
        : 0;

    const baseline = await getBaselineMetric('inventory_variance_avg', periodType, periodStart) ?? 0;

    // For variance, we compare absolute deviation or net loss
    // Here we treat negative variance (loss) as the concern
    const comparison = compareWithBaseline(variancePercentage, baseline, { attention: 2, critical: 5 });

    // Top items with variance
    const by_item: Record<string, { expected: number; actual: number; variance: number }> = {};
    rows.forEach(row => {
        if (row.expected_qty !== row.actual_qty) {
            by_item[row.item_name] = {
                expected: Number(row.expected_qty),
                actual: Number(row.actual_qty),
                variance: Number(row.actual_qty) - Number(row.expected_qty)
            };
        }
    });

    return {
        metric_name: 'inventory_variance_avg',
        metric_value: variancePercentage,
        baseline_value: baseline,
        variance: variancePercentage - baseline,
        variance_percentage: comparison.variance_percentage,
        significance_level: Math.abs(variancePercentage) > 5 ? 'critical' : Math.abs(variancePercentage) > 2 ? 'attention' : 'normal',
        metadata: {
            total_expected: totalSystem,
            total_actual: totalPhysical,
            net_variance: netVariance,
            by_item,
            item_count: rows.length
        }
    };
}

/**
 * 7. Productivity Proxy
 * Orders processed per day
 */
export async function calculateProductivity(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    const rows = await query<ProductivityRow[]>(
        `SELECT 
            COUNT(*) as total_orders,
            COALESCE(AVG(TIMESTAMPDIFF(HOUR, created_at, actual_completion)), 0) as avg_processing_hours,
            DATEDIFF(?, ?) + 1 as days_in_period
         FROM orders
         WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
           AND current_status IN ('completed', 'ready', 'closed')`,
        [periodEnd, periodStart, periodStart, periodEnd]
    );

    const stats = rows[0] || { total_orders: 0, avg_processing_hours: 0, days_in_period: 1 };
    const currentValue = Number(stats.total_orders) / Number(stats.days_in_period);

    const baseline = await getBaselineMetric('productivity_orders_per_day', periodType, periodStart) ?? 20.0;
    const comparison = compareWithBaseline(currentValue, baseline, { attention: 10, critical: 20 });

    return {
        metric_name: 'productivity_orders_per_day',
        metric_value: currentValue,
        baseline_value: baseline,
        ...comparison,
        metadata: {
            total_orders: Number(stats.total_orders),
            days_in_period: Number(stats.days_in_period),
            avg_processing_hours: Number(stats.avg_processing_hours)
        }
    };
}

/**
 * 8. Capacity Utilization Proxy
 * Active orders vs estimated capacity
 */
export async function calculateCapacityUtilization(
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult> {
    const rows = await query<CapacityRow[]>(
        `SELECT 
            COUNT(*) as active_orders,
            (SELECT COUNT(*) * 1.5 FROM orders WHERE created_at >= DATE_SUB(?, INTERVAL 30 DAY)) as total_capacity_estimate
         FROM orders
         WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
           AND current_status NOT IN ('completed', 'closed', 'cancelled')`,
        [periodStart, periodStart, periodEnd]
    );

    const stats = rows[0] || { active_orders: 0, total_capacity_estimate: 100 };
    const currentValue = Number(stats.total_capacity_estimate) > 0
        ? (Number(stats.active_orders) / Number(stats.total_capacity_estimate)) * 100
        : 0;

    const baseline = await getBaselineMetric('capacity_utilization', periodType, periodStart) ?? 75.0;
    const comparison = compareWithBaseline(currentValue, baseline, { attention: 10, critical: 20 });

    return {
        metric_name: 'capacity_utilization',
        metric_value: currentValue,
        baseline_value: baseline,
        ...comparison,
        metadata: {
            active_orders: Number(stats.active_orders),
            estimated_capacity: Number(stats.total_capacity_estimate)
        }
    };
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Calculate all metrics for a given period
 */
export async function calculateAllMetrics(
    snapshotId: number,
    periodStart: string,
    periodEnd: string,
    periodType: string
): Promise<MetricResult[]> {
    const metrics = await Promise.all([
        calculateSLACompliance(periodStart, periodEnd, periodType),
        calculateOrderAgingDistribution(periodStart, periodEnd, periodType),
        calculateRewashRate(periodStart, periodEnd, periodType),
        calculateExceptionFrequency(periodStart, periodEnd, periodType),
        calculateContributionMargin(periodStart, periodEnd, periodType),
        calculateInventoryVariance(periodStart, periodEnd, periodType),
        calculateProductivity(periodStart, periodEnd, periodType),
        calculateCapacityUtilization(periodStart, periodEnd, periodType)
    ]);

    return metrics;
}
