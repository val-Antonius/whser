import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15+ async params
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, resolution_notes } = body;

        // Validation: Ensure valid status
        const validStatuses = ['open', 'in_progress', 'resolved', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        let query = 'UPDATE tasks SET updated_at = NOW()';
        const queryParams: any[] = [];

        if (status) {
            query += ', status = ?';
            queryParams.push(status);

            // If resolving, set completed_at
            if (status === 'resolved') {
                query += ', completed_at = NOW()';
            }
        }

        if (resolution_notes) {
            query += ', completion_notes = ?';
            queryParams.push(resolution_notes);
        }

        query += ' WHERE id = ?';
        queryParams.push(id);

        const [result] = await pool.query<ResultSetHeader>(query, queryParams);

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Task updated successfully' });

    } catch (error: any) {
        console.error('Error updating task:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM tasks WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Task deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
