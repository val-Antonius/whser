import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status');

        let query = `
            SELECT 
                so.*,
                u.name as created_by_name,
                (SELECT COUNT(*) FROM stock_opname_items WHERE opname_id = so.id) as item_count,
                (SELECT COUNT(*) FROM stock_opname_items WHERE opname_id = so.id AND actual_qty IS NOT NULL) as counted_items
            FROM stock_opnames so
            LEFT JOIN users u ON so.created_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status) {
            query += ' AND so.status = ?';
            params.push(status);
        }

        query += ' ORDER BY so.created_at DESC LIMIT ?';
        params.push(limit);

        const [opnames] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json(opnames);
    } catch (error) {
        console.error('Error fetching stock opnames:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock opnames' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const body = await request.json();
        const { notes, created_by } = body;

        // Generate Opname Number (OPN-YYYYMM-XXX)
        const date = new Date();
        const yearMonth = date.toISOString().slice(0, 7).replace('-', '');
        const [lastOpname] = await conn.query<RowDataPacket[]>(
            `SELECT opname_number FROM stock_opnames 
             WHERE opname_number LIKE ? 
             ORDER BY id DESC LIMIT 1`,
            [`OPN-${yearMonth}-%`]
        );

        let sequence = 1;
        if (lastOpname.length > 0) {
            const lastSeq = parseInt(lastOpname[0].opname_number.split('-')[2]);
            sequence = lastSeq + 1;
        }
        const opnameNumber = `OPN-${yearMonth}-${String(sequence).padStart(3, '0')}`;

        // Create Opname Record
        const [result] = await conn.execute<ResultSetHeader>(
            `INSERT INTO stock_opnames (opname_number, status, notes, created_by)
             VALUES (?, 'open', ?, ?)`,
            [opnameNumber, notes || null, created_by || 1] // Default to admin if not provided
        );
        const opnameId = result.insertId;

        // Snapshot all active inventory items
        // We capture current_stock as system_qty
        await conn.execute(
            `INSERT INTO stock_opname_items (opname_id, inventory_item_id, system_qty)
             SELECT ?, id, current_stock
             FROM inventory_items
             WHERE is_active = 1`,
            [opnameId]
        );

        await conn.commit();

        return NextResponse.json({
            success: true,
            id: opnameId,
            opname_number: opnameNumber,
            message: 'Stock Opname session started successfully'
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error creating stock opname:', error);
        return NextResponse.json(
            { error: 'Failed to create stock opname' },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
