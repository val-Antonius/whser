// ============================================================================
// INSIGHT BY ID API ROUTE
// ============================================================================
// Purpose: Handle GET, PUT, DELETE for specific insight
// Phase: 3.4 - Manual Insight Creation
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
    getInsightById,
    updateInsight,
    deleteInsight,
    UpdateInsightInput
} from '@/services/InsightService';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * GET /api/analytics/insights/[id]
 * Get insight by ID
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const insightId = parseInt(id);

        if (isNaN(insightId)) {
            return NextResponse.json(
                { success: false, error: 'ID tidak valid' },
                { status: 400 }
            );
        }

        const result = await getInsightById(insightId);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Error in GET /api/analytics/insights/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal mengambil wawasan' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/analytics/insights/[id]
 * Update insight
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const insightId = parseInt(id);

        if (isNaN(insightId)) {
            return NextResponse.json(
                { success: false, error: 'ID tidak valid' },
                { status: 400 }
            );
        }

        const body = await request.json();

        const input: UpdateInsightInput = {
            statement: body.statement,
            severity: body.severity,
            metrics_involved: body.metrics_involved,
            is_actionable: body.is_actionable
        };

        const result = await updateInsight(insightId, input);

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
        console.error('Error in PUT /api/analytics/insights/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal memperbarui wawasan' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/analytics/insights/[id]
 * Delete insight
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const insightId = parseInt(id);

        if (isNaN(insightId)) {
            return NextResponse.json(
                { success: false, error: 'ID tidak valid' },
                { status: 400 }
            );
        }

        const result = await deleteInsight(insightId);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true
        });
    } catch (error) {
        console.error('Error in DELETE /api/analytics/insights/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Gagal menghapus wawasan' },
            { status: 500 }
        );
    }
}
