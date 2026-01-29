import { query } from '@/lib/db';
import { CustomerSegment } from '@/types';

export class CustomerService {
    /**
     * Check customer's total spend and upgrade segment if threshold is met.
     */
    static async checkAndUpgradeSegment(customerId: number, connection?: any) {
        const execQuery = connection ?
            (sql: string, params: any[]) => connection.execute(sql, params) :
            (sql: string, params: any[]) => query(sql, params);

        try {
            // 1. Calculate Total Spend (Paid Amount of Completed Orders)
            // We use 'completed' status to be safe.
            const [result]: any = await execQuery(
                `SELECT SUM(paid_amount) as total_spend 
                 FROM orders 
                 WHERE customer_id = ? AND current_status = 'completed'`,
                [customerId]
            );

            const totalSpend = parseFloat(result[0]?.total_spend || 0);

            // 2. Define Thresholds
            const VIP_THRESHOLD = 1000000; // 1 Million
            const PLATINUM_THRESHOLD = 5000000; // 5 Million

            let newSegment = null;

            if (totalSpend >= PLATINUM_THRESHOLD) {
                newSegment = 'platinum'; // Assuming we add this later, or stick to existing enum
            } else if (totalSpend >= VIP_THRESHOLD) {
                newSegment = CustomerSegment.VIP;
            }

            if (!newSegment) return;

            // 3. Get Current Segment
            const [customerResult]: any = await execQuery(
                'SELECT segment FROM customers WHERE id = ?',
                [customerId]
            );
            const currentSegment = customerResult[0]?.segment;

            // 4. Upgrade if new segment is "higher" (Simple check for now: Regular -> VIP)
            if (currentSegment === CustomerSegment.REGULAR && newSegment === CustomerSegment.VIP) {
                await execQuery(
                    'UPDATE customers SET segment = ? WHERE id = ?',
                    [newSegment, customerId]
                );
                console.log(`🎉 Customer #${customerId} upgraded to ${newSegment} (Spend: ${totalSpend})`);
            }

            // If we have Platinum, we'd add logic to upgrade VIP -> Platinum here too.

        } catch (error) {
            console.error('Error in checkAndUpgradeSegment:', error);
            // Don't throw, as this is a background side-effect
        }
    }
    /**
     * Award loyalty points to a customer based on order value.
     * Default rule: 1 point per 1000 IDR.
     */
    static async awardPoints(customerId: number, orderId: number, amountPaid: number, connection?: any) {
        const execQuery = connection ?
            (sql: string, params: any[]) => connection.execute(sql, params) :
            (sql: string, params: any[]) => query(sql, params);

        try {
            // Rule: 1 Point per 1,000 IDR
            const points = Math.floor(amountPaid / 1000);

            if (points <= 0) return;

            console.log(`Awarding ${points} points to Customer #${customerId} for Order #${orderId}`);

            // 1. Insert History Record
            await execQuery(
                `INSERT INTO customer_loyalty_history 
                 (customer_id, order_id, change_type, points_earned, description, new_tier)
                 VALUES (?, ?, 'Order', ?, ?, NULL)`,
                [
                    customerId,
                    orderId,
                    points,
                    `Points earned from Order #${orderId}`
                ]
            );

            // 2. Update Customer Balance (Legacy field if exists, or just rely on history?)
            // The schema has total_lifetime_value, but maybe not a direct 'points_balance' column yet?
            // Phase 2.4 Specs mentioned total_lifetime_value. Let's update that at least.

            await execQuery(
                `UPDATE customers 
                 SET total_lifetime_value = total_lifetime_value + ? 
                 WHERE id = ?`,
                [amountPaid, customerId]
            );

            // 3. Trigger Tier Upgrade Check
            await this.checkAndUpgradeSegment(customerId, connection);

        } catch (error) {
            console.error('Error in awardPoints:', error);
        }
    }
}
