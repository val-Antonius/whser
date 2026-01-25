import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch Opname Header
        const [opnames] = await pool.query<RowDataPacket[]>(
            `SELECT so.*, u.name as created_by_name 
             FROM stock_opnames so
             LEFT JOIN users u ON so.created_by = u.id
             WHERE so.id = ?`,
            [id]
        );

        if (opnames.length === 0) {
            return NextResponse.json({ error: 'Opname not found' }, { status: 404 });
        }

        // Fetch Opname Items with details
        const [items] = await pool.query<RowDataPacket[]>(
            `SELECT 
                soi.*,
                ii.item_name,
                ii.item_code,
                ii.unit_of_measure,
                ii.category
             FROM stock_opname_items soi
             JOIN inventory_items ii ON soi.inventory_item_id = ii.id
             WHERE soi.opname_id = ?
             ORDER BY ii.item_name ASC`,
            [id]
        );

        return NextResponse.json({
            ...opnames[0],
            items
        });

    } catch (error) {
        console.error('Error fetching opname details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch opname details' },
            { status: 500 }
        );
    }
}

// PUT: Update actual quantities (Draft Save)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const conn = await pool.getConnection();
    try {
        const { id } = await params;
        const body = await request.json();
        const { items } = body; // Array of { id, actual_qty, notes }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
        }

        await conn.beginTransaction();

        // Check if opname is still open
        const [opnames] = await conn.query<RowDataPacket[]>(
            'SELECT status FROM stock_opnames WHERE id = ?',
            [id]
        );

        if (opnames.length === 0 || opnames[0].status !== 'open') {
            await conn.rollback();
            return NextResponse.json({ error: 'Opname is not open for editing' }, { status: 400 });
        }

        // Bulk update using loop (simplest for now, for safety)
        for (const item of items) {
            if (item.actual_qty !== undefined) {
                await conn.execute(
                    `UPDATE stock_opname_items 
                     SET actual_qty = ?, notes = ?
                     WHERE id = ? AND opname_id = ?`,
                    [item.actual_qty, item.notes || null, item.id, id]
                );
            }
        }

        await conn.commit();

        return NextResponse.json({ success: true, message: 'Opname saved as draft' });

    } catch (error) {
        await conn.rollback();
        console.error('Error updating opname items:', error);
        return NextResponse.json(
            { error: 'Failed to update opname items' },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
