// ============================================================================
// DASHBOARD STATS API
// ============================================================================
// Purpose: API endpoint for fetching aggregated dashboard statistics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import { DashboardService } from '@/lib/services/dashboard-service';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const period = (searchParams.get('period') || 'today') as 'today' | 'week' | 'month';

        const stats = await DashboardService.getStats(period);

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch dashboard stats',
            },
            { status: 500 }
        );
    }
}
