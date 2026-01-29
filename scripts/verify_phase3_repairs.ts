import { query } from '@/lib/db';
import { TaskService } from '@/services/TaskService';

async function runVerification() {
    console.log('🚀 Starting Phase 3 Repair Verification (Task Logic)...\n');

    try {
        console.log('--- 1. Testing Standard Task Creation ---');
        const task1 = await TaskService.createTask({
            title: 'Test Task Manual',
            description: 'Verification Test',
            assigned_to: 1,
            priority: 'medium',
            created_by: 1
        });

        console.log(`Task Created: ID ${task1.id} - ${task1.title}`);
        if (task1.id) console.log('✅ Manual Task Creation: PASSED');
        else console.log('❌ Manual Task Creation: FAILED');


        console.log('\n--- 2. Testing Insight -> Task Conversion ---');
        // We need an insight first
        // Check if any insight exists, or create dummy
        let insightId = 0;
        const insights = await query<any>('SELECT id FROM insights LIMIT 1');

        if (insights.length > 0) {
            insightId = insights[0].id;
        } else {
            const res: any = await query(`
                INSERT INTO insights (snapshot_id, statement, severity, metrics_involved, generated_by, created_by)
                VALUES (1, 'Test Insight for Verification', 'normal', '["sla"]', 'manual', 1)
             `);
            insightId = res.insertId;
        }

        const task2 = await TaskService.createTaskFromInsight(insightId, 1);
        console.log(`Smart Task Created: ID ${task2.id} - ${task2.title}`);

        if (task2.id && task2.description.includes('Generated from Insight')) {
            console.log('✅ Smart Task Conversion (Insight): PASSED');
        } else {
            console.log('❌ Smart Task Conversion (Insight): FAILED');
        }


        console.log('\n--- 3. Testing Recommendation -> Task Conversion ---');
        // Create dummy recommendation
        const recRes: any = await query(`
            INSERT INTO recommendations (action, category, urgency, rationale, generated_by, status, insight_id)
            VALUES ('Test Action', 'sop', 'high', 'Test Rationale', 'manual', 'pending', ?)
        `, [insightId]);
        const recId = recRes.insertId;

        const task3 = await TaskService.createTaskFromRecommendation(recId, 1);
        console.log(`Smart Task Created: ID ${task3.id} - ${task3.title}`);

        if (task3.id && task3.title.includes('Execute: Test Action')) {
            console.log('✅ Smart Task Conversion (Recommendation): PASSED');
        } else {
            console.log('❌ Smart Task Conversion (Recommendation): FAILED');
        }

        // Cleanup
        await query('DELETE FROM tasks WHERE id IN (?, ?, ?)', [task1.id, task2.id, task3.id]);
        await query('DELETE FROM recommendations WHERE id = ?', [recId]);

    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    }
}

runVerification();
