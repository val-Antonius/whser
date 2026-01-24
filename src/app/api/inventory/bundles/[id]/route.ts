import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/inventory/bundles/[id] - Get bundle details with items
export async function GET(
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

        // Get bundle details
        const [bundles] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM inventory_bundles WHERE id = ?',
            [bundleId]
        );

        if (bundles.length === 0) {
            return NextResponse.json(
                { error: 'Bundle not found' },
                { status: 404 }
            );
        }

        // Get bundle items
        const [items] = await pool.query<RowDataPacket[]>(
            `SELECT 
                bi.*,
                ii.item_name,
                ii.item_code,
                ii.unit_of_measure
            FROM bundle_items bi
            JOIN inventory_items ii ON bi.inventory_item_id = ii.id
            WHERE bi.bundle_id = ?`,
            [bundleId]
        );

        return NextResponse.json({
            bundle: bundles[0],
            items
        });
    } catch (error) {
        console.error('Error fetching bundle details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bundle details' },
            { status: 500 }
        );
    }
}

// PATCH /api/inventory/bundles/[id] - Update bundle
export async function PATCH(
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
        const { bundle_name, description, is_active } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (bundle_name !== undefined) {
            updates.push('bundle_name = ?');
            values.push(bundle_name);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'No updates provided' },
                { status: 400 }
            );
        }

        values.push(bundleId);

        await pool.query(
            `UPDATE inventory_bundles SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({
            message: 'Bundle updated successfully'
        });
    } catch (error) {
        console.error('Error updating bundle:', error);
        return NextResponse.json(
            { error: 'Failed to update bundle' },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/bundles/[id] - Delete bundle
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

        await pool.query('DELETE FROM inventory_bundles WHERE id = ?', [bundleId]);

        return NextResponse.json({
            message: 'Bundle deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting bundle:', error);
        return NextResponse.json(
            { error: 'Failed to delete bundle' },
            { status: 500 }
        );
    }
}
