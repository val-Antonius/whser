import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/orders/[id]/exceptions - List exceptions for an order
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: 'Invalid order ID' },
                { status: 400 }
            );
        }

        const [exceptions] = await pool.query<RowDataPacket[]>(
            `SELECT 
        oe.*,
        u1.name as reported_by_name,
        u2.name as resolved_by_name
      FROM order_exceptions oe
      LEFT JOIN users u1 ON oe.reported_by = u1.id
      LEFT JOIN users u2 ON oe.resolved_by = u2.id
      WHERE oe.order_id = ?
      ORDER BY oe.reported_at DESC`,
            [orderId]
        );

        return NextResponse.json({ exceptions });
    } catch (error) {
        console.error('Error fetching exceptions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exceptions' },
            { status: 500 }
        );
    }
}

// POST /api/orders/[id]/exceptions - Report new exception
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json(
                { error: 'Invalid order ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { exception_type, severity, description } = body;

        // Validate required fields
        if (!exception_type || !description) {
            return NextResponse.json(
                { error: 'Exception type and description are required' },
                { status: 400 }
            );
        }

        // Verify order exists
        const [orders] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Insert exception
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO order_exceptions 
        (order_id, exception_type, severity, description, reported_by, status)
      VALUES (?, ?, ?, ?, ?, 'open')`,
            [orderId, exception_type, severity || 'medium', description, 1] // TODO: Get actual user ID from session
        );

        // Fetch the created exception
        const [newException] = await pool.query<RowDataPacket[]>(
            `SELECT oe.*, u.name as reported_by_name
      FROM order_exceptions oe
      LEFT JOIN users u ON oe.reported_by = u.id
      WHERE oe.id = ?`,
            [result.insertId]
        );

        return NextResponse.json({
            message: 'Exception reported successfully',
            exception: newException[0]
        }, { status: 201 });
    } catch (error) {
        console.error('Error reporting exception:', error);
        return NextResponse.json(
            { error: 'Failed to report exception' },
            { status: 500 }
        );
    }
}
