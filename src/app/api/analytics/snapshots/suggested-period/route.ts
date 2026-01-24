// ============================================================================
// SUGGESTED PERIODS API ROUTE
// ============================================================================
// Purpose: Get suggested period dates for snapshot creation
// Phase: 3.1 - Data Snapshot System
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSuggestedPeriod } from '@/services/SnapshotService';
import { ApiResponse, PeriodType } from '@/types';

/**
 * GET /api/analytics/snapshots/suggested-period
 * Get suggested period dates based on period type
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const periodType = searchParams.get('periodType') as PeriodType;

        if (!periodType) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing periodType parameter'
                },
                { status: 400 }
            );
        }

        if (!['daily', 'weekly', 'monthly'].includes(periodType)) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Invalid period type. Must be: daily, weekly, or monthly'
                },
                { status: 400 }
            );
        }

        const period = await getSuggestedPeriod(periodType);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: period
        });
    } catch (error: any) {
        console.error('Error getting suggested period:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: error.message || 'Failed to get suggested period'
            },
            { status: 500 }
        );
    }
}
