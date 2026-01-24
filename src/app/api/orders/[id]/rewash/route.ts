import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { validateAuthorizationCode } from '@/lib/authorization';

// GET /api/orders/[id]/rewash - Get rewash history for an order
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

        const [rewashEvents] = await pool.query<RowDataPacket[]>(
            `SELECT 
        re.*,
        u1.name as authorized_by_name,
        u2.name as created_by_name
      FROM rewash_events re
      LEFT JOIN users u1 ON re.authorized_by = u1.id
      LEFT JOIN users u2 ON re.created_by = u2.id
      WHERE re.order_id = ?
      ORDER BY re.created_at DESC`,
            [orderId]
        );

        // Calculate total cost impact
        const totalCost = rewashEvents.reduce((sum, event) => sum + parseFloat(event.cost_impact || 0), 0);

        return NextResponse.json({
            rewash_events: rewashEvents,
            total_cost: totalCost,
            count: rewashEvents.length
        });
    } catch (error) {
        console.error('Error fetching rewash events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rewash events' },
            { status: 500 }
        );
    }
}

// POST /api/orders/[id]/rewash - Record rewash event
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
        const { process_stage, reason, cost_impact, notes, authorization_code } = body;

        // Validate required fields
        if (!process_stage || !reason) {
            return NextResponse.json(
                { error: 'Process stage and reason are required' },
                { status: 400 }
            );
        }

        // Validate authorization code
        if (!validateAuthorizationCode(authorization_code)) {
            return NextResponse.json(
                { error: 'Invalid authorization code' },
                { status: 401 }
            );
        }

        // Verify order exists and is not voided/cancelled
        const [orders] = await pool.query<RowDataPacket[]>(
            'SELECT id, status, is_voided FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (orders[0].is_voided) {
            return NextResponse.json(
                { error: 'Cannot record rewash for voided order' },
                { status: 400 }
            );
        }

        if (orders[0].status === 'CANCELLED') {
            return NextResponse.json(
                { error: 'Cannot record rewash for cancelled order' },
                { status: 400 }
            );
        }

        // Insert rewash event
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO rewash_events 
        (order_id, process_stage, reason, cost_impact, notes, authorized_by, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                orderId,
                process_stage,
                reason,
                cost_impact || 0,
                notes || null,
                1, // TODO: Get actual user ID from session (authorizer)
                1  // TODO: Get actual user ID from session (creator)
            ]
        );

        // Fetch the created rewash event
        const [newEvent] = await pool.query<RowDataPacket[]>(
            `SELECT re.*, 
        u1.name as authorized_by_name,
        u2.name as created_by_name
      FROM rewash_events re
      LEFT JOIN users u1 ON re.authorized_by = u1.id
      LEFT JOIN users u2 ON re.created_by = u2.id
      WHERE re.id = ?`,
            [result.insertId]
        );

        return NextResponse.json({
            message: 'Rewash event recorded successfully',
            rewash_event: newEvent[0]
        }, { status: 201 });
    } catch (error) {
        console.error('Error recording rewash event:', error);
        return NextResponse.json(
            { error: 'Failed to record rewash event' },
            { status: 500 }
        );
    }
}
