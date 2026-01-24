import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// PATCH /api/exceptions/[id] - Update exception status/resolution
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const exceptionId = parseInt(id);

        if (isNaN(exceptionId)) {
            return NextResponse.json(
                { error: 'Invalid exception ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status, resolution_notes } = body;

        // Validate status
        const validStatuses = ['open', 'in_progress', 'resolved', 'escalated'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Verify exception exists
        const [exceptions] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM order_exceptions WHERE id = ?',
            [exceptionId]
        );

        if (exceptions.length === 0) {
            return NextResponse.json(
                { error: 'Exception not found' },
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
                values.push(1); // TODO: Get actual user ID from session
            }
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

        values.push(exceptionId);

        await pool.query(
            `UPDATE order_exceptions SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Fetch updated exception
        const [updated] = await pool.query<RowDataPacket[]>(
            `SELECT oe.*, 
        u1.name as reported_by_name,
        u2.name as resolved_by_name
      FROM order_exceptions oe
      LEFT JOIN users u1 ON oe.reported_by = u1.id
      LEFT JOIN users u2 ON oe.resolved_by = u2.id
      WHERE oe.id = ?`,
            [exceptionId]
        );

        return NextResponse.json({
            message: 'Exception updated successfully',
            exception: updated[0]
        });
    } catch (error) {
        console.error('Error updating exception:', error);
        return NextResponse.json(
            { error: 'Failed to update exception' },
            { status: 500 }
        );
    }
}
