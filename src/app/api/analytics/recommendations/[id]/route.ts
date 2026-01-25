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
        const { status } = body;

        await query(
            `UPDATE recommendations SET status = ? WHERE id = ?`,
            [status, id]
        );

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Recommendation updated'
        });
    } catch (error: any) {
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}
