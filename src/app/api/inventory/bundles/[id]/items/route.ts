import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// POST /api/inventory/bundles/[id]/items - Add item to bundle
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const bundleId = parseInt(id);

        if (isNaN(bundleId)) {
            return NextResponse.json(
                { error: 'Invalid bundle ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { inventory_item_id, quantity, unit } = body;

        if (!inventory_item_id || !quantity || !unit) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if item already in bundle
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM bundle_items WHERE bundle_id = ? AND inventory_item_id = ?',
            [bundleId, inventory_item_id]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Item already in bundle' },
                { status: 409 }
            );
        }

        const [result] = await pool.query(
            `INSERT INTO bundle_items (bundle_id, inventory_item_id, quantity, unit)
            VALUES (?, ?, ?, ?)`,
            [bundleId, inventory_item_id, quantity, unit]
        );

        return NextResponse.json({
            message: 'Item added to bundle successfully',
            id: (result as any).insertId
        });
    } catch (error) {
        console.error('Error adding item to bundle:', error);
        return NextResponse.json(
            { error: 'Failed to add item to bundle' },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/bundles/[id]/items - Remove item from bundle
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const bundleId = parseInt(id);

        if (isNaN(bundleId)) {
            return NextResponse.json(
                { error: 'Invalid bundle ID' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('item_id');

        if (!itemId) {
            return NextResponse.json(
                { error: 'Item ID required' },
                { status: 400 }
            );
        }

        await pool.query(
            'DELETE FROM bundle_items WHERE bundle_id = ? AND id = ?',
            [bundleId, parseInt(itemId)]
        );

        return NextResponse.json({
            message: 'Item removed from bundle successfully'
        });
    } catch (error) {
        console.error('Error removing item from bundle:', error);
        return NextResponse.json(
            { error: 'Failed to remove item from bundle' },
            { status: 500 }
        );
    }
}
