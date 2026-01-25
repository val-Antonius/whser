// ============================================================================
// INSIGHTS API ROUTE
// ============================================================================
// Purpose: Handle CRUD operations for insights
// Phase: 3.4 - Manual Insight Creation
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
    createInsight,
    getAllInsights,
    CreateInsightInput
} from '@/services/InsightService';

/**
 * GET /api/analytics/insights
 * Get all insights with optional filtering
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const snapshotId = searchParams.get('snapshotId');
        const severity = searchParams.get('severity');
        const isActionable = searchParams.get('isActionable');

        const filters: any = {};

        if (snapshotId) {
            filters.snapshotId = parseInt(snapshotId);
        }

        if (severity) {
            filters.severity = severity;
        }

        if (isActionable !== null) {
            filters.isActionable = isActionable === 'true';
        }

        const result = await getAllInsights(filters);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Error in GET /api/analytics/insights:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal mengambil wawasan' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/analytics/insights
 * Create a new insight
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // TODO: Get user ID from session/auth
        const userId = 1; // Placeholder

        const input: CreateInsightInput = {
            snapshot_id: body.snapshot_id,
            statement: body.statement,
            severity: body.severity,
            metrics_involved: body.metrics_involved,
            is_actionable: body.is_actionable || false,
            created_by: userId
        };

        const result = await createInsight(input);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/analytics/insights:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal membuat wawasan' },
            { status: 500 }
        );
    }
}
