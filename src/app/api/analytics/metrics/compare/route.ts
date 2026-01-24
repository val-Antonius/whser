// ============================================================================
// METRICS COMPARISON API ROUTE
// ============================================================================
// Purpose: Compare metrics between two snapshots
// Phase: 3.2 - Analytical Metric Engine
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { ApiResponse } from '@/types';

interface MetricRow extends RowDataPacket {
    metric_name: string;
    metric_value: number;
    baseline_value: number | null;
    variance: number | null;
    variance_percentage: number | null;
    significance_level: 'normal' | 'attention' | 'critical';
    metadata: string | null;
}

interface ComparisonResult {
    metric_name: string;
    snapshot1: {
        value: number;
        metadata: unknown;
    };
    snapshot2: {
        value: number;
        metadata: unknown;
    };
    difference: number;
    difference_percentage: number;
    trend: 'improving' | 'declining' | 'stable';
}

/**
 * GET /api/analytics/metrics/compare
 * Compare metrics between two snapshots
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const snapshot1Id = searchParams.get('snapshot1');
        const snapshot2Id = searchParams.get('snapshot2');

        if (!snapshot1Id || !snapshot2Id) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing snapshot1 or snapshot2 parameter'
                },
                { status: 400 }
            );
        }

        // Fetch metrics for both snapshots
        const [metrics1, metrics2] = await Promise.all([
            query<MetricRow>(
                `SELECT metric_name, metric_value, baseline_value, variance, variance_percentage, significance_level, metadata
                 FROM analytical_metrics 
                 WHERE snapshot_id = ?`,
                [parseInt(snapshot1Id)]
            ),
            query<MetricRow>(
                `SELECT metric_name, metric_value, baseline_value, variance, variance_percentage, significance_level, metadata
                 FROM analytical_metrics 
                 WHERE snapshot_id = ?`,
                [parseInt(snapshot2Id)]
            )
        ]);

        // Create comparison map
        const metricsMap1 = new Map(metrics1.map(m => [m.metric_name, m]));
        const metricsMap2 = new Map(metrics2.map(m => [m.metric_name, m]));

        // Get all unique metric names
        const allMetricNames = new Set([...metricsMap1.keys(), ...metricsMap2.keys()]);

        const comparisons: ComparisonResult[] = [];

        for (const metricName of allMetricNames) {
            const metric1 = metricsMap1.get(metricName);
            const metric2 = metricsMap2.get(metricName);

            if (metric1 && metric2) {
                const difference = metric2.metric_value - metric1.metric_value;
                const differencePercentage = metric1.metric_value !== 0
                    ? (difference / metric1.metric_value) * 100
                    : 0;

                // Determine trend based on metric type
                let trend: 'improving' | 'declining' | 'stable' = 'stable';

                // For most metrics, higher is better
                const higherIsBetter = [
                    'sla_compliance_rate',
                    'productivity_orders_per_day',
                    'contribution_margin',
                    'capacity_utilization'
                ].includes(metricName);

                // For these metrics, lower is better
                const lowerIsBetter = [
                    'rewash_rate',
                    'exception_frequency',
                    'order_aging_critical_pct',
                    'inventory_variance_avg'
                ].includes(metricName);

                if (Math.abs(differencePercentage) > 2) { // 2% threshold for stability
                    if (higherIsBetter) {
                        trend = difference > 0 ? 'improving' : 'declining';
                    } else if (lowerIsBetter) {
                        trend = difference < 0 ? 'improving' : 'declining';
                    }
                }

                comparisons.push({
                    metric_name: metricName,
                    snapshot1: {
                        value: metric1.metric_value,
                        metadata: metric1.metadata ? JSON.parse(metric1.metadata) : null
                    },
                    snapshot2: {
                        value: metric2.metric_value,
                        metadata: metric2.metadata ? JSON.parse(metric2.metadata) : null
                    },
                    difference,
                    difference_percentage: differencePercentage,
                    trend
                });
            }
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                snapshot1_id: parseInt(snapshot1Id),
                snapshot2_id: parseInt(snapshot2Id),
                comparisons
            }
        });
    } catch (error) {
        console.error('Error comparing metrics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to compare metrics';
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}
