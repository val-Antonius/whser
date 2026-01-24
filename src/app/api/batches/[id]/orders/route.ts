import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// POST /api/batches/[id]/orders - Add order to batch
export async function POST(
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
        const { order_id } = body;

        if (!order_id) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Verify batch exists and is not completed/cancelled
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

        if (['completed', 'cancelled'].includes(batches[0].status)) {
            return NextResponse.json(
                { error: 'Cannot add orders to a completed or cancelled batch' },
                { status: 400 }
            );
        }

        // Verify order exists
        const [orders] = await pool.query<RowDataPacket[]>(
            'SELECT id, weight FROM orders WHERE id = ?',
            [order_id]
        );

        if (orders.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if order is already in a batch
        const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT bo.batch_id, pb.status
      FROM batch_orders bo
      JOIN processing_batches pb ON bo.batch_id = pb.id
      WHERE bo.order_id = ? AND pb.status NOT IN ('completed', 'cancelled')`,
            [order_id]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Order is already in an active batch' },
                { status: 400 }
            );
        }

        // Add order to batch
        await pool.query(
            `INSERT INTO batch_orders (batch_id, order_id, added_by)
      VALUES (?, ?, ?)`,
            [batchId, order_id, 1] // TODO: Get actual user ID from session
        );

        // Update batch totals
        const orderWeight = orders[0].weight || 0;
        await pool.query(
            `UPDATE processing_batches 
      SET total_orders = total_orders + 1,
          total_weight = total_weight + ?
      WHERE id = ?`,
            [orderWeight, batchId]
        );

        return NextResponse.json({
            message: 'Order added to batch successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding order to batch:', error);
        return NextResponse.json(
            { error: 'Failed to add order to batch' },
            { status: 500 }
        );
    }
}

// DELETE /api/batches/[id]/orders - Remove order from batch
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

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('order_id');

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Get order weight before removing
        const [orders] = await pool.query<RowDataPacket[]>(
            'SELECT weight FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Remove order from batch
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM batch_orders WHERE batch_id = ? AND order_id = ?',
            [batchId, orderId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'Order not in this batch' },
                { status: 404 }
            );
        }

        // Update batch totals
        const orderWeight = orders[0].weight || 0;
        await pool.query(
            `UPDATE processing_batches 
      SET total_orders = total_orders - 1,
          total_weight = total_weight - ?
      WHERE id = ?`,
            [orderWeight, batchId]
        );

        return NextResponse.json({
            message: 'Order removed from batch successfully'
        });
    } catch (error) {
        console.error('Error removing order from batch:', error);
        return NextResponse.json(
            { error: 'Failed to remove order from batch' },
            { status: 500 }
        );
    }
}
