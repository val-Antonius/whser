import { query } from '@/lib/db';

async function testFrontendApiFlow() {
    console.log('Testing Frontend API Flow for Task Creation...');

    const { TaskService } = await import('@/services/TaskService');

    try {
        // 1. Create Dummy Snapshot
        const snapRes: any = await query(`INSERT INTO data_snapshots (snapshot_name, period_start, period_end, snapshot_date) VALUES ('Test Snapshot', '2024-01-01', '2024-01-07', NOW())`);
        const snapId = snapRes.insertId;

        // 2. Create Dummy Insight
        const insightRes: any = await query(`INSERT INTO insights (snapshot_id, statement, severity, metrics_involved, generated_by, created_by) VALUES (?, 'Test Insight', 'normal', '["effectiveness_score"]', 'manual', 1)`, [snapId]);
        const insightId = insightRes.insertId;

        // Simulate the fetch call body from the Frontend
        const body = {
            title: 'Frontend Flow Test',
            description: 'Testing if metrics persist',
            assigned_to: 1,
            created_by: 1,
            priority: 'high' as const,
            insight_id: insightId,
            metrics_involved: ['effectiveness_score']
        };

        const result = await TaskService.createTask(body);
        console.log('Task Created ID:', result.id);

        // Verify DB
        const rows = await query<any>('SELECT metrics_involved FROM tasks WHERE id = ?', [result.id]);
        if (rows.length > 0) {
            console.log('DB metrics_involved:', rows[0].metrics_involved);
            if (JSON.stringify(rows[0].metrics_involved) === JSON.stringify(body.metrics_involved)) {
                console.log('✅ PASS: Metrics persisted correctly via Service');
            } else {
                console.log('❌ FAIL: Metrics mismatch');
            }
        } else {
            console.log('❌ FAIL: Task not found in DB');
        }

        // Cleanup
        await query('DELETE FROM tasks WHERE id = ?', [result.id]);
        await query('DELETE FROM insights WHERE id = ?', [insightId]);
        await query('DELETE FROM data_snapshots WHERE id = ?', [snapId]);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

testFrontendApiFlow();
