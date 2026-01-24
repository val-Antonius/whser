import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/batches/[id] - Get batch details
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const batchId = parseInt(id);

        if (isNaN(batchId)) {
            return NextResponse.json(
                { error: 'Invalid batch ID' },
                { status: 400 }
            );
        }

        // Fetch batch details
        const [batches] = await pool.query<RowDataPacket[]>(
            `SELECT pb.*, u.name as created_by_name
      FROM processing_batches pb
      LEFT JOIN users u ON pb.created_by = u.id
      WHERE pb.id = ?`,
            [batchId]
        );

        if (batches.length === 0) {
            return NextResponse.json(
                { error: 'Batch not found' },
                { status: 404 }
            );
        }

        // Fetch orders in batch
        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT 
        o.id, o.order_number, o.status, o.estimated_price,
        c.name as customer_name,
        bo.added_at
      FROM batch_orders bo
      JOIN orders o ON bo.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE bo.batch_id = ?
      ORDER BY bo.added_at ASC`,
            [batchId]
        );

        return NextResponse.json({
            ...batches[0],
            orders
        });
    } catch (error) {
        console.error('Error fetching batch:', error);
        return NextResponse.json(
            { error: 'Failed to fetch batch' },
            { status: 500 }
        );
    }
}

// PATCH /api/batches/[id] - Update batch status
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const batchId = parseInt(id);

        if (isNaN(batchId)) {
            return NextResponse.json(
                { error: 'Invalid batch ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status } = body;

        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Build update query based on status
        let updateQuery = 'UPDATE processing_batches SET status = ?';
        const params: any[] = [status];

        if (status === 'in_progress') {
            updateQuery += ', started_at = NOW()';
        } else if (status === 'completed') {
            updateQuery += ', completed_at = NOW()';
        }

        updateQuery += ' WHERE id = ?';
        params.push(batchId);

        await pool.query(updateQuery, params);

        // Fetch updated batch
        const [updated] = await pool.query<RowDataPacket[]>(
            `SELECT pb.*, u.name as created_by_name
      FROM processing_batches pb
      LEFT JOIN users u ON pb.created_by = u.id
      WHERE pb.id = ?`,
            [batchId]
        );

        return NextResponse.json({
            message: 'Batch updated successfully',
            batch: updated[0]
        });
    } catch (error) {
        console.error('Error updating batch:', error);
        return NextResponse.json(
            { error: 'Failed to update batch' },
            { status: 500 }
        );
    }
}

// DELETE /api/batches/[id] - Cancel batch
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const batchId = parseInt(id);

        if (isNaN(batchId)) {
            return NextResponse.json(
                { error: 'Invalid batch ID' },
                { status: 400 }
            );
        }

        // Check if batch can be cancelled
        const [batches] = await pool.query<RowDataPacket[]>(
            'SELECT status FROM processing_batches WHERE id = ?',
            [batchId]
        );

        if (batches.length === 0) {
            return NextResponse.json(
                { error: 'Batch not found' },
                { status: 404 }
            );
        }

        if (batches[0].status === 'completed') {
            return NextResponse.json(
                { error: 'Cannot cancel a completed batch' },
                { status: 400 }
            );
        }

        await pool.query(
            'UPDATE processing_batches SET status = ? WHERE id = ?',
            ['cancelled', batchId]
        );

        return NextResponse.json({
            message: 'Batch cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling batch:', error);
        return NextResponse.json(
            { error: 'Failed to cancel batch' },
            { status: 500 }
        );
    }
}
