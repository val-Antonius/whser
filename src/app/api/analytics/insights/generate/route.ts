import { NextResponse } from 'next/server';
import { LLMService } from '@/services/LLMService';
import { MetricData } from '@/lib/prompts';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { snapshotId, period } = body;

        if (!snapshotId) {
            return NextResponse.json({ success: false, error: 'Snapshot ID is required' }, { status: 400 });
        }

        // 1. Fetch Metrics for this Snapshot from DB
        // NOTE: In a real scenario, we would join with metric definitions. 
        // For now, we assume metrics are stored or calculated. 
        // To keep this integration simple and robust, we will fetch the calculated metrics 
        // from the `snapshot_metrics` table if it exists, or re-calculate.
        // Assuming Phase 3 completed `snapshot_metrics` table.

        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT metric_name as name, metric_value as currentValue, baseline_value as baselineValue
            FROM analytical_metrics
            WHERE snapshot_id = ?
        `, [snapshotId]);

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: 'No metrics found for this snapshot' }, { status: 404 });
        }

        const metrics: MetricData[] = rows.map(row => {
            const current = parseFloat(row.currentValue);
            const baseline = parseFloat(row.baselineValue);
            const variance = current - baseline;
            const variancePercentage = baseline !== 0 ? (variance / baseline) * 100 : 0;

            // Unit Inference
            let unit = '';
            if (row.name.includes('rate') || row.name.includes('pct') || row.name.includes('percentage') || row.name.includes('margin')) unit = '%';
            else if (row.name.includes('hours') || row.name.includes('time')) unit = 'h';
            else if (row.name.includes('cost') || row.name.includes('revenue') || row.name.includes('price')) unit = 'IDR';
            else unit = '';

            // Infer goal based on name
            const lowerIsBetterKeywords = ['cost', 'expense', 'rewash', 'complaint', 'turnaround', 'time', 'aging', 'exception'];
            const goal = lowerIsBetterKeywords.some(k => row.name.toLowerCase().includes(k))
                ? 'lower-is-better'
                : 'higher-is-better';

            return {
                name: row.name,
                currentValue: current,
                baselineValue: baseline,
                variance: variance,
                variancePercentage: variancePercentage,
                unit: unit,
                goal: goal
            };
        });

        // 2. Call LLM Service
        // User ID 1 (Owner) for now, or extracted from session
        const llmService = new LLMService({ userId: 1 });
        const result = await llmService.generateInsights(period || 'Current Period', metrics, snapshotId);

        // 3. Save to DB (if not already handled by Service, but Service returned data)
        // The Service in Phase 4.4 returned data but commented out DB save.
        // We will save valid insights here to the `insights` table.

        if (result.success && result.data) {
            const values = result.data.map((insight: any) => [
                snapshotId,
                insight.statement,
                insight.severity,
                JSON.stringify(insight.metrics_involved),
                true, // is_actionable default
                result.source, // 'llm' or 'rule-based'
                1 // created_by
            ]);

            if (values.length > 0) {
                await pool.query(`
                    INSERT INTO insights(snapshot_id, statement, severity, metrics_involved, is_actionable, generated_by, created_by)
        VALUES ?
            `, [values]);
            }
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error in generate insights route:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
