import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, completion_notes } = body;

        let sql = `UPDATE tasks SET status = ?`;
        const values: any[] = [status];

        if (status === 'resolved' || status === 'completed') {
            sql += `, completed_at = NOW()`;
            if (completion_notes) {
                sql += `, completion_notes = ?`;
                values.push(completion_notes);
            }
        }

        sql += ` WHERE id = ?`;
        values.push(id);

        await query(sql, values);

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Task updated'
        });
    } catch (error: any) {
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}
