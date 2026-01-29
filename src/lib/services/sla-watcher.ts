import { query, transaction } from '@/lib/db';

export class SLAWatcher {
    /**
     * Check SLA status for a specific order and generate alerts if needed.
     * Triggered on status changes or periodic checks.
     */
    static async checkOrderSLA(orderId: number, connection?: any) {
        const execQuery = connection ?
            (sql: string, params: any[]) => connection.execute(sql, params) :
            (sql: string, params: any[]) => query(sql, params);

        try {
            // 1. Get Order Details
            const [orders] = await execQuery(
                `SELECT 
                    id, 
                    order_number, 
                    created_at, 
                    estimated_completion, 
                    current_status 
                 FROM orders 
                 WHERE id = ?`,
                [orderId]
            );

            if (!orders || orders.length === 0) return;
            const order = orders[0];

            // If already completed/closed/cancelled, no need to alert
            if (['completed', 'ready_for_pickup', 'closed', 'cancelled'].includes(order.current_status)) {
                return;
            }

            // 2. Calculate Timings
            const now = new Date();
            const createdAt = new Date(order.created_at);
            const target = new Date(order.estimated_completion);

            // If no target set, skip
            if (!order.estimated_completion) return;

            const totalDurationMs = target.getTime() - createdAt.getTime();
            const elapsedMs = now.getTime() - createdAt.getTime();
            const remainingMs = target.getTime() - now.getTime();
            const remainingHours = remainingMs / (1000 * 60 * 60);

            let alertType = null;
            let message = '';

            // 3. Define Thresholds
            // Critical: Overdue
            if (remainingMs < 0) {
                alertType = 'breached'; // or 'critical' if significantly overdue
                const overdueHours = Math.abs(remainingHours).toFixed(1);
                message = `Order #${order.order_number} is OVERDUE by ${overdueHours} hours!`;

                // If overdue by more than 24 hours, maybe 'critical'?
                if (Math.abs(remainingHours) > 24) alertType = 'critical';

            } else {
                // Approaching: > 80% elapsed (or < 4 hours remaining)
                const elapsedPercent = elapsedMs / totalDurationMs;
                if (elapsedPercent > 0.8 || remainingHours < 4) {
                    alertType = 'approaching';
                    message = `Order #${order.order_number} is approaching SLA deadline (${remainingHours.toFixed(1)}h remaining).`;
                }
            }

            if (!alertType) return;

            // 4. Update/Insert Alert (Avoid duplicates for same type)
            // Check existing unacknowledged alert of same type
            const [existing] = await execQuery(
                `SELECT id FROM sla_alerts 
                 WHERE order_id = ? AND alert_type = ? AND is_acknowledged = FALSE`,
                [orderId, alertType]
            );

            if (existing.length === 0) {
                await execQuery(
                    `INSERT INTO sla_alerts 
                     (order_id, alert_type, alert_message, hours_remaining)
                     VALUES (?, ?, ?, ?)`,
                    [orderId, alertType, message, remainingHours]
                );
                console.log(`SLA Alert generated: ${alertType} for Order #${orderId}`);
            }

        } catch (error) {
            console.error('Error in checkOrderSLA:', error);
        }
    }
}
