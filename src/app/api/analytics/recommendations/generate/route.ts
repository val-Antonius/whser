import { NextResponse } from 'next/server';
import { LLMService } from '@/services/LLMService';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { insightId, snapshotId } = body;

        // User ID 1 (Owner) for now
        const llmService = new LLMService({ userId: 1 });
        const generatedRecommendations: any[] = [];

        // Scenario A: Generate for a specific Insight
        if (insightId) {
            const insights = await query<any>('SELECT * FROM insights WHERE id = ?', [insightId]);
            if (insights.length === 0) {
                return NextResponse.json({ success: false, error: 'Insight not found' }, { status: 404 });
            }
            const insight = insights[0];

            const result = await llmService.generateRecommendations(insight.statement, insight.id);

            if (result.success && result.data) {
                for (const rec of result.data) {
                    // Save to DB
                    const insert = await query<any>(
                        `INSERT INTO recommendations (action, category, urgency, rationale, generated_by, insight_id, status)
                         VALUES (?, ?, ?, ?, 'llm', ?, 'pending')`,
                        [rec.action, rec.category, rec.urgency, rec.rationale, insightId]
                    );
                    generatedRecommendations.push({ ...rec, id: (insert as any).insertId });
                }
            }
        }
        // Scenario B: Generate for all actionable insights in a snapshot that don't have recommendations yet
        else if (snapshotId) {
            const insights = await query<any>(`
                SELECT * FROM insights 
                WHERE snapshot_id = ? 
                AND is_actionable = 1
                AND id NOT IN (SELECT DISTINCT insight_id FROM recommendations WHERE insight_id IS NOT NULL)
             `, [snapshotId]);

            // Limit to 3 insights to avoid timeout/overload in prototype
            const limitedInsights = insights.slice(0, 3);

            for (const insight of limitedInsights) {
                const result = await llmService.generateRecommendations(insight.statement, insight.id);
                if (result.success && result.data) {
                    for (const rec of result.data) {
                        const insert = await query<any>(
                            `INSERT INTO recommendations (action, category, urgency, rationale, generated_by, insight_id, status)
                             VALUES (?, ?, ?, ?, 'llm', ?, 'pending')`,
                            [rec.action, rec.category, rec.urgency, rec.rationale, insight.id]
                        );
                        generatedRecommendations.push({ ...rec, id: (insert as any).insertId });
                    }
                }
            }
        } else {
            return NextResponse.json({ success: false, error: 'Either insightId or snapshotId is required' }, { status: 400 });
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: generatedRecommendations,
            message: `Successfully generated ${generatedRecommendations.length} recommendations`
        });

    } catch (error: any) {
        console.error('Error generating recommendations:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
