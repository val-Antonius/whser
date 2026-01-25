import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const conn = await pool.getConnection();
    try {
        const { id } = await params;
        const body = await request.json();
        const { submitted_by } = body; // User ID

        await conn.beginTransaction();

        // 1. Validate Opname State
        const [opnames] = await conn.query<RowDataPacket[]>(
            'SELECT * FROM stock_opnames WHERE id = ? FOR UPDATE',
            [id]
        );

        if (opnames.length === 0) {
            throw new Error('Opname not found');
        }

        if (opnames[0].status !== 'open') {
            throw new Error('Opname is already submitted or cancelled');
        }

        // 2. Fetch Items with Variance
        const [items] = await conn.query<RowDataPacket[]>(
            `SELECT * FROM stock_opname_items 
             WHERE opname_id = ? AND actual_qty IS NOT NULL`,
            [id]
        );

        // 3. Process Adjustments
        for (const item of items) {
            // Variance is auto-calculated column: actual - system
            // But we can re-calculate to be safe or just use the difference
            const variance = Number(item.actual_qty) - Number(item.system_qty);

            if (variance !== 0) {
                const transactionType = 'adjustment';
                const absVariance = Math.abs(variance);

                // Insert Transaction
                await conn.execute(
                    `INSERT INTO inventory_transactions 
                     (inventory_item_id, transaction_type, quantity, stock_before, stock_after, 
                      reason_code, reference_number, notes, created_by, transaction_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        item.inventory_item_id,
                        transactionType,
                        absVariance,
                        item.system_qty,
                        item.actual_qty,
                        'STOCK_OPNAME',
                        opnames[0].opname_number,
                        `Variance adjustment from ${opnames[0].opname_number}`,
                        submitted_by || 1,
                    ]
                );

                // Update Inventory Master Stock
                await conn.execute(
                    `UPDATE inventory_items 
                     SET current_stock = ?, updated_at = NOW()
                     WHERE id = ?`,
                    [item.actual_qty, item.inventory_item_id]
                );
            }
        }

        // 4. Close Opname
        await conn.execute(
            `UPDATE stock_opnames 
             SET status = 'submitted', submitted_at = NOW()
             WHERE id = ?`,
            [id]
        );

        await conn.commit();

        return NextResponse.json({
            success: true,
            message: 'Stock Opname submitted and inventory adjusted successfully'
        });

    } catch (error: any) {
        await conn.rollback();
        console.error('Error submitting opname:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit opname' },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
