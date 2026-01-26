import { query, transaction } from '@/lib/db';

export interface ServiceProcess {
    id: number;
    service_id: number;
    process_name: string;
    process_order: number;
    estimated_duration_minutes: number;
    depends_on_process_id: number | null;
    is_required: boolean;
    description: string;
}

export class BlueprintService {
    /**
     * Get blueprint (processes) for a specific service
     */
    static async getBlueprintForService(serviceId: number): Promise<ServiceProcess[]> {
        return query<ServiceProcess>(
            'SELECT * FROM service_processes WHERE service_id = ? ORDER BY process_order ASC',
            [serviceId]
        );
    }

    /**
     * Decompose an Order into Order Jobs based on the Service Blueprint
     * Should be called inside a transaction ideally, or passed a connection
     */
    static async decomposeOrder(orderId: number, serviceId: number, connection?: any) {
        // 1. Fetch Blueprint
        const blueprint = await this.getBlueprintForService(serviceId);

        if (!blueprint || blueprint.length === 0) {
            console.warn(`No blueprint found for service ${serviceId}. Order #${orderId} will have no detailed jobs.`);
            return [];
        }

        // 2. Generate Jobs
        const jobsToInsert = blueprint.map(step => {
            return {
                order_id: orderId,
                service_process_id: step.id,
                job_name: step.process_name,
                job_order: step.process_order,
                status: step.process_order === 1 ? 'ready' : 'pending', // First job is ready? Or pending until 'Waiting for process' -> 'In Wash'?
                // Let's stick to 'pending' for all, and the first one becomes 'active' when Order Status moves to 'In Wash' logic later. Or simplified: all pending/ready.
                // Actually, let's make them 'pending'. The "Kanban" will move them.
                estimated_duration_minutes: step.estimated_duration_minutes,
            };
        });

        const execQuery = connection ?
            (sql: string, params: any[]) => connection.execute(sql, params) :
            (sql: string, params: any[]) => query(sql, params);

        console.log(`Decomposing Order #${orderId} into ${jobsToInsert.length} jobs.`);

        for (const job of jobsToInsert) {
            await execQuery(
                `INSERT INTO order_jobs 
                (order_id, service_process_id, job_name, job_order, status, estimated_duration_minutes)
                VALUES (?, ?, ?, ?, 'pending', ?)`,
                [job.order_id, job.service_process_id, job.job_name, job.job_order, job.estimated_duration_minutes]
            );
        }

        return jobsToInsert;
    }

    /**
     * Sync high-level Order Status with granular Job Status
     */
    static async syncJobStatus(orderId: number, newOrderStatus: string, connection?: any) {
        const execQuery = connection ?
            (sql: string, params: any[]) => connection.execute(sql, params) :
            (sql: string, params: any[]) => query(sql, params);

        // Map Order Status -> Job Name keywords (or we could use process_order if strictly sequential)
        // Using keywords allows for some flexibility if steps are named differently (e.g. "Cuci" vs "Washing")
        let activeJobKeyword = '';
        let completedJobKeywords: string[] = [];

        switch (newOrderStatus) {
            case 'in_wash':
                activeJobKeyword = 'Wash';
                break;
            case 'in_dry':
                activeJobKeyword = 'Dry';
                completedJobKeywords = ['Wash'];
                break;
            case 'in_iron':
                activeJobKeyword = 'Iron';
                // Note: Ironing might be skipped in some workflows, so we should complete "Dry"
                completedJobKeywords = ['Wash', 'Dry'];
                break;
            case 'in_fold':
                activeJobKeyword = 'Fold';
                completedJobKeywords = ['Wash', 'Dry', 'Iron'];
                break;
            case 'ready_for_qc':
                activeJobKeyword = 'Quality'; // Matches "Quality Check"
                completedJobKeywords = ['Wash', 'Dry', 'Iron', 'Fold'];
                break;
            case 'completed':
            case 'ready_for_pickup':
                completedJobKeywords = ['Wash', 'Dry', 'Iron', 'Fold', 'Quality', 'QC', 'Check', 'Pack'];
                break;
        }

        // 1. Mark COMPLETED jobs
        if (completedJobKeywords.length > 0) {
            // Construct a flexible OR clause: job_name LIKE '%Wash%' OR job_name LIKE '%Dry%'...
            const conditions = completedJobKeywords.map(() => `job_name LIKE ?`).join(' OR ');
            const params = [...completedJobKeywords.map(k => `%${k}%`), orderId];

            await execQuery(
                `UPDATE order_jobs 
                 SET status = 'completed', completed_at = NOW() 
                 WHERE (${conditions}) AND order_id = ? AND status != 'completed'`,
                params
            );
        }

        // 2. Mark ACTIVE job
        if (activeJobKeyword) {
            await execQuery(
                `UPDATE order_jobs 
                 SET status = 'in_progress', started_at = NOW() 
                 WHERE job_name LIKE ? AND order_id = ? AND status != 'in_progress'`,
                [`%${activeJobKeyword}%`, orderId]
            );
        }
    }
}
