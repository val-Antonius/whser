// ============================================================================
// SNAPSHOTS API ROUTE
// ============================================================================
// Purpose: API endpoints for managing data snapshots
// Phase: 3.1 - Data Snapshot System
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
    createSnapshot,
    getAllSnapshots,
    getSnapshotById,
    getSnapshotMetrics,
    toggleSnapshotLock,
    deleteSnapshot,
    getSuggestedPeriod,
    CreateSnapshotInput
} from '@/services/SnapshotService';
import { ApiResponse } from '@/types';

/**
 * GET /api/analytics/snapshots
 * Get all snapshots or a specific snapshot by ID
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const includeMetrics = searchParams.get('includeMetrics') === 'true';

        if (id) {
            // Get specific snapshot
            const snapshot = await getSnapshotById(parseInt(id));

            if (!snapshot) {
                return NextResponse.json<ApiResponse>(
                    {
                        success: false,
                        error: 'Snapshot not found'
                    },
                    { status: 404 }
                );
            }

            let metrics = null;
            if (includeMetrics) {
                metrics = await getSnapshotMetrics(parseInt(id));
            }

            return NextResponse.json<ApiResponse>({
                success: true,
                data: {
                    snapshot,
                    metrics
                }
            });
        }

        // Get all snapshots
        const snapshots = await getAllSnapshots();

        return NextResponse.json<ApiResponse>({
            success: true,
            data: snapshots
        });
    } catch (error) {
        console.error('Error fetching snapshots:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch snapshots'
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/analytics/snapshots
 * Create a new snapshot
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { periodType, periodStart, periodEnd, snapshotName, createdBy } = body;

        // Validation
        if (!periodType || !periodStart || !periodEnd) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing required fields: periodType, periodStart, periodEnd'
                },
                { status: 400 }
            );
        }

        // Validate period type
        if (!['daily', 'weekly', 'monthly'].includes(periodType)) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Invalid period type. Must be: daily, weekly, or monthly'
                },
                { status: 400 }
            );
        }

        const input: CreateSnapshotInput = {
            periodType,
            periodStart,
            periodEnd,
            snapshotName,
            createdBy
        };

        const snapshot = await createSnapshot(input);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: snapshot,
            message: 'Snapshot created successfully'
        });
    } catch (error: unknown) {
        console.error('Error creating snapshot:', error);

        const errorMessage = error instanceof Error ? error.message : 'Failed to create snapshot';

        // Handle specific error messages
        if (errorMessage.includes('already exists')) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: errorMessage
                },
                { status: 409 }
            );
        }

        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/analytics/snapshots
 * Update snapshot (lock/unlock)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, isLocked } = body;

        if (!id || isLocked === undefined) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing required fields: id, isLocked'
                },
                { status: 400 }
            );
        }

        await toggleSnapshotLock(id, isLocked);

        return NextResponse.json<ApiResponse>({
            success: true,
            message: `Snapshot ${isLocked ? 'locked' : 'unlocked'} successfully`
        });
    } catch (error: unknown) {
        console.error('Error updating snapshot:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update snapshot';
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/analytics/snapshots
 * Delete a snapshot (only if unlocked)
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing snapshot ID'
                },
                { status: 400 }
            );
        }

        await deleteSnapshot(parseInt(id));

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Snapshot deleted successfully'
        });
    } catch (error: unknown) {
        console.error('Error deleting snapshot:', error);

        const errorMessage = error instanceof Error ? error.message : 'Failed to delete snapshot';

        if (errorMessage.includes('locked')) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: errorMessage
                },
                { status: 403 }
            );
        }

        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}
