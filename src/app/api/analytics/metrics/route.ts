// ============================================================================
// METRICS API ROUTE
// ============================================================================
// Purpose: API endpoints for fetching calculated metrics
// Phase: 3.2 - Analytical Metric Engine
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { ApiResponse } from '@/types';

interface MetricRow extends RowDataPacket {
    id: number;
    snapshot_id: number;
    metric_name: string;
    metric_value: number;
    baseline_value: number | null;
    variance: number | null;
    variance_percentage: number | null;
    significance_level: 'normal' | 'attention' | 'critical';
    metadata: string | null;
    created_at: Date;
}

/**
 * GET /api/analytics/metrics
 * Get all metrics for a snapshot
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const snapshotId = searchParams.get('snapshotId');

        if (!snapshotId) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing snapshotId parameter'
                },
                { status: 400 }
            );
        }

        const metrics = await query<MetricRow>(
            `SELECT * FROM analytical_metrics 
             WHERE snapshot_id = ? 
             ORDER BY metric_name`,
            [parseInt(snapshotId)]
        );

        // Parse metadata JSON
        const parsedMetrics = metrics.map(metric => ({
            ...metric,
            metadata: metric.metadata ? JSON.parse(metric.metadata) : null
        }));

        return NextResponse.json<ApiResponse>({
            success: true,
            data: parsedMetrics
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metrics';
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}
