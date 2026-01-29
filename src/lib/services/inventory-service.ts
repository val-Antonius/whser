import { query, queryOne, transaction } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OrderData extends RowDataPacket {
    service_id: number;
    unit_type: string;
    estimated_weight: string | number; // DECIMAL or FLOAT
    quantity: number;
}

interface ServiceMaterial extends RowDataPacket {
    inventory_item_id: number;
    estimated_quantity: string | number; // DECIMAL
    unit: string;
    item_name: string;
    current_stock: number;
}

export class InventoryService {
    /**
     * Process automatic inventory consumption for an order based on its service
     * Triggered when order enters IN_WASH status
     */
    static async processAutomaticConsumption(orderId: number, userId: number) {
        try {
            // 1. Get Order Details (to know Service & Weight/Qty)
            const order = await queryOne<OrderData>(
                'SELECT service_id, unit_type, estimated_weight, quantity FROM orders WHERE id = ?',
                [orderId]
            );

            if (!order) throw new Error('Order not found');

            // 2. Get Service Materials (Recipe)
            const materials = await query<ServiceMaterial>(
                `SELECT sct.inventory_item_id, sct.estimated_quantity, sct.unit, ii.item_name, ii.current_stock 
                 FROM service_consumption_templates sct
                 JOIN inventory_items ii ON sct.inventory_item_id = ii.id
                 WHERE sct.service_id = ?`,
                [order.service_id]
            );

            if (!materials || materials.length === 0) {
                console.log(`No materials defined for service ${order.service_id}, skipping auto-consumption.`);
                return; // Nothing to consume
            }

            // 3. Process Consumption
            await transaction(async (conn) => {
                for (const mat of materials) {
                    let consumedQty = 0;

                    // Calculate Consumption based on Unit Type (using 'unit' field from templates)
                    // Note: Schema uses 'unit' column which stores 'per_kg', 'per_pc', etc.
                    const matQty = typeof mat.estimated_quantity === 'string' ? parseFloat(mat.estimated_quantity) : mat.estimated_quantity;
                    const orderWeight = typeof order.estimated_weight === 'string' ? parseFloat(order.estimated_weight) : order.estimated_weight;

                    if (mat.unit === 'per_kg') {
                        consumedQty = matQty * (orderWeight || 0);
                    } else if (mat.unit === 'per_pc') {
                        consumedQty = matQty * (order.quantity || 0);
                    } else if (mat.unit === 'per_order') {
                        consumedQty = matQty;
                    }

                    if (consumedQty > 0) {
                        // Check stock (Optional: we allow negative stock or just log warning? For now, allow but log)
                        // In strict mode, we might throw error. Here we just proceed.

                        // Insert Transaction
                        await conn.execute(
                            `INSERT INTO inventory_transactions 
                            (inventory_item_id, transaction_type, quantity, notes, created_by, order_id)
                            VALUES (?, 'usage', ?, ?, ?, ?)`,
                            [
                                mat.inventory_item_id,
                                -consumedQty, // Negative for usage
                                `Auto-consumption for Order #${orderId} (${mat.item_name})`,
                                userId,
                                orderId
                            ]
                        );

                        // Update Stock
                        await conn.execute(
                            `UPDATE inventory_items 
                             SET current_stock = current_stock - ? 
                             WHERE id = ?`,
                            [consumedQty, mat.inventory_item_id]
                        );

                        // Record in inventory_consumption (for audit/costing)
                        await conn.execute(
                            `INSERT INTO inventory_consumption
                            (order_id, inventory_item_id, estimated_quantity, actual_quantity)
                            VALUES (?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE 
                            actual_quantity = actual_quantity + VALUES(actual_quantity),
                            estimated_quantity = VALUES(estimated_quantity)`, // Simple upsert
                            [orderId, mat.inventory_item_id, consumedQty, consumedQty]
                        );
                    }
                }
            });

            console.log(`Auto-consumption processed for Order #${orderId}`);

        } catch (error) {
            console.error('Failed to process auto-consumption:', error);
            // We do NOT re-throw to avoid blocking the Order Status update. 
            // Consumption failure should be logged but shouldn't stop flow.
        }
    }


    /**
     * Process consumption for a Rewash Event
     */
    static async processRewashConsumption(orderId: number, rewashEventId: number, userId: number) {
        try {
            // Reuse logic similar to above, effectively "Charging double" for materials
            // Note: In a real advanced system, rewash might use LESS materials (e.g. only detergent).
            // For MVP, we assume rewash uses the same materials as the original service.

            // 1. Get Order
            const order = await queryOne<OrderData>(
                'SELECT service_id, unit_type, estimated_weight, quantity FROM orders WHERE id = ?',
                [orderId]
            );

            if (!order) throw new Error('Order not found');

            // 2. Get Materials
            const materials = await query<ServiceMaterial>(
                `SELECT sct.inventory_item_id, sct.estimated_quantity, sct.unit FROM service_consumption_templates sct WHERE sct.service_id = ?`,
                [order.service_id]
            );

            if (!materials || materials.length === 0) return;

            // 3. Deduct
            await transaction(async (conn) => {
                for (const mat of materials) {
                    let consumedQty = 0;

                    const matQty = typeof mat.estimated_quantity === 'string' ? parseFloat(mat.estimated_quantity) : mat.estimated_quantity;
                    const orderWeight = typeof order.estimated_weight === 'string' ? parseFloat(order.estimated_weight) : order.estimated_weight;

                    if (mat.unit === 'per_kg') consumedQty = matQty * (orderWeight || 0);
                    else if (mat.unit === 'per_pc') consumedQty = matQty * (order.quantity || 0);
                    else if (mat.unit === 'per_order') consumedQty = matQty;

                    if (consumedQty > 0) {
                        // Insert Transaction
                        await conn.execute(
                            `INSERT INTO inventory_transactions 
                            (inventory_item_id, transaction_type, quantity, notes, created_by, order_id)
                            VALUES (?, 'usage', ?, ?, ?, ?)`,
                            [
                                mat.inventory_item_id,
                                -consumedQty,
                                `REWASH #${rewashEventId} for Order #${orderId}`,
                                userId,
                                orderId
                            ]
                        );

                        // Update Stock
                        await conn.execute(
                            `UPDATE inventory_items 
                             SET current_stock = current_stock - ? 
                             WHERE id = ?`,
                            [consumedQty, mat.inventory_item_id]
                        );

                        // We do NOT act on inventory_consumption table here as that tracks "Standard" consumption.
                        // Rewash consumption is tracked via transactions linked to order.
                    }
                }

                // Mark Rewash Event as Deducted
                await conn.execute(
                    'UPDATE rewash_events SET inventory_deducted = TRUE WHERE id = ?',
                    [rewashEventId]
                );
            });

        } catch (e) {
            console.error('Rewash consumption error:', e);
        }
    }
}
