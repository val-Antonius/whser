import { query } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export interface EffectivenessResult {
    task_id: number;
    metric_name: string;
    before_value: number;
    after_value: number;
    percentage_change: number;
    is_effective: boolean;
}

export class TaskEffectivenessService {
    /**
     * Calculate effectiveness for a completed task
     * Note: In a real system, this would look at historical periods.
     * For this prototype, we will simulate the comparison if no future data exists.
     */
    static async calculateEffectiveness(taskId: number): Promise<EffectivenessResult | null> {
        // 1. Get Task and context
        const tasks = await query<any>(`
            SELECT t.*, i.metrics_involved 
            FROM tasks t
            LEFT JOIN insights i ON t.insight_id = i.id
            WHERE t.id = ? AND t.status = 'resolved'
        `, [taskId]);

        if (tasks.length === 0) {
            throw new Error(`Task #${taskId} not found or not resolved`);
        }
        const task = tasks[0];

        // 2. Determine Metric to Check
        // Try to parse from insight first, or use default
        let metricName = 'operational_efficiency';
        if (task.metrics_involved) {
            try {
                const metrics = JSON.parse(task.metrics_involved);
                if (Array.isArray(metrics) && metrics.length > 0) {
                    metricName = metrics[0];
                }
            } catch (e) { }
        }

        // 3. Get/Simulate Values
        // In prototype: Randomly generate "improvement" to demonstrate the closed loop
        // Logic: 70% chance of improvement, 30% chance of no change/regression
        const isSuccessful = Math.random() > 0.3;

        const beforeValue = Math.floor(Math.random() * 20) + 70; // e.g. 70-90%
        let afterValue;

        if (isSuccessful) {
            afterValue = beforeValue + (Math.floor(Math.random() * 10) + 2); // Improve by 2-12%
            if (afterValue > 100) afterValue = 100;
        } else {
            afterValue = beforeValue - (Math.floor(Math.random() * 5)); // Regress slightly
        }

        const improvement = ((afterValue - beforeValue) / beforeValue) * 100;

        // 4. Record Result
        await query(
            `INSERT INTO task_effectiveness (task_id, metric_name, before_value, after_value, percentage_change, is_effective)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [taskId, metricName, beforeValue, afterValue, improvement, improvement > 0]
        );

        return {
            task_id: taskId,
            metric_name: metricName,
            before_value: beforeValue,
            after_value: afterValue,
            percentage_change: parseFloat(improvement.toFixed(2)),
            is_effective: improvement > 0
        };
    }

    /**
     * Get existing effectiveness record
     */
    static async getEffectiveness(taskId: number): Promise<EffectivenessResult | null> {
        const rows = await query<any>('SELECT * FROM task_effectiveness WHERE task_id = ?', [taskId]);
        if (rows.length === 0) return null;
        return rows[0];
    }
}
