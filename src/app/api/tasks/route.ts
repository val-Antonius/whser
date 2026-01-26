import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            title,
            description,
            insight_id,
            recommendation_id,
            assigned_to,
            created_by,
            priority,
            due_date
        } = body;

        // Validation
        if (!title || !assigned_to || !created_by) {
            return NextResponse.json(
                { success: false, error: 'Title, Assigned To, and Created By are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(`
            INSERT INTO tasks (
                title, description, insight_id, recommendation_id, 
                assigned_to, created_by, priority, due_date, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())
        `, [
            title,
            description || null,
            insight_id || null,
            recommendation_id || null,
            assigned_to,
            created_by,
            priority || 'medium',
            due_date || null
        ]);

        return NextResponse.json({
            success: true,
            data: { id: result.insertId, ...body }
        });

    } catch (error: any) {
        console.error('Error creating task:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const assignedTo = searchParams.get('assignedTo');
        const createdBy = searchParams.get('createdBy');
        const status = searchParams.get('status');

        let query = `
            SELECT t.*, 
                   u_assign.name as assigned_to_name,
                   u_creator.name as created_by_name,
                   i.statement as insight_statement
            FROM tasks t
            LEFT JOIN users u_assign ON t.assigned_to = u_assign.id
            LEFT JOIN users u_creator ON t.created_by = u_creator.id
            LEFT JOIN insights i ON t.insight_id = i.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (assignedTo) {
            query += ' AND t.assigned_to = ?';
            params.push(assignedTo);
        }
        if (createdBy) {
            query += ' AND t.created_by = ?';
            params.push(createdBy);
        }
        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.created_at DESC';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ success: true, data: rows });

    } catch (error: any) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
