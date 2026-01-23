// ============================================================================
// SERVICES API ROUTES
// ============================================================================
// Purpose: API endpoints for service listing and details
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Service, ApiResponse } from '@/types';

/**
 * GET /api/services
 * Get all active services
 */
export async function GET(request: NextRequest) {
    try {
        const services = await query<Service>(
            'SELECT * FROM services WHERE is_active = TRUE ORDER BY service_name'
        );

        return NextResponse.json<ApiResponse<Service[]>>({
            success: true,
            data: services,
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch services',
            },
            { status: 500 }
        );
    }
}
