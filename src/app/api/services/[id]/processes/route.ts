// ============================================================================
// SERVICE PROCESSES API
// ============================================================================
// Purpose: API endpoint for fetching service process blueprints
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

/**
 * GET /api/services/[id]/processes
 * Get process blueprint for a service
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const serviceId = parseInt(params.id);

        const processes = await query<any>(
            `SELECT * FROM service_processes 
       WHERE service_id = ? 
       ORDER BY sequence_order`,
            [serviceId]
        );

        return NextResponse.json<ApiResponse<any[]>>({
            success: true,
            data: processes,
        });
    } catch (error) {
        console.error('Error fetching service processes:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch service processes',
            },
            { status: 500 }
        );
    }
}
