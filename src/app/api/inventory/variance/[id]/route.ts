import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// PATCH /api/inventory/variance/[id] - Update variance status
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const varianceId = parseInt(id);

        if (isNaN(varianceId)) {
            return NextResponse.json(
                { error: 'Invalid variance ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status, investigation_notes, resolution_notes } = body;

        // Verify variance exists
        const [variances] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM inventory_variance WHERE id = ?',
            [varianceId]
        );

        if (variances.length === 0) {
            return NextResponse.json(
                { error: 'Variance not found' },
                { status: 404 }
            );
        }

        // Build update query
        const updates: string[] = [];
        const values: any[] = [];

        if (status) {
            updates.push('status = ?');
            values.push(status);

            if (status === 'resolved') {
                updates.push('resolved_at = NOW()');
                updates.push('resolved_by = ?');
                values.push(1); // TODO: Get from session
            }
        }

        if (investigation_notes) {
            updates.push('investigation_notes = ?');
            values.push(investigation_notes);
        }

        if (resolution_notes) {
            updates.push('resolution_notes = ?');
            values.push(resolution_notes);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'No updates provided' },
                { status: 400 }
            );
        }

        values.push(varianceId);

        await pool.query(
            `UPDATE inventory_variance SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({
            message: 'Variance updated successfully'
        });
    } catch (error) {
        console.error('Error updating variance:', error);
        return NextResponse.json(
            { error: 'Failed to update variance' },
            { status: 500 }
        );
    }
}
