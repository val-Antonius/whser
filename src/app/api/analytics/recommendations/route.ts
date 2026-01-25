import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const recommendations = await query(`
            SELECT r.*, i.statement as insight_statement 
            FROM recommendations r
            LEFT JOIN insights i ON r.insight_id = i.id
            ORDER BY r.created_at DESC
        `);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: recommendations
        });
    } catch (error: any) {
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, category, urgency, rationale, generated_by, insight_id } = body;

        const result: any = await query(
            `INSERT INTO recommendations (action, category, urgency, rationale, generated_by, insight_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [action, category, urgency, rationale, generated_by || 'manual', insight_id || null]
        );

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Recommendation created',
            data: { id: result.insertId }
        });
    } catch (error: any) {
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}
