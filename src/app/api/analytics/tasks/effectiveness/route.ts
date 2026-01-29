import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import { TaskEffectivenessService } from '@/services/TaskEffectivenessService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { task_id } = body;

        if (!task_id) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Missing task_id' }, { status: 400 });
        }

        const result = await TaskEffectivenessService.calculateEffectiveness(task_id);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Effectiveness calculation error:', error);
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}
