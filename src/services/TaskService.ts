import { query, transaction } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getInsightById } from './InsightService';

export interface CreateTaskInput {
    title: string;
    description: string;
    assigned_to: number; // User ID
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    created_by: number;
    insight_id?: number;
    recommendation_id?: number;
    metrics_involved?: string[];
}

export class TaskService {
    /**
     * Create a new task
     */
    static async createTask(input: CreateTaskInput) {
        const { title, description, assigned_to, priority, due_date, created_by, insight_id, recommendation_id } = input;

        const result: any = await query(
            `INSERT INTO tasks (title, description, assigned_to, priority, due_date, created_by, insight_id, recommendation_id, metrics_involved)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, assigned_to, priority, due_date, created_by, insight_id || null, recommendation_id || null,
                input.metrics_involved ? JSON.stringify(input.metrics_involved) : null]
        );

        return { id: result.insertId, ...input };
    }

    /**
     * Create a task directly from an Insight
     * Auto-populates description with Insight Statement
     */
    static async createTaskFromInsight(insightId: number, createdBy: number, assignedTo: number = 1) {
        // 1. Fetch Insight
        const insightResult = await getInsightById(insightId);
        if (!insightResult.success || !insightResult.data) {
            throw new Error(`Insight #${insightId} not found`);
        }
        const insight = insightResult.data;

        // 2. Construct Task Input
        const input: CreateTaskInput = {
            title: `Review Insight: ${insight.metrics_involved.join(', ')}`,
            description: `Generated from Insight #${insightId}:\n"${insight.statement}"\n\nMetrics: ${JSON.stringify(insight.metrics_involved)}`,
            assigned_to: assignedTo, // Default assignee
            priority: insight.severity === 'critical' ? 'high' : 'medium',
            created_by: createdBy,
            insight_id: insightId,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default +7 days
            metrics_involved: insight.metrics_involved
        };

        // 3. Create Task
        return await this.createTask(input);
    }
    // ... previous methods ...

    /**
     * Create a task from a Recommendation
     */
    static async createTaskFromRecommendation(recommendationId: number, createdBy: number, assignedTo: number = 1) {
        // 1. Fetch Recommendation
        const recs = await query<any>('SELECT * FROM recommendations WHERE id = ?', [recommendationId]);
        if (!recs || recs.length === 0) {
            throw new Error(`Recommendation #${recommendationId} not found`);
        }
        const rec = recs[0];

        // 1b. Fetch Linked Insight Metrics if available
        let metricsInvolved: string[] | undefined;
        if (rec.insight_id) {
            try {
                // We can use the service or direct query. 
                // Since we are in TaskService, let's use direct query to avoid circular deps if any, 
                // or just re-use the import if it works.
                const insightResult = await getInsightById(rec.insight_id);
                if (insightResult.success && insightResult.data) {
                    metricsInvolved = insightResult.data.metrics_involved;
                }
            } catch (e) {
                console.warn('Failed to fetch linked insight for recommendation task creation', e);
            }
        }

        // 2. Construct Task Input
        const input: CreateTaskInput = {
            title: `Execute: ${rec.action}`,
            description: `Based on Recommendation #${recommendationId}:\nRationale: ${rec.rationale}`,
            assigned_to: assignedTo,
            priority: rec.urgency === 'critical' ? 'high' : rec.urgency === 'high' ? 'high' : 'medium',
            created_by: createdBy,
            recommendation_id: recommendationId,
            insight_id: rec.insight_id || undefined, // Also link the insight_id directly if possible
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            metrics_involved: metricsInvolved
        };

        // 3. Create Task
        return await this.createTask(input);
    }
}
