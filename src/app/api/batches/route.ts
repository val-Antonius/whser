import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET /api/batches - List batches with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const batchType = searchParams.get('type');

        let query = `
      SELECT pb.*, u.name as created_by_name
      FROM processing_batches pb
      LEFT JOIN users u ON pb.created_by = u.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (status) {
            query += ' AND pb.status = ?';
            params.push(status);
        }

        if (batchType) {
            query += ' AND pb.batch_type = ?';
            params.push(batchType);
        }

        query += ' ORDER BY pb.created_at DESC LIMIT 50';

        const [batches] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ batches });
    } catch (error) {
        console.error('Error fetching batches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch batches' },
            { status: 500 }
        );
    }
}

// POST /api/batches - Create new batch
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { batch_type, notes } = body;

        if (!batch_type) {
            return NextResponse.json(
                { error: 'Batch type is required' },
                { status: 400 }
            );
        }

        // Generate batch number
        const batchNumber = `BATCH-${Date.now()}`;

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO processing_batches 
        (batch_number, batch_type, status, notes, created_by)
      VALUES (?, ?, 'pending', ?, ?)`,
            [batchNumber, batch_type, notes || null, 1] // TODO: Get actual user ID from session
        );

        // Fetch created batch
        const [newBatch] = await pool.query<RowDataPacket[]>(
            `SELECT pb.*, u.name as created_by_name
      FROM processing_batches pb
      LEFT JOIN users u ON pb.created_by = u.id
      WHERE pb.id = ?`,
            [result.insertId]
        );

        return NextResponse.json({
            message: 'Batch created successfully',
            batch: newBatch[0]
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating batch:', error);
        return NextResponse.json(
            { error: 'Failed to create batch' },
            { status: 500 }
        );
    }
}
