import { query } from '@/lib/db';
import { TaskEffectivenessService } from '@/services/TaskEffectivenessService';

async function verifyFeedback() {
    console.log('🚀 Testing Feedback Loop (Phase 5.4)...\n');

    try {
        // 1. Create a resolved task
        console.log('--- 1. Creating Resolved Task ---');
        const taskRes: any = await query(`
            INSERT INTO tasks (title, description, assigned_to, priority, status, created_by, metrics_involved)
            VALUES ('Feedback Test Task', 'Testing impact calculation', 1, 'high', 'resolved', 1, ?)
        `, [JSON.stringify(["sla_compliance"])]);
        const taskId = taskRes.insertId;
        console.log(`Task Created: ID ${taskId}`);

        // 2. Calculate Impact
        console.log('\n--- 2. Calculating Impact ---');
        const result = await TaskEffectivenessService.calculateEffectiveness(taskId);

        if (result) {
            console.table(result);
            console.log('✅ Calculation Result Received');

            if (result.metric_name && result.before_value !== undefined) {
                console.log(`✅ Valid Result: ${result.metric_name} changed by ${result.percentage_change}%`);
            } else {
                console.log('❌ Data Fields Missing/Invalid', result);
            }
        } else {
            console.log('❌ No result returned');
        }

        // Cleanup
        await query('DELETE FROM task_effectiveness WHERE task_id = ?', [taskId]);
        await query('DELETE FROM tasks WHERE id = ?', [taskId]);

    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    }
}

verifyFeedback();
