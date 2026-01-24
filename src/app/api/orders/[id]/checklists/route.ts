import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/orders/[id]/checklists - Get checklist completion status for an order
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

        // Get order's service ID
        const [orders] = await pool.query<RowDataPacket[]>(
            'SELECT service_id FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        const serviceId = orders[0].service_id;

        // Get all checklist items for this service with completion status
        const [checklistItems] = await pool.query<RowDataPacket[]>(
            `SELECT 
        pc.*,
        occ.is_completed,
        occ.completed_at,
        occ.completed_by,
        occ.notes as completion_notes,
        u.name as completed_by_name
      FROM process_checklists pc
      LEFT JOIN order_checklist_completion occ ON pc.id = occ.checklist_id AND occ.order_id = ?
      LEFT JOIN users u ON occ.completed_by = u.id
      WHERE pc.service_id = ?
      ORDER BY pc.process_stage, pc.sequence_order`,
            [orderId, serviceId]
        );

        // Group by process stage
        const groupedByStage: Record<string, any[]> = {};
        checklistItems.forEach(item => {
            if (!groupedByStage[item.process_stage]) {
                groupedByStage[item.process_stage] = [];
            }
            groupedByStage[item.process_stage].push({
                ...item,
                is_completed: item.is_completed || false
            });
        });

        // Calculate stats
        const totalItems = checklistItems.length;
        const completedItems = checklistItems.filter(item => item.is_completed).length;
        const requiredItems = checklistItems.filter(item => item.is_required).length;
        const completedRequiredItems = checklistItems.filter(item => item.is_required && item.is_completed).length;

        return NextResponse.json({
            checklist_items: checklistItems.map(item => ({
                ...item,
                is_completed: item.is_completed || false
            })),
            grouped_by_stage: groupedByStage,
            stats: {
                total: totalItems,
                completed: completedItems,
                required: requiredItems,
                completed_required: completedRequiredItems,
                percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching checklists:', error);
        return NextResponse.json(
            { error: 'Failed to fetch checklists' },
            { status: 500 }
        );
    }
}

// POST /api/orders/[id]/checklists - Mark checklist item complete/incomplete
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
        const { checklist_id, is_completed, notes } = body;

        if (!checklist_id) {
            return NextResponse.json(
                { error: 'Checklist ID is required' },
                { status: 400 }
            );
        }

        // Check if completion record exists
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM order_checklist_completion WHERE order_id = ? AND checklist_id = ?',
            [orderId, checklist_id]
        );

        if (existing.length > 0) {
            // Update existing record
            await pool.query(
                `UPDATE order_checklist_completion 
        SET is_completed = ?, 
            completed_at = ${is_completed ? 'NOW()' : 'NULL'},
            completed_by = ${is_completed ? '?' : 'NULL'},
            notes = ?
        WHERE order_id = ? AND checklist_id = ?`,
                is_completed
                    ? [is_completed, 1, notes || null, orderId, checklist_id] // TODO: Get actual user ID
                    : [is_completed, notes || null, orderId, checklist_id]
            );
        } else {
            // Insert new record
            await pool.query(
                `INSERT INTO order_checklist_completion 
          (order_id, checklist_id, is_completed, completed_at, completed_by, notes)
        VALUES (?, ?, ?, ${is_completed ? 'NOW()' : 'NULL'}, ${is_completed ? '?' : 'NULL'}, ?)`,
                is_completed
                    ? [orderId, checklist_id, is_completed, 1, notes || null] // TODO: Get actual user ID
                    : [orderId, checklist_id, is_completed, notes || null]
            );
        }

        return NextResponse.json({
            message: 'Checklist item updated successfully'
        });
    } catch (error) {
        console.error('Error updating checklist:', error);
        return NextResponse.json(
            { error: 'Failed to update checklist' },
            { status: 500 }
        );
    }
}
