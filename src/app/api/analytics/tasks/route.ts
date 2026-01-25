import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const tasks = await query(`
            SELECT t.*, i.statement as insight_statement 
            FROM tasks t
            LEFT JOIN insights i ON t.insight_id = i.id
            ORDER BY t.created_at DESC
        `);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: tasks
        });
    } catch (error: any) {
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, assigned_to, priority, due_date, created_by, insight_id, recommendation_id } = body;

        const result: any = await query(
            `INSERT INTO tasks (title, description, assigned_to, priority, due_date, created_by, insight_id, recommendation_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, assigned_to, priority, due_date, created_by, insight_id || null, recommendation_id || null]
        );

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Task created',
            data: { id: result.insertId }
        });
    } catch (error: any) {
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}
