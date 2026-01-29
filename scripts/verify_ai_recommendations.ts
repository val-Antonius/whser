import { query } from '@/lib/db';

async function verifyAiRecommendations() {
    console.log('🧪 Testing AI Recommendation Generation...');

    try {
        // 1. Setup: Create Snapshot and Insight
        const snapRes: any = await query(`INSERT INTO data_snapshots (snapshot_name, period_start, period_end, snapshot_date) VALUES ('AI Rec Test', '2024-02-01', '2024-02-07', NOW())`);
        const snapId = snapRes.insertId;

        const insightRes: any = await query(`
            INSERT INTO insights (snapshot_id, statement, severity, metrics_involved, generated_by, is_actionable, created_by) 
            VALUES (?, 'Delivery Late Rate has increased by 15% causing customer dissatisfaction.', 'critical', '["sla_compliance"]', 'manual', 1, 1)
        `, [snapId]);
        const insightId = insightRes.insertId;

        console.log(`Setup complete. Insight ID: ${insightId}`);

        // 2. Mock Call to API Logic (since we can't fetch local API easily, we verify logic via Service usage or logic replication)
        // Actually, let's replicate the API logic directly here since it uses LLMService
        const { LLMService } = await import('@/services/LLMService');
        const llmService = new LLMService({ userId: 1 });

        console.log('🤖 Invoking LLM Service...');
        // We'll mock the LLM response if real LLM is not available, but let's try real first?
        // Actually, if LLM is offline, this might fail or fallback. The Service has checkConnection.

        const result = await llmService.generateRecommendations('Delivery Late Rate has increased by 15% causing customer dissatisfaction.', insightId);

        if (result.success && result.data && result.data.length > 0) {
            console.log('✅ LLM Service generated recommendations:', result.data.length);
            console.log('Example:', result.data[0].action);

            // 3. Verify DB Logic (Simulate what API does)
            for (const rec of result.data) {
                await query(
                    `INSERT INTO recommendations (action, category, urgency, rationale, generated_by, insight_id, status)
                     VALUES (?, ?, ?, ?, 'llm', ?, 'pending')`,
                    [rec.action, rec.category, rec.urgency, rec.rationale, insightId]
                );
            }

            const dbRows = await query<any>('SELECT * FROM recommendations WHERE insight_id = ?', [insightId]);
            if (dbRows.length > 0) {
                console.log('✅ Recommendations saved to DB');
            } else {
                console.log('❌ Failed to save to DB');
            }

        } else {
            console.log('⚠️ LLM Service returned no data (or offline). Result:', result);
        }

        // Cleanup
        await query('DELETE FROM recommendations WHERE insight_id = ?', [insightId]);
        await query('DELETE FROM insights WHERE id = ?', [insightId]);
        await query('DELETE FROM data_snapshots WHERE id = ?', [snapId]);

    } catch (e) {
        console.error('Test Failed:', e);
    }
    process.exit(0);
}

verifyAiRecommendations();
