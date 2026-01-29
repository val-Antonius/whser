import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';
import { TaskService, CreateTaskInput } from '@/services/TaskService';

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
        const { title, description, assigned_to, priority, due_date, created_by, insight_id, recommendation_id, from_insight } = body;

        // Smart Creation Feature
        if (from_insight && insight_id) {
            // "Convert to Task" flow
            const task = await TaskService.createTaskFromInsight(insight_id, created_by || 1, assigned_to || 1);
            return NextResponse.json<ApiResponse>({
                success: true,
                message: 'Task created from Insight',
                data: task
            });
        }

        if (body.from_recommendation && recommendation_id) {
            const task = await TaskService.createTaskFromRecommendation(recommendation_id, created_by || 1, assigned_to || 1);
            return NextResponse.json<ApiResponse>({
                success: true,
                message: 'Task created from Recommendation',
                data: task
            });
        }

        // Standard Creation
        const input: CreateTaskInput = {
            title,
            description,
            assigned_to,
            priority,
            due_date,
            created_by: created_by || 1,
            insight_id,
            recommendation_id
        };

        const result = await TaskService.createTask(input);

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Task created',
            data: result
        });
    } catch (error: any) {
        console.error('Task creation error:', error);
        return NextResponse.json<ApiResponse>({ success: false, error: error.message }, { status: 500 });
    }
}
